"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Rocket, Compass, LayoutDashboard, ChevronRight, ChevronLeft, X,
  CheckCircle2, ArrowRight, Settings, HelpCircle,
} from "lucide-react";
import { PHASES, MODULE_BY_KEY } from "@/lib/modules-info";

const STORAGE_PREFIX = "sgna_onboarding_done_v1:";

/** Fired (window event) to replay the tour on demand, e.g. from the Help center. */
export const START_TOUR_EVENT = "sgna:start-tour";

export default function OnboardingTour() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email || "";
  const storageKey = STORAGE_PREFIX + email;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  // Auto-open on first visit (once we know who the user is).
  useEffect(() => {
    if (status !== "authenticated" || !email) return;
    try {
      if (!localStorage.getItem(storageKey)) {
        setStep(0);
        setOpen(true);
      }
    } catch {
      /* localStorage unavailable — skip auto-open */
    }
  }, [status, email, storageKey]);

  // Allow replaying the tour on demand.
  useEffect(() => {
    const handler = () => { setStep(0); setOpen(true); };
    window.addEventListener(START_TOUR_EVENT, handler);
    return () => window.removeEventListener(START_TOUR_EVENT, handler);
  }, []);

  const finish = () => {
    try { localStorage.setItem(storageKey, new Date().toISOString()); } catch {}
    setOpen(false);
  };

  const goTo = (path: string) => { finish(); router.push(path); };

  if (!open) return null;

  const steps = [
    // 0 — Welcome
    {
      icon: Rocket,
      title: "¡Bienvenido a AuditoríasEnLínea!",
      body: (
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Tu espacio ya está aprovisionado de forma aislada y segura. Esta plataforma te acompaña
            a construir y mantener tu Sistema de Gestión Integrado (ISO 9001, 14001, 45001) de punta a punta.
          </p>
          <p>
            Este recorrido de 1 minuto te muestra <strong>cómo está organizada</strong> y por dónde empezar.
            Podés volver a verlo cuando quieras desde el <strong>Centro de Ayuda</strong>.
          </p>
        </div>
      ),
    },
    // 1 — Modules overview (informative)
    {
      icon: Compass,
      title: "Los módulos disponibles",
      body: (
        <div className="space-y-3 max-h-[46vh] overflow-y-auto pr-1">
          {PHASES.map((phase) => (
            <div key={phase.title} className="rounded-xl border border-border p-3 bg-muted/20">
              <div className="font-bold text-sm">{phase.title}</div>
              <div className="text-xs text-muted-foreground mb-2">{phase.summary}</div>
              <div className="flex flex-wrap gap-1.5">
                {phase.moduleKeys.map((k) => {
                  const m = MODULE_BY_KEY[k];
                  if (!m) return null;
                  const Icon = m.icon;
                  return (
                    <span key={k} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-background border border-border rounded-full px-2 py-1">
                      <Icon className="w-3 h-3 text-secondary" /> {m.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    // 2 — Tour of main windows
    {
      icon: LayoutDashboard,
      title: "Las ventanas principales",
      body: (
        <div className="space-y-3 text-sm">
          <TourRow icon={Compass} title="Menú lateral" text="Navegás entre los módulos del SGI. Están ordenados siguiendo el flujo de trabajo, de arriba hacia abajo." />
          <TourRow icon={LayoutDashboard} title="Inicio" text="Tu tablero: documentos, aprobaciones pendientes y no conformidades activas de un vistazo." />
          <TourRow icon={Settings} title="Configuración Tenant" text="(Rol admin) Invitás usuarios, configurás tu servidor SMTP y el 2FA de tu organización." />
          <TourRow icon={HelpCircle} title="Centro de Ayuda" text="La explicación de cada módulo, cómo usarlo y recomendaciones. Siempre disponible en el menú." />
        </div>
      ),
    },
    // 3 — First steps
    {
      icon: CheckCircle2,
      title: "Primeros pasos recomendados",
      body: (
        <div className="space-y-2">
          <FirstStep n={1} title="Definí tu Contexto" text="Cargá FODA, partes interesadas y el alcance del SGI." onClick={() => goTo("/dashboard/contexto")} />
          <FirstStep n={2} title="Hacé un Diagnóstico" text="Medí tu nivel de cumplimiento inicial contra la norma." onClick={() => goTo("/dashboard/diagnosticos")} />
          <FirstStep n={3} title="Invitá a tu equipo" text="Sumá usuarios y asigná roles desde Configuración Tenant." onClick={() => goTo("/dashboard/settings")} />
          <FirstStep n={4} title="Explorá la Ayuda" text="Consultá el detalle y las recomendaciones de cada módulo." onClick={() => goTo("/dashboard/ayuda")} />
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center">
              <Icon className="w-5 h-5 text-secondary" />
            </div>
            <h3 className="font-bold text-base">{current.title}</h3>
          </div>
          <button onClick={finish} title="Cerrar" className="p-1.5 hover:bg-muted rounded-full transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">{current.body}</div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/10">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-secondary" : "w-1.5 bg-border"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
            )}
            {!isLast ? (
              <>
                <button onClick={finish} className="text-sm font-semibold text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg transition">
                  Omitir
                </button>
                <button onClick={() => setStep((s) => s + 1)} className="inline-flex items-center gap-1 bg-secondary text-white font-bold px-5 py-2 rounded-lg text-sm hover:opacity-95 transition">
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button onClick={finish} className="inline-flex items-center gap-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm hover:opacity-90 transition">
                Empezar <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TourRow({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border p-3">
      <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-secondary" />
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}

function FirstStep({ n, title, text, onClick }: { n: number; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 rounded-xl border border-border p-3 text-left hover:bg-muted/30 hover:border-secondary/40 transition group">
      <div className="w-7 h-7 rounded-full bg-secondary text-white font-bold text-xs flex items-center justify-center flex-shrink-0">{n}</div>
      <div className="flex-1">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{text}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-secondary transition" />
    </button>
  );
}
