import uuid
from sqlalchemy import Column, String, ForeignKey, Date, Text, DateTime, Integer, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.base_class import Base


class PlantillaChecklist(Base):
    """Plantilla de checklist reutilizable por tenant (ej. verificación de EPP).

    Los ítems se guardan como JSON: [{"clausula": str, "pregunta": str, "orden": int}].
    Un supervisor la arma una vez y la aplica a futuras asignaciones de campo.
    """
    __tablename__ = "plantillas_checklist"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    categoria = Column(String(100), nullable=True)  # ej: Seguridad, EPP, Calidad
    items = Column(JSON, nullable=False, default=list)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProgramaAuditoria(Base):
    __tablename__ = "programas_auditoria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo = Column(String(255), nullable=False)
    objetivos = Column(Text, nullable=False)
    alcance = Column(Text, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    estado = Column(String(30), default="planificado", nullable=False)  # planificado, en_progreso, cerrado
    # Norma auditada (ISO 9001, ISO 14001, ...). Define los criterios y el
    # cronograma base con los que nace el plan de auditoría.
    norma = Column(String(50), nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)


class CorrelativoPlan(Base):
    """
    Último número de plan emitido en cada año.

    No alcanza con mirar los planes que existen para saber cuál es el próximo
    número: si se borra un programa, su plan se va con él y el correlativo
    retrocedería, reemitiendo un código que ya se entregó impreso y firmado.
    Este contador sólo sube, y se incrementa con un UPSERT atómico para que dos
    planes emitidos a la vez no saquen el mismo número.
    """
    __tablename__ = "planes_auditoria_correlativo"

    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), primary_key=True)
    anio = Column(Integer, primary_key=True)
    ultimo = Column(Integer, nullable=False, default=0)


class PlanAuditoria(Base):
    """
    Plan de auditoría de un programa: el documento que se acuerda con la
    organización antes de auditar (ISO 19011, 6.3 "Preparación de las
    actividades de auditoría"). Uno por programa.

    El programa dice QUÉ se va a auditar y en qué ventana de fechas; el plan
    dice CÓMO: qué día, con qué jornada, quién conduce, quién acompaña por el
    cliente, contra qué criterios y en qué orden se recorren los procesos.

    El cronograma se guarda como JSON —misma decisión que PlantillaChecklist—
    porque sus filas no las referencia nada más, no tienen estado propio y
    siempre se leen y se guardan como un bloque entero.
    Cada fila: {"desde","hasta","actividad","detalle","requisitos","responsables"}.
    """
    __tablename__ = "planes_auditoria"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programa_id = Column(UUID(as_uuid=True), ForeignKey("programas_auditoria.id", ondelete="CASCADE"),
                         nullable=False, unique=True, index=True)

    # Identificación documental (encabezado del documento impreso)
    codigo = Column(String(50), nullable=False)          # PL-AUD-2026-01
    revision = Column(String(10), default="01", nullable=False)
    fecha_emision = Column(Date, nullable=False)
    norma = Column(String(120), nullable=True)           # ISO 9001:2015

    # Partes y lugar
    organizacion = Column(String(255), nullable=True)
    ente_certificador = Column(String(255), nullable=True)
    lugar_sede = Column(Text, nullable=True)
    auditor_lider = Column(String(255), nullable=True)
    coordinador_sgc = Column(String(255), nullable=True)

    # Ejecución
    fecha_auditoria = Column(Date, nullable=True)
    jornada = Column(String(100), nullable=True)         # "09:00 a 13:00 hs"

    # Cuerpo normativo del plan
    objetivo = Column(Text, nullable=True)
    alcance = Column(Text, nullable=True)
    criterios = Column(Text, nullable=True)

    cronograma = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)


class AuditoriaAsignacion(Base):
    """
    Asignación de una auditoría (o sector auditable) del programa a un auditor de
    campo. La crea el auditor líder desde la consola web; el auditor asignado la ve
    en "Mis auditorías" y la ejecutará —en fases posteriores— desde la app móvil.

    El auditor referenciado vive en public.users; guardamos también un snapshot de
    su nombre/correo para poder listar la asignación sin resolver un join
    cross-schema en cada respuesta.
    """
    __tablename__ = "auditorias_asignaciones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programa_id = Column(UUID(as_uuid=True), ForeignKey("programas_auditoria.id", ondelete="CASCADE"), nullable=False, index=True)
    auditor_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="CASCADE"), nullable=False, index=True)
    auditor_nombre = Column(String(255), nullable=False)  # snapshot para listado
    auditor_email = Column(String(255), nullable=False)   # snapshot para listado
    area = Column(String(255), nullable=False)            # sector / proceso auditado
    norma = Column(String(50), nullable=True)             # norma de referencia (ISO 9001, 14001, ...)
    fecha_programada = Column(Date, nullable=False)
    estado = Column(String(30), default="asignada", nullable=False)  # asignada, en_progreso, completada
    notas = Column(Text, nullable=True)
    # Firma digital de cierre
    firma_url = Column(String(500), nullable=True)   # key S3 de la imagen de firma
    firmado_por = Column(String(255), nullable=True)
    firmado_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    puntos = relationship("PuntoControl", back_populates="asignacion", cascade="all, delete-orphan")


class PuntoControl(Base):
    """
    Punto de control (ítem de checklist) que el auditor debe verificar en campo
    dentro de una asignación. Se pueden generar desde una plantilla ISO o cargar
    de a uno. El resultado se registra en RespuestaControl.
    """
    __tablename__ = "puntos_control"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asignacion_id = Column(UUID(as_uuid=True), ForeignKey("auditorias_asignaciones.id", ondelete="CASCADE"), nullable=False, index=True)
    clausula = Column(String(100), nullable=False)   # Ej: ISO 9001 7.1.5
    pregunta = Column(Text, nullable=False)
    tipo_resp = Column(String(30), default="conformidad", nullable=False)  # conformidad: conforme/no_conforme/na
    orden = Column(Integer, default=0, nullable=False)
    # Módulo del checklist (ej. "Dirección, Liderazgo y Contexto"): agrupa los
    # puntos por bloque de la jornada, como en el checklist en papel.
    modulo = Column(String(255), nullable=True)
    # Qué evidencia hay que pedir para ese requisito. Sin esto el auditor sabe
    # qué preguntar pero no qué registro reclamar, que es la mitad del trabajo.
    evidencia_solicitada = Column(Text, nullable=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    asignacion = relationship("AuditoriaAsignacion", back_populates="puntos")
    respuesta = relationship("RespuestaControl", back_populates="punto", uselist=False, cascade="all, delete-orphan")


class RespuestaControl(Base):
    """
    Respuesta del auditor a un punto de control. Una respuesta por punto (relación
    1-a-1). Incluye 'client_uuid' como clave de idempotencia: la app móvil (Fase 3)
    la genera en el cliente para que el 'upsert' offline→online no duplique.
    """
    __tablename__ = "respuestas_control"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_uuid = Column(UUID(as_uuid=True), nullable=True, unique=True, index=True)  # idempotencia offline
    punto_id = Column(UUID(as_uuid=True), ForeignKey("puntos_control.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    resultado = Column(String(20), nullable=False)   # conforme, no_conforme, na
    nota = Column(Text, nullable=True)
    foto_url = Column(String(500), nullable=True)    # evidencia fotográfica (cámara del teléfono)
    # Evidencia de voz: el auditor graba una nota de audio en vez de escribirla.
    # El audio se conserva como evidencia y se transcribe a texto al finalizar
    # la auditoría (ver services/transcription.py).
    audio_url = Column(String(500), nullable=True)
    transcripcion = Column(Text, nullable=True)
    transcripcion_estado = Column(String(20), nullable=True)  # pendiente, ok, error, no_disponible
    lat = Column(Float, nullable=True)               # geolocalización (Fase 3)
    lng = Column(Float, nullable=True)
    respondido_at = Column(DateTime(timezone=True), server_default=func.now())
    synced_at = Column(DateTime(timezone=True), nullable=True)  # marca de sincronización (Fase 3)
    nc_id = Column(UUID(as_uuid=True), nullable=True)  # No Conformidad auto-generada si 'no_conforme'
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)

    punto = relationship("PuntoControl", back_populates="respuesta")


class AuditoriaHallazgo(Base):
    __tablename__ = "auditorias_hallazgos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    descripcion = Column(Text, nullable=False)
    clasificacion = Column(String(50), nullable=False)  # no_conformidad_mayor, no_conformidad_menor, observacion, oportunidad
    clausula_referencia = Column(String(100), nullable=False)  # Ej: ISO 9001 Cláusula 9.2
    estado = Column(String(30), default="abierto", nullable=False)  # abierto, en_tratamiento, cerrado
    programa_id = Column(UUID(as_uuid=True), ForeignKey("programas_auditoria.id", ondelete="CASCADE"), nullable=False, index=True)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("public.tenants.id", ondelete="CASCADE"), nullable=False, index=True)
