from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
from typing import List
from uuid import UUID, uuid4

from app.api.deps import get_tenant_db_from_token, get_current_active_user, get_current_user
from app.schemas.auth import TokenData
from app.services.s3 import s3_service
from app.models.user import User
from app.models.auditoria import (
    ProgramaAuditoria, AuditoriaHallazgo, AuditoriaAsignacion,
    PuntoControl, RespuestaControl
)
from app.schemas.auditoria import (
    ProgramaAuditoriaCreate,
    ProgramaAuditoriaResponse,
    AuditoriaHallazgoCreate,
    AuditoriaHallazgoResponse,
    AuditoriaAsignacionCreate,
    AuditoriaAsignacionUpdate,
    AuditoriaAsignacionResponse,
    PuntoControlCreate,
    PuntoControlResponse,
    RespuestaControlUpsert,
    RespuestaControlResponse,
    AplicarPlantillaRequest
)
from app.data.checklist_templates import get_template, available_normas

router = APIRouter()

# ----------------- PROGRAMAS DE AUDITORIA -----------------

@router.post("/programas", response_model=ProgramaAuditoriaResponse, status_code=status.HTTP_201_CREATED)
def create_programa(
    data: ProgramaAuditoriaCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    programa = ProgramaAuditoria(
        titulo=data.titulo,
        objetivos=data.objetivos,
        alcance=data.alcance,
        fecha_inicio=data.fecha_inicio,
        fecha_fin=data.fecha_fin,
        estado=data.estado,
        tenant_id=current_user.tenant_id
    )
    db.add(programa)
    db.commit()
    db.refresh(programa)
    return programa

@router.get("/programas", response_model=List[ProgramaAuditoriaResponse])
def list_programas(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(ProgramaAuditoria).filter(ProgramaAuditoria.tenant_id == current_user.tenant_id).all()

@router.delete("/programas/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_programa(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    programa = db.query(ProgramaAuditoria).filter(
        ProgramaAuditoria.id == id,
        ProgramaAuditoria.tenant_id == current_user.tenant_id
    ).first()

    if not programa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el programa de auditoría especificado."
        )

    db.delete(programa)
    db.commit()


# ----------------- ASIGNACIONES DE AUDITORIA (líder -> campo) -----------------

def _with_programa_titulo(asignaciones, db):
    """
    Enriquece las asignaciones con el título de su programa y el progreso del
    checklist (total de puntos y cuántos ya tienen respuesta), para el listado.
    """
    asig_ids = {a.id for a in asignaciones}
    prog_ids = {a.programa_id for a in asignaciones}

    titulos = {}
    if prog_ids:
        for p in db.query(ProgramaAuditoria.id, ProgramaAuditoria.titulo).filter(
            ProgramaAuditoria.id.in_(prog_ids)
        ).all():
            titulos[p.id] = p.titulo

    total_por_asig = {}
    respondidos_por_asig = {}
    if asig_ids:
        for asig_id, cnt in db.query(
            PuntoControl.asignacion_id, func.count(PuntoControl.id)
        ).filter(PuntoControl.asignacion_id.in_(asig_ids)).group_by(PuntoControl.asignacion_id).all():
            total_por_asig[asig_id] = cnt

        for asig_id, cnt in db.query(
            PuntoControl.asignacion_id, func.count(RespuestaControl.id)
        ).join(RespuestaControl, RespuestaControl.punto_id == PuntoControl.id).filter(
            PuntoControl.asignacion_id.in_(asig_ids)
        ).group_by(PuntoControl.asignacion_id).all():
            respondidos_por_asig[asig_id] = cnt

    for a in asignaciones:
        a.programa_titulo = titulos.get(a.programa_id)
        a.total_puntos = total_por_asig.get(a.id, 0)
        a.puntos_respondidos = respondidos_por_asig.get(a.id, 0)
    return asignaciones


@router.post("/asignaciones", response_model=AuditoriaAsignacionResponse, status_code=status.HTTP_201_CREATED)
def create_asignacion(
    data: AuditoriaAsignacionCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # El programa debe existir y pertenecer al tenant.
    prog = db.query(ProgramaAuditoria).filter(
        ProgramaAuditoria.id == data.programa_id,
        ProgramaAuditoria.tenant_id == current_user.tenant_id
    ).first()
    if not prog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El programa de auditoría seleccionado no existe."
        )

    # El auditor debe ser un usuario activo del mismo tenant.
    auditor = db.query(User).filter(
        User.id == data.auditor_id,
        User.tenant_id == current_user.tenant_id,
        User.active == True
    ).first()
    if not auditor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El auditor seleccionado no pertenece a esta organización."
        )

    asignacion = AuditoriaAsignacion(
        programa_id=data.programa_id,
        auditor_id=auditor.id,
        auditor_nombre=auditor.full_name or auditor.email,
        auditor_email=auditor.email,
        area=data.area,
        norma=data.norma,
        fecha_programada=data.fecha_programada,
        estado="asignada",
        notas=data.notas,
        tenant_id=current_user.tenant_id
    )
    db.add(asignacion)
    db.flush()  # obtener asignacion.id antes de generar los puntos

    # Si la norma tiene plantilla, generar el checklist inicial.
    if data.norma:
        for i, item in enumerate(get_template(data.norma)):
            db.add(PuntoControl(
                asignacion_id=asignacion.id,
                clausula=item["clausula"],
                pregunta=item["pregunta"],
                tipo_resp="conformidad",
                orden=i,
                tenant_id=current_user.tenant_id
            ))

    db.commit()
    db.refresh(asignacion)
    return _with_programa_titulo([asignacion], db)[0]


@router.get("/asignaciones", response_model=List[AuditoriaAsignacionResponse])
def list_asignaciones(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """Todas las asignaciones del tenant (vista del auditor líder)."""
    asignaciones = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.tenant_id == current_user.tenant_id
    ).order_by(AuditoriaAsignacion.fecha_programada).all()
    return _with_programa_titulo(asignaciones, db)


@router.get("/asignaciones/mias", response_model=List[AuditoriaAsignacionResponse])
def list_mis_asignaciones(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """Asignaciones del auditor autenticado (vista 'Mis auditorías')."""
    asignaciones = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.tenant_id == current_user.tenant_id,
        AuditoriaAsignacion.auditor_id == current_user.id
    ).order_by(AuditoriaAsignacion.fecha_programada).all()
    return _with_programa_titulo(asignaciones, db)


@router.patch("/asignaciones/{id}", response_model=AuditoriaAsignacionResponse)
def update_asignacion(
    id: UUID,
    data: AuditoriaAsignacionUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    asignacion = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.id == id,
        AuditoriaAsignacion.tenant_id == current_user.tenant_id
    ).first()
    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la asignación de auditoría especificada."
        )

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(asignacion, field, value)

    db.commit()
    db.refresh(asignacion)
    return _with_programa_titulo([asignacion], db)[0]


@router.delete("/asignaciones/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asignacion(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    asignacion = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.id == id,
        AuditoriaAsignacion.tenant_id == current_user.tenant_id
    ).first()
    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la asignación de auditoría especificada."
        )

    db.delete(asignacion)
    db.commit()


# ----------------- CHECKLIST: PUNTOS DE CONTROL Y RESPUESTAS -----------------

def _get_asignacion_or_404(asig_id, db, current_user):
    asignacion = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.id == asig_id,
        AuditoriaAsignacion.tenant_id == current_user.tenant_id
    ).first()
    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró la asignación de auditoría especificada."
        )
    return asignacion


@router.get("/plantillas")
def list_plantillas(current_user: User = Depends(get_current_active_user)):
    """Normas con plantilla de checklist disponible."""
    return {"normas": available_normas()}


@router.get("/asignaciones/{asig_id}/detalle", response_model=AuditoriaAsignacionResponse)
def get_asignacion_detalle(
    asig_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    asignacion = _get_asignacion_or_404(asig_id, db, current_user)
    return _with_programa_titulo([asignacion], db)[0]


@router.get("/asignaciones/{asig_id}/puntos", response_model=List[PuntoControlResponse])
def list_puntos(
    asig_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    _get_asignacion_or_404(asig_id, db, current_user)
    return db.query(PuntoControl).filter(
        PuntoControl.asignacion_id == asig_id
    ).order_by(PuntoControl.orden, PuntoControl.clausula).all()


@router.post("/asignaciones/{asig_id}/puntos", response_model=PuntoControlResponse, status_code=status.HTTP_201_CREATED)
def add_punto(
    asig_id: UUID,
    data: PuntoControlCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    _get_asignacion_or_404(asig_id, db, current_user)
    orden = data.orden
    if not orden:
        max_orden = db.query(func.coalesce(func.max(PuntoControl.orden), 0)).filter(
            PuntoControl.asignacion_id == asig_id
        ).scalar()
        orden = (max_orden or 0) + 1
    punto = PuntoControl(
        asignacion_id=asig_id,
        clausula=data.clausula,
        pregunta=data.pregunta,
        tipo_resp="conformidad",
        orden=orden,
        tenant_id=current_user.tenant_id
    )
    db.add(punto)
    db.commit()
    db.refresh(punto)
    return punto


@router.post("/asignaciones/{asig_id}/plantilla", response_model=List[PuntoControlResponse])
def aplicar_plantilla(
    asig_id: UUID,
    data: AplicarPlantillaRequest,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """Genera los puntos de control de una asignación a partir de una plantilla ISO."""
    asignacion = _get_asignacion_or_404(asig_id, db, current_user)
    template = get_template(data.norma)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No existe una plantilla de checklist para la norma '{data.norma}'."
        )

    if data.reemplazar:
        db.query(PuntoControl).filter(PuntoControl.asignacion_id == asig_id).delete(synchronize_session=False)

    base = 0 if data.reemplazar else (db.query(func.coalesce(func.max(PuntoControl.orden), 0)).filter(
        PuntoControl.asignacion_id == asig_id).scalar() or 0)

    for i, item in enumerate(template):
        db.add(PuntoControl(
            asignacion_id=asig_id,
            clausula=item["clausula"],
            pregunta=item["pregunta"],
            tipo_resp="conformidad",
            orden=base + i + 1,
            tenant_id=current_user.tenant_id
        ))
    if not asignacion.norma:
        asignacion.norma = data.norma
    db.commit()

    return db.query(PuntoControl).filter(
        PuntoControl.asignacion_id == asig_id
    ).order_by(PuntoControl.orden, PuntoControl.clausula).all()


@router.delete("/puntos/{punto_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_punto(
    punto_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    punto = db.query(PuntoControl).filter(
        PuntoControl.id == punto_id,
        PuntoControl.tenant_id == current_user.tenant_id
    ).first()
    if not punto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el punto de control especificado."
        )
    db.delete(punto)
    db.commit()


@router.post("/puntos/{punto_id}/foto")
async def upload_foto_control(
    punto_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
    token_data: TokenData = Depends(get_current_user),
):
    """
    Sube una foto de evidencia para un punto de control al bucket aislado del
    tenant y devuelve su 'key'. La app móvil la incluye luego en foto_url al
    sincronizar la respuesta. Idempotente por el nombre de archivo (client_uuid).
    """
    punto = db.query(PuntoControl).filter(
        PuntoControl.id == punto_id,
        PuntoControl.tenant_id == current_user.tenant_id
    ).first()
    if not punto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el punto de control especificado."
        )

    try:
        file_data = await file.read()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo leer la imagen cargada.")

    safe_name = (file.filename or "evidencia.jpg").replace(" ", "_")
    key = f"auditorias/{punto_id}/{uuid4()}_{safe_name}"
    ok = s3_service.upload_file(tenant_slug=token_data.tenant_slug, file_key=key, file_data=file_data)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al subir la evidencia al almacenamiento."
        )
    return {"key": key}


@router.put("/puntos/{punto_id}/respuesta", response_model=RespuestaControlResponse)
def upsert_respuesta(
    punto_id: UUID,
    data: RespuestaControlUpsert,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """
    Registra (o actualiza) la respuesta del auditor a un punto de control.
    Idempotente: reenviar con el mismo client_uuid no crea duplicados, lo que
    habilita la sincronización offline→online de la app móvil (Fase 3).
    """
    if data.resultado not in ("conforme", "no_conforme", "na"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El resultado debe ser 'conforme', 'no_conforme' o 'na'."
        )

    punto = db.query(PuntoControl).filter(
        PuntoControl.id == punto_id,
        PuntoControl.tenant_id == current_user.tenant_id
    ).first()
    if not punto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el punto de control especificado."
        )

    # Idempotencia por client_uuid (una acción de la app móvil).
    if data.client_uuid:
        existente = db.query(RespuestaControl).filter(
            RespuestaControl.client_uuid == data.client_uuid
        ).first()
        if existente:
            return existente

    respuesta = db.query(RespuestaControl).filter(
        RespuestaControl.punto_id == punto_id
    ).first()

    now = datetime.now(timezone.utc)
    if respuesta:
        respuesta.resultado = data.resultado
        respuesta.nota = data.nota
        if data.foto_url is not None:
            respuesta.foto_url = data.foto_url
        if data.lat is not None:
            respuesta.lat = data.lat
        if data.lng is not None:
            respuesta.lng = data.lng
        respuesta.synced_at = now
        if data.client_uuid:
            respuesta.client_uuid = data.client_uuid
    else:
        respuesta = RespuestaControl(
            client_uuid=data.client_uuid,
            punto_id=punto_id,
            resultado=data.resultado,
            nota=data.nota,
            foto_url=data.foto_url,
            lat=data.lat,
            lng=data.lng,
            synced_at=now,
            tenant_id=current_user.tenant_id
        )
        db.add(respuesta)

    # Al registrar la primera respuesta, la asignación pasa a 'en_progreso'.
    asignacion = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.id == punto.asignacion_id
    ).first()
    if asignacion and asignacion.estado == "asignada":
        asignacion.estado = "en_progreso"

    db.commit()
    db.refresh(respuesta)
    return respuesta


# ----------------- HALLAZGOS DE AUDITORIA -----------------

@router.post("/hallazgos", response_model=AuditoriaHallazgoResponse, status_code=status.HTTP_201_CREATED)
def create_hallazgo(
    data: AuditoriaHallazgoCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    # Verify program exists and belongs to this tenant
    prog = db.query(ProgramaAuditoria).filter(
        ProgramaAuditoria.id == data.programa_id,
        ProgramaAuditoria.tenant_id == current_user.tenant_id
    ).first()

    if not prog:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El programa de auditoría seleccionado no existe."
        )

    hallazgo = AuditoriaHallazgo(
        descripcion=data.descripcion,
        clasificacion=data.clasificacion,
        clausula_referencia=data.clausula_referencia,
        estado=data.estado,
        programa_id=data.programa_id,
        tenant_id=current_user.tenant_id
    )
    db.add(hallazgo)
    db.commit()
    db.refresh(hallazgo)
    return hallazgo

@router.get("/hallazgos", response_model=List[AuditoriaHallazgoResponse])
def list_hallazgos(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(AuditoriaHallazgo).filter(AuditoriaHallazgo.tenant_id == current_user.tenant_id).all()

@router.delete("/hallazgos/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hallazgo(
    id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    hallazgo = db.query(AuditoriaHallazgo).filter(
        AuditoriaHallazgo.id == id,
        AuditoriaHallazgo.tenant_id == current_user.tenant_id
    ).first()

    if not hallazgo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el hallazgo de auditoría especificado."
        )

    db.delete(hallazgo)
    db.commit()
