"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Save, Building, Users, Image, Settings } from "lucide-react";

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleComplete = () => {
    setLoading(true);
    // In a real app, save the settings to the backend
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-border rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        <div className="flex">
          {/* Sidebar steps */}
          <div className="w-1/3 bg-muted/30 p-6 border-r border-border hidden sm:block">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-6">Setup Inicial</h3>
            <ul className="space-y-4">
              {[
                { id: 1, label: "Bienvenida", icon: Building },
                { id: 2, label: "Personalización", icon: Image },
                { id: 3, label: "Ajustes Regionales", icon: Settings },
                { id: 4, label: "Roles Base", icon: Users },
                { id: 5, label: "¡Listo!", icon: CheckCircle2 }
              ].map(s => (
                <li key={s.id} className={`flex items-center gap-3 text-sm font-semibold transition ${step === s.id ? 'text-secondary' : step > s.id ? 'text-green-600' : 'text-muted-foreground'}`}>
                  <s.icon className="w-4 h-4" /> {s.label}
                </li>
              ))}
            </ul>
          </div>

          {/* Content */}
          <div className="w-full sm:w-2/3 p-8">
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                  <Building className="w-6 h-6 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold">¡Bienvenido a tu Espacio!</h2>
                <p className="text-muted-foreground">Hemos aprovisionado tu base de datos de manera aislada y segura. Durante los próximos pasos, configuraremos las preferencias básicas de tu Sistema de Gestión.</p>
                <button onClick={() => setStep(2)} className="bg-secondary text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2 mt-8">
                  Comenzar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold flex items-center gap-2"><Image className="w-5 h-5 text-secondary" /> Identidad Visual</h2>
                <p className="text-sm text-muted-foreground">Sube el logo de tu empresa. Este aparecerá en todos los reportes PDF y en el menú principal.</p>
                <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-muted-foreground cursor-pointer hover:bg-muted/50 transition">
                  <Image className="w-8 h-8 mb-2" />
                  <span className="font-semibold text-sm">Haz clic para subir un logo</span>
                  <span className="text-xs mt-1">PNG o JPG (Max 2MB)</span>
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(1)} className="text-sm font-bold text-muted-foreground">Volver</button>
                  <button onClick={() => setStep(3)} className="bg-secondary text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2">
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-secondary" /> Ajustes Regionales</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Zona Horaria</label>
                    <select className="w-full p-2 border rounded-lg bg-background text-sm">
                      <option>America/Argentina/Buenos_Aires</option>
                      <option>America/Santiago</option>
                      <option>America/Bogota</option>
                      <option>America/Mexico_City</option>
                      <option>Europe/Madrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Formato de Fecha</label>
                    <select className="w-full p-2 border rounded-lg bg-background text-sm">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(2)} className="text-sm font-bold text-muted-foreground">Volver</button>
                  <button onClick={() => setStep(4)} className="bg-secondary text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2">
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5 text-secondary" /> Configuración de Roles</h2>
                <p className="text-sm text-muted-foreground">El sistema requiere ciertos procesos base. Hemos generado los siguientes permisos por defecto para tu Tenant.</p>
                <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border">
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-green-500" /> <span className="text-sm font-bold">Auditor Líder (Permisos de Lectura Global)</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-green-500" /> <span className="text-sm font-bold">Empleado (Lectura de Procedimientos)</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-green-500" /> <span className="text-sm font-bold">Aprobador (Lectura y Firma DMS)</span></div>
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={() => setStep(3)} className="text-sm font-bold text-muted-foreground">Volver</button>
                  <button onClick={() => setStep(5)} className="bg-secondary text-white font-bold px-6 py-2.5 rounded-lg flex items-center gap-2">
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-6 animate-fade-in text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold">¡Todo configurado!</h2>
                <p className="text-sm text-muted-foreground">Ya puedes invitar a tu equipo y comenzar a certificar tus procesos.</p>
                <button onClick={handleComplete} disabled={loading} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold px-6 py-3 rounded-xl flex justify-center items-center gap-2 mt-4">
                  {loading ? 'Redirigiendo...' : 'Ir al Dashboard'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
