"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Send, Calendar, Sparkles, CheckCircle2, ArrowRight, RefreshCw } from "lucide-react";

/**
 * Botón flotante de WhatsApp + asistente (bot) para la landing.
 * - Responde preguntas frecuentes del sistema (reglas por palabras clave).
 * - Permite agendar una demo: genera un evento de Google Calendar (con Google
 *   Meet, invitando a ventas@) y/o un mensaje de WhatsApp al equipo comercial.
 * Todo corre en el cliente: no requiere backend.
 */

const WA_NUMBER = "5492615708516"; // formato wa.me (Argentina móvil: 549 + área + número)
const WA_DISPLAY = "+54 261 570-8516";
const SALES_EMAIL = "ventas@auditoriasenlinea.com.ar";

type Msg = { from: "bot" | "user"; text: React.ReactNode };

interface Faq {
  keys: string[];
  label: string;
  answer: React.ReactNode;
}

const FAQS: Faq[] = [
  {
    keys: ["que es", "qué es", "sistema", "plataforma", "auditorias en linea", "producto"],
    label: "¿Qué es Auditorías en Línea?",
    answer:
      "Es un software en la nube para gestionar auditorías y Sistemas de Gestión Integrado ISO 9001, 14001 y 45001. Centraliza auditorías, no conformidades, documentos, riesgos y KPIs en un solo lugar. 📊",
  },
  {
    keys: ["sin internet", "offline", "conexion", "conexión", "campo", "celular", "movil", "móvil", "terreno"],
    label: "¿Funciona sin internet?",
    answer:
      "¡Sí! La app de campo se instala en el celular del auditor y funciona 100% sin conexión. Ejecuta los controles en planta u obra y, al recuperar la señal, todo se sincroniza solo. Podés probar la demo interactiva en la sección \"App de Campo\". 📴🔄",
  },
  {
    keys: ["modulo", "módulo", "funcionalidad", "que hace", "qué hace", "caracteristicas", "características"],
    label: "¿Qué módulos incluye?",
    answer:
      "Auditorías internas, No Conformidades con causa raíz, Huella de Carbono (ISO 14001), Seguridad y Salud (ISO 45001), Gestión Documental, IA Auditor Copilot y tableros de KPIs en tiempo real. 🧩",
  },
  {
    keys: ["precio", "plan", "planes", "costo", "cuanto", "cuánto", "valor", "tarifa"],
    label: "Planes y precios",
    answer: process.env.NEXT_PUBLIC_HIDE_PRICES === "true" ? (
      <>
        Tenemos 3 planes adaptados a tus necesidades:
        <br />• <b>Básico</b> — A medida (1 norma ISO)
        <br />• <b>Standard</b> — A medida (ISO 9001 + 14001 + Huella)
        <br />• <b>Personalizado</b> — A medida (ecosistema SGI completo)
        <br />Todos con actualizaciones automáticas. 💳
      </>
    ) : (
      <>
        Tenemos 3 planes:
        <br />• <b>Básico</b> — USD 99/mes (1 norma ISO)
        <br />• <b>Standard</b> — USD 249/mes (ISO 9001 + 14001 + Huella)
        <br />• <b>Personalizado</b> — a medida (ecosistema SGI completo)
        <br />Todos con actualizaciones automáticas. 💳
      </>
    ),
  },
  {
    keys: ["seguridad", "datos", "multitenant", "aislado", "privacidad"],
    label: "¿Es seguro?",
    answer:
      "Cada empresa tiene su espacio aislado (multi-tenant): datos, documentos y archivos separados por cliente. Almacenamiento cifrado y accesos por rol. 🔒",
  },
];

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", empresa: "", when: "" });
  const scrollRef = useRef<HTMLDivElement>(null);

  // Saludo inicial la primera vez que se abre.
  useEffect(() => {
    if (open && msgs.length === 0) {
      setMsgs([
        {
          from: "bot",
          text: "¡Hola! 👋 Soy el asistente de Auditorías en Línea. Puedo contarte cómo funciona el sistema o ayudarte a agendar una demo. ¿En qué te ayudo?",
        },
      ]);
    }
  }, [open, msgs.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, booking]);

  const pushBot = (text: React.ReactNode) => setMsgs((m) => [...m, { from: "bot", text }]);
  const pushUser = (text: string) => setMsgs((m) => [...m, { from: "user", text }]);

  const answerFor = (raw: string) => {
    const t = raw.toLowerCase();
    if (/(demo|reuni|agenda|meet|cita|llamada|contact)/.test(t)) {
      startBooking();
      return;
    }
    const hit = FAQS.find((f) => f.keys.some((k) => t.includes(k)));
    if (hit) {
      pushBot(hit.answer);
    } else {
      pushBot(
        <>
          Puedo ayudarte con eso. 🙂 Para una respuesta más precisa, tocá una opción de abajo o escribinos directo por WhatsApp. También puedo <b>agendar una demo</b> cuando quieras.
        </>
      );
    }
  };

  const handleFaq = (f: Faq) => {
    pushUser(f.label);
    setTimeout(() => pushBot(f.answer), 250);
  };

  const send = () => {
    const v = input.trim();
    if (!v) return;
    pushUser(v);
    setInput("");
    setTimeout(() => answerFor(v), 250);
  };

  const startBooking = () => {
    setBooking(true);
    pushBot("¡Genial! Coordinamos una demo por Google Meet. Completá estos datos y te preparo la invitación 👇");
  };

  // Construye link de Google Calendar (evento con invitado ventas@ y Google Meet).
  const buildCalendarUrl = () => {
    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const text = encodeURIComponent("Demo — Auditorías en Línea");
    const details = encodeURIComponent(
      `Demo del sistema Auditorías en Línea.\n\nSolicitada por: ${form.nombre}${form.empresa ? ` (${form.empresa})` : ""}\nEmail: ${form.email}\n\nSe realizará por Google Meet. El equipo comercial confirmará el enlace.`
    );
    const guests = `&add=${encodeURIComponent(SALES_EMAIL)}${form.email ? `&add=${encodeURIComponent(form.email)}` : ""}`;
    const location = "&location=Google+Meet";
    let dates = "";
    if (form.when) {
      const start = new Date(form.when);
      if (!isNaN(start.getTime())) {
        const end = new Date(start.getTime() + 30 * 60000);
        const fmt = (d: Date) =>
          d.getFullYear().toString() +
          String(d.getMonth() + 1).padStart(2, "0") +
          String(d.getDate()).padStart(2, "0") +
          "T" +
          String(d.getHours()).padStart(2, "0") +
          String(d.getMinutes()).padStart(2, "0") +
          "00";
        dates = `&dates=${fmt(start)}/${fmt(end)}`;
      }
    }
    return `${base}&text=${text}&details=${details}${location}${guests}${dates}`;
  };

  const buildWhatsappUrl = () => {
    const msg =
      `Hola! Quiero agendar una *demo* de Auditorías en Línea.%0A%0A` +
      `*Nombre:* ${form.nombre || "-"}%0A` +
      `*Empresa:* ${form.empresa || "-"}%0A` +
      `*Email:* ${form.email || "-"}%0A` +
      `*Preferencia:* ${form.when ? new Date(form.when).toLocaleString("es-AR") : "a coordinar"}`;
    return `https://wa.me/${WA_NUMBER}?text=${msg}`;
  };

  const [sending, setSending] = useState(false);

  const confirmBooking = async () => {
    if (!form.nombre || !form.email) {
      pushBot("Necesito al menos tu nombre y email para preparar la invitación 🙂");
      return;
    }
    setSending(true);

    // 1) Intento de agendamiento automático en el backend (crea Meet + avisa por email/WhatsApp).
    let meetLink: string | null = null;
    let backendOk = false;
    let backendMsg = "";
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/demos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          empresa: form.empresa || null,
          when: form.when ? new Date(form.when).toISOString() : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        backendOk = !!data.ok;
        meetLink = data.meet_link || null;
        backendMsg = data.message || "";
      }
    } catch {
      // Sin backend disponible: usamos los enlaces directos como respaldo.
    }

    setSending(false);
    setBooking(false);
    const firstName = form.nombre.split(" ")[0];

    if (backendOk) {
      // Agendamiento automático confirmado por el servidor.
      pushBot(
        <>
          ¡Listo, {firstName}! 🎉 {backendMsg}
          {meetLink && (
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 justify-center rounded-lg bg-primary text-white text-xs font-bold px-3 py-2 mt-3 w-full hover:bg-primary/90 transition"
            >
              <Calendar className="w-4 h-4" /> Abrir enlace de Google Meet
            </a>
          )}
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 justify-center rounded-lg bg-[#25D366] text-white text-xs font-bold px-3 py-2 mt-2 w-full hover:brightness-95 transition"
          >
            <WaGlyph className="w-4 h-4" /> ¿Preferís coordinar por WhatsApp?
          </a>
        </>
      );
      return;
    }

    // Respaldo: enlaces directos (Google Calendar + WhatsApp) sin backend.
    pushBot(
      <>
        ¡Listo, {firstName}! 🎉 Preparé tu solicitud de demo. Elegí cómo confirmarla:
        <div className="flex flex-col gap-2 mt-3">
          <a
            href={buildCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 justify-center rounded-lg bg-primary text-white text-xs font-bold px-3 py-2 hover:bg-primary/90 transition"
          >
            <Calendar className="w-4 h-4" /> Agendar en Google Calendar
          </a>
          <a
            href={buildWhatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 justify-center rounded-lg bg-[#25D366] text-white text-xs font-bold px-3 py-2 hover:brightness-95 transition"
          >
            <WaGlyph className="w-4 h-4" /> Confirmar por WhatsApp
          </a>
        </div>
        <span className="block text-[10px] text-slate-400 mt-2">
          La invitación incluye a {SALES_EMAIL} y se realiza por Google Meet. Te contactaremos para confirmar el horario.
        </span>
      </>
    );
  };

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir chat de WhatsApp"
        className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        {open ? <X className="w-6 h-6" /> : <WaGlyph className="w-7 h-7" />}
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Panel de chat */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] w-[calc(100vw-2.5rem)] sm:w-[370px] max-h-[70vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white animate-[waIn_0.25s_ease-out]">
          {/* Header */}
          <div className="bg-[#075E54] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm leading-tight">Asistente Auditorías en Línea</p>
              <p className="text-[11px] text-white/70 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> En línea · responde al instante
              </p>
            </div>
          </div>

          {/* Mensajes */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#ECE5DD]"
            style={{ backgroundImage: "radial-gradient(rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "16px 16px" }}
          >
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug shadow-sm ${
                    m.from === "user"
                      ? "bg-[#DCF8C6] text-slate-800 rounded-br-sm"
                      : "bg-white text-slate-700 rounded-tl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {/* Formulario de agenda */}
            {booking && (
              <div className="bg-white rounded-xl p-3 shadow-sm space-y-2">
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Tu nombre *"
                  className="w-full text-[13px] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-primary"
                />
                <input
                  value={form.empresa}
                  onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                  placeholder="Empresa"
                  className="w-full text-[13px] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-primary"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email *"
                  className="w-full text-[13px] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-primary"
                />
                <label className="block text-[11px] font-semibold text-slate-500">Fecha y hora preferida</label>
                <input
                  type="datetime-local"
                  value={form.when}
                  onChange={(e) => setForm({ ...form, when: e.target.value })}
                  className="w-full text-[13px] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:border-primary"
                />
                <button
                  onClick={confirmBooking}
                  disabled={sending}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary text-white text-xs font-bold px-3 py-2.5 hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Agendando…</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Preparar mi demo</>
                  )}
                </button>
              </div>
            )}

            {/* Sugerencias rápidas */}
            {!booking && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {FAQS.map((f) => (
                  <button
                    key={f.label}
                    onClick={() => handleFaq(f)}
                    className="text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 rounded-full px-2.5 py-1 hover:border-primary hover:text-primary transition"
                  >
                    {f.label}
                  </button>
                ))}
                <button
                  onClick={() => {
                    pushUser("Quiero agendar una demo");
                    setTimeout(startBooking, 250);
                  }}
                  className="text-[11px] font-bold bg-primary text-white rounded-full px-2.5 py-1 hover:bg-primary/90 transition inline-flex items-center gap-1"
                >
                  <Calendar className="w-3 h-3" /> Agendar demo
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Escribí tu consulta…"
              className="flex-1 text-[13px] rounded-full bg-slate-100 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={send}
              aria-label="Enviar"
              className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition flex-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Pie: WhatsApp directo */}
          <a
            href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Hola! Tengo una consulta sobre Auditorías en Línea.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-xs font-bold py-2.5 hover:brightness-95 transition"
          >
            <WaGlyph className="w-4 h-4" /> Hablar directo por WhatsApp ({WA_DISPLAY})
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <style>{`@keyframes waIn { from { opacity: 0; transform: translateY(12px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }`}</style>
        </div>
      )}
    </>
  );
}

/* Glifo de WhatsApp (inline, sin dependencias externas). */
function WaGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden="true">
      <path d="M16.004 2.667c-7.36 0-13.333 5.973-13.333 13.333 0 2.352.616 4.651 1.787 6.677L2.667 29.333l6.83-1.79a13.27 13.27 0 0 0 6.507 1.657h.005c7.355 0 13.329-5.973 13.329-13.333 0-3.563-1.387-6.911-3.907-9.431-2.52-2.52-5.869-3.905-9.432-3.769zm0 24.32h-.004a11.03 11.03 0 0 1-5.62-1.539l-.403-.24-4.053 1.063 1.081-3.951-.263-.405a11.01 11.01 0 0 1-1.688-5.876c0-6.115 4.977-11.093 11.096-11.093 2.963 0 5.749 1.155 7.843 3.251a11.02 11.02 0 0 1 3.247 7.847c0 6.116-4.977 11.093-11.093 11.093zm6.084-8.309c-.333-.167-1.973-.973-2.279-1.084-.305-.112-.528-.167-.751.167-.223.333-.861 1.083-1.056 1.306-.195.223-.389.25-.722.083-.333-.167-1.408-.519-2.681-1.655-.991-.884-1.66-1.977-1.855-2.311-.195-.333-.021-.513.146-.679.15-.149.333-.389.5-.583.167-.195.222-.334.333-.556.111-.223.056-.417-.028-.583-.083-.167-.751-1.809-1.028-2.477-.271-.65-.546-.562-.751-.573l-.639-.011c-.223 0-.583.083-.889.417-.305.333-1.167 1.14-1.167 2.782 0 1.642 1.195 3.228 1.361 3.451.167.223 2.352 3.591 5.699 5.035.796.344 1.417.549 1.901.703.799.254 1.526.218 2.101.132.641-.096 1.973-.806 2.251-1.585.278-.779.278-1.446.195-1.585-.083-.139-.305-.223-.638-.389z" />
    </svg>
  );
}
