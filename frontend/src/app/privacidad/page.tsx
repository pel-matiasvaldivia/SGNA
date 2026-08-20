import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, ArrowLeft, Mail, Database, Mic, MapPin, Bot } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad | Auditorías en Línea",
  description:
    "Cómo Auditorías en Línea trata los datos personales de sus usuarios y de las organizaciones clientes, conforme a la Ley 25.326 de Protección de Datos Personales.",
  alternates: { canonical: "https://auditoriasenlinea.com.ar/privacidad" },
  robots: { index: true, follow: true },
};

/**
 * Datos registrales y de vigencia. Están centralizados acá —y no dispersos en el
 * texto— para que completarlos antes de publicar sea un solo cambio y no una
 * búsqueda por todo el documento.
 */
const TITULAR = {
  razonSocial: "[COMPLETAR: razón social inscripta]",
  cuit: "[COMPLETAR: CUIT]",
  domicilio: "[COMPLETAR: domicilio legal], Mendoza, Argentina",
  emailPrivacidad: "privacidad@auditoriasenlinea.com.ar",
  vigenciaDesde: "20 de agosto de 2026",
  ultimaActualizacion: "20 de agosto de 2026",
};

/** Retenciones. Ajustar a lo que efectivamente se cumpla en producción. */
const RETENCION = {
  cuentaInactiva: "[COMPLETAR: p. ej. 12 meses]",
  trasBaja: "[COMPLETAR: p. ej. 30 días para exportación, luego borrado]",
  logs: "[COMPLETAR: p. ej. 12 meses]",
};

const INDICE = [
  ["1", "Quiénes somos y alcance"],
  ["2", "Dos niveles de responsabilidad"],
  ["3", "Qué datos tratamos"],
  ["4", "Para qué los usamos y con qué base legal"],
  ["5", "Evidencia de campo: fotos, voz, ubicación y firma"],
  ["6", "Asistentes de inteligencia artificial"],
  ["7", "Con quiénes compartimos datos"],
  ["8", "Transferencia internacional"],
  ["9", "Aislamiento entre organizaciones y seguridad"],
  ["10", "Cuánto tiempo conservamos los datos"],
  ["11", "Derechos del titular de los datos"],
  ["12", "Cookies y almacenamiento local"],
  ["13", "Menores de edad"],
  ["14", "Cambios en esta política"],
  ["15", "Contacto"],
];

function Seccion({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`s${id}`} className="scroll-mt-28">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-14 mb-4 font-heading">
        <span className="text-primary mr-2">{id}.</span>
        {titulo}
      </h2>
      <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PoliticaPrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120]">
      {/* Cabecera */}
      <header className="bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <Link href="/" className="relative w-40 h-10 shrink-0">
            <Image
              src="/logo-auditorias.png"
              alt="Auditorías en Línea"
              fill
              className="object-contain object-left"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-bold mb-6 border border-primary/10">
          <ShieldCheck className="w-4 h-4" /> Protección de datos personales
        </div>

        <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4 font-heading">
          Política de Privacidad
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-2">
          Aplica al sitio <strong>auditoriasenlinea.com.ar</strong> y a la plataforma SaaS de
          Sistemas de Gestión Integrado que operamos bajo la marca{" "}
          <strong>Auditorías en Línea</strong>.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500">
          Vigente desde el {TITULAR.vigenciaDesde} · Última actualización:{" "}
          {TITULAR.ultimaActualizacion}
        </p>

        {/* Resumen en lenguaje llano */}
        <div className="mt-10 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">En pocas palabras</h2>
          <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li className="flex gap-3">
              <Database className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                Los datos que tu organización carga en la plataforma <strong>son suyos</strong>.
                Nosotros los alojamos y procesamos por instrucción de ella, en un espacio aislado
                del de cualquier otro cliente.
              </span>
            </li>
            <li className="flex gap-3">
              <Mic className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                Las <strong>notas de voz</strong> vienen desactivadas. Solo si la organización las
                habilita, el audio se envía a un servicio externo para transcribirlo a texto.
              </span>
            </li>
            <li className="flex gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                La app de campo puede registrar la <strong>ubicación</strong> al responder un punto
                de control. El navegador siempre pide permiso y la auditoría funciona igual si se
                niega.
              </span>
            </li>
            <li className="flex gap-3">
              <Bot className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>No vendemos datos</strong> ni los usamos para entrenar modelos de
                inteligencia artificial propios ni de terceros.
              </span>
            </li>
          </ul>
        </div>

        {/* Índice */}
        <nav className="mt-10 rounded-2xl bg-slate-100 dark:bg-zinc-900/60 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-4">
            Contenido
          </h2>
          <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {INDICE.map(([n, t]) => (
              <li key={n}>
                <a href={`#s${n}`} className="text-slate-600 dark:text-slate-300 hover:text-primary transition">
                  <span className="text-slate-400 mr-1.5">{n}.</span>
                  {t}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ------------------------------------------------------------------ */}

        <Seccion id="1" titulo="Quiénes somos y alcance">
          <p>
            <strong>{TITULAR.razonSocial}</strong>, CUIT {TITULAR.cuit}, con domicilio en{" "}
            {TITULAR.domicilio} (en adelante, «Auditorías en Línea», «la plataforma» o «nosotros»),
            es responsable del tratamiento de los datos personales descriptos en esta política.
          </p>
          <p>
            Esta política aplica al sitio web público, al proceso de registro y contratación, y al
            uso de la plataforma en todos sus módulos, incluida la aplicación de campo que los
            auditores usan desde el teléfono.
          </p>
          <p>
            El tratamiento se rige por la <strong>Ley 25.326 de Protección de los Datos
            Personales</strong>, su Decreto Reglamentario 1558/2001 y las normas complementarias
            dictadas por la Agencia de Acceso a la Información Pública (AAIP). Si tu organización
            está alcanzada además por normativa extranjera —por ejemplo el Reglamento General de
            Protección de Datos de la Unión Europea—, podemos suscribir un acuerdo de tratamiento
            específico a pedido.
          </p>
        </Seccion>

        <Seccion id="2" titulo="Dos niveles de responsabilidad">
          <p>
            La plataforma es un servicio entre empresas, así que conviven dos situaciones distintas
            y es importante no confundirlas:
          </p>
          <div className="grid sm:grid-cols-2 gap-4 not-prose">
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
                Somos responsables
              </div>
              <p className="text-sm">
                De los datos de la <strong>relación comercial</strong>: la cuenta de cada usuario,
                los datos de contacto y facturación de la organización, las consultas que nos
                llegan por el sitio y los registros técnicos del servicio.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
              <div className="text-xs font-bold uppercase tracking-wide text-secondary mb-2">
                Somos encargados
              </div>
              <p className="text-sm">
                De los datos que <strong>la organización carga</strong> en su Sistema de Gestión:
                auditorías, hallazgos, capacitaciones, proveedores, evidencia de campo. Ahí la
                responsable es ella, y nosotros actuamos por su instrucción.
              </p>
            </div>
          </div>
          <p>
            En la práctica esto significa que si sos empleado, auditado o proveedor de una empresa
            cliente y querés ejercer derechos sobre los datos cargados en su Sistema de Gestión, el
            reclamo se dirige a <strong>esa organización</strong>. Si nos llega a nosotros, se lo
            derivamos y colaboramos para que pueda responderte.
          </p>
        </Seccion>

        <Seccion id="3" titulo="Qué datos tratamos">
          <p>La plataforma trata las siguientes categorías de datos:</p>

          <div className="overflow-x-auto not-prose">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-zinc-800 text-left">
                  <th className="py-3 pr-4 font-bold text-slate-900 dark:text-white">Categoría</th>
                  <th className="py-3 font-bold text-slate-900 dark:text-white">Qué incluye</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 dark:text-slate-300">
                <tr className="border-b border-slate-100 dark:border-zinc-800/60">
                  <td className="py-3 pr-4 font-semibold align-top">Cuenta de usuario</td>
                  <td className="py-3">
                    Correo electrónico, nombre y apellido, rol asignado dentro del sistema, estado
                    de la cuenta y fecha de alta. La contraseña se guarda como{" "}
                    <em>hash</em> irreversible: no conservamos ni podemos leer la contraseña
                    original. Si se ingresa con un proveedor externo, el identificador que ese
                    proveedor nos devuelve.
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800/60">
                  <td className="py-3 pr-4 font-semibold align-top">Organización</td>
                  <td className="py-3">
                    Nombre de la organización, identificador interno, plan contratado, dominio
                    propio si lo configura y parámetros del servidor de correo que la organización
                    elija usar para sus notificaciones.
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800/60">
                  <td className="py-3 pr-4 font-semibold align-top">Sistema de Gestión</td>
                  <td className="py-3">
                    Todo lo que la organización carga: programas y asignaciones de auditoría,
                    hallazgos y no conformidades, acciones correctivas, riesgos, procesos,
                    indicadores, registros de capacitación del personal, evaluaciones de
                    proveedores, encuestas de satisfacción y documentación del sistema. Puede
                    incluir nombres de empleados, terceros y datos de contacto.
                  </td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800/60">
                  <td className="py-3 pr-4 font-semibold align-top">Evidencia de campo</td>
                  <td className="py-3">
                    Fotografías tomadas con la cámara del dispositivo, notas escritas, notas de voz
                    y su transcripción, coordenadas de ubicación al momento de responder y firma
                    digital de cierre con el nombre de quien firma. Ver la sección 5.
                  </td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold align-top">Datos técnicos</td>
                  <td className="py-3">
                    Registros de acceso y actividad, dirección IP, tipo de navegador o dispositivo,
                    fecha y hora de las operaciones. Se usan para seguridad, trazabilidad y
                    diagnóstico de fallas.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4 text-sm text-amber-900 dark:text-amber-200">
            <strong>Datos sensibles.</strong> La plataforma no está diseñada para tratar datos
            sensibles en el sentido del artículo 2 de la Ley 25.326 (salud, origen racial o étnico,
            opiniones políticas, convicciones religiosas, vida sexual). Ciertos módulos —Seguridad y
            Salud en el Trabajo, por ejemplo— pueden llevar a que una organización registre
            información vinculada a la salud de un trabajador, como el parte de un accidente. Si tu
            organización va a hacerlo, es ella quien debe obtener el consentimiento expreso que la
            ley exige y adoptar los recaudos correspondientes.
          </p>
        </Seccion>

        <Seccion id="4" titulo="Para qué los usamos y con qué base legal">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Prestar el servicio contratado</strong> —crear y mantener las cuentas,
              ejecutar los módulos del Sistema de Gestión, generar reportes—. Base legal: ejecución
              del contrato con la organización cliente.
            </li>
            <li>
              <strong>Enviar notificaciones operativas</strong>: alta de usuarios, asignación de
              auditorías, vencimientos de calibraciones y mantenimientos, aprobaciones pendientes.
              Base legal: ejecución del contrato e interés legítimo en que el servicio cumpla su
              función.
            </li>
            <li>
              <strong>Seguridad y trazabilidad</strong>: prevenir accesos indebidos, auditar
              operaciones, respaldar la información. Base legal: interés legítimo y cumplimiento de
              obligaciones legales.
            </li>
            <li>
              <strong>Soporte y mejora del producto</strong>: atender consultas, diagnosticar
              errores, analizar el uso de forma agregada. Base legal: interés legítimo.
            </li>
            <li>
              <strong>Comunicaciones comerciales</strong> a quienes nos dejaron sus datos en el
              sitio o solicitaron una demostración. Base legal: consentimiento, revocable en
              cualquier momento sin costo.
            </li>
            <li>
              <strong>Transcripción de notas de voz</strong>, cuando la organización activa la
              función. Base legal: consentimiento de la organización, con el aviso previo que
              describimos en la sección 5.
            </li>
          </ul>
          <p>
            <strong>No usamos los datos de las organizaciones clientes para entrenar modelos de
            inteligencia artificial</strong>, propios ni de terceros, ni los cedemos con fines
            publicitarios.
          </p>
        </Seccion>

        <Seccion id="5" titulo="Evidencia de campo: fotos, voz, ubicación y firma">
          <p>
            La aplicación de campo funciona sin conexión y sincroniza cuando recupera señal. Al
            responder un punto de control, el auditor puede adjuntar distintos tipos de evidencia.
            Cada uno merece una aclaración:
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white pt-2">Fotografías</h3>
          <p>
            Se toman con la cámara del dispositivo y se almacenan como evidencia en el repositorio
            de la organización. Pueden contener imágenes de personas presentes en el lugar
            auditado; es responsabilidad de la organización informar a su personal que las
            auditorías se documentan de este modo.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white pt-2">Notas de voz y transcripción</h3>
          <p>
            La función <strong>viene desactivada</strong> y solo un administrador de la organización
            puede habilitarla, desde Configuración, aceptando previamente un aviso de privacidad. El
            modo por defecto para documentar un punto de control es la nota escrita.
          </p>
          <p>Cuando está habilitada:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>El audio grabado se guarda como evidencia en el repositorio de la organización.</li>
            <li>
              Al finalizar la auditoría, el audio se envía a un <strong>proveedor externo de
              transcripción</strong> para convertirlo a texto (ver sección 7). El texto resultante
              queda junto a la respuesta.
            </li>
            <li>
              La voz de una persona puede permitir identificarla. La organización debe informar a
              sus auditores y a quienes puedan ser grabados, y obtener el consentimiento que
              corresponda antes de activar la función.
            </li>
            <li>
              Desactivar la función detiene el envío de nuevos audios, pero no borra los ya
              cargados: eso se hace desde la propia auditoría.
            </li>
          </ul>

          <h3 className="font-bold text-slate-900 dark:text-white pt-2">Ubicación</h3>
          <p>
            La aplicación puede registrar las coordenadas del dispositivo al momento de responder,
            para acreditar que la verificación se hizo en el sitio. El navegador{" "}
            <strong>siempre solicita permiso</strong> y la respuesta se guarda igual si el permiso
            se deniega o si no hay señal: en ese caso el punto queda sin coordenadas. No hacemos
            seguimiento continuo ni registramos la ubicación fuera del momento de responder.
          </p>

          <h3 className="font-bold text-slate-900 dark:text-white pt-2">Firma digital</h3>
          <p>
            Al cerrar una auditoría se guarda la imagen de la firma trazada en pantalla, el nombre
            declarado de quien firma y la fecha y hora. Su finalidad es acreditar la conformidad con
            el resultado.
          </p>
        </Seccion>

        <Seccion id="6" titulo="Asistentes de inteligencia artificial">
          <p>
            El módulo <strong>Auditor de IA Hub</strong> analiza la información del Sistema de
            Gestión de tu organización para sugerir análisis de causa raíz, evaluaciones de riesgo o
            resúmenes de indicadores. Sus respuestas son <strong>una sugerencia, no una decisión</strong>:
            la responsabilidad de validar y resolver es siempre del responsable del proceso.
          </p>
          <p>
            Cuando la organización conecta un proveedor externo de inteligencia artificial, los
            fragmentos de información necesarios para responder la consulta se envían a ese
            proveedor, bajo las condiciones que él establezca. La organización elige si activa esa
            integración y con qué proveedor, y es quien debe evaluar si el envío resulta compatible
            con sus obligaciones. Sin proveedor configurado, el análisis se resuelve dentro de la
            plataforma.
          </p>
        </Seccion>

        <Seccion id="7" titulo="Con quiénes compartimos datos">
          <p>
            No vendemos ni cedemos datos personales. Compartimos únicamente lo indispensable con
            proveedores que actúan como <strong>encargados del tratamiento</strong> por nuestra
            cuenta:
          </p>
          <div className="overflow-x-auto not-prose">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-zinc-800 text-left">
                  <th className="py-3 pr-4 font-bold text-slate-900 dark:text-white">Servicio</th>
                  <th className="py-3 pr-4 font-bold text-slate-900 dark:text-white">Para qué</th>
                  <th className="py-3 font-bold text-slate-900 dark:text-white">Qué recibe</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 dark:text-slate-300">
                <tr className="border-b border-slate-100 dark:border-zinc-800/60">
                  <td className="py-3 pr-4 font-semibold align-top">Proveedor de transcripción</td>
                  <td className="py-3 pr-4 align-top">
                    Convertir a texto las notas de voz, si la función está habilitada
                  </td>
                  <td className="py-3">El archivo de audio</td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800/60">
                  <td className="py-3 pr-4 font-semibold align-top">Servicio de correo</td>
                  <td className="py-3 pr-4 align-top">Enviar notificaciones y avisos del sistema</td>
                  <td className="py-3">Correo del destinatario y contenido del aviso</td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800/60">
                  <td className="py-3 pr-4 font-semibold align-top">Calendario y videollamada</td>
                  <td className="py-3 pr-4 align-top">Agendar demostraciones comerciales</td>
                  <td className="py-3">Nombre, correo y horario elegido</td>
                </tr>
                <tr className="border-b border-slate-100 dark:border-zinc-800/60">
                  <td className="py-3 pr-4 font-semibold align-top">Mensajería instantánea</td>
                  <td className="py-3 pr-4 align-top">
                    Canal de contacto del sitio, si elegís usarlo
                  </td>
                  <td className="py-3">Número de teléfono y contenido del mensaje</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold align-top">Infraestructura y respaldo</td>
                  <td className="py-3 pr-4 align-top">Alojar la base de datos y los archivos</td>
                  <td className="py-3">Los datos de la plataforma, cifrados en tránsito</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            También podemos revelar información cuando lo exija una orden judicial o una autoridad
            competente en ejercicio de sus atribuciones.
          </p>
          <p className="text-sm text-slate-500">
            El detalle actualizado de proveedores y sus jurisdicciones está disponible a pedido
            escribiendo a {TITULAR.emailPrivacidad}.
          </p>
        </Seccion>

        <Seccion id="8" titulo="Transferencia internacional">
          <p>
            Algunos de los proveedores mencionados operan fuera de la República Argentina,
            principalmente en los Estados Unidos. El artículo 12 de la Ley 25.326 condiciona la
            transferencia de datos a países que no brinden niveles de protección adecuados.
          </p>
          <p>
            Para esos casos nos apoyamos en las cláusulas contractuales de protección exigidas por
            la normativa vigente, en el consentimiento de la organización cliente —que activa
            expresamente las funciones que implican transferencia, como la transcripción de voz— y
            en la necesidad de la transferencia para ejecutar el contrato.
          </p>
          <p>
            Una organización que necesite evitar toda transferencia internacional puede dejar
            desactivadas las funciones de transcripción e inteligencia artificial externa: el resto
            de la plataforma opera con normalidad.
          </p>
        </Seccion>

        <Seccion id="9" titulo="Aislamiento entre organizaciones y seguridad">
          <p>
            La plataforma es multiempresa, y el aislamiento entre clientes es parte de su diseño, no
            un permiso que se pueda configurar mal:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Cada organización tiene su <strong>propio espacio de base de datos</strong>, separado
              del de las demás. Una consulta hecha desde una organización no alcanza los datos de
              otra.
            </li>
            <li>
              Los archivos y la evidencia se guardan en un{" "}
              <strong>repositorio separado por organización</strong>.
            </li>
            <li>
              Las contraseñas se almacenan como <em>hash</em> irreversible. Nadie de nuestro equipo
              puede verlas.
            </li>
            <li>
              <strong>Segundo factor de autenticación</strong> disponible, y activable como
              obligatorio para toda la organización.
            </li>
            <li>Comunicaciones cifradas en tránsito mediante TLS.</li>
            <li>
              Acceso del personal técnico limitado a lo necesario para operar y sostener el
              servicio, sujeto a deber de confidencialidad.
            </li>
          </ul>
          <p>
            Ningún sistema es infalible. Si detectamos un incidente de seguridad que afecte datos
            personales, lo notificaremos a las organizaciones alcanzadas y a la autoridad de control
            en los plazos y condiciones que fije la normativa aplicable.
          </p>
        </Seccion>

        <Seccion id="10" titulo="Cuánto tiempo conservamos los datos">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Mientras el contrato esté vigente</strong>, conservamos los datos del Sistema
              de Gestión: es su razón de ser, porque la trazabilidad de auditorías y no
              conformidades tiene valor probatorio en el tiempo.
            </li>
            <li>
              <strong>Cuentas inactivas</strong>: {RETENCION.cuentaInactiva}.
            </li>
            <li>
              <strong>Tras la baja del servicio</strong>: {RETENCION.trasBaja}. Durante ese período
              la organización puede exportar su información.
            </li>
            <li>
              <strong>Registros técnicos</strong>: {RETENCION.logs}.
            </li>
            <li>
              <strong>Documentación contable y fiscal</strong>: por los plazos que exige la
              legislación aplicable, aun después de terminada la relación.
            </li>
          </ul>
        </Seccion>

        <Seccion id="11" titulo="Derechos del titular de los datos">
          <p>
            Como titular de datos personales podés ejercer los derechos de{" "}
            <strong>acceso, rectificación, actualización y supresión</strong> previstos en la Ley
            25.326, además de oponerte al tratamiento y revocar el consentimiento que hubieras
            prestado.
          </p>
          <p>
            Escribinos a <strong>{TITULAR.emailPrivacidad}</strong> indicando qué derecho querés
            ejercer y acompañando constancia de tu identidad. Respondemos dentro de los{" "}
            <strong>diez días corridos</strong> para las solicitudes de acceso y de los{" "}
            <strong>cinco días hábiles</strong> para las de rectificación, actualización o
            supresión, conforme a los artículos 14 y 16 de la ley.
          </p>
          <p className="rounded-xl bg-slate-100 dark:bg-zinc-900/60 p-4 text-sm">
            <strong>Si sos empleado, auditado o proveedor de una empresa cliente:</strong> tu pedido
            sobre los datos cargados en el Sistema de Gestión de esa empresa debe dirigirse a ella,
            que es la responsable. Si nos escribís a nosotros, te lo indicamos y le damos aviso para
            que pueda responderte.
          </p>
          <p className="text-sm text-slate-500">
            El ejercicio del derecho de acceso es gratuito a intervalos no inferiores a seis meses,
            salvo interés legítimo acreditado (art. 14, inc. 3, Ley 25.326). La{" "}
            <strong>Agencia de Acceso a la Información Pública</strong>, en su carácter de autoridad
            de aplicación, atiende las denuncias de quien considere vulnerados sus derechos.
          </p>
        </Seccion>

        <Seccion id="12" titulo="Cookies y almacenamiento local">
          <p>
            No usamos cookies de publicidad ni de seguimiento de terceros. Empleamos únicamente:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Cookies técnicas de sesión</strong>, imprescindibles para mantenerte
              autenticado. Sin ellas no es posible iniciar sesión.
            </li>
            <li>
              <strong>Almacenamiento local del navegador</strong>, que la aplicación de campo usa
              para guardar en el dispositivo las auditorías y la evidencia mientras no hay conexión,
              y sincronizarlas después. Esa información queda en el teléfono hasta que se sincroniza
              y se puede eliminar borrando los datos del sitio.
            </li>
          </ul>
        </Seccion>

        <Seccion id="13" titulo="Menores de edad">
          <p>
            La plataforma es una herramienta de gestión profesional dirigida a organizaciones. No
            está destinada a menores de 18 años ni recolectamos deliberadamente sus datos. Si
            detectamos que se registró una cuenta de un menor sin autorización, la damos de baja.
          </p>
        </Seccion>

        <Seccion id="14" titulo="Cambios en esta política">
          <p>
            Podemos actualizar esta política para reflejar cambios en la plataforma o en la
            normativa. Publicamos la versión vigente en esta misma dirección con su fecha de última
            actualización. Cuando el cambio sea sustancial —una nueva finalidad, un nuevo proveedor
            que reciba datos— lo avisamos por correo a los administradores de cada organización
            antes de que entre en vigor.
          </p>
        </Seccion>

        <Seccion id="15" titulo="Contacto">
          <p>Para cualquier consulta sobre esta política o sobre el tratamiento de tus datos:</p>
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 not-prose">
            <p className="font-bold text-slate-900 dark:text-white">{TITULAR.razonSocial}</p>
            <p className="text-sm text-slate-500 mt-1">CUIT {TITULAR.cuit}</p>
            <p className="text-sm text-slate-500">{TITULAR.domicilio}</p>
            <a
              href={`mailto:${TITULAR.emailPrivacidad}`}
              className="inline-flex items-center gap-2 mt-4 font-semibold text-primary hover:underline"
            >
              <Mail className="w-4 h-4" /> {TITULAR.emailPrivacidad}
            </a>
          </div>
        </Seccion>

        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/" className="text-slate-500 hover:text-primary transition">
            Inicio
          </Link>
          <Link href="/register" className="text-slate-500 hover:text-primary transition">
            Crear cuenta
          </Link>
          <a
            href={`mailto:${TITULAR.emailPrivacidad}`}
            className="text-slate-500 hover:text-primary transition"
          >
            Ejercer mis derechos
          </a>
        </div>
      </main>
    </div>
  );
}
