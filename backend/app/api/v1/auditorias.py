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
    PuntoControl, RespuestaControl, PlantillaChecklist
)
from app.models.iso9001 import NonConformity
from app.models.tenant import Tenant
from app.services import notifications
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
    AplicarPlantillaRequest,
    ReporteAuditoria,
    ReporteResumen,
    ReporteHallazgoNC,
    PlantillaChecklistCreate,
    PlantillaChecklistResponse,
    GuardarComoPlantillaRequest,
)
from app.data.checklist_templates import get_template, available_normas
from app.api.deps import require_modules

router = APIRouter()

# Endpoints de GESTIÓN (auditor líder): además del acceso mínimo al router,
# exigen el módulo "auditorias". Los de CAMPO no lo llevan, así el auditor de
# campo (perfil con "mis-auditorias") puede ejecutar sus asignaciones.
_gestion = [Depends(require_modules("auditorias"))]

# ----------------- PROGRAMAS DE AUDITORIA -----------------

@router.post("/programas", response_model=ProgramaAuditoriaResponse, status_code=status.HTTP_201_CREATED, dependencies=_gestion)
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

    # Aviso a los responsables de Calidad/SGI (administradores del tenant).
    try:
        admin_emails = [
            u.email for u in db.query(User).filter(
                User.tenant_id == current_user.tenant_id,
                User.role == "admin",
                User.active == True,  # noqa: E712
            ).all() if u.email
        ]
        tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
        notifications.notify_audit_planned(
            admin_emails, programa.titulo, programa.fecha_inicio,
            programa.fecha_fin, tenant.name if tenant else None)
    except Exception:  # noqa: BLE001 — un aviso no debe romper la creación
        pass

    return programa

@router.get("/programas", response_model=List[ProgramaAuditoriaResponse], dependencies=_gestion)
def list_programas(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(ProgramaAuditoria).filter(ProgramaAuditoria.tenant_id == current_user.tenant_id).all()

@router.delete("/programas/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=_gestion)
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


@router.post("/asignaciones", response_model=AuditoriaAsignacionResponse, status_code=status.HTTP_201_CREATED, dependencies=_gestion)
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

    # Aviso al auditor de campo asignado.
    try:
        notifications.notify_audit_assigned(
            asignacion.auditor_email, asignacion.auditor_nombre, asignacion.area,
            asignacion.norma, asignacion.fecha_programada, prog.titulo)
    except Exception:  # noqa: BLE001
        pass

    return _with_programa_titulo([asignacion], db)[0]


@router.get("/asignaciones", response_model=List[AuditoriaAsignacionResponse], dependencies=_gestion)
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


@router.delete("/asignaciones/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=_gestion)
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


@router.post("/asignaciones/{asig_id}/puntos", response_model=PuntoControlResponse, status_code=status.HTTP_201_CREATED, dependencies=_gestion)
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


@router.post("/asignaciones/{asig_id}/plantilla", response_model=List[PuntoControlResponse], dependencies=_gestion)
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


@router.delete("/puntos/{punto_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=_gestion)
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

    db.flush()  # asegura respuesta.id antes de vincular la NC

    # No Conformidad automática: un 'no_conforme' genera (una sola vez) una NC en el
    # módulo ISO 9001 para su tratamiento. Si el resultado deja de ser 'no_conforme'
    # y la NC autogenerada sigue abierta y sin análisis, se elimina (evita huérfanas).
    if respuesta.resultado == "no_conforme":
        if not respuesta.nc_id:
            nc = NonConformity(
                title=f"Hallazgo de auditoría — {punto.clausula}",
                description=(
                    f"{punto.pregunta}\n\n"
                    f"Área auditada: {asignacion.area if asignacion else '-'}. "
                    f"Observación del auditor: {respuesta.nota or 'sin observación'}."
                ),
                origin="auditoria",
                estado="abierta",
                creado_por_id=current_user.id,
                tenant_id=current_user.tenant_id,
            )
            db.add(nc)
            db.flush()
            respuesta.nc_id = nc.id
    elif respuesta.nc_id:
        nc = db.query(NonConformity).filter(NonConformity.id == respuesta.nc_id).first()
        if nc and nc.estado == "abierta" and not nc.five_whys and not nc.ishikawa and not nc.corrective_actions:
            db.delete(nc)
        respuesta.nc_id = None

    db.commit()
    db.refresh(respuesta)
    return respuesta


@router.post("/asignaciones/{asig_id}/firma", response_model=AuditoriaAsignacionResponse)
async def firmar_auditoria(
    asig_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
    token_data: TokenData = Depends(get_current_user),
):
    """
    Cierra la auditoría con la firma digital del auditor: sube la imagen de firma
    al bucket del tenant, registra firmante/fecha y marca la asignación como
    'completada'. Requiere que todos los puntos de control tengan respuesta.
    """
    asignacion = _get_asignacion_or_404(asig_id, db, current_user)

    total = db.query(func.count(PuntoControl.id)).filter(PuntoControl.asignacion_id == asig_id).scalar() or 0
    respondidos = db.query(func.count(RespuestaControl.id)).join(
        PuntoControl, RespuestaControl.punto_id == PuntoControl.id
    ).filter(PuntoControl.asignacion_id == asig_id).scalar() or 0
    if total == 0 or respondidos < total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede firmar: quedan controles sin responder."
        )

    try:
        file_data = await file.read()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo leer la firma.")

    key = f"auditorias/{asig_id}/firma_{uuid4()}.png"
    ok = s3_service.upload_file(tenant_slug=token_data.tenant_slug, file_key=key, file_data=file_data)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al subir la firma al almacenamiento."
        )

    asignacion.firma_url = key
    asignacion.firmado_por = current_user.full_name or current_user.email
    asignacion.firmado_at = datetime.now(timezone.utc)
    asignacion.estado = "completada"
    db.commit()
    db.refresh(asignacion)
    return _with_programa_titulo([asignacion], db)[0]


@router.get("/asignaciones/{asig_id}/reporte", response_model=ReporteAuditoria)
def reporte_auditoria(
    asig_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
    token_data: TokenData = Depends(get_current_user),
):
    """Reporte consolidado de la auditoría para la vista imprimible / PDF."""
    asignacion = _get_asignacion_or_404(asig_id, db, current_user)
    asignacion = _with_programa_titulo([asignacion], db)[0]

    puntos = db.query(PuntoControl).filter(
        PuntoControl.asignacion_id == asig_id
    ).order_by(PuntoControl.orden, PuntoControl.clausula).all()

    conforme = no_conforme = na = sin = 0
    hallazgos = []
    for p in puntos:
        r = p.respuesta
        if not r:
            sin += 1
            continue
        if r.resultado == "conforme":
            conforme += 1
        elif r.resultado == "no_conforme":
            no_conforme += 1
            if r.nc_id:
                nc = db.query(NonConformity).filter(NonConformity.id == r.nc_id).first()
                hallazgos.append(ReporteHallazgoNC(
                    nc_id=r.nc_id,
                    clausula=p.clausula,
                    titulo=nc.title if nc else f"Hallazgo — {p.clausula}",
                    estado=nc.estado if nc else "abierta",
                ))
        elif r.resultado == "na":
            na += 1

    firma_url = None
    if asignacion.firma_url:
        firma_url = s3_service.generate_presigned_download_url(token_data.tenant_slug, asignacion.firma_url)

    return ReporteAuditoria(
        asignacion=AuditoriaAsignacionResponse.model_validate(asignacion),
        firma_download_url=firma_url,
        resumen=ReporteResumen(
            total=len(puntos), conforme=conforme, no_conforme=no_conforme, na=na, sin_responder=sin
        ),
        puntos=[PuntoControlResponse.model_validate(p) for p in puntos],
        no_conformidades=hallazgos,
    )


# ----------------- HALLAZGOS DE AUDITORIA -----------------

@router.post("/hallazgos", response_model=AuditoriaHallazgoResponse, status_code=status.HTTP_201_CREATED, dependencies=_gestion)
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

@router.get("/hallazgos", response_model=List[AuditoriaHallazgoResponse], dependencies=_gestion)
def list_hallazgos(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(AuditoriaHallazgo).filter(AuditoriaHallazgo.tenant_id == current_user.tenant_id).all()

@router.delete("/hallazgos/{id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=_gestion)
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


# ----------------- PLANTILLAS DE CHECKLIST REUTILIZABLES -----------------
# Un supervisor/auditor líder arma una lista de preguntas una vez (ej. EPP) y la
# reutiliza en futuras asignaciones de campo, sin recargarla cada vez.

@router.get("/plantillas-checklist", response_model=List[PlantillaChecklistResponse], dependencies=_gestion)
def list_plantillas_checklist(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(PlantillaChecklist).filter(
        PlantillaChecklist.tenant_id == current_user.tenant_id
    ).order_by(PlantillaChecklist.nombre).all()


@router.post("/plantillas-checklist", response_model=PlantillaChecklistResponse,
             status_code=status.HTTP_201_CREATED, dependencies=_gestion)
def create_plantilla_checklist(
    data: PlantillaChecklistCreate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    items = [
        {"clausula": (it.clausula or f"Ítem {i + 1}"), "pregunta": it.pregunta, "orden": i + 1}
        for i, it in enumerate(data.items) if (it.pregunta or "").strip()
    ]
    plantilla = PlantillaChecklist(
        nombre=data.nombre,
        descripcion=data.descripcion,
        categoria=data.categoria,
        items=items,
        tenant_id=current_user.tenant_id,
    )
    db.add(plantilla)
    db.commit()
    db.refresh(plantilla)
    return plantilla


@router.delete("/plantillas-checklist/{plantilla_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=_gestion)
def delete_plantilla_checklist(
    plantilla_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    plantilla = db.query(PlantillaChecklist).filter(
        PlantillaChecklist.id == plantilla_id,
        PlantillaChecklist.tenant_id == current_user.tenant_id
    ).first()
    if not plantilla:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró la plantilla.")
    db.delete(plantilla)
    db.commit()


@router.post("/plantillas-checklist/desde-asignacion/{asig_id}", response_model=PlantillaChecklistResponse,
             status_code=status.HTTP_201_CREATED, dependencies=_gestion)
def guardar_plantilla_desde_asignacion(
    asig_id: UUID,
    data: GuardarComoPlantillaRequest,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """Guarda las preguntas actuales de una asignación como una plantilla reutilizable."""
    _get_asignacion_or_404(asig_id, db, current_user)
    puntos = db.query(PuntoControl).filter(
        PuntoControl.asignacion_id == asig_id
    ).order_by(PuntoControl.orden, PuntoControl.clausula).all()
    if not puntos:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="La asignación no tiene preguntas para guardar.")
    items = [
        {"clausula": p.clausula, "pregunta": p.pregunta, "orden": i + 1}
        for i, p in enumerate(puntos)
    ]
    plantilla = PlantillaChecklist(
        nombre=data.nombre,
        descripcion=data.descripcion,
        categoria=data.categoria,
        items=items,
        tenant_id=current_user.tenant_id,
    )
    db.add(plantilla)
    db.commit()
    db.refresh(plantilla)
    return plantilla


@router.post("/asignaciones/{asig_id}/aplicar-plantilla/{plantilla_id}",
             response_model=List[PuntoControlResponse], dependencies=_gestion)
def aplicar_plantilla_checklist(
    asig_id: UUID,
    plantilla_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """Agrega las preguntas de una plantilla a una asignación (a continuación de las existentes)."""
    _get_asignacion_or_404(asig_id, db, current_user)
    plantilla = db.query(PlantillaChecklist).filter(
        PlantillaChecklist.id == plantilla_id,
        PlantillaChecklist.tenant_id == current_user.tenant_id
    ).first()
    if not plantilla:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No se encontró la plantilla.")

    max_orden = db.query(func.coalesce(func.max(PuntoControl.orden), 0)).filter(
        PuntoControl.asignacion_id == asig_id
    ).scalar() or 0

    for i, it in enumerate(plantilla.items or []):
        pregunta = (it.get("pregunta") or "").strip()
        if not pregunta:
            continue
        db.add(PuntoControl(
            asignacion_id=asig_id,
            clausula=it.get("clausula") or f"Ítem {max_orden + i + 1}",
            pregunta=pregunta,
            tipo_resp="conformidad",
            orden=max_orden + i + 1,
            tenant_id=current_user.tenant_id,
        ))
    db.commit()
    return db.query(PuntoControl).filter(
        PuntoControl.asignacion_id == asig_id
    ).order_by(PuntoControl.orden, PuntoControl.clausula).all()
