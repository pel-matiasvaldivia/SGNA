"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, BarChart3, Users, Leaf, CheckCircle2, Star, Sparkles, BrainCircuit, MonitorSmartphone, Settings, Smartphone, WifiOff, RefreshCw, Camera, MapPin, PenLine, CloudLightning, ListChecks, AlertOctagon, FileText, Wifi, Signal } from "lucide-react";

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
            <a href="#app-campo" className="hover:text-primary transition">App de Campo</a>
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
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-2"><WifiOff className="w-4 h-4 text-primary" /> Auditorías sin conexión</span>
            <span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4 text-primary" /> Sincronización automática</span>
            <span className="inline-flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" /> App en el celular</span>
          </div>
        </div>

        {/* Mockup Image */}
        <div className="mt-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="rounded-2xl border border-slate-200/50 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl p-2 shadow-2xl">
            <div className="rounded-xl overflow-hidden bg-slate-100 aspect-video relative flex items-center justify-center border border-slate-100">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5"></div>
              <div className="text-center p-8">
                <BrainCircuit className="w-20 h-20 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-slate-800">Software de Gestión Inteligente</h3>
                <p className="text-slate-500 mt-2">Tableros ISO 9001, 14001, 45001 y Analítica Predictiva</p>
              </div>
            </div>
          </div>
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
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Phone mockup */}
            <div className="lg:w-2/5 flex justify-center">
              <div className="relative">
                {/* Floating "sin conexión" pill */}
                <div className="absolute -top-4 -left-8 z-20 hidden sm:flex items-center gap-2 rounded-full bg-amber-500 text-amber-950 pl-3 pr-4 py-2 shadow-xl text-xs font-bold animate-pulse">
                  <WifiOff className="w-4 h-4" /> Sin conexión · 3 sin enviar
                </div>
                {/* Floating "sincronizado" pill */}
                <div className="absolute -bottom-4 -right-8 z-20 hidden sm:flex items-center gap-2 rounded-full bg-green-600 text-white pl-3 pr-4 py-2 shadow-xl text-xs font-bold">
                  <RefreshCw className="w-4 h-4" /> Todo sincronizado
                </div>

                {/* Phone frame */}
                <div className="relative w-[280px] h-[570px] rounded-[2.8rem] bg-slate-900 dark:bg-black p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-black/5">
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-slate-900 dark:bg-black rounded-b-2xl z-10"></div>
                  <div className="w-full h-full rounded-[2rem] bg-slate-50 overflow-hidden flex flex-col">
                    {/* App header */}
                    <div className="bg-primary text-white px-4 pt-8 pb-4">
                      <div className="flex items-center justify-between text-[10px] text-white/70 mb-3">
                        <span>9:41</span>
                        <span className="flex items-center gap-1"><Signal className="w-3 h-3" /><WifiOff className="w-3 h-3" /></span>
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-white/70 font-bold">Auditoría de campo</p>
                      <h3 className="text-base font-bold leading-tight">Depósito Central · ISO 45001</h3>
                      <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
                        <div className="h-full w-2/3 bg-white rounded-full"></div>
                      </div>
                      <p className="text-[10px] text-white/70 mt-1">8 de 12 controles</p>
                    </div>
                    {/* Checklist items */}
                    <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
                      <div className="bg-white rounded-xl border border-green-200 p-3 shadow-sm">
                        <p className="text-[9px] font-mono font-bold text-primary uppercase">8.1.2 EPP</p>
                        <p className="text-[11px] text-slate-700 leading-snug mt-0.5">¿El personal usa protección adecuada?</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-green-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Conforme
                          <span className="ml-auto flex items-center gap-1 text-slate-400"><Camera className="w-3 h-3" /><MapPin className="w-3 h-3" /></span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-red-200 p-3 shadow-sm">
                        <p className="text-[9px] font-mono font-bold text-primary uppercase">6.1.1 Riesgos</p>
                        <p className="text-[11px] text-slate-700 leading-snug mt-0.5">¿Señalización de emergencia visible?</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[9px] font-bold text-red-600">
                          <AlertOctagon className="w-3.5 h-3.5" /> No conforme → NC
                          <span className="ml-auto flex items-center gap-1 text-slate-400"><Camera className="w-3 h-3" /></span>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm opacity-70">
                        <p className="text-[9px] font-mono font-bold text-primary uppercase">7.2.1 Competencia</p>
                        <p className="text-[11px] text-slate-700 leading-snug mt-0.5">¿Registros de capacitación al día?</p>
                        <div className="flex gap-1.5 mt-2">
                          <span className="text-[8px] font-bold text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">Conforme</span>
                          <span className="text-[8px] font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">No conf.</span>
                          <span className="text-[8px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">N/A</span>
                        </div>
                      </div>
                    </div>
                    {/* Sign button */}
                    <div className="p-3 border-t border-slate-200 bg-white">
                      <div className="w-full bg-secondary text-white text-[11px] font-bold rounded-lg py-2.5 flex items-center justify-center gap-1.5">
                        <PenLine className="w-3.5 h-3.5" /> Firmar y cerrar auditoría
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
            <p className="text-lg text-slate-600 dark:text-slate-400">Pague sólo por el alcance normativo que su empresa requiere certificar.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Basico */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 bg-white dark:bg-zinc-900 hover:shadow-xl transition">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Básico</h3>
              <p className="text-slate-500 text-sm mb-6">Para pymes comenzando su certificación.</p>
              <div className="mb-6"><span className="text-4xl font-extrabold">USD 99</span><span className="text-slate-500"> /mes</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-secondary" /> 1 Auditoría Anual</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-secondary" /> 1 Modelo ISO (9001)</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-secondary" /> 10GB Almacenamiento (DMS)</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-secondary" /> Actualizaciones automáticas</li>
              </ul>
              <Link href="/register" className="block w-full py-3 px-4 bg-slate-100 dark:bg-zinc-800 text-center font-bold rounded-xl hover:bg-slate-200 transition">Comenzar</Link>
            </div>

            {/* Standard */}
            <div className="border-2 border-primary rounded-3xl p-8 bg-white dark:bg-zinc-900 shadow-2xl relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Más Popular</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Standard</h3>
              <p className="text-slate-500 text-sm mb-6">Cobertura integral de calidad y ambiente.</p>
              <div className="mb-6"><span className="text-4xl font-extrabold">USD 249</span><span className="text-slate-500"> /mes</span></div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> 2 Auditorías Anuales</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> ISO 9001 + ISO 14001</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> Módulo de Huella de Carbono</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary" /> 50GB Almacenamiento</li>
              </ul>
              <Link href="/register" className="block w-full py-3 px-4 bg-primary text-white text-center font-bold rounded-xl hover:bg-primary/90 transition shadow-lg">Comenzar Prueba</Link>
            </div>

            {/* Personalizado */}
            <div className="border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 bg-primary text-white hover:shadow-xl transition">
              <h3 className="text-2xl font-bold mb-2">Personalizado</h3>
              <p className="text-primary-foreground/70 text-sm mb-6">El Ecosistema SGI Total B2B.</p>
              <div className="mb-6"><span className="text-4xl font-extrabold">A Medida</span></div>
              <ul className="space-y-4 mb-8 text-primary-foreground/90">
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-secondary" /> Módulos ISO 9001, 14001, 45001</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-secondary" /> AI Auditor Copilot Integrado</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-secondary" /> Informes OPM & CMMS Activos</li>
                <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-secondary" /> 500GB Almacenamiento MinIO</li>
              </ul>
              <a href="mailto:gerencia@auditoriasenlinea.com.ar" className="block w-full py-3 px-4 bg-white text-primary text-center font-bold rounded-xl hover:bg-slate-100 transition">Contactar Ventas</a>
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
            <a href="mailto:gerencia@auditoriasenlinea.com.ar" className="bg-transparent border border-white/30 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-colors text-lg">
              Agendar Auditoría de Prueba
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-slate-600 py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Image src="/logo-auditorias.png" alt="Auditorías en Línea" width={180} height={69} className="mb-5 h-12 w-auto" />
            <p className="text-sm max-w-sm text-slate-500">Software SaaS Multitenant diseñado para centralizar Normativas ISO. Simplificamos el cumplimiento, potenciamos el talento.</p>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#soluciones" className="hover:text-primary transition">Soluciones</Link></li>
              <li><Link href="#planes" className="hover:text-primary transition">Precios</Link></li>
              <li><Link href="/login" className="hover:text-primary transition">Ingreso a Consola</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-slate-900 font-bold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Matias Valdivia</li>
              <li>gerencia@auditoriasenlinea.com.ar</li>
              <li>Cel: +54 9 261 610-7652</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-200 text-sm text-center text-slate-400">
          &copy; {new Date().getFullYear()} Auditorías en Línea. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
