# -*- coding: utf-8 -*-
"""Genera el Manual de Uso de Auditorías en Línea en PDF, desde el contenido del
Centro de Ayuda de la plataforma."""
import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, ListFlowable, ListItem, KeepTogether, FrameBreak,
)
from reportlab.pdfgen import canvas as canvaslib

PRIMARY = HexColor("#003F87")
SECONDARY = HexColor("#007BFF")
GREEN = HexColor("#2E7D32")
INK = HexColor("#0F2036")
GREY = HexColor("#5B6B7F")
LIGHT = HexColor("#EAF2FC")
LINE = HexColor("#D6E1F0")

import os
_PUBLIC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
LOGO = os.path.join(_PUBLIC, "logo-auditorias.png")
OUT = os.path.join(_PUBLIC, "manual-auditorias-en-linea.pdf")

# ------------------------- Contenido (del Centro de Ayuda) -------------------------
# OJO: este diccionario es una COPIA del contenido de
# `src/lib/modules-info.ts`, que es lo que se ve dentro de la plataforma. La
# copia existe porque el PDF se arma con reportlab y no con el bundle de
# Next, pero ya se desfasó una vez: el manual descargable describía una
# plataforma anterior a la que el cliente tenía abierta en la otra pestaña.
# `_verificar_sincronia()`, al final del archivo, compara las dos listas y
# aborta la generación si no coinciden.
MODULES = {
  "inicio": {"name":"Inicio — qué sigue","clause":"Primeros pasos","tagline":"La pantalla que te dice qué hacer ahora.","description":"El Inicio no es un tablero decorativo: mira el estado real de tu sistema y arma dos listas — lo que requiere tu atención hoy y lo que falta para terminar la puesta en marcha. Si no hay nada pendiente, no inventa tarjetas vacías.","howTo":["Entrá a «Inicio» (es la primera opción del menú y la pantalla a la que caés al iniciar sesión).","Mirá el bloque «Requiere tu atención»: no conformidades abiertas, auditorías asignadas sin ejecutar y documentos esperando aprobación.","Mirá el bloque «Puesta en marcha»: los pasos de configuración que todavía no hiciste, en el orden en que conviene hacerlos.","Tocá cualquier renglón para ir directo al módulo donde se resuelve."],"recommendations":["Si los dos bloques están vacíos, el sistema está al día: eso es la respuesta, no una pantalla rota.","El bloque de puesta en marcha se apaga solo a medida que completás los pasos; no hace falta marcarlos a mano.","Cargá primero el domicilio y el contacto en «Configuración → Organización»: de ahí salen los datos que reciben tus auditores de campo."]},
  "ediciones": {"name":"Alcance de la Plataforma","clause":"Ediciones · Auditorías / SGI Completo","tagline":"Mostrá solo los módulos que tu organización va a usar.","description":"La plataforma se usa en dos alcances. «Auditorías» deja a la vista lo necesario para ejecutar auditorías internas en cualquier industria; «SGI Completo» habilita además todo lo que hace falta para implementar y mantener un sistema de gestión. El recorte se aplica en el menú y también en el servidor.","howTo":["La primera vez que entra un administrador, la plataforma hace una sola pregunta: a qué vino. Con esa respuesta queda elegida la edición.","Para cambiarla después, entrá a «Configuración → Alcance de la Plataforma» y elegí la otra opción.","El menú se reacomoda al recargar; no hace falta que nadie vuelva a iniciar sesión.","Si querés afinar más, en «Permisos y Perfiles» recortás además por perfil: cada persona ve la intersección de las dos cosas."],"recommendations":["Empezá por «Auditorías» si lo primero que vas a hacer es auditar: siempre podés ampliar.","Cambiar de edición no borra nada. Lo que se apaga es el acceso a las secciones, no la información que cargaste; si volvés, los datos están donde los dejaste.","La edición también limita a los administradores: no es un permiso de usuario, es el alcance de lo que la organización contrató.","Un perfil personalizado al que le otorgaste módulos fuera de la edición solo verá los que estén dentro: gana el más restrictivo, no el más permisivo."]},
  "empresas": {"name":"Empresas Auditadas (cartera)","clause":"Auditorías · Cartera de clientes","tagline":"Para quien audita a terceros, no a su propia casa.","description":"Registro de las empresas que auditás: domicilio, actividad, identificación tributaria y referente en sitio. Al asignar una auditoría elegís a cuál de ellas corresponde, y el auditor recibe los datos de esa empresa en lugar de los de tu propia organización.","howTo":["Entrá a «Auditorías Internas → Empresas Auditadas» y cargá cada cliente con «Nueva empresa».","Completá domicilio y referente: es lo que va a recibir el auditor que vaya a la visita.","Al crear una asignación de campo, elegí la empresa en el selector. Si la dejás vacía, se entiende que auditás tu propia organización, como hasta ahora.","Si una visita puntual es en otra sede, cargá el domicilio en la asignación: lo específico de la visita manda sobre la ficha del cliente.","Cuando dejás de trabajar con un cliente, desactivalo: sale del selector y su historial de auditorías queda intacto."],"recommendations":["Cargá la empresa una vez y reutilizala: cada auditoría que le hagas hereda sus datos sin volver a tipearlos.","Si cargás coordenadas, el auditor abre el pin exacto en el mapa del celular. Es la diferencia entre llegar y dar vueltas.","Una empresa con auditorías registradas no se puede borrar —un informe sin auditado no prueba nada—: se desactiva.","El teléfono de tu propio estudio nunca se usa como respaldo del contacto de un cliente: si la ficha del cliente no tiene referente, es mejor que el auditor lo sepa que darle un número que no sirve."]},
  "plantillas": {"name":"Plantillas de Checklist","clause":"Auditorías · Listas de verificación propias","tagline":"Auditá con tu propia lista, de cualquier actividad.","description":"Biblioteca de listas de verificación propias. Se crean a mano, se importan desde un archivo de Excel o CSV, se duplican para variar una versión y se aplican a cualquier auditoría. No hace falta auditar contra una norma ISO si lo que necesitás es controlar uso de EPP, higiene o recepción de mercadería.","howTo":["Entrá a «Auditorías Internas → Plantillas de Checklist».","Para empezar de cero, usá «Nueva plantilla» y cargá cláusula y pregunta en cada punto.","Para traer una lista que ya tenés, usá «Importar CSV»: la pantalla te muestra una vista previa antes de guardar nada.","También podés partir de un checklist ISO con «Desde catálogo» y después editarlo a tu medida.","Al asignar una auditoría, elegí la plantilla y las preguntas se cargan solas; «Exportar» te devuelve el archivo para editarlo afuera."],"recommendations":["El archivo puede venir de Excel en español (con punto y coma) o de cualquier planilla con comas o tabulaciones: el importador reconoce el separador solo.","Las columnas pueden llamarse «cláusula» y «pregunta», o sus sinónimos habituales, con o sin tildes. Si el archivo no trae encabezado, se toma la primera columna como cláusula y la segunda como pregunta, y la pantalla te lo avisa.","Un archivo con algunas filas mal armadas importa las que están bien y te lista las otras por número de fila: no tenés que adivinar cuál falló.","Redactá preguntas cerradas y verificables en sitio: se responden conforme, no conforme o N/A.","Duplicá la plantilla antes de variarla para una sede puntual, así no pierdes la original."]},
  "diagnosticos": {"name":"Diagnóstico y Brechas","clause":"GAP analysis inicial","tagline":"Medí cuán lejos estás de cumplir la norma.","description":"Evaluación inicial (GAP analysis) que compara tu organización contra cada cláusula de la norma elegida y calcula el porcentaje de cumplimiento.","howTo":["Creá un diagnóstico con «Nuevo Diagnóstico» y seleccioná las normas a incluir (ISO 9001/14001/45001).","Recorré cada ítem del checklist y marcá el estado: cumple, cumple parcialmente, no cumple o no aplica.","Adjuntá evidencia documental y observaciones en los puntos relevantes.","Revisá el resumen de brechas para priorizar el plan de acción."],"recommendations":["Hacé el primer diagnóstico apenas empezás: es la línea base de todo el sistema.","Repetilo cada 6-12 meses para medir avance real.","Convertí cada «no cumple» en un objetivo o una acción en Planificación."]},
  "contexto": {"name":"Contexto Organizacional","clause":"ISO 9001 · Cláusula 4","tagline":"Definí el terreno donde opera tu SGI.","description":"Registra las cuestiones internas y externas (FODA/PESTEL), las partes interesadas, el alcance del sistema y los requisitos legales aplicables.","howTo":["En «Análisis FODA/PESTEL» cargá fortalezas, debilidades, oportunidades y amenazas.","En «Partes Interesadas» listá clientes, proveedores, organismos y sus expectativas.","Redactá el «Alcance del SGI» indicando procesos, sitios y exclusiones justificadas.","Cargá los «Requisitos Legales» que debe cumplir la organización."],"recommendations":["El alcance debe ser realista: no incluyas procesos que aún no vas a auditar.","Revisá el contexto en cada Revisión por la Dirección.","Vinculá amenazas y expectativas con riesgos en Planificación."]},
  "planificacion": {"name":"Planificación SGI","clause":"ISO 9001 · Cláusula 6","tagline":"Fijá objetivos y gestioná riesgos y oportunidades.","description":"Define los objetivos del sistema de gestión y administra los riesgos y oportunidades con su evaluación inicial y residual.","howTo":["Cargá objetivos SMART con responsable, meta y fecha.","Registrá riesgos y oportunidades con probabilidad e impacto.","Definí controles y volvé a valorar el riesgo residual.","Asociá cada riesgo a un proceso y a su evidencia."],"recommendations":["Un objetivo sin indicador no se puede medir: conectalo con KPIs.","Prioridad a los riesgos de nivel alto antes de la auditoría.","Releé los riesgos cuando cambie el contexto o haya una no conformidad."]},
  "procesos": {"name":"Gestión de Procesos","clause":"ISO 9001 · Cláusula 4.4","tagline":"Mapeá cómo funciona realmente tu organización.","description":"Modela el mapa de procesos (BPM): entradas, salidas, responsables e interacciones entre procesos.","howTo":["Creá cada proceso con su tipo (estratégico, operativo, de apoyo).","Definí entradas, salidas, responsable e indicadores asociados.","Relacioná los procesos con riesgos, documentos y objetivos."],"recommendations":["Empezá por los procesos operativos que generan valor al cliente.","Cada proceso debería tener al menos un indicador en KPIs.","Mantené el mapa simple: pocos procesos bien definidos es mejor que muchos difusos."]},
  "documents": {"name":"Gestión Documental (DMS)","clause":"ISO 9001 · Cláusula 7.5","tagline":"Tu información documentada, versionada y controlada.","description":"Repositorio central de manuales, procedimientos, registros y evidencias, con control de versiones y almacenamiento aislado por tenant.","howTo":["Subí un documento con «Cargar» indicando tipo y descripción.","Cada nueva carga genera una versión; la anterior queda en el historial.","Descargá con enlaces temporales y seguros.","Referenciá documentos como evidencia en otros módulos."],"recommendations":["Nombrá los documentos con un código consistente (ej. PR-CAL-01).","No borres versiones: la trazabilidad es parte del cumplimiento.","Enviá a aprobación los documentos críticos antes de publicarlos."]},
  "approvals": {"name":"Aprobaciones de Calidad","clause":"ISO 9001 · Cláusula 7.5","tagline":"Firmá y aprobá documentos de forma controlada.","description":"Flujo de revisión y firma electrónica de los documentos que requieren aprobación formal antes de entrar en vigencia.","howTo":["Revisá la lista de documentos pendientes de aprobación.","Abrí el documento, verificá su contenido y firmá o rechazá.","El documento aprobado queda como vigente y trazable."],"recommendations":["Definí quién aprueba cada tipo de documento antes de operar.","Aprobá siempre sobre la última versión.","Un rechazo debería incluir el motivo para que se corrija."]},
  "auditorias": {"name":"Auditorías Internas","clause":"ISO 9001 · Cláusula 9.2","tagline":"Planificá auditorías y registrá hallazgos.","description":"Gestiona el programa anual de auditorías internas y el registro de hallazgos o desvíos detectados.","howTo":["Creá un programa de auditoría con objetivo, alcance y fechas.","En «Asignaciones de Campo» asigná el área a un auditor. Si auditás a un cliente, elegilo en el selector de empresa: el auditor va a recibir el domicilio y el referente de esa empresa.","Podés elegir una norma ISO (genera el checklist automático), una plantilla propia, o «Sin plantilla» para armar las preguntas a medida.","Durante la auditoría, cargá los hallazgos encontrados.","Derivá los hallazgos que sean no conformidades al módulo ISO 9001."],"recommendations":["Auditá contra el alcance declarado en Contexto.","Programá al menos una auditoría interna antes de la certificación.","Un hallazgo objetivo cita la cláusula y la evidencia."]},
  "iso9001": {"name":"No Conformidades (ISO 9001)","clause":"ISO 9001 · Cláusula 10.2","tagline":"Desviaciones, causa raíz y acción correctiva (CAPA).","description":"Ciclo completo de no conformidades: registro, análisis de causa raíz, acción correctiva y verificación de eficacia.","howTo":["Declará la desviación indicando origen y descripción.","Ejecutá el análisis de causa raíz (Ishikawa / 5 Porqués).","Definí la acción correctiva con responsable y fecha límite.","Verificá la eficacia y cerrá la no conformidad."],"recommendations":["No cierres una NC sin verificar que la causa fue eliminada.","Usá el Auditor de IA para acelerar la causa raíz.","Las NC recurrentes indican un problema de proceso, no de personas."]},
  "cambios": {"name":"Control de Cambios","clause":"ISO 9001 · Cláusula 6.3","tagline":"Planificá los cambios sin perder el control.","description":"Gestiona los cambios del sistema de gestión de forma planificada, con acciones e impacto asociados.","howTo":["Registrá el cambio con su código y descripción.","Cargá las acciones necesarias y sus responsables.","Actualizá el estado a medida que se implementan."],"recommendations":["Evaluá el impacto del cambio antes de ejecutarlo.","Vinculá cambios significativos con riesgos y documentos.","Registrá también los cambios de contexto y de estructura."]},
  "equipos": {"name":"Equipos y Calibración","clause":"ISO 9001 · Cláusula 7.1.5","tagline":"Instrumentos calibrados y trazables.","description":"Inventario de equipos de seguimiento y medición con su historial de calibraciones y certificados.","howTo":["Cargá cada equipo con su identificación y frecuencia de calibración.","Registrá cada calibración con fecha, resultado y certificado.","Adjuntá el certificado desde la Gestión Documental."],"recommendations":["Configurá la frecuencia para anticipar vencimientos.","Un equipo fuera de calibración invalida las mediciones que hizo.","Guardá los certificados en el DMS para tenerlos trazables."]},
  "capacitacion": {"name":"Planes y Competencias","clause":"ISO 9001 · Cláusula 7.2","tagline":"Personas competentes para cada tarea.","description":"Administra planes de capacitación, asistentes y la matriz de competencias del personal.","howTo":["Creá un plan de capacitación con tema, fecha y asistentes.","Registrá asistencia y evaluá la eficacia de la formación.","Mantené la matriz de competencias por colaborador."],"recommendations":["Detectá brechas de competencia a partir del diagnóstico.","Evaluá la eficacia, no solo la asistencia.","La competencia se demuestra con evidencia (título, evaluación, práctica)."]},
  "satisfaccion": {"name":"Satisfacción de Clientes","clause":"ISO 9001 · Cláusula 9.1.2","tagline":"Escuchá la voz del cliente (NPS / CSAT).","description":"Diseña y ejecuta encuestas de satisfacción y analiza los resultados de NPS y CSAT.","howTo":["Creá una encuesta con sus preguntas.","Compartila o simulá respuestas para cargar resultados.","Analizá los indicadores de satisfacción resultantes."],"recommendations":["Medí de forma periódica para ver tendencias, no puntos aislados.","Convertí una insatisfacción en una no conformidad o mejora.","Cruzá satisfacción con reclamos de proveedores y KPIs."]},
  "proveedores": {"name":"Gestión de Proveedores","clause":"ISO 9001 · Cláusula 8.4","tagline":"Controlá tu cadena de suministro.","description":"Registra proveedores, los evalúa periódicamente y gestiona reclamos hacia ellos.","howTo":["Dá de alta el proveedor con sus datos y criticidad.","Realizá evaluaciones periódicas de desempeño.","Registrá reclamos y su resolución."],"recommendations":["Definí criterios de evaluación antes de calificar.","Enfocá el control en los proveedores críticos.","Un proveedor mal evaluado debería tener un plan de mejora."]},
  "huella": {"name":"Huella de Carbono","clause":"GHG Protocol / ISO 14064","tagline":"Medí tus emisiones de CO2 (Alcance 1, 2 y 3).","description":"Calcula la huella de carbono organizacional cargando las fuentes de emisión por alcance y categoría.","howTo":["Cargá cada fuente de emisión con su cantidad y unidad.","Clasificá por alcance (1 directas, 2 energía, 3 indirectas).","Revisá el CO2 equivalente calculado y adjuntá evidencia."],"recommendations":["Empezá por Alcance 1 y 2, que son los más fáciles de medir.","Guardá las facturas/soportes como evidencia de cada carga.","Fijá una meta de reducción y seguila con un KPI."]},
  "kpis": {"name":"KPIs e Indicadores","clause":"ISO 9001 · Cláusula 9.1","tagline":"Medí el desempeño con datos.","description":"Define indicadores clave, cargá mediciones y seguí su evolución frente a las metas.","howTo":["Creá un KPI con su fórmula, unidad y meta.","Cargá mediciones periódicas.","Analizá la tendencia y el cumplimiento de la meta."],"recommendations":["Pocos KPIs relevantes valen más que muchos que nadie mira.","Cada objetivo y proceso importante debería tener su indicador.","Un KPI en rojo es un insumo directo para la Revisión por la Dirección."]},
  "direccion": {"name":"Revisión por la Dirección","clause":"ISO 9001 · Cláusula 9.3","tagline":"La dirección revisa y decide.","description":"Registra las revisiones por la dirección con sus entradas, conclusiones y decisiones.","howTo":["Creá una revisión con fecha y participantes.","Consolidá entradas: KPIs, auditorías, NC, satisfacción, riesgos.","Documentá conclusiones, decisiones y recursos asignados; luego cerrala."],"recommendations":["Hacela al menos una vez al año.","Usá los datos reales de los otros módulos como entrada.","Toda decisión debería derivar en objetivos o acciones concretas."]},
  "reportes": {"name":"Reporte SGI","clause":"Salidas consolidadas","tagline":"El estado de tu sistema en un solo lugar.","description":"Genera reportes consolidados del sistema de gestión para auditorías, dirección o clientes.","howTo":["Seleccioná el período y el alcance del reporte.","Generá el reporte con los datos consolidados del SGI.","Compartilo o exportalo según necesites."],"recommendations":["Generá un reporte antes de cada auditoría externa.","Usalo como respaldo de la Revisión por la Dirección."]},
  "ia-auditor": {"name":"Auditor de IA Hub","clause":"Asistentes MCP","tagline":"Asistentes inteligentes para tu SGI.","description":"Herramientas de IA conectables (MCP): consultor de cumplimiento, causa raíz, mitigación de riesgos y resumen ejecutivo de KPIs. Razonan sobre los datos reales de tu sistema.","howTo":["Elegí el asistente según lo que necesites.","Proporcioná el contexto (una NC, un riesgo, un período).","Revisá la propuesta de la IA y ajustala con tu criterio."],"recommendations":["La IA acelera el análisis, pero la decisión final es del responsable.","Ideal para causa raíz y para redactar resúmenes de dirección.","Verificá siempre las recomendaciones contra la evidencia real."]},
  "campo": {"name":"Auditorías de Campo (app móvil)","clause":"App móvil · PWA","tagline":"Ejecutá auditorías en sitio, incluso sin internet.","description":"Aplicación móvil para que el auditor de campo ejecute los controles asignados por el auditor líder directamente desde el celular. Registra la evidencia con una nota escrita y la foto de la cámara (y notas de voz si la organización las habilita), funciona sin conexión y sincroniza automáticamente al reconectar.","howTo":["El auditor líder o un supervisor asigna la auditoría desde «Auditorías Internas». Puede elegir una norma ISO (checklist automático) o «Sin plantilla» para armar las preguntas a medida.","Las preguntas se cargan con «Editar preguntas del checklist», antes o después de asignar; las listas propias (ej. uso de EPP) se guardan como plantilla y se reutilizan.","Si la auditoría le llegó sin preguntas, el auditor toca «Solicitar checklist al líder» y el pedido llega por correo a los administradores.","La asignación le dice al auditor para qué organización es, a qué domicilio ir, en qué horario, a quién buscar al llegar y cuál es el alcance: lo recibe por correo y lo ve en la app, con el pin del mapa y el teléfono del referente para tocar y llamar.","El domicilio y el contacto salen de «Configuración → Organización»; si la auditoría se hace en otra sede, el líder lo indica al asignarla.","El auditor abre «Mis Auditorías» en el celular y ejecuta cada control: conforme, no conforme o N/A, con ubicación GPS automática.","Debajo de cada pregunta tiene el campo de nota breve y, al lado, el botón de cámara para la foto. Es el modo por defecto y está siempre disponible.","Las notas de voz son opcionales: un administrador las habilita en «Configuración → Auditoría en Campo» aceptando el aviso de privacidad, porque el audio se envía a un servicio externo de transcripción.","Sin conexión, respuestas y evidencias se guardan en el dispositivo; al recuperar señal, se sincronizan solas.","Al terminar, el auditor firma digitalmente: se cierra la auditoría, las notas de voz habilitadas se transforman en texto y se genera el reporte; los «no conforme» abren una No Conformidad automáticamente."],"recommendations":["Instalá la app desde el navegador del celular (se agrega como ícono, sin App Store).","Abrí la auditoría una vez con señal antes de salir: domicilio, contacto y checklist quedan en el dispositivo y los tenés aunque en planta no haya datos.","Si el auditor olvida su contraseña, la recupera solo desde «¿Olvidaste tu contraseña?» en la pantalla de ingreso: le llega un enlace al correo y no depende de un administrador.","Redactá preguntas cerradas y verificables en sitio (se responden conforme / no conforme / N/A).","Guardá como plantilla los controles que repetís en distintas sedes o cuadrillas.","Sacá la foto de evidencia en cada punto crítico.","Si habilitás las notas de voz, dictar es más rápido que escribir en planta: el texto transcripto queda en el reporte y en la no conformidad.","Verificá el indicador de sincronización antes de cerrar la jornada."]},
  "sst": {"name":"Seguridad y Salud (SST)","clause":"ISO 45001","tagline":"Cuidá a las personas: incidentes e inspecciones.","description":"Registra incidentes de seguridad y salud ocupacional e inspecciones de SST.","howTo":["Registrá cada incidente con su descripción y gravedad.","Cargá las inspecciones de seguridad realizadas.","Derivá los hallazgos relevantes a no conformidades o acciones."],"recommendations":["Registrá también los casi-incidentes: previenen accidentes.","Cerrá el círculo con acciones correctivas.","Cruzá SST con capacitación y mantenimiento."]},
  "mantenimiento": {"name":"Mantenimiento (CMMS)","clause":"ISO 9001 · Cláusula 7.1.3","tagline":"Infraestructura disponible y confiable.","description":"Gestiona activos de infraestructura y órdenes de trabajo de mantenimiento.","howTo":["Cargá los activos de infraestructura críticos.","Generá órdenes de trabajo de mantenimiento.","Seguí su estado hasta el cierre."],"recommendations":["Priorizá el mantenimiento preventivo sobre el correctivo.","Vinculá los activos con los equipos de medición cuando aplique.","Una falla recurrente puede ser una no conformidad de infraestructura."]},
  "permisos": {"name":"Usuarios, Permisos y Perfiles","clause":"Administración del Tenant","tagline":"Definí quién entra y qué puede ver cada perfil.","description":"Gestión de los usuarios de tu organización y del alcance de cada perfil: qué secciones ve, a qué puede entrar y qué puede modificar. Los permisos se aplican tanto en el menú como en el servidor.","howTo":["Entrá a «Configuración del Tenant» (solo administradores) desde el menú lateral.","En «Usuarios y Roles» invitá personas indicando nombre, correo y perfil; reciben un mail con su acceso y contraseña temporal.","En «Permisos y Perfiles» marcá, para cada perfil, las secciones que debe ver y guardá los cambios.","Creá perfiles propios (ej. «Supervisor de Planta») con «Crear perfil personalizado» y marcá si usan la app móvil de campo.","En «Auditoría en Campo» elegís cómo registra la evidencia el auditor: la nota escrita y la foto están siempre activas; las notas de voz son opcionales y requieren aceptar el aviso de privacidad.","Cada usuario ve los cambios al recargar; si le cambiás el rol, debe volver a iniciar sesión."],"recommendations":["Aplicá el mínimo privilegio: dá solo las secciones que cada perfil necesita.","El perfil «Administrador» siempre ve todo y no se puede restringir: asignalo solo a quien administra el sistema.","«Auditor de Campo» entra a una app móvil simplificada, limitada a sus auditorías asignadas.","Ayuda y Mi Perfil están siempre disponibles para todos los perfiles.","Los permisos también se validan en el servidor: ocultar una sección no es solo cosmético."]},
  "notificaciones": {"name":"Notificaciones por correo","clause":"Avisos del sistema","tagline":"El sistema avisa lo que requiere atención.","description":"La plataforma envía avisos automáticos desde notificaciones@auditoriasenlinea.com.ar: altas y invitaciones, auditorías planificadas y asignadas, y recordatorios de vencimientos.","howTo":["Al invitar un usuario, recibe su acceso por correo automáticamente.","Al planificar una auditoría se avisa a los responsables de Calidad/SGI; al asignarla, al auditor de campo.","Un barrido diario avisa lo que está por vencer: calibraciones, mantenimientos y acciones con fecha límite.","Cada responsable recibe un resumen con sus pendientes; si no hay responsable asignado, lo recibe el administrador."],"recommendations":["Cargá el responsable en equipos, órdenes y objetivos: es quien recibe el aviso.","Configurá el SMTP de tu empresa para que los correos salgan con tu dominio.","Revisá el correo de vencimientos: anticipa las no conformidades por equipos vencidos."]},
}

PHASES = [
  ("0 · Primeros pasos", "Elegí el alcance de la plataforma y dejá que el Inicio te marque qué sigue.", ["inicio","ediciones"]),
  ("1 · Diagnóstico y contexto", "Entendé dónde estás parado y definí el terreno de tu sistema de gestión.", ["diagnosticos","contexto"]),
  ("2 · Planificación y procesos", "Fijá objetivos, gestioná riesgos y mapeá cómo trabaja tu organización.", ["planificacion","procesos"]),
  ("3 · Documentación y evidencia", "Centralizá y controlá la información documentada con aprobaciones.", ["documents","approvals"]),
  ("4 · Control operativo", "Auditá —tu organización o la de tus clientes—, gestioná no conformidades, cambios y equipos de medición.", ["auditorias","empresas","plantillas","iso9001","cambios","equipos"]),
  ("5 · Auditoría en campo", "Ejecutá los controles en sitio desde el celular, incluso sin internet.", ["campo"]),
  ("6 · Personas y partes interesadas", "Competencias del equipo, satisfacción de clientes y proveedores.", ["capacitacion","satisfaccion","proveedores"]),
  ("7 · Desempeño y dirección", "Medí resultados, tu huella de carbono y llevá todo a la dirección.", ["huella","kpis","direccion","reportes"]),
  ("8 · Inteligencia y otros sistemas", "Asistentes de IA, seguridad y salud (SST) y mantenimiento (CMMS).", ["ia-auditor","sst","mantenimiento"]),
  ("9 · Administración de la cuenta", "Usuarios de tu organización, perfiles con su alcance y avisos por correo.", ["permisos","notificaciones"]),
]

TODAY = datetime.date.today().strftime("%d/%m/%Y")


# --------------------- Guarda contra el desfasaje del manual ---------------------
def _verificar_sincronia():
    """Aborta si el Centro de Ayuda tiene módulos que este manual no describe.

    El PDF es lo que el cliente se descarga e imprime, así que un módulo que
    está en la plataforma y no en el manual no se nota hasta que alguien lo
    busca y no lo encuentra. Compara `key` y `name` contra la fuente real
    (`src/lib/modules-info.ts`); permite que acá sobren entradas —hay temas
    como las notificaciones que no son un módulo del menú—, pero no que falten.
    """
    import re
    ts = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                      "src", "lib", "modules-info.ts")
    if not os.path.exists(ts):           # el script puede correrse fuera del repo
        return
    with open(ts, encoding="utf-8") as fh:
        fuente = fh.read()
    # Cada entrada abre con `key: "...",` y en la línea siguiente `name: "..."`.
    pares = re.findall(r'key:\s*"([^"]+)",\s*\n\s*name:\s*"([^"]+)"', fuente)
    if not pares:
        raise SystemExit("No pude leer los módulos de modules-info.ts: cambió el formato.")
    faltan = [k for k, _ in pares if k not in MODULES]
    distintos = [(k, n, MODULES[k]["name"]) for k, n in pares
                 if k in MODULES and MODULES[k]["name"] != n]
    todas_las_fases = {k for _, _, ks in PHASES for k in ks}
    sueltos = [k for k in MODULES if k not in todas_las_fases]
    problemas = []
    if faltan:
        problemas.append("faltan en el manual: " + ", ".join(faltan))
    if distintos:
        problemas.append("nombres distintos: " + "; ".join(
            "%s → «%s» en la app, «%s» acá" % t for t in distintos))
    if sueltos:
        problemas.append("no están en ninguna fase (no se imprimirían): " + ", ".join(sueltos))
    if problemas:
        raise SystemExit("Manual desincronizado con el Centro de Ayuda:\n  - " +
                         "\n  - ".join(problemas))


_verificar_sincronia()

# ------------------------------- Estilos -------------------------------
styles = getSampleStyleSheet()
def S(name, **kw):
    kw.setdefault("fontName", "Helvetica")
    return ParagraphStyle(name, parent=styles["Normal"], **kw)

st_body = S("body", fontSize=10, leading=15, textColor=INK, spaceAfter=4)
st_phase = S("phase", fontSize=17, leading=21, textColor=PRIMARY, fontName="Helvetica-Bold", spaceBefore=6, spaceAfter=2)
st_phase_sub = S("phasesub", fontSize=10, leading=14, textColor=GREY, spaceAfter=10)
st_modname = S("modname", fontSize=13, leading=16, textColor=white, fontName="Helvetica-Bold")
st_clause = S("clause", fontSize=8, leading=11, textColor=white, alignment=TA_LEFT)
st_tag = S("tag", fontSize=10, leading=14, textColor=SECONDARY, fontName="Helvetica-Bold", spaceAfter=4)
st_desc = S("desc", fontSize=9.5, leading=14, textColor=INK, spaceAfter=6)
st_h = S("h", fontSize=9, leading=12, textColor=PRIMARY, fontName="Helvetica-Bold", spaceBefore=4, spaceAfter=3)
st_li = S("li", fontSize=9.5, leading=13.5, textColor=INK)
st_li_g = S("lig", fontSize=9.5, leading=13.5, textColor=HexColor("#4A5A6D"))
st_toc = S("toc", fontSize=10, leading=17, textColor=INK)

def module_block(key):
    m = MODULES[key]
    # Header bar (name + clause) as a table with primary background
    hdr = Table([[Paragraph(m["name"], st_modname), Paragraph(m["clause"], st_clause)]],
                colWidths=[112*mm, 50*mm])
    hdr.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),PRIMARY),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(0,0),(0,0),10),("RIGHTPADDING",(1,0),(1,0),10),
        ("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7),
        ("ALIGN",(1,0),(1,0),"RIGHT"),
        ("ROUNDEDCORNERS",[6,6,0,0]),
    ]))
    howto = ListFlowable(
        [ListItem(Paragraph(s, st_li), leftIndent=6, value=i+1) for i, s in enumerate(m["howTo"])],
        bulletType="1", bulletColor=SECONDARY, bulletFontName="Helvetica-Bold", leftIndent=14, spaceBefore=1)
    recs = ListFlowable(
        [ListItem(Paragraph(r, st_li_g), leftIndent=6) for r in m["recommendations"]],
        bulletType="bullet", bulletColor=HexColor("#F59E0B"), start="•", leftIndent=14, spaceBefore=1)
    body = [
        Paragraph(m["tagline"], st_tag),
        Paragraph(m["description"], st_desc),
        Paragraph("CÓMO USARLO", st_h), howto,
        Spacer(1, 4),
        Paragraph("RECOMENDACIONES", st_h), recs,
    ]
    inner = Table([[body]], colWidths=[162*mm])
    inner.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),white),
        ("BOX",(0,0),(-1,-1),0.6,LINE),
        ("LEFTPADDING",(0,0),(-1,-1),12),("RIGHTPADDING",(0,0),(-1,-1),12),
        ("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),10),
    ]))
    return KeepTogether([hdr, inner, Spacer(1, 12)])

# ------------------------------- Portada + header/footer -------------------------------
def cover(c, doc):
    w, h = A4
    c.setFillColor(PRIMARY); c.rect(0, h-150*mm, w, 150*mm, fill=1, stroke=0)
    c.setFillColor(SECONDARY); c.rect(0, h-150*mm, w, 6*mm, fill=1, stroke=0)
    # logo sobre banda blanca
    c.setFillColor(white); c.roundRect(28*mm, h-70*mm, 70*mm, 26*mm, 4*mm, fill=1, stroke=0)
    try:
        c.drawImage(LOGO, 32*mm, h-66*mm, width=62*mm, height=18*mm, preserveAspectRatio=True, mask='auto')
    except Exception:
        pass
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 30); c.drawString(28*mm, h-105*mm, "Manual de Uso")
    c.setFont("Helvetica", 15); c.drawString(28*mm, h-116*mm, "Plataforma Auditorías en Línea")
    c.setFont("Helvetica", 10.5)
    c.drawString(28*mm, h-128*mm, "Auditorías internas y Sistema de Gestión Integrado")
    c.drawString(28*mm, h-135*mm, "ISO 9001 · 14001 · 45001")
    # pie de portada
    c.setFillColor(INK)
    c.setFont("Helvetica", 9)
    c.drawString(28*mm, 28*mm, "Para empresas y para consultores independientes.")
    c.drawString(28*mm, 22*mm, "Qué hace cada módulo, cómo usarlo y qué conviene hacer primero.")
    c.setFillColor(GREY)
    c.drawString(28*mm, 15*mm, "Actualizado: %s   ·   Versión 2.0   ·   auditoriasenlinea.com.ar" % TODAY)

def later(c, doc):
    w, h = A4
    # header
    c.setFillColor(PRIMARY); c.rect(0, h-14*mm, w, 14*mm, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Helvetica-Bold", 9)
    c.drawString(20*mm, h-9.2*mm, "Auditorías en Línea")
    c.setFont("Helvetica", 8.5); c.setFillColor(HexColor("#BBD3EE"))
    c.drawRightString(w-20*mm, h-9.2*mm, "Manual de Uso de la Plataforma")
    # footer
    c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(20*mm, 14*mm, w-20*mm, 14*mm)
    c.setFillColor(GREY); c.setFont("Helvetica", 8)
    c.drawString(20*mm, 9*mm, "© %s Auditorías en Línea" % datetime.date.today().year)
    c.drawRightString(w-20*mm, 9*mm, "Página %d" % doc.page)

# ------------------------------- Documento -------------------------------
doc = BaseDocTemplate(OUT, pagesize=A4,
    leftMargin=20*mm, rightMargin=20*mm, topMargin=22*mm, bottomMargin=20*mm,
    title="Manual de Uso — Auditorías en Línea", author="Auditorías en Línea")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([
    PageTemplate(id="cover", frames=[frame], onPage=cover),
    PageTemplate(id="content", frames=[frame], onPage=later),
])

story = []
# pág 1 = portada (vacía de flowables salvo salto)
story.append(PageBreak())
story.append(Paragraph("content-start", S("hidden", fontSize=0.1, textColor=white)))

# Intro
story.append(Paragraph("Bienvenido/a", st_phase))
story.append(Paragraph(
    "Auditorías en Línea es una plataforma en la nube para ejecutar auditorías y gestionar Sistemas de "
    "Gestión Integrado (ISO 9001, 14001 y 45001). Cada organización trabaja en un espacio aislado y "
    "seguro. Este manual explica, módulo por módulo, para qué sirve, cómo usarlo y qué recomendaciones "
    "seguir.", st_body))
story.append(Spacer(1, 10))

# --- Lo primero: el alcance. Un manual de 40 páginas asusta si no se aclara
#     cuánto de eso le toca a cada uno.
story.append(Paragraph("Antes de empezar: no todos usan toda la plataforma", st_h))
story.append(Paragraph(
    "La plataforma se usa en dos alcances, y el que elegís define qué secciones ves. No es una versión "
    "recortada ni una prueba: son dos formas de trabajar distintas.", st_body))

ed_rows = [[
    Paragraph("<b>Auditorías</b><br/><font size=8.5 color='#5B6B7F'>Auditores, consultores "
              "independientes y responsables de calidad</font>", st_toc),
    Paragraph("Ejecutar auditorías internas en cualquier industria: programa, plan, checklist, auditor "
              "en campo, hallazgos e informe. Cinco secciones en el menú.", st_toc),
], [
    Paragraph("<b>SGI Completo</b><br/><font size=8.5 color='#5B6B7F'>Empresas que implementan o "
              "mantienen su sistema</font>", st_toc),
    Paragraph("Todo lo anterior más contexto, planificación, procesos, competencias, equipos, "
              "proveedores, indicadores y revisión por la dirección.", st_toc),
]]
ed = Table(ed_rows, colWidths=[54*mm, 108*mm])
ed.setStyle(TableStyle([
    ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("BACKGROUND",(0,0),(-1,-1),LIGHT),
    ("LINEBELOW",(0,0),(-1,-2),0.6,white),
    ("LEFTPADDING",(0,0),(-1,-1),9),("RIGHTPADDING",(0,0),(-1,-1),9),
    ("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7),
]))
story.append(ed)
story.append(Paragraph(
    "La elegís contestando una sola pregunta la primera vez que entrás, y la cambiás cuando quieras "
    "desde <b>Configuración → Alcance de la Plataforma</b>. Cambiar de alcance no borra nada: lo que se "
    "enciende o se apaga es el acceso a las secciones, no la información cargada. Si en este manual "
    "encontrás un módulo que no ves en tu pantalla, es por esto (o porque tu perfil no lo tiene "
    "habilitado), y no porque falte instalarlo.", st_body))
story.append(Spacer(1, 10))

story.append(Paragraph("Si auditás para otros", st_h))
story.append(Paragraph(
    "La plataforma no da por sentado que auditás tu propia organización. Si sos consultor o auditor "
    "independiente, cargás tu cartera de clientes en <b>Empresas Auditadas</b> y cada visita sale con el "
    "domicilio, la actividad y el referente del cliente —no con los datos de tu estudio—. Tus listas de "
    "verificación propias se importan desde Excel en <b>Plantillas de Checklist</b>, así que podés "
    "auditar una bodega, una obra o una clínica sin estar obligado a usar un checklist ISO.", st_body))
story.append(Spacer(1, 10))

story.append(Paragraph("Cómo está organizada la plataforma", st_h))
toc_rows = []
for i,(title, summary, keys) in enumerate(PHASES):
    toc_rows.append([Paragraph("<b>%s</b>" % title, st_toc), Paragraph(summary, st_toc)])
toc = Table(toc_rows, colWidths=[54*mm, 108*mm])
toc.setStyle(TableStyle([
    ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("LINEBELOW",(0,0),(-1,-2),0.4,LINE),
    ("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),
]))
story.append(toc)
story.append(Paragraph(
    "<br/>La plataforma sigue el ciclo de mejora continua (Planificar → Hacer → Verificar → Actuar). "
    "Podés recorrer los módulos en este orden o entrar directo al que necesites.", st_body))
story.append(Paragraph(
    "En el menú lateral no vas a ver una lista larga: los módulos están agrupados en cinco secciones "
    "que se abren solo si las necesitás, y si tu alcance tiene pocos módulos la lista se muestra plana, "
    "sin un clic de más. La sección donde estás trabajando queda abierta sola.", st_body))
story.append(PageBreak())

# Fases y módulos
for title, summary, keys in PHASES:
    story.append(Paragraph(title, st_phase))
    story.append(Paragraph(summary, st_phase_sub))
    for k in keys:
        story.append(module_block(k))
    story.append(Spacer(1, 4))

# Cierre
story.append(Paragraph("Soporte", st_phase))
story.append(Paragraph(
    "¿Dudas o querés una demostración? Escribinos a <b>ventas@auditoriasenlinea.com.ar</b> o por WhatsApp "
    "al <b>+54 261 570-8516</b>. También podés reejecutar el «Tour de bienvenida» desde el Centro de Ayuda "
    "de la plataforma en cualquier momento.", st_body))

# Construcción: primera página usa plantilla 'cover', el resto 'content'
def on_first(c, d): pass
story2 = story
# Cambiamos de plantilla luego de la portada
from reportlab.platypus import NextPageTemplate
final = [NextPageTemplate("content")] + story2
doc.build(final)
print("OK ->", OUT)
