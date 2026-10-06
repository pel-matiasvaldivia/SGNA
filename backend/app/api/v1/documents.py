import uuid
import hashlib
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from sqlalchemy.orm import Session

from app.api.deps import get_tenant_db_from_token, get_current_active_user, get_current_user
from app.schemas.auth import TokenData
from app.models.user import User
from app.models.document import Document, DocumentVersion, DocumentApproval
from app.schemas.document import DocumentResponse, DownloadResponse, ApprovalDecisionRequest
from app.services.s3 import s3_service
from app.services.firma_aprobacion import huella_aprobacion

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    title: str = Form(...),
    description: str = Form(None),
    type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
    token_data: TokenData = Depends(get_current_user),
):
    # Read file binary content
    try:
        file_data = await file.read()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo leer el archivo cargado."
        )

    # Generate unique S3 file key
    document_uuid = uuid.uuid4()
    safe_filename = file.filename.replace(" ", "_") if file.filename else "evidence"
    s3_key = f"documents/{document_uuid}/{safe_filename}"

    # Upload to MinIO/S3 isolated bucket
    upload_success = s3_service.upload_file(
        tenant_slug=token_data.tenant_slug,
        file_key=s3_key,
        file_data=file_data
    )

    if not upload_success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al subir el archivo al almacenamiento en la nube."
        )

    # Create Document record in DB
    new_doc = Document(
        id=document_uuid,
        title=title,
        description=description,
        type=type,
        status="pendiente",  # Default pending approval
        version_actual=1,
        creator_id=current_user.id,
        tenant_id=current_user.tenant_id
    )
    db.add(new_doc)
    db.flush()

    # Create first DocumentVersion record
    new_version = DocumentVersion(
        document_id=new_doc.id,
        version_number=1,
        s3_file_key=s3_key,
        cargado_por_id=current_user.id
    )
    db.add(new_version)
    
    # Create initial pending approval step
    new_approval = DocumentApproval(
        document_id=new_doc.id,
        estado="pendiente"
    )
    db.add(new_approval)

    db.commit()
    db.refresh(new_doc)

    return new_doc


@router.get("/list", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Document).filter(Document.tenant_id == current_user.tenant_id).all()


@router.get("/{id}", response_model=DocumentResponse)
def get_document(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.tenant_id == current_user.tenant_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )
    return doc


@router.get("/{id}/download", response_model=DownloadResponse)
def get_document_download_url(
    id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
    token_data: TokenData = Depends(get_current_user)
):
    # Fetch active version key
    doc = db.query(Document).filter(Document.id == id, Document.tenant_id == current_user.tenant_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )
    
    latest_version = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == doc.id,
        DocumentVersion.version_number == doc.version_actual
    ).first()

    if not latest_version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró versión activa para este documento."
        )

    # Generate pre-signed URL (15 minutes expiry)
    download_url = s3_service.generate_presigned_download_url(
        tenant_slug=token_data.tenant_slug,
        file_key=latest_version.s3_file_key,
        expires_in=900
    )

    if not download_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo generar el enlace de descarga."
        )

    return DownloadResponse(download_url=download_url)


@router.post("/{id}/approve", response_model=DocumentResponse)
def decide_document_approval(
    id: uuid.UUID,
    decision: ApprovalDecisionRequest,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.tenant_id == current_user.tenant_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )

    # Resolve pending approval records
    pending_approval = db.query(DocumentApproval).filter(
        DocumentApproval.document_id == doc.id,
        DocumentApproval.estado == "pendiente"
    ).first()

    status_str = "aprobado" if decision.approve else "rechazado"

    if pending_approval:
        pending_approval.estado = status_str
        pending_approval.aprobador_id = current_user.id
        pending_approval.comentarios = decision.comments
        pending_approval.fecha_resolucion = datetime.now(timezone.utc)
    else:
        # Fallback create a resolution trace
        resolution = DocumentApproval(
            document_id=doc.id,
            aprobador_id=current_user.id,
            estado=status_str,
            comentarios=decision.comments,
            fecha_resolucion=datetime.now(timezone.utc)
        )
        db.add(resolution)

    # Update global document status
    doc.status = status_str
    
    db.commit()
    db.refresh(doc)
    
    return doc


@router.post("/{id}/sign", response_model=DocumentResponse)
def sign_document_approval(
    id: uuid.UUID,
    decision: ApprovalDecisionRequest,
    request: Request,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.tenant_id == current_user.tenant_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado."
        )

    # Resolve pending approval records
    pending_approval = db.query(DocumentApproval).filter(
        DocumentApproval.document_id == doc.id,
        DocumentApproval.estado == "pendiente"
    ).first()

    status_str = "aprobado" if decision.approve else "rechazado"

    # Traza de origen. La IP la resuelve uvicorn (--proxy-headers) a partir de
    # X-Forwarded-For, que nginx reescribe con un único valor que el navegador
    # no puede elegir; ver el bloque "IP real del cliente" en nginx/nginx.conf.
    #
    # Si no hay IP se guarda NULL y la pantalla muestra "no registrada": poner
    # un 127.0.0.1 plausible en un registro de auditoría es el mismo error que
    # tenía antes el hash inventado.
    ip_addr = request.client.host if request.client else None
    u_agent = request.headers.get("user-agent") or None

    firmado_en = datetime.now(timezone.utc)
    version_firmada = doc.version_actual
    sig_hash = huella_aprobacion(
        current_user.email, firmado_en, status_str, doc.id, version_firmada
    )

    if pending_approval:
        pending_approval.estado = status_str
        pending_approval.aprobador_id = current_user.id
        pending_approval.comentarios = decision.comments
        pending_approval.fecha_resolucion = firmado_en
        pending_approval.signature_hash = sig_hash
        pending_approval.ip_address = ip_addr
        pending_approval.user_agent = u_agent
        pending_approval.document_version = version_firmada
    else:
        # Fallback create a resolution trace
        resolution = DocumentApproval(
            document_id=doc.id,
            aprobador_id=current_user.id,
            estado=status_str,
            comentarios=decision.comments,
            fecha_resolucion=firmado_en,
            signature_hash=sig_hash,
            ip_address=ip_addr,
            user_agent=u_agent,
            document_version=version_firmada,
        )
        db.add(resolution)

    # Update global document status
    doc.status = status_str
    
    db.commit()
    db.refresh(doc)
    
    return doc


@router.get("/{id}/aprobaciones/{aprobacion_id}/verificar")
def verificar_aprobacion(
    id: uuid.UUID,
    aprobacion_id: uuid.UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
):
    """
    Recalcula la huella de una aprobación y la compara con la registrada.

    Sin esto la huella no sirve de nada: una cadena de 64 caracteres que nadie
    puede volver a calcular no prueba nada. Acá se rehace el cálculo con los
    datos guardados y se informa si coinciden.
    """
    doc = db.query(Document).filter(
        Document.id == id, Document.tenant_id == current_user.tenant_id
    ).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Documento no encontrado."
        )

    aprobacion = db.query(DocumentApproval).filter(
        DocumentApproval.id == aprobacion_id,
        DocumentApproval.document_id == doc.id,
    ).first()
    if not aprobacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Aprobación no encontrada."
        )

    if not aprobacion.signature_hash or not aprobacion.fecha_resolucion:
        return {
            "verificable": False,
            "coincide": None,
            "motivo": "La aprobación no tiene huella registrada (es anterior a esta función o sigue pendiente).",
        }

    aprobador = (
        db.query(User).filter(User.id == aprobacion.aprobador_id).first()
        if aprobacion.aprobador_id else None
    )
    if not aprobador:
        return {
            "verificable": False,
            "coincide": None,
            "motivo": "No se puede recalcular: la cuenta del aprobador ya no existe.",
        }

    recalculada = huella_aprobacion(
        aprobador.email,
        aprobacion.fecha_resolucion,
        aprobacion.estado,
        doc.id,
        aprobacion.document_version,
    )
    coincide = recalculada == aprobacion.signature_hash

    return {
        "verificable": True,
        "coincide": coincide,
        "huella_registrada": aprobacion.signature_hash,
        "huella_recalculada": recalculada,
        "aprobador": aprobador.email,
        "estado": aprobacion.estado,
        "fecha_resolucion": aprobacion.fecha_resolucion,
        "version_aprobada": aprobacion.document_version,
        "version_actual_documento": doc.version_actual,
        # Aviso util para el auditor: la huella puede coincidir y aun asi el
        # documento haber cambiado despues de aprobado.
        "version_cambio_desde_la_aprobacion": (
            aprobacion.document_version is not None
            and aprobacion.document_version != doc.version_actual
        ),
    }
