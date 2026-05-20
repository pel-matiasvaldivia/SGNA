from app.models.base_class import Base
from app.models.tenant import Tenant
from app.models.user import User
from app.models.document import Document, DocumentVersion, DocumentApproval
from app.models.iso9001 import NonConformity, CorrectiveAction
from app.models.gap_analysis import Diagnostico, DiagnosticoItem
from app.models.contexto import FodaPestelItem, ParteInteresada, AlcanceSGI, RequisitoLegal
from app.models.planificacion import ObjetivoSGI, RiesgoOportunidad
from app.models.procesos import ProcesoBPM
from app.models.auditoria import ProgramaAuditoria, AuditoriaHallazgo
from app.models.huella import EmisionCarbono
from app.models.indicador import IndicadorKPI, IndicadorMedicion
from app.models.revision import RevisionDireccion
from app.models.cambio import ControlCambio, ItemAccionCambio
from app.models.equipo import EquipoMedicion, RegistroCalibracion
from app.models.capacitacion import PlanCapacitacion, AsistenteCapacitacion, CompetenciaColaborador
from app.models.satisfaccion import EncuestaSatisfaccion, PreguntaEncuesta
from app.models.proveedor import Proveedor, EvaluacionProveedor, ReclamoProveedor
from app.models.sst import IncidenteSST, InspeccionSST
from app.models.mantenimiento import ActivoInfraestructura, OrdenTrabajoMantenimiento

# This file is imported by Alembic to register the models



