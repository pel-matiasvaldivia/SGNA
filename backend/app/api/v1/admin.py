import re
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.admin import TenantProvisionRequest, TenantResponse
from app.db.session import provision_tenant_schema
from app.core.security import get_password_hash

router = APIRouter()

def validate_superadmin(current_user: User = Depends(get_current_active_user)):
    """
    Enforces that the current authenticated requester holds a 'superadmin' role.
    """
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación denegada. Se requieren credenciales de Superadmin global."
        )
    return current_user


@router.post("/tenants", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
def provision_new_tenant(
    data: TenantProvisionRequest,
    db: Session = Depends(get_db),
    current_superadmin: User = Depends(validate_superadmin)
):
    # 1. Strictly validate tenant slug format (lowercase alphanumeric and dashes)
    slug_clean = data.slug.strip().lower()
    if not re.match(r"^[a-z0-9-]+$", slug_clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El slug del tenant solo debe contener letras minúsculas, números y guiones."
        )

    # 2. Check if slug already exists
    existing_tenant = db.query(Tenant).filter(Tenant.slug == slug_clean).first()
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El slug '{slug_clean}' ya está registrado."
        )

    # 3. Check if admin email already exists globally in public.users
    existing_user = db.query(User).filter(User.email == data.admin_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico del administrador ya está en uso."
        )

    # 4. Create and commit Tenant record in public.tenants
    new_tenant = Tenant(
        name=data.name,
        slug=slug_clean,
        plan="premium",
        active=True
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    # 5. Dynamically provision the isolated schema and create all required tables
    try:
        provision_tenant_schema(slug_clean)
    except Exception as e:
        # Fallback delete tenant record if schema setup completely fails
        db.delete(new_tenant)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fallo al aprovisionar la base de datos aislada: {str(e)}"
        )

    # 6. Create the tenant's primary admin user inside public.users
    new_admin = User(
        tenant_id=new_tenant.id,
        email=data.admin_email,
        password_hash=get_password_hash(data.admin_password),
        full_name=f"Administrador {data.name}",
        role="admin",
        two_fa_enabled=True,
        active=True
    )
    db.add(new_admin)
    db.commit()

    return new_tenant


@router.get("/tenants", response_model=List[TenantResponse])
def list_tenants(
    db: Session = Depends(get_db),
    current_superadmin: User = Depends(validate_superadmin)
):
    """
    Returns all tenants registered globally in the system.
    """
    return db.query(Tenant).all()


from uuid import UUID

@router.put("/tenants/{tenant_id}/toggle-2fa", response_model=TenantResponse)
def toggle_tenant_2fa(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_superadmin: User = Depends(validate_superadmin)
):
    """
    Toggles the 2FA setting for the specified tenant.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado.")
    tenant.two_factor_enabled = not tenant.two_factor_enabled
    db.commit()
    db.refresh(tenant)
    return tenant

@router.put("/tenants/{tenant_id}/suspend", response_model=TenantResponse)
def suspend_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_superadmin: User = Depends(validate_superadmin)
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado.")
    tenant.active = not tenant.active
    db.commit()
    db.refresh(tenant)
    return tenant

@router.delete("/tenants/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_superadmin: User = Depends(validate_superadmin)
):
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado.")
    
    # 1. Delete users
    db.query(User).filter(User.tenant_id == tenant_id).delete()
    
    # 2. Delete tenant record
    db.delete(tenant)
    db.commit()
    
    # 3. Drop schema (raw SQL)
    from sqlalchemy import text
    try:
        db.execute(text(f'DROP SCHEMA IF EXISTS "tenant_{tenant.slug}" CASCADE'))
        db.commit()
    except Exception as e:
        print(f"Error dropping schema for {tenant.slug}: {e}")
    return

from app.core.security import create_access_token
from datetime import timedelta
from app.core.config import settings
from typing import Dict, Any

@router.post("/tenants/{tenant_id}/impersonate")
def impersonate_tenant(
    tenant_id: UUID,
    db: Session = Depends(get_db),
    current_superadmin: User = Depends(validate_superadmin)
):
    """
    Generates a JWT token for the superadmin but scoped to the target tenant_id.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado.")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    # The payload uses the superadmin's email but the target tenant_id
    token_payload = {
        "sub": current_superadmin.email,
        "tenant_id": str(tenant_id),
        "role": "superadmin_impersonation"
    }
    access_token = create_access_token(
        data=token_payload, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "tenant_slug": tenant.slug}

@router.get("/metrics", response_model=Dict[str, Any])
def global_metrics(
    db: Session = Depends(get_db),
    current_superadmin: User = Depends(validate_superadmin)
):
    total_tenants = db.query(Tenant).count()
    active_tenants = db.query(Tenant).filter(Tenant.active == True).count()
    total_users = db.query(User).count()
    
    return {
        "total_tenants": total_tenants,
        "active_tenants": active_tenants,
        "total_users": total_users,
        # Further metrics can be aggregated via periodic celery tasks
    }
