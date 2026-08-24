"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, BarChart3, Users, Leaf, CheckCircle2, Star, Sparkles, BrainCircuit, MonitorSmartphone, Settings, Smartphone, WifiOff, RefreshCw, Camera, MapPin, PenLine, CloudLightning, ListChecks, AlertOctagon, FileText, Wifi, Signal, Mail, MessageCircle, Workflow, Search, GitBranch, Activity, Database, Lock, Download, Mic, Wallet, Percent, CalendarRange } from "lucide-react";

/**
 * Catálogo de planes. El precio NO se publica: se cotiza según los módulos que
 * la organización habilite, así que la tarjeta se ancla en el alcance —cuántas
 * normas, cuántas auditorías— en lugar de en una cifra.
 */
const PLANES = [
  {
    id: "basico",
    nombre: "Básico",
    alcance: "1 norma ISO",
    bajada: "Para pymes que están comenzando su certificación.",
    destacado: false,
    items: [
      "1 auditoría interna al año",
      "1 modelo ISO — 9001, 14001 o 45001",
      "1 checklist a medida",
      "1 GB de almacenamiento",
    ],
  },
  {
    id: "standard",
    nombre: "Standard",
    alcance: "3 normas ISO",
    bajada: "Cobertura integral del sistema de gestión.",
    destacado: true,
    items: [
      "2 auditorías internas al año",
      "3 modelos ISO — 9001, 14001 y 45001",
      "5 checklists a medida",
      "5 GB de almacenamiento",
    ],
  },
  {
    id: "business",
    nombre: "Business",
    alcance: "Multi-empresa",
    bajada: "Para grupos económicos y organizaciones multi-sede.",
    destacado: false,
    oscuro: true,
    items: [
      "Gestión multi-empresa y multi-sede",
      "Modelos ISO 9001, 14001 y 45001",
      "Checklists a medida sin límite",
      "100 GB de almacenamiento",
      "IA Auditor incluido",
    ],
  },
];
import HeroCarousel from "@/components/hero-carousel";
import InteractiveDemo from "@/components/interactive-demo";
import WhatsAppWidget from "@/components/whatsapp-widget";
import ModulesAccordion from "@/components/modules-accordion";
import AiAuditorDemo from "@/components/ai-auditor-demo";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] font-sans selection:bg-secondary selection:text-white">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="relative w-44 h-11">
              <Image src="/logo-auditorias.png" alt="Auditorías en Línea" fill className="object-contain object-left" priority />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#soluciones" className="hover:text-primary transition">Soluciones SGI</a>
            <a href="#modulos" className="hover:text-primary transition">Módulos</a>
            <a href="#app-campo" className="hover:text-primary transition">App de Campo</a>
            <a href="#auditor-ia" className="hover:text-primary transition">Auditor IA</a>
            <a href="#ecosistema" className="hover:text-primary transition">Ecosistema</a>
            <a href="#planes" className="hover:text-primary transition">Planes</a>
            <a href="#testimonios" className="hover:text-primary transition">Testimonios</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-primary dark:text-white hover:opacity-80 transition">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-full hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all">
              Probar Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-secondary/10 blur-[120px] mix-blend-multiply opacity-70 animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[100px] mix-blend-multiply opacity-70"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-bold mb-6 border border-primary/10">
            <Sparkles className="w-4 h-4" /> La revolución del Software B2B ha llegado
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 font-heading">
            La forma más rápida y eficiente<br />
            de alcanzar la <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Excelencia.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10">
            Soluciones ágiles de auditorías y Sistemas de Gestión Integrado. Libere a sus auditores para concentrarse en tareas de mayor valor con control total en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="w-full sm:w-auto text-lg font-bold bg-primary text-white px-8 py-4 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2">
              Comience su transformación hoy <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#soluciones" className="w-full sm:w-auto text-lg font-bold bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-zinc-800 px-8 py-4 rounded-full hover:bg-slate-50 transition-colors">
              Explorar Plataforma
            </a>
          </div>
          <div className="mt-4">
            <a href="/brochure-auditorias-en-linea.pdf" download className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              <Download className="w-4 h-4" /> Descargar brochure (PDF)
            </a>
          </div>
          <a href="#app-campo" className="group flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition">
            <span className="inline-flex items-center gap-2"><WifiOff className="w-4 h-4 text-primary" /> Auditorías sin conexión</span>
            <span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4 text-primary" /> Sincronización automática</span>
            <span className="inline-flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" /> App en el celular</span>
            <span className="inline-flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition">Probar demo <ArrowRight className="w-4 h-4" /></span>
          </a>
        </div>

        {/* Carrusel de casos de uso y beneficios */}
        <div className="mt-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <HeroCarousel />
        </div>
      </section>

      {/* Por qué elegirnos (PDF Page 2 & 3) */}
      <section id="soluciones" className="py-24 bg-white dark:bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">Las auditorías tradicionales ya no son suficientes.</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Procesos manuales costosos, visión incompleta de la organización y riesgos ocultos que la automatización puede prevenir.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 p-8 rounded-3xl text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ágil</h3>
              <p className="text-slate-600 dark:text-slate-400">Automatiza tareas manuales y agiliza el proceso de auditoría y reportabilidad.</p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 p-8 rounded-3xl text-center hover:shadow-xl transition-shadow transform md:-translate-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Eficiente</h3>
              <p className="text-slate-600 dark:text-slate-400">Proporciona una visión completa, analítica y predictiva del estado real de la organización.</p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900/50 border border-slate-100 dark:border-zinc-800 p-8 rounded-3xl text-center hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MonitorSmartphone className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Accesible</h3>
              <p className="text-slate-600 dark:text-slate-400">Plataforma cloud multitenant disponible desde cualquier lugar y dispositivo corporativo.</p>
            </div>
          </div>
        </div>
      </section>

      {/* App de Campo — Auditor Móvil Offline */}
      <section id="app-campo" className="py-24 bg-gradient-to-b from-white to-slate-50 dark:from-[#0F172A] dark:to-[#0B1120] relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-secondary/5 blur-[140px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-bold mb-5 border border-secondary/20">
              <Smartphone className="w-4 h-4" /> Nuevo · Auditor en Campo
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 font-heading">
              La auditoría, en el bolsillo de su equipo.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Sus auditores ejecutan los controles desde el celular en planta, obra o depósito —
              <span className="font-semibold text-slate-800 dark:text-slate-200"> incluso sin señal</span>.
              Cuando vuelve la conexión, <span className="font-semibold text-slate-800 dark:text-slate-200">todo se sincroniza solo</span>.
              La herramienta que su organización usa cada día, esté donde esté.
            </p>
            <p className="text-sm font-bold text-secondary mt-4 inline-flex items-center gap-1.5">
              👉 Probá la app acá mismo: elegí una auditoría, respondé y cortá la conexión para ver la sincronización.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Demo interactiva de la app móvil */}
            <div className="lg:w-2/5 flex justify-center">
              <InteractiveDemo />
            </div>

            {/* Feature list */}
            <div className="lg:w-3/5">
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: WifiOff, color: "text-amber-600 bg-amber-100", title: "Funciona sin internet", desc: "En sitios remotos, sótanos o zonas rurales, el auditor ejecuta la auditoría completa. Nada se pierde." },
                  { icon: RefreshCw, color: "text-green-600 bg-green-100", title: "Sincronización automática", desc: "Al recuperar la señal, respuestas, fotos y ubicación se envían solas al servidor, sin duplicados." },
                  { icon: ListChecks, color: "text-primary bg-blue-100", title: "Checklists por norma", desc: "El líder asigna la auditoría y el checklist ISO 9001 / 14001 / 45001 se genera automáticamente." },
                  { icon: Camera, color: "text-purple-600 bg-purple-100", title: "Evidencia con foto y GPS", desc: "Cada control se respalda con fotografía y coordenadas del lugar exacto de la verificación." },
                  { icon: AlertOctagon, color: "text-red-600 bg-red-100", title: "No Conformidades automáticas", desc: "Un hallazgo \"no conforme\" abre la NC en el módulo ISO 9001 al instante, lista para tratar." },
                  { icon: PenLine, color: "text-secondary bg-sky-100", title: "Firma digital y reporte", desc: "El auditor firma en pantalla, cierra la auditoría y genera el reporte PDF listo para el legajo." },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${f.color}`}>
                      <f.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{f.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Install note */}
              <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/10">
                <div className="flex items-center gap-3 flex-1">
                  <CloudLightning className="w-8 h-8 text-primary flex-shrink-0" />
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    <span className="font-bold">Se instala como una app</span> desde el navegador —
                    sin App Store, sin descargas. Un ícono en el celular de cada auditor.
                  </p>
                </div>
                <Link href="/register" className="w-full sm:w-auto flex-shrink-0 text-sm font-bold bg-primary text-white px-6 py-3 rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 whitespace-nowrap">
                  Probar en mi equipo <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Day-in-the-life flow strip */}
          <div className="mt-20">
            <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">Un día de trabajo, de principio a fin</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { icon: ListChecks, label: "El líder asigna", sub: "Checklist por norma" },
                { icon: WifiOff, label: "Ejecuta en sitio", sub: "Sin conexión" },
                { icon: Wifi, label: "Reconecta", sub: "Sincroniza solo" },
                { icon: AlertOctagon, label: "Dispara NC", sub: "Automático" },
                { icon: FileText, label: "Reporte PDF", sub: "Listo p/ legajo" },
              ].map((s, i) => (
                <div key={i} className="relative bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{s.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
                  {i < 4 && <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 text-slate-300 z-10" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Auditor de IA */}
      <section id="auditor-ia" className="py-24 relative overflow-hidden bg-gradient-to-b from-white to-violet-50/60 dark:from-[#0B1120] dark:to-[#160B2E]">
        <div className="absolute top-1/3 right-[-8%] w-[700px] h-[700px] rounded-full bg-violet-500/10 blur-[140px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 text-violet-700 dark:text-violet-300 text-sm font-bold mb-5 border border-violet-500/20">
              <Sparkles className="w-4 h-4" /> Auditor de IA · Copiloto experto
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 font-heading">
              Un auditor experto que conoce <span className="text-violet-600">tu</span> sistema, 24/7
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              No es un chatbot genérico: razona sobre los <span className="font-semibold text-slate-800 dark:text-slate-200">datos reales de tu SGI</span> —
              cumplimiento, riesgos, no conformidades y KPIs— para responder, analizar y proponer acciones concretas.
            </p>
            <p className="text-sm font-bold text-violet-600 mt-4">👉 Probá el asistente acá al lado: tocá una pregunta.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Beneficios */}
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="grid sm:grid-cols-2 gap-6">
                {[
                  { icon: Search, title: "Análisis de brechas", desc: "Compara tu sistema con la norma, detecta brechas de cumplimiento y prioriza qué corregir primero." },
                  { icon: ShieldCheck, title: "Control de riesgos", desc: "Propone controles para tus riesgos y estima el riesgo residual, alineado a ISO 9001." },
                  { icon: GitBranch, title: "Causa raíz automática", desc: "Ishikawa y 5 Porqués para tus No Conformidades, con acciones correctivas sugeridas." },
                  { icon: Activity, title: "Lectura de KPIs", desc: "Interpreta tus indicadores y te avisa cuáles están por debajo de la meta." },
                  { icon: Database, title: "Sobre TUS datos", desc: "Razona con la información de tu empresa cargada en la plataforma, no con respuestas genéricas." },
                  { icon: Lock, title: "Privado y siempre disponible", desc: "Aislado por empresa y disponible 24/7, sin exponer tu información a terceros." },
                ].map((f, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300 flex items-center justify-center flex-shrink-0">
                      <f.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1">{f.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo interactiva */}
            <div className="lg:w-1/2 order-1 lg:order-2 flex justify-center">
              <AiAuditorDemo />
            </div>
          </div>

          {/* Por qué dentro de la plataforma */}
          <div className="mt-16 rounded-2xl border border-violet-500/15 bg-violet-500/[0.04] dark:bg-violet-500/10 p-6 sm:p-8">
            <h3 className="text-center text-lg font-bold text-slate-900 dark:text-white mb-2">
              ¿Por qué tenerlo <span className="text-violet-600">dentro</span> de la plataforma?
            </h3>
            <p className="text-center text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              Un ChatGPT genérico no conoce tu empresa ni puede actuar. Este copiloto vive junto a tus módulos y por eso realmente ahorra trabajo.
            </p>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { icon: Database, title: "Contexto real", desc: "Lee tu cumplimiento, riesgos, NC y KPIs. Sus respuestas son sobre tu operación, no teoría." },
                { icon: Zap, title: "Convierte en acción", desc: "De un hallazgo abre una No Conformidad o una acción correctiva en el módulo, sin copiar y pegar." },
                { icon: ShieldCheck, title: "Seguro y trazable", desc: "Datos aislados por empresa y todo queda registrado dentro del Sistema de Gestión." },
              ].map((c, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 rounded-xl bg-violet-600 text-white flex items-center justify-center mx-auto mb-3">
                    <c.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">{c.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Flujo */}
          <div className="mt-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: MessageCircle, label: "Preguntás", sub: "En lenguaje natural" },
                { icon: Database, label: "Analiza tus datos", sub: "Del SGI real" },
                { icon: Sparkles, label: "Propone acciones", sub: "Concretas y priorizadas" },
                { icon: CheckCircle2, label: "Aplicás en el módulo", sub: "Con un clic" },
              ].map((s, i) => (
                <div key={i} className="relative bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-2xl p-5 text-center shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-300 flex items-center justify-center mx-auto mb-3">
                    <s.icon className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{s.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
                  {i < 3 && <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-5 h-5 text-slate-300 z-10" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona: módulo por módulo */}
      <section id="modulos" className="py-24 bg-white dark:bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-bold mb-5 border border-primary/10">
              <Workflow className="w-4 h-4" /> Cómo funciona la plataforma
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4 font-heading">
              Un módulo para cada etapa de tu Sistema de Gestión
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Del diagnóstico inicial a la revisión por la dirección: cada requisito de la norma tiene su
              módulo, conectados entre sí para que la información fluya sin duplicar trabajo.
            </p>
          </div>

          <p className="text-center text-xs font-semibold text-slate-400 mb-6">Tocá cada etapa para ver sus módulos</p>
          <ModulesAccordion />

          <div className="text-center mt-14">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-base font-bold bg-primary text-white px-7 py-3.5 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all"
            >
              Explorar todos los módulos gratis <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Ecosistema SGI (PDF Page 7) */}
      <section id="ecosistema" className="py-24 bg-slate-50 dark:bg-zinc-950 border-y border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-6">Más que software, una consultoría integral.</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
                Agregamos valor real a su negocio combinando Tecnología de Vanguardia (Cloud, IA, Datos) con un enfoque puro al cliente.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Gestión Documental (DMS)", desc: "Aprobaciones automáticas, versionado y repositorios aislados." },
                  { title: "Gestión de Riesgos (ISO 9001)", desc: "Matrices FODA, PESTEL e identificación de Riesgos y Oportunidades." },
                  { title: "Seguridad y Salud (ISO 45001)", desc: "Pirámide de incidentes, control de actos inseguros y reportes en terreno." },
                  { title: "Medio Ambiente (ISO 14001)", desc: "Cálculo en tiempo real de Huella de Carbono (Alcance 1, 2 y 3)." }
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{feature.title}</h4>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 w-full">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 pt-8">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800"><ShieldCheck className="w-10 h-10 text-primary mb-4"/><h5 className="font-bold">Auditorías Internas</h5><p className="text-xs text-slate-500 mt-2">Verificación de cumplimiento ágil.</p></div>
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800"><Settings className="w-10 h-10 text-secondary mb-4"/><h5 className="font-bold">Consultoría SGC</h5><p className="text-xs text-slate-500 mt-2">Diagnóstico y diseño.</p></div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800"><BrainCircuit className="w-10 h-10 text-purple-500 mb-4"/><h5 className="font-bold">Inteligencia Artificial</h5><p className="text-xs text-slate-500 mt-2">Auditor Copilot 24/7 integrado.</p></div>
                  <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-zinc-800"><Users className="w-10 h-10 text-orange-500 mb-4"/><h5 className="font-bold">Capacitación</h5><p className="text-xs text-slate-500 mt-2">Entrenamiento del personal.</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planes (PDF Page 9) */}
      <section id="planes" className="py-24 bg-white dark:bg-[#0F172A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">Planes adaptados a sus necesidades.</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Pague sólo por el alcance normativo que su empresa requiere certificar. El valor se
              define según los módulos que habilite, así que la propuesta se arma sobre su caso.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {PLANES.map((plan) => {
              const oscuro = !!plan.oscuro;
              return (
                <div
                  key={plan.id}
                  className={[
                    "rounded-3xl p-8 transition relative flex flex-col h-full",
                    plan.destacado
                      ? "border-2 border-primary bg-white dark:bg-zinc-900 shadow-2xl md:-translate-y-4"
                      : oscuro
                        ? "border border-slate-200 dark:border-zinc-800 bg-primary text-white hover:shadow-xl"
                        : "border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:shadow-xl",
                  ].join(" ")}
                >
                  {plan.destacado && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      Más Popular
                    </div>
                  )}

                  <h3 className={`text-2xl font-bold mb-2 ${oscuro ? "" : "text-slate-900 dark:text-white"}`}>
                    {plan.nombre}
                  </h3>
                  <p className={`text-sm mb-6 ${oscuro ? "text-primary-foreground/70" : "text-slate-500"}`}>
                    {plan.bajada}
                  </p>

                  {/* Sin precio: el ancla visual es el alcance del plan. */}
                  <div className="mb-6">
                    <span className="text-3xl font-extrabold tracking-tight">{plan.alcance}</span>
                    <span className={`block text-sm mt-1 ${oscuro ? "text-primary-foreground/70" : "text-slate-500"}`}>
                      Contrato anual · valor a cotizar
                    </span>
                  </div>

                  <ul className={`space-y-4 mb-8 flex-1 ${oscuro ? "text-primary-foreground/90" : ""}`}>
                    {plan.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2
                          className={`w-5 h-5 shrink-0 mt-0.5 ${
                            oscuro ? "text-secondary" : plan.destacado ? "text-primary" : "text-secondary"
                          }`}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`mailto:ventas@auditoriasenlinea.com.ar?subject=${encodeURIComponent(
                      `Solicitud de propuesta — Plan ${plan.nombre}`
                    )}`}
                    className={[
                      "block w-full py-3 px-4 text-center font-bold rounded-xl transition",
                      plan.destacado
                        ? "bg-primary text-white hover:bg-primary/90 shadow-lg"
                        : oscuro
                          ? "bg-white text-primary hover:bg-slate-100"
                          : "bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700",
                    ].join(" ")}
                  >
                    Solicitar propuesta
                  </a>
                </div>
              );
            })}
          </div>

          {/* Condiciones de contratación: aplican por igual a los tres planes. */}
          <div className="max-w-5xl mx-auto mt-14">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 p-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 text-center">
                Cómo se contrata
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <CalendarRange className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">Ciclos de 12 meses</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      El servicio se contrata por un año completo, con renovación automática al
                      vencimiento salvo aviso previo.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Wallet className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">3 pagos</div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      El total del año dividido en tres pagos, para acompañar el flujo de caja de
                      la organización.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Percent className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                      Pago único — 15 % de descuento
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Abonando el año por adelantado en un solo pago, el total se reduce un 15 %.
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-center text-sm text-slate-500 mt-7">
                ¿No sabe qué plan le corresponde?{" "}
                <a href="mailto:ventas@auditoriasenlinea.com.ar" className="font-semibold text-primary hover:underline">
                  Escríbanos
                </a>{" "}
                y armamos la propuesta según los módulos que necesite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonios (PDF Page 8) */}
      <section id="testimonios" className="py-24 bg-slate-50 dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center text-slate-900 dark:text-white mb-16">Lo que dicen nuestros clientes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
              <div className="flex text-secondary mb-4"><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/></div>
              <p className="text-slate-600 dark:text-slate-400 italic mb-6">"Simplificamos los controles de las obras... en diferentes ubicaciones de Argentina."</p>
              <div className="font-bold text-slate-900 dark:text-white">Lara Gonzales</div>
              <div className="text-sm text-slate-500">Tetrapack</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
              <div className="flex text-secondary mb-4"><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/></div>
              <p className="text-slate-600 dark:text-slate-400 italic mb-6">"Herramienta muy útil para realizar controles a distancia y emitir reportes de forma rápida y eficiente."</p>
              <div className="font-bold text-slate-900 dark:text-white">Marianel Sanchez</div>
              <div className="text-sm text-slate-500">Constructora del Oeste S.A.</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
              <div className="flex text-secondary mb-4"><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/><Star className="w-5 h-5 fill-current"/></div>
              <p className="text-slate-600 dark:text-slate-400 italic mb-6">"Con los modelos a medida pudimos mejorar nuestro proceso, integrar al equipo fue la clave del éxito."</p>
              <div className="font-bold text-slate-900 dark:text-white">Pablo Conte</div>
              <div className="text-sm text-slate-500">Cliente Satisfecho</div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacidad y protección de datos */}
      <section id="privacidad" className="py-24 bg-white dark:bg-[#0B1120]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-bold mb-6 border border-primary/10">
              <ShieldCheck className="w-4 h-4" /> Privacidad y protección de datos
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Los datos de tu organización son tuyos.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Tratamos la información conforme a la <strong>Ley 25.326 de Protección de los Datos
              Personales</strong>. Nosotros la alojamos y procesamos por instrucción tuya: nunca la
              vendemos ni la usamos para entrenar modelos de inteligencia artificial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-50 dark:bg-zinc-900 p-7 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <Database className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Aislamiento real</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Cada organización tiene su propio espacio de base de datos y su propio repositorio
                de archivos. No es un permiso configurable: es cómo está construida la plataforma.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900 p-7 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <Mic className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Voz, solo si querés</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Las notas de voz vienen desactivadas. El modo por defecto es la nota escrita, y
                activar la transcripción requiere que un administrador acepte el aviso de
                privacidad.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900 p-7 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <MapPin className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Ubicación puntual</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                La app registra dónde se respondió un punto de control, con permiso del navegador y
                solo en ese momento. Sin seguimiento continuo, y la auditoría funciona igual si se
                deniega.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-zinc-900 p-7 rounded-2xl border border-slate-100 dark:border-zinc-800">
              <Lock className="w-8 h-8 text-primary mb-4" />
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">Acceso protegido</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Contraseñas guardadas como hash irreversible, segundo factor de autenticación
                exigible a toda la organización y comunicaciones cifradas de punta a punta.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/privacidad"
              className="inline-flex items-center gap-2 text-base font-bold text-primary hover:gap-3 transition-all"
            >
              Leer la Política de Privacidad completa <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-sm text-slate-500 mt-3">
              Incluye qué datos tratamos, con quién los compartimos y cómo ejercer tus derechos de
              acceso, rectificación y supresión.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-br from-primary to-[#00224d] py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-6">Comience su transformación hoy.</h2>
          <p className="text-xl text-primary-foreground/80 mb-10">
            "La adopción de un sistema de calidad es una decisión estratégica... que le puede ayudar a mejorar su desempeño global."
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register" className="bg-white text-primary font-bold px-8 py-4 rounded-full hover:scale-105 transition-all text-lg shadow-xl">
              Crear mi Tenant Gratis
            </Link>
            <a href="#app-campo" className="bg-transparent border border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-lg">
              Probar la app de campo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-slate-600 py-14 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="col-span-1 md:col-span-2">
            <div className="inline-flex rounded-xl bg-white p-1">
              <Image src="/logo-auditorias.png" alt="Auditorías en Línea" width={200} height={77} className="h-14 w-auto" />
            </div>
            <p className="text-sm max-w-sm text-slate-500 mt-5">Software SaaS Multitenant diseñado para centralizar Normativas ISO. Simplificamos el cumplimiento, potenciamos el talento.</p>
            <div className="flex items-center gap-2 mt-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-3 py-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" /> ISO 9001 · 14001 · 45001
              </span>
            </div>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-4">Plataforma</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="#soluciones" className="hover:text-primary transition">Soluciones</Link></li>
              <li><Link href="#app-campo" className="hover:text-primary transition">App de Campo</Link></li>
              <li><Link href="#planes" className="hover:text-primary transition">Precios</Link></li>
              <li><Link href="/login" className="hover:text-primary transition">Ingreso a Consola</Link></li>
              <li>
                <a href="/brochure-auditorias-en-linea.pdf" download className="inline-flex items-center gap-1.5 hover:text-primary transition">
                  <Download className="w-4 h-4 text-primary" /> Brochure (PDF)
                </a>
              </li>
              <li>
                <a href="/manual-auditorias-en-linea.pdf" download className="inline-flex items-center gap-1.5 hover:text-primary transition">
                  <Download className="w-4 h-4 text-primary" /> Manual de uso (PDF)
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-4">Contacto</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>
                <a href="mailto:ventas@auditoriasenlinea.com.ar" className="inline-flex items-center gap-2 hover:text-primary transition">
                  <Mail className="w-4 h-4 text-primary" /> ventas@auditoriasenlinea.com.ar
                </a>
              </li>
              <li>
                <a href="https://wa.me/5492615708516" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary transition">
                  <MessageCircle className="w-4 h-4 text-green-600" /> WhatsApp: +54 261 570-8516
                </a>
              </li>
              <li className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Mendoza, Argentina
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/privacidad" className="hover:text-primary transition">Política de Privacidad</Link></li>
              <li><Link href="/privacidad#s11" className="hover:text-primary transition">Ejercer mis derechos</Link></li>
              <li><Link href="/privacidad#s12" className="hover:text-primary transition">Cookies</Link></li>
              <li>
                <a href="mailto:privacidad@auditoriasenlinea.com.ar" className="inline-flex items-center gap-1.5 hover:text-primary transition">
                  <Mail className="w-4 h-4 text-primary" /> Contacto de privacidad
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span>&copy; {new Date().getFullYear()} Auditorías en Línea. Todos los derechos reservados.</span>
          <Link href="/privacidad" className="hover:text-primary transition">
            Política de Privacidad
          </Link>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp + asistente */}
      <WhatsAppWidget />
    </div>
  );
}
