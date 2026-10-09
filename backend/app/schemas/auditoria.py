from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID


# Plantillas de checklist reutilizables
class PlantillaChecklistItem(BaseModel):
    clausula: str = Field("", max_length=100)
    pregunta: str
    orden: Optional[int] = 0
    modulo: Optional[str] = Field(None, max_length=255)
    evidencia: Optional[str] = None

class PlantillaChecklistCreate(BaseModel):
    nombre: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(None, max_length=100)
    items: List[PlantillaChecklistItem] = []

class PlantillaChecklistResponse(BaseModel):
    id: UUID
    nombre: str
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    items: List[PlantillaChecklistItem] = []
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class GuardarComoPlantillaRequest(BaseModel):
    nombre: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(None, max_length=100)


class ImportarPlantillaRequest(BaseModel):
    """
    Importación de un checklist desde CSV.

    El archivo viaja como texto y no como `multipart`: son unos pocos KB, el
    front ya lo lee con FileReader para poder previsualizarlo antes de enviar,
    y así el mismo endpoint sirve para pegar las filas a mano.
    """
    nombre: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(None, max_length=100)
    csv: str = Field(..., description="Contenido del archivo CSV")


class ImportacionPlantillaResponse(BaseModel):
    plantilla: "PlantillaChecklistResponse"
    importadas: int
    # Qué filas no se pudieron importar y por qué. No es un error: el resto
    # entró igual, y quien importa necesita saber qué revisar.
    problemas: List[str] = []


class PlantillaDesdeCatalogoRequest(BaseModel):
    norma: str = Field(..., max_length=100, description="Catálogo de fábrica del que partir")
    nombre: Optional[str] = Field(None, max_length=255)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(None, max_length=100)


# Programa de Auditoría
class ProgramaAuditoriaCreate(BaseModel):
    titulo: str = Field(..., max_length=255)
    objetivos: str
    alcance: str
    fecha_inicio: date
    fecha_fin: date
    estado: str = "planificado"
    norma: Optional[str] = Field(None, max_length=50,
                                 description="Norma auditada; define los criterios y el cronograma base del plan")

class ProgramaAuditoriaResponse(BaseModel):
    id: UUID
    titulo: str
    objetivos: str
    alcance: str
    fecha_inicio: date
    fecha_fin: date
    estado: str
    norma: Optional[str] = None
    tenant_id: UUID

    class Config:
        from_attributes = True


# Plan de Auditoría (documento que se acuerda con la organización)
class CronogramaItem(BaseModel):
    desde: str = Field("", max_length=10, description="Hora de inicio, HH:MM")
    hasta: str = Field("", max_length=10, description="Hora de fin, HH:MM")
    actividad: str = Field("", max_length=255)
    detalle: Optional[str] = None
    requisitos: Optional[str] = None
    responsables: Optional[str] = None

class PlanAuditoriaUpdate(BaseModel):
    """
    Campos editables del plan. El código no está: se emite una sola vez y es la
    referencia del documento entregado; dejarlo editable permitiría que dos
    planes del mismo año terminen con el mismo número.
    """
    revision: Optional[str] = Field(None, max_length=10)
    norma: Optional[str] = Field(None, max_length=120)
    organizacion: Optional[str] = Field(None, max_length=255)
    ente_certificador: Optional[str] = Field(None, max_length=255)
    lugar_sede: Optional[str] = None
    auditor_lider: Optional[str] = Field(None, max_length=255)
    coordinador_sgc: Optional[str] = Field(None, max_length=255)
    fecha_auditoria: Optional[date] = None
    jornada: Optional[str] = Field(None, max_length=100)
    objetivo: Optional[str] = None
    alcance: Optional[str] = None
    criterios: Optional[str] = None
    cronograma: Optional[List[CronogramaItem]] = None

class PlanAuditoriaResponse(BaseModel):
    id: UUID
    programa_id: UUID
    programa_titulo: Optional[str] = None
    codigo: str
    revision: str
    fecha_emision: date
    norma: Optional[str] = None
    organizacion: Optional[str] = None
    ente_certificador: Optional[str] = None
    lugar_sede: Optional[str] = None
    auditor_lider: Optional[str] = None
    coordinador_sgc: Optional[str] = None
    fecha_auditoria: Optional[date] = None
    jornada: Optional[str] = None
    objetivo: Optional[str] = None
    alcance: Optional[str] = None
    criterios: Optional[str] = None
    cronograma: List[CronogramaItem] = []

    class Config:
        from_attributes = True

# Asignaciones de Auditoría (auditor líder -> auditor de campo)
# Horario de la visita como "HH:MM". El patrón se declara una sola vez para que
# la creación y la edición acepten exactamente lo mismo.
_HORA = Field(None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$",
              description="Hora local en formato HH:MM (ej. 09:00)")


class UbicacionAsignacion(BaseModel):
    """
    Dónde se audita y con quién hablar. Se comparte entre la creación y la
    edición: una sede o un contacto que cambia se corrige sin rehacer la
    asignación.

    Todo opcional: cuando la auditoría se hace en el domicilio de la
    organización, estos datos salen de la ficha de la organización
    (Configuración → Organización) y no hay que repetirlos acá.
    """
    lugar_nombre: Optional[str] = Field(None, max_length=255, description="Ej. «Planta Luján de Cuyo»")
    lugar_direccion: Optional[str] = Field(None, max_length=500, description="Domicilio donde se realiza la auditoría")
    lugar_lat: Optional[float] = Field(None, ge=-90, le=90)
    lugar_lng: Optional[float] = Field(None, ge=-180, le=180)
    hora_inicio: Optional[str] = _HORA
    hora_fin: Optional[str] = _HORA
    contacto_nombre: Optional[str] = Field(None, max_length=255, description="Referente a quien presentarse en sitio")
    contacto_cargo: Optional[str] = Field(None, max_length=255)
    contacto_telefono: Optional[str] = Field(None, max_length=60)
    contacto_email: Optional[str] = Field(None, max_length=255)


class ContactoEnSitio(BaseModel):
    """
    Referente ya resuelto: el de la asignación, o el de la ficha de la
    organización cuando la asignación no nombra a nadie.

    Va como objeto aparte y no sobreescribiendo ``contacto_nombre`` y compañía
    porque esos son columnas de la tabla: pisarlos con el valor heredado
    marcaría la fila como modificada y el contacto de la organización terminaría
    guardado dentro de la asignación en el primer flush.
    """
    nombre: Optional[str] = None
    cargo: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    # True cuando el dato NO sale de esta asignación: la app lo aclara, para
    # que el auditor sepa que es la recepción y no la persona que lo espera en
    # la puerta.
    de_la_organizacion: bool = False
    # De dónde salió, con más precisión que el booleano: "asignacion" (se
    # acordó para esta visita), "empresa" (ficha del cliente auditado) u
    # "organizacion" (ficha de la propia organización). El booleano se queda
    # por compatibilidad con lo que ya lo consume.
    origen: str = "asignacion"


class EmpresaAuditadaBase(BaseModel):
    nombre: str = Field(..., max_length=255)
    identificacion: Optional[str] = Field(None, max_length=60, description="CUIT, RUT, NIF… sin formato impuesto")
    actividad: Optional[str] = Field(None, max_length=255, description="A qué se dedica; texto libre")
    domicilio: Optional[str] = Field(None, max_length=500)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    telefono: Optional[str] = Field(None, max_length=60)
    contacto_nombre: Optional[str] = Field(None, max_length=255)
    contacto_cargo: Optional[str] = Field(None, max_length=255)
    contacto_telefono: Optional[str] = Field(None, max_length=60)
    contacto_email: Optional[str] = Field(None, max_length=255)
    notas: Optional[str] = None
    activa: bool = True


class EmpresaAuditadaCreate(EmpresaAuditadaBase):
    pass


class EmpresaAuditadaUpdate(BaseModel):
    """Todo opcional: se corrige un domicilio sin reenviar la ficha entera."""
    nombre: Optional[str] = Field(None, max_length=255)
    identificacion: Optional[str] = Field(None, max_length=60)
    actividad: Optional[str] = Field(None, max_length=255)
    domicilio: Optional[str] = Field(None, max_length=500)
    lat: Optional[float] = Field(None, ge=-90, le=90)
    lng: Optional[float] = Field(None, ge=-180, le=180)
    telefono: Optional[str] = Field(None, max_length=60)
    contacto_nombre: Optional[str] = Field(None, max_length=255)
    contacto_cargo: Optional[str] = Field(None, max_length=255)
    contacto_telefono: Optional[str] = Field(None, max_length=60)
    contacto_email: Optional[str] = Field(None, max_length=255)
    notas: Optional[str] = None
    activa: Optional[bool] = None


class EmpresaAuditadaResponse(EmpresaAuditadaBase):
    id: UUID
    tenant_id: UUID
    created_at: Optional[datetime] = None
    # Enlace al mapa ya armado, para no repetir en el front la precedencia
    # coordenadas-sobre-texto que ya resuelve el servidor.
    mapa_url: Optional[str] = None
    # Cuántas auditorías se le asignaron. Es lo que permite avisar antes de
    # desactivar una empresa que todavía tiene trabajo en curso.
    auditorias: Optional[int] = None

    class Config:
        from_attributes = True


class AuditoriaAsignacionCreate(UbicacionAsignacion):
    programa_id: UUID
    auditor_id: UUID
    area: str = Field(..., max_length=255)
    norma: Optional[str] = Field(None, max_length=50, description="Aplica plantilla de checklist si coincide (ISO 9001, 14001, 45001, 27001)")
    fecha_programada: date
    notas: Optional[str] = None
    empresa_id: Optional[UUID] = Field(
        None, description="Empresa auditada de la cartera. Sin esto se audita la propia organización.")

class AuditoriaAsignacionUpdate(UbicacionAsignacion):
    estado: Optional[str] = Field(None, description="asignada, en_progreso, completada")
    area: Optional[str] = Field(None, max_length=255)
    fecha_programada: Optional[date] = None
    notas: Optional[str] = None
    empresa_id: Optional[UUID] = None

class AuditoriaAsignacionResponse(BaseModel):
    id: UUID
    programa_id: UUID
    programa_titulo: Optional[str] = None
    auditor_id: UUID
    auditor_nombre: str
    auditor_email: str
    area: str
    norma: Optional[str] = None
    fecha_programada: date
    estado: str
    notas: Optional[str] = None
    firma_url: Optional[str] = None
    firmado_por: Optional[str] = None
    firmado_at: Optional[datetime] = None
    tenant_id: UUID
    total_puntos: Optional[int] = None
    puntos_respondidos: Optional[int] = None

    # --- Para el auditor en campo -------------------------------------------
    # Lo que necesita saber antes de salir: para qué empresa es, a dónde va, a
    # quién busca al llegar, a qué hora y con qué alcance. Son campos
    # calculados: los resuelve el endpoint combinando la asignación, la ficha
    # de la organización y el programa, para que la app no tenga que pedir tres
    # endpoints más —y menos todavía estando sin señal.
    # Nombre de lo que se audita: la empresa de la cartera si la asignación
    # apunta a una, y si no la propia organización. Es lo que el auditor lee
    # primero en la app y en el asunto del correo.
    organizacion: Optional[str] = None
    empresa_id: Optional[UUID] = None             # cuál de la cartera, si corresponde
    empresa_actividad: Optional[str] = None       # a qué se dedica; orienta qué mirar
    lugar_nombre: Optional[str] = None
    lugar_direccion: Optional[str] = None         # el de la asignación, si lo tiene
    direccion: Optional[str] = None               # el efectivo (asignación o organización)
    lugar_lat: Optional[float] = None
    lugar_lng: Optional[float] = None
    mapa_url: Optional[str] = None                # abre el pin en el mapa del celular
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    jornada: Optional[str] = None                 # "09:00 a 13:00 hs"
    # Los cuatro campos crudos de la asignación quedan para el formulario del
    # líder; el contacto ya resuelto —con el de la organización como respaldo—
    # va en `contacto`, que es el que muestra la app de campo.
    contacto_nombre: Optional[str] = None
    contacto_cargo: Optional[str] = None
    contacto_telefono: Optional[str] = None
    contacto_email: Optional[str] = None
    contacto: Optional[ContactoEnSitio] = None
    programa_alcance: Optional[str] = None
    programa_objetivos: Optional[str] = None

    class Config:
        from_attributes = True


# Puntos de control (checklist) y respuestas
class RespuestaControlUpsert(BaseModel):
    resultado: str = Field(..., description="conforme, no_conforme, na")
    nota: Optional[str] = None
    foto_url: Optional[str] = None
    audio_url: Optional[str] = Field(None, description="Key S3 de la nota de voz; se transcribe al finalizar")
    lat: Optional[float] = None
    lng: Optional[float] = None
    client_uuid: Optional[UUID] = None  # idempotencia offline (Fase 3)

class RespuestaControlResponse(BaseModel):
    id: UUID
    punto_id: UUID
    resultado: str
    nota: Optional[str] = None
    foto_url: Optional[str] = None
    audio_url: Optional[str] = None
    transcripcion: Optional[str] = None
    transcripcion_estado: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    respondido_at: Optional[datetime] = None
    nc_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class TranscripcionResultado(BaseModel):
    """Resultado del proceso de transcripción de las notas de voz de una auditoría."""
    total_audios: int = 0
    transcriptas: int = 0
    con_error: int = 0
    proveedor_disponible: bool = False
    detalle: Optional[str] = None

class PuntoControlCreate(BaseModel):
    clausula: str = Field(..., max_length=100)
    pregunta: str
    orden: Optional[int] = 0
    modulo: Optional[str] = Field(None, max_length=255, description="Bloque de la jornada al que pertenece el punto")
    evidencia_solicitada: Optional[str] = Field(None, description="Qué registro debe pedir el auditor")

class PuntoControlResponse(BaseModel):
    id: UUID
    asignacion_id: UUID
    clausula: str
    pregunta: str
    tipo_resp: str
    orden: int
    modulo: Optional[str] = None
    evidencia_solicitada: Optional[str] = None
    respuesta: Optional[RespuestaControlResponse] = None

    class Config:
        from_attributes = True

class AplicarPlantillaRequest(BaseModel):
    norma: str = Field(..., description="ISO 9001, ISO 14001, ISO 45001, ISO 27001")
    reemplazar: bool = Field(False, description="Si true, elimina los puntos existentes antes de aplicar")


# Reporte consolidado de la auditoría (para la vista imprimible / PDF)
class ReporteHallazgoNC(BaseModel):
    nc_id: UUID
    clausula: str
    titulo: str
    estado: str

class ReporteResumen(BaseModel):
    total: int
    conforme: int
    no_conforme: int
    na: int
    sin_responder: int

class ReporteAuditoria(BaseModel):
    asignacion: AuditoriaAsignacionResponse
    firma_download_url: Optional[str] = None
    resumen: ReporteResumen
    puntos: List[PuntoControlResponse]
    no_conformidades: List[ReporteHallazgoNC] = []

# Hallazgos de Auditoría
class AuditoriaHallazgoCreate(BaseModel):
    descripcion: str
    clasificacion: str = Field(..., description="no_conformidad_mayor, no_conformidad_menor, observacion, oportunidad")
    clausula_referencia: str = Field(..., max_length=100)
    estado: str = "abierto"
    programa_id: UUID

class AuditoriaHallazgoResponse(BaseModel):
    id: UUID
    descripcion: str
    clasificacion: str
    clausula_referencia: str
    estado: str
    programa_id: UUID
    tenant_id: UUID

    class Config:
        from_attributes = True
