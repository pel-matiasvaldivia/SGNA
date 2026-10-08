from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from starlette.concurrency import run_in_threadpool
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy import text as sa_text
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone, date
from typing import List
from uuid import UUID, uuid4

from app.api.deps import get_tenant_db_from_token, get_current_active_user, get_current_user
from app.schemas.auth import TokenData
from app.services.s3 import s3_service
from app.models.user import User
from app.core.membership import membership_for, admin_emails_of_tenant
from app.models.auditoria import (
    ProgramaAuditoria, AuditoriaHallazgo, AuditoriaAsignacion,
    PuntoControl, RespuestaControl, PlantillaChecklist, PlanAuditoria
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
    ContactoEnSitio,
    PuntoControlCreate,
    PuntoControlResponse,
    RespuestaControlUpsert,
    RespuestaControlResponse,
    AplicarPlantillaRequest,
    ReporteAuditoria,
    ReporteResumen,
    ReporteHallazgoNC,
    PlanAuditoriaUpdate,
    PlanAuditoriaResponse,
    PlantillaChecklistCreate,
    PlantillaChecklistResponse,
    GuardarComoPlantillaRequest,
    TranscripcionResultado,
)
from app.services import transcription, ubicacion
from app.data.checklist_templates import get_template, available_normas
from app.data.plan_auditoria import (
    cronograma_base, criterios_base, edicion_norma, formatear_codigo, objetivo_base,
)
from app.api.deps import require_modules
from app.data.modules_catalog import allowed_modules_for_role

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
        norma=data.norma,
        tenant_id=current_user.tenant_id
    )
    db.add(programa)
    db.flush()

    # El plan nace con el programa: código, criterios y el cronograma de la
    # jornada ya cargados. Va en la misma transacción —no en un try/except como
    # el aviso por correo— porque un programa sin plan es un documento a medias.
    _crear_plan(programa, db, current_user)

    db.commit()
    db.refresh(programa)

    # Aviso a los responsables de Calidad/SGI (administradores del tenant).
    try:
        admin_emails = admin_emails_of_tenant(db, current_user.tenant_id)
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


# ----------------- PLAN DE AUDITORIA -----------------

def _get_programa_or_404(programa_id: UUID, db: Session, current_user: User) -> ProgramaAuditoria:
    programa = db.query(ProgramaAuditoria).filter(
        ProgramaAuditoria.id == programa_id,
        ProgramaAuditoria.tenant_id == current_user.tenant_id
    ).first()
    if not programa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el programa de auditoría especificado."
        )
    return programa


def _proximo_numero_de_plan(db: Session, tenant_id: UUID, anio: int) -> int:
    """
    Reserva el próximo número de plan del año, de forma atómica.

    El UPSERT incrementa y devuelve en la misma sentencia, así dos planes
    emitidos al mismo tiempo no pueden sacar el mismo número. El contador vive
    aparte de los planes a propósito: borrar un plan no lo hace retroceder.
    """
    return db.execute(sa_text("""
        INSERT INTO planes_auditoria_correlativo (tenant_id, anio, ultimo)
        VALUES (:tenant_id, :anio, 1)
        ON CONFLICT (tenant_id, anio)
        DO UPDATE SET ultimo = planes_auditoria_correlativo.ultimo + 1
        RETURNING ultimo
    """), {"tenant_id": str(tenant_id), "anio": anio}).scalar()


def _crear_plan(programa: ProgramaAuditoria, db: Session, current_user: User) -> PlanAuditoria:
    """Emite el plan de un programa con el contenido base ya cargado."""
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    organizacion = tenant.name if tenant else None

    anio = programa.fecha_inicio.year
    numero = _proximo_numero_de_plan(db, current_user.tenant_id, anio)

    plan = PlanAuditoria(
        programa_id=programa.id,
        codigo=formatear_codigo(anio, numero),
        revision="01",
        fecha_emision=date.today(),
        norma=edicion_norma(programa.norma),
        organizacion=organizacion,
        auditor_lider=current_user.full_name or current_user.email,
        fecha_auditoria=programa.fecha_inicio,
        jornada="09:00 a 13:00 hs",
        objetivo=objetivo_base(organizacion, programa.norma),
        alcance=programa.alcance,
        criterios=criterios_base(programa.norma),
        cronograma=cronograma_base(programa.norma),
        tenant_id=current_user.tenant_id,
    )
    db.add(plan)
    return plan


def _plan_response(plan: PlanAuditoria, programa: ProgramaAuditoria) -> dict:
    datos = {c.name: getattr(plan, c.name) for c in PlanAuditoria.__table__.columns}
    datos["programa_titulo"] = programa.titulo
    datos["cronograma"] = plan.cronograma or []
    return datos


@router.get("/programas/{programa_id}/plan", response_model=PlanAuditoriaResponse, dependencies=_gestion)
def get_plan(
    programa_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """
    Plan de auditoría del programa. Si todavía no existe, se emite ahora.

    Los programas creados antes de que existiera el plan no tienen uno, y
    pedirles que se borren y se vuelvan a crear para obtenerlo sería absurdo:
    la primera consulta lo genera con el mismo contenido base.
    """
    programa = _get_programa_or_404(programa_id, db, current_user)
    plan = db.query(PlanAuditoria).filter(
        PlanAuditoria.programa_id == programa.id,
        PlanAuditoria.tenant_id == current_user.tenant_id
    ).first()

    if not plan:
        plan = _crear_plan(programa, db, current_user)
        try:
            db.commit()
        except IntegrityError:
            # Dos pestañas abrieron el plan a la vez; gana la que insertó primero.
            db.rollback()
            plan = db.query(PlanAuditoria).filter(
                PlanAuditoria.programa_id == programa.id,
                PlanAuditoria.tenant_id == current_user.tenant_id
            ).first()
            if not plan:
                raise
        else:
            db.refresh(plan)

    return _plan_response(plan, programa)


@router.put("/programas/{programa_id}/plan", response_model=PlanAuditoriaResponse, dependencies=_gestion)
def update_plan(
    programa_id: UUID,
    data: PlanAuditoriaUpdate,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    programa = _get_programa_or_404(programa_id, db, current_user)
    plan = db.query(PlanAuditoria).filter(
        PlanAuditoria.programa_id == programa.id,
        PlanAuditoria.tenant_id == current_user.tenant_id
    ).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Este programa todavía no tiene un plan de auditoría emitido."
        )

    cambios = data.model_dump(exclude_unset=True)
    cronograma = cambios.pop("cronograma", None)
    for campo, valor in cambios.items():
        setattr(plan, campo, valor)
    if cronograma is not None:
        plan.cronograma = [dict(fila) for fila in cronograma]

    db.commit()
    db.refresh(plan)
    return _plan_response(plan, programa)


# ----------------- ASIGNACIONES DE AUDITORIA (líder -> campo) -----------------

def _contacto_de(asignacion, tenant) -> ContactoEnSitio | None:
    """
    Referente en sitio: a quién busca el auditor al llegar.

    El contacto se toma como un bloque y no campo por campo: si la asignación
    nombra a alguien, vale esa persona con los datos que tenga. Mezclarla con
    el teléfono de la organización mostraría un número ajeno como si fuera el
    suyo. Sólo cuando la asignación no nombra a nadie se usa el contacto de la
    ficha de la organización, y entonces queda marcado como tal.
    """
    propio = any((
        (asignacion.contacto_nombre or "").strip(),
        (asignacion.contacto_cargo or "").strip(),
        (asignacion.contacto_telefono or "").strip(),
        (asignacion.contacto_email or "").strip(),
    ))
    if propio:
        return ContactoEnSitio(
            nombre=asignacion.contacto_nombre,
            cargo=asignacion.contacto_cargo,
            telefono=asignacion.contacto_telefono,
            email=asignacion.contacto_email,
            de_la_organizacion=False,
        )
    if tenant is None:
        return None
    if not any((tenant.contacto_nombre, tenant.telefono, tenant.contacto_email)):
        return None
    return ContactoEnSitio(
        nombre=tenant.contacto_nombre,
        telefono=tenant.telefono,
        email=tenant.contacto_email,
        de_la_organizacion=True,
    )


def _enriquecer(asignaciones, db):
    """
    Completa las asignaciones con todo lo que la app de campo muestra y que no
    está en la fila: el título, el alcance y los objetivos del programa, el
    progreso del checklist, y la ubicación y el contacto efectivos.

    Se resuelve acá, del lado del servidor, por dos razones: el auditor trabaja
    sin señal —lo que no venga en esta respuesta no lo tiene en el celular— y
    los datos de la organización viven en ``public.tenants``, fuera del alcance
    de un auditor de campo si tuviera que pedirlos por su cuenta.
    """
    asig_ids = {a.id for a in asignaciones}
    prog_ids = {a.programa_id for a in asignaciones}

    programas = {}
    if prog_ids:
        for p in db.query(
            ProgramaAuditoria.id, ProgramaAuditoria.titulo,
            ProgramaAuditoria.alcance, ProgramaAuditoria.objetivos,
        ).filter(ProgramaAuditoria.id.in_(prog_ids)).all():
            programas[p.id] = p

    # Ficha de la organización: nombre, domicilio y contacto por defecto. Todas
    # las asignaciones de una respuesta son del mismo tenant (el del token), así
    # que es una sola consulta.
    tenant = None
    tenant_ids = {a.tenant_id for a in asignaciones if a.tenant_id}
    if len(tenant_ids) == 1:
        tenant = db.query(Tenant).filter(Tenant.id == tenant_ids.pop()).first()

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
        prog = programas.get(a.programa_id)
        a.programa_titulo = prog.titulo if prog else None
        a.programa_alcance = prog.alcance if prog else None
        a.programa_objetivos = prog.objetivos if prog else None
        a.total_puntos = total_por_asig.get(a.id, 0)
        a.puntos_respondidos = respondidos_por_asig.get(a.id, 0)

        a.organizacion = tenant.name if tenant else None
        a.direccion = ubicacion.direccion_efectiva(
            a.lugar_direccion, tenant.domicilio if tenant else None)
        a.mapa_url = ubicacion.url_de_mapa(a.direccion, a.lugar_lat, a.lugar_lng)
        a.jornada = ubicacion.jornada_legible(a.hora_inicio, a.hora_fin)
        a.contacto = _contacto_de(a, tenant)
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

    # El auditor debe pertenecer a esta organización. La pertenencia puede ser
    # la de su propia cuenta o la de un auditor externo (partner, o alguien del
    # equipo propio) que además trabaja para otros clientes.
    auditor = db.query(User).filter(
        User.id == data.auditor_id,
        User.active == True
    ).first()
    if not auditor or not membership_for(db, auditor, current_user.tenant_id):
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
        # Dónde y con quién. Lo que quede vacío lo cubre la ficha de la
        # organización al momento de responder (ver _enriquecer).
        lugar_nombre=data.lugar_nombre,
        lugar_direccion=data.lugar_direccion,
        lugar_lat=data.lugar_lat,
        lugar_lng=data.lugar_lng,
        hora_inicio=data.hora_inicio,
        hora_fin=data.hora_fin,
        contacto_nombre=data.contacto_nombre,
        contacto_cargo=data.contacto_cargo,
        contacto_telefono=data.contacto_telefono,
        contacto_email=data.contacto_email,
        tenant_id=current_user.tenant_id
    )
    db.add(asignacion)
    db.flush()  # obtener asignacion.id antes de generar los puntos

    # Si la norma tiene plantilla, generar el checklist inicial. Sin norma la
    # asignación queda válida y sin preguntas: el líder las carga a mano (o desde
    # una plantilla guardada) y el auditor puede reclamárselas desde la app.
    puntos_generados = 0
    if data.norma:
        for i, item in enumerate(get_template(data.norma)):
            puntos_generados += 1
            db.add(PuntoControl(
                asignacion_id=asignacion.id,
                clausula=item["clausula"],
                pregunta=item["pregunta"],
                tipo_resp="conformidad",
                orden=i,
                modulo=item.get("modulo"),
                evidencia_solicitada=item.get("evidencia"),
                tenant_id=current_user.tenant_id
            ))

    db.commit()
    db.refresh(asignacion)

    # La respuesta ya trae la ubicación y el contacto resueltos; el correo sale
    # de ahí para que diga exactamente lo mismo que la app.
    resultado = _enriquecer([asignacion], db)[0]

    # Aviso al auditor de campo asignado.
    try:
        notifications.notify_audit_assigned(
            asignacion.auditor_email, asignacion.auditor_nombre, asignacion.area,
            asignacion.norma, asignacion.fecha_programada, prog.titulo,
            con_checklist=puntos_generados > 0,
            organizacion=resultado.organizacion,
            lugar_nombre=resultado.lugar_nombre,
            direccion=resultado.direccion,
            mapa_url=resultado.mapa_url,
            jornada=resultado.jornada,
            contacto=resultado.contacto.model_dump() if resultado.contacto else None,
            alcance=prog.alcance)
    except Exception:  # noqa: BLE001
        pass

    return resultado


@router.get("/asignaciones", response_model=List[AuditoriaAsignacionResponse], dependencies=_gestion)
def list_asignaciones(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """Todas las asignaciones del tenant (vista del auditor líder)."""
    asignaciones = db.query(AuditoriaAsignacion).filter(
        AuditoriaAsignacion.tenant_id == current_user.tenant_id
    ).order_by(AuditoriaAsignacion.fecha_programada).all()
    return _enriquecer(asignaciones, db)


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
    return _enriquecer(asignaciones, db)


# Campos de la asignación que son planificación, no ejecución: los acuerda el
# auditor líder con la organización. El auditor de campo sólo mueve `estado`.
_CAMPOS_DE_PLANIFICACION = {
    "area", "fecha_programada", "notas",
    "lugar_nombre", "lugar_direccion", "lugar_lat", "lugar_lng",
    "hora_inicio", "hora_fin",
    "contacto_nombre", "contacto_cargo", "contacto_telefono", "contacto_email",
}


def _puede_planificar(db: Session, current_user: User) -> bool:
    """
    ¿El usuario tiene el módulo de gestión de auditorías en esta organización?

    Se evalúa igual que `require_modules("auditorias")` —mismo catálogo, mismo
    `tenant.settings` leído en vivo— pero como un booleano, porque acá no
    decide el acceso al endpoint sino qué campos puede tocar. El rol que se
    mira es el de la organización activa, que `get_current_active_user` ya dejó
    en `current_user.role`.
    """
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    config = tenant.settings if (tenant and isinstance(tenant.settings, dict)) else {}
    permitidos = allowed_modules_for_role(config, current_user.role)
    return permitidos is None or "auditorias" in permitidos


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

    cambios = data.model_dump(exclude_unset=True)

    # Este endpoint lo usan los dos lados: el auditor de campo para mover el
    # estado de SU auditoría desde el celular, y el líder para corregir la
    # planificación. Lo segundo exige el módulo de gestión: el domicilio, el
    # horario y el contacto son el acuerdo con el cliente, y quien ejecuta la
    # visita no decide dónde ni con quién se hace.
    de_planificacion = set(cambios) & _CAMPOS_DE_PLANIFICACION
    if de_planificacion and not _puede_planificar(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Sólo el auditor líder puede cambiar la planificación de la "
                   "auditoría (lugar, horario, contacto, fecha o alcance). "
                   "Desde la app podés actualizar el estado de la tuya.",
        )

    for field, value in cambios.items():
        setattr(asignacion, field, value)

    db.commit()
    db.refresh(asignacion)
    return _enriquecer([asignacion], db)[0]


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


@router.get("/transcripcion/estado")
def estado_transcripcion(
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
):
    """
    Diagnóstico de las notas de voz: si el cliente las habilitó y si la
    plataforma tiene proveedor de transcripción. Nunca expone la clave.
    """
    st = transcription.status()
    st["habilitada_en_tenant"] = _audio_notes_enabled(db, current_user.tenant_id)
    st["operativa"] = bool(st["habilitada"] and st["habilitada_en_tenant"])
    if not st["habilitada_en_tenant"]:
        st["detalle"] = ("Las notas de voz están desactivadas para esta organización "
                         "(Configuración → Auditoría en Campo).")
    return st


@router.get("/asignaciones/{asig_id}/detalle", response_model=AuditoriaAsignacionResponse)
def get_asignacion_detalle(
    asig_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    asignacion = _get_asignacion_or_404(asig_id, db, current_user)
    return _enriquecer([asignacion], db)[0]


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
        modulo=data.modulo,
        evidencia_solicitada=data.evidencia_solicitada,
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
            modulo=item.get("modulo"),
            evidencia_solicitada=item.get("evidencia"),
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


def _audio_notes_enabled(db: Session, tenant_id) -> bool:
    """
    Las notas de voz son opt-in por cliente (Configuración → Auditoría en Campo):
    implican mandar el audio a un transcriptor externo, así que si el tenant no
    las habilitó, el checklist queda solo con nota escrita y foto.
    """
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    s = tenant.settings if (tenant and isinstance(tenant.settings, dict)) else {}
    raw = s.get("field_audit") if isinstance(s.get("field_audit"), dict) else {}
    return bool(raw.get("audio_notes_enabled", False))


@router.post("/puntos/{punto_id}/audio")
async def upload_audio_control(
    punto_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
    token_data: TokenData = Depends(get_current_user),
):
    """
    Sube una nota de voz del auditor para un punto de control. El audio queda
    como evidencia en el bucket aislado del tenant y se transcribe a texto al
    finalizar (firmar) la auditoría.
    """
    if not _audio_notes_enabled(db, current_user.tenant_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Las notas de voz no están habilitadas para esta organización. "
                   "Un administrador puede activarlas en Configuración → Auditoría en Campo."
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

    try:
        file_data = await file.read()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se pudo leer el audio cargado.")
    if not file_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El audio cargado está vacío.")

    safe_name = (file.filename or "nota-voz.webm").replace(" ", "_")
    key = f"auditorias/{punto_id}/audio/{uuid4()}_{safe_name}"
    ok = s3_service.upload_file(tenant_slug=token_data.tenant_slug, file_key=key, file_data=file_data)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al subir la nota de voz al almacenamiento."
        )
    return {"key": key, "transcripcion_disponible": transcription.is_enabled()}


def _transcribir_asignacion(asig_id: UUID, db: Session, tenant_slug: str) -> TranscripcionResultado:
    """
    Transcribe a texto las notas de voz pendientes de una asignación. No lanza
    excepciones: un fallo de transcripción nunca debe impedir cerrar la auditoría.
    """
    respuestas = db.query(RespuestaControl).join(
        PuntoControl, RespuestaControl.punto_id == PuntoControl.id
    ).filter(
        PuntoControl.asignacion_id == asig_id,
        RespuestaControl.audio_url.isnot(None),
    ).all()

    resultado = TranscripcionResultado(
        total_audios=len(respuestas),
        proveedor_disponible=transcription.is_enabled(),
    )
    if not respuestas:
        return resultado

    if not resultado.proveedor_disponible:
        for r in respuestas:
            if r.transcripcion_estado != transcription.ESTADO_OK:
                r.transcripcion_estado = transcription.ESTADO_NO_DISPONIBLE
        db.commit()
        resultado.detalle = (
            "Las notas de voz quedaron adjuntas como evidencia, pero no hay un "
            "servicio de transcripción configurado en la plataforma."
        )
        return resultado

    for r in respuestas:
        if r.transcripcion_estado == transcription.ESTADO_OK and r.transcripcion:
            resultado.transcriptas += 1
            continue
        audio = s3_service.download_file(tenant_slug, r.audio_url)
        if audio is None:
            r.transcripcion_estado = transcription.ESTADO_ERROR
            resultado.con_error += 1
            continue
        estado, texto = transcription.transcribe(audio, filename=r.audio_url.rsplit("/", 1)[-1])
        r.transcripcion_estado = estado
        if estado == transcription.ESTADO_OK and texto:
            r.transcripcion = texto
            # La transcripción se incorpora a la observación del punto para que
            # aparezca en el reporte y en la NC generada, sin pisar lo escrito.
            if not r.nota:
                r.nota = texto
            elif texto not in r.nota:
                r.nota = f"{r.nota}\n\n[Nota de voz] {texto}"
            # Si el punto generó una No Conformidad, la observación dictada se
            # suma a su descripción para que el tratamiento tenga el contexto.
            if r.nc_id:
                nc = db.query(NonConformity).filter(NonConformity.id == r.nc_id).first()
                if nc and texto not in (nc.description or ""):
                    nc.description = f"{nc.description or ''}\n\n[Nota de voz del auditor] {texto}".strip()
            resultado.transcriptas += 1
        else:
            resultado.con_error += 1

    db.commit()
    if resultado.con_error:
        resultado.detalle = (
            f"{resultado.con_error} nota(s) de voz no se pudieron transcribir. "
            "El audio sigue disponible como evidencia y se puede reintentar."
        )
    return resultado


@router.post("/asignaciones/{asig_id}/transcribir", response_model=TranscripcionResultado)
def transcribir_notas_de_voz(
    asig_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
    token_data: TokenData = Depends(get_current_user),
):
    """Re-procesa las notas de voz de una auditoría (por si falló al cerrarla)."""
    _get_asignacion_or_404(asig_id, db, current_user)
    return _transcribir_asignacion(asig_id, db, token_data.tenant_slug)


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
        if data.audio_url is not None and data.audio_url != respuesta.audio_url:
            respuesta.audio_url = data.audio_url
            respuesta.transcripcion = None
            respuesta.transcripcion_estado = transcription.ESTADO_PENDIENTE
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
            audio_url=data.audio_url,
            transcripcion_estado=transcription.ESTADO_PENDIENTE if data.audio_url else None,
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

    # Al finalizar, las notas de voz grabadas en campo se transforman en texto y
    # se incorporan a la observación de cada punto (y a la NC si la generó).
    try:
        await run_in_threadpool(_transcribir_asignacion, asig_id, db, token_data.tenant_slug)
    except Exception:  # noqa: BLE001 — la transcripción nunca bloquea el cierre
        pass

    asignacion.firma_url = key
    asignacion.firmado_por = current_user.full_name or current_user.email
    asignacion.firmado_at = datetime.now(timezone.utc)
    asignacion.estado = "completada"
    db.commit()
    db.refresh(asignacion)
    return _enriquecer([asignacion], db)[0]


@router.post("/asignaciones/{asig_id}/solicitar-checklist")
def solicitar_checklist(
    asig_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user)
):
    """
    El auditor de campo pide al líder/supervisor que cargue las preguntas de una
    asignación creada sin plantilla. Envía el aviso a los responsables de gestión.
    """
    asignacion = _get_asignacion_or_404(asig_id, db, current_user)

    total = db.query(func.count(PuntoControl.id)).filter(PuntoControl.asignacion_id == asig_id).scalar() or 0
    if total > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esta auditoría ya tiene preguntas cargadas."
        )

    destinatarios = admin_emails_of_tenant(db, current_user.tenant_id)
    prog = db.query(ProgramaAuditoria).filter(ProgramaAuditoria.id == asignacion.programa_id).first()

    enviados = 0
    try:
        enviados = notifications.notify_checklist_requested(
            destinatarios,
            current_user.full_name or current_user.email,
            asignacion.area,
            prog.titulo if prog else None,
            asignacion.id,
            asignacion.fecha_programada,
        )
    except Exception:  # noqa: BLE001 — un aviso no debe romper la solicitud
        pass

    return {
        "solicitado": True,
        "destinatarios": len(destinatarios),
        "avisos_enviados": enviados,
    }


@router.get("/asignaciones/{asig_id}/reporte", response_model=ReporteAuditoria)
def reporte_auditoria(
    asig_id: UUID,
    db: Session = Depends(get_tenant_db_from_token),
    current_user: User = Depends(get_current_active_user),
    token_data: TokenData = Depends(get_current_user),
):
    """Reporte consolidado de la auditoría para la vista imprimible / PDF."""
    asignacion = _get_asignacion_or_404(asig_id, db, current_user)
    asignacion = _enriquecer([asignacion], db)[0]

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
        {"clausula": p.clausula, "pregunta": p.pregunta, "orden": i + 1,
         "modulo": p.modulo, "evidencia": p.evidencia_solicitada}
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
            modulo=it.get("modulo"),
            evidencia_solicitada=it.get("evidencia"),
            tenant_id=current_user.tenant_id,
        ))
    db.commit()
    return db.query(PuntoControl).filter(
        PuntoControl.asignacion_id == asig_id
    ).order_by(PuntoControl.orden, PuntoControl.clausula).all()
