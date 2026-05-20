"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, BarChart3, Users, Leaf, CheckCircle2, Star, Sparkles, BrainCircuit, MonitorSmartphone, Settings } from "lucide-react";

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
            <div className="relative w-40 h-10">
              <Image src="/logo.png" alt="Auditorías en Línea" fill className="object-contain object-left" priority />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#soluciones" className="hover:text-primary transition">Soluciones SGI</a>
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
      <footer className="bg-slate-900 dark:bg-zinc-950 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Image src="/logo-iso.png" alt="Logo" width={150} height={40} className="mb-6 opacity-80 hover:opacity-100 transition" />
            <p className="text-sm max-w-sm">Software SaaS Multitenant diseñado para centralizar Normativas ISO. Simplificamos el cumplimiento, potenciamos el talento.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#soluciones" className="hover:text-white transition">Soluciones</Link></li>
              <li><Link href="#planes" className="hover:text-white transition">Precios</Link></li>
              <li><Link href="/login" className="hover:text-white transition">Ingreso a Consola</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm">
              <li>Matias Valdivia</li>
              <li>gerencia@auditoriasenlinea.com.ar</li>
              <li>Cel: +54 9 261 610-7652</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-sm text-center">
          &copy; {new Date().getFullYear()} Auditorías en Línea. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
