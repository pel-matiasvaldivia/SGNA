"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Presentation,
  Building2,
  ArrowRight,
} from "lucide-react";
import { SceneAssign, SceneBoard, ScenePlatform } from "./carousel-scenes";

/**
 * Carrusel del hero, estilo editorial "full-bleed".
 * Cada slide muestra una escena ilustrada (orgánica, vectorial) que representa
 * un momento real de uso del sistema, con un título orientado a beneficio.
 *
 * Listo para fotos generadas con IA: si existe el archivo indicado en `image`
 * dentro de /public, se muestra por encima de la ilustración automáticamente.
 * (Ej.: colocá /public/carousel/asignacion.jpg y aparecerá sin tocar código.)
 */

interface Slide {
  id: string;
  tag: string;
  title: string;
  desc: string;
  accent: string;
  Icon: React.ComponentType<{ className?: string }>;
  Scene: React.ComponentType;
  image: string; // ruta opcional de foto IA (si el archivo existe, se usa)
}

const SLIDES: Slide[] = [
  {
    id: "asignacion",
    tag: "Del líder al terreno",
    title: "El auditor líder asigna, el auditor de campo ejecuta",
    desc: "El líder distribuye las auditorías con un clic y cada auditor recibe su checklist listo para ejecutar en sitio, incluso sin conexión.",
    accent: "#003F87",
    Icon: ClipboardList,
    Scene: SceneAssign,
    image: "/carousel/asignacion.jpg",
  },
  {
    id: "direccion",
    tag: "Resultados para decidir",
    title: "Reportes que la alta dirección entiende",
    desc: "El líder presenta hallazgos, indicadores y avance de la certificación ante la dirección, con datos en tiempo real y reportes claros.",
    accent: "#007BFF",
    Icon: Presentation,
    Scene: SceneBoard,
    image: "/carousel/direccion.jpg",
  },
  {
    id: "plataforma",
    tag: "Para cualquier empresa",
    title: "Se adapta a tu industria y nivel de madurez",
    desc: "Pymes o corporaciones, industria, salud, construcción o servicios: una plataforma que crece con tu Sistema de Gestión.",
    accent: "#2E7D32",
    Icon: Building2,
    Scene: ScenePlatform,
    image: "/carousel/plataforma.jpg",
  },
];

export default function HeroCarousel() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const n = SLIDES.length;

  const go = useCallback((i: number) => setIdx(((i % n) + n) % n), [n]);
  const next = useCallback(() => setIdx((p) => (p + 1) % n), [n]);
  const prev = useCallback(() => setIdx((p) => (p - 1 + n) % n), [n]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx((p) => (p + 1) % n), 6500);
    return () => clearInterval(t);
  }, [paused, n]);

  return (
    <div
      className="rounded-2xl border border-slate-200/60 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl p-2 shadow-2xl select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative rounded-xl overflow-hidden aspect-video">
        {SLIDES.map((s, i) => {
          const Scene = s.Scene;
          const hasPhoto = loaded[s.id];
          return (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-out ${
                i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              aria-hidden={i !== idx}
            >
              {/* Escena ilustrada (base) */}
              <div className="absolute inset-0">
                <Scene />
              </div>

              {/* Foto IA opcional: si el archivo existe, se superpone con un fundido */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image}
                alt=""
                onLoad={() => setLoaded((l) => ({ ...l, [s.id]: true }))}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                  hasPhoto ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* Velo para legibilidad (más fuerte si hay foto) */}
              <div
                className="absolute inset-0"
                style={{
                  background: hasPhoto
                    ? "linear-gradient(90deg, rgba(2,6,23,0.72) 0%, rgba(2,6,23,0.35) 45%, rgba(2,6,23,0) 75%)"
                    : "linear-gradient(90deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 55%)",
                }}
              />

              {/* Tarjeta de texto (frosted) */}
              <div className="absolute inset-y-0 left-0 flex items-center">
                <div className="m-5 sm:m-8 max-w-[62%] sm:max-w-[52%]">
                  <div
                    className={`rounded-2xl p-4 sm:p-6 ${
                      hasPhoto
                        ? "bg-black/30 backdrop-blur-md ring-1 ring-white/10"
                        : "bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md ring-1 ring-white/40 dark:ring-white/10"
                    }`}
                  >
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wide mb-2.5"
                      style={{
                        color: hasPhoto ? "#fff" : s.accent,
                        backgroundColor: hasPhoto ? `${s.accent}` : `${s.accent}18`,
                      }}
                    >
                      <s.Icon className="w-3.5 h-3.5" /> {s.tag}
                    </span>
                    <h3
                      className={`text-lg sm:text-2xl lg:text-3xl font-bold leading-tight font-heading ${
                        hasPhoto ? "text-white" : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {s.title}
                    </h3>
                    <p
                      className={`text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed ${
                        hasPhoto ? "text-white/85" : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {s.desc}
                    </p>
                    <a
                      href="#app-campo"
                      className="inline-flex items-center gap-1.5 mt-3 sm:mt-4 text-xs sm:text-sm font-bold transition hover:gap-2.5"
                      style={{ color: hasPhoto ? "#fff" : s.accent }}
                    >
                      Ver cómo funciona <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Flechas */}
        <button
          onClick={prev}
          aria-label="Anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 dark:bg-zinc-800/85 backdrop-blur shadow-md flex items-center justify-center text-slate-700 dark:text-slate-100 hover:bg-white hover:scale-110 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          aria-label="Siguiente"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 dark:bg-zinc-800/85 backdrop-blur shadow-md flex items-center justify-center text-slate-700 dark:text-slate-100 hover:bg-white hover:scale-110 transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Puntos con barra de progreso */}
      <div className="flex items-center justify-center gap-2 py-3">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => go(i)}
            aria-label={`Ir al slide ${i + 1}`}
            className="relative h-2 rounded-full transition-all duration-300 overflow-hidden"
            style={{
              width: i === idx ? 34 : 8,
              backgroundColor: i === idx ? undefined : "rgb(203 213 225)",
            }}
          >
            {i === idx && (
              <span className="absolute inset-0 rounded-full" style={{ backgroundColor: s.accent }}>
                <span
                  key={`${idx}-${paused}`}
                  className="absolute inset-y-0 left-0 rounded-full bg-white/45"
                  style={{ animation: paused ? "none" : "carouselFill 6.5s linear forwards" }}
                />
              </span>
            )}
          </button>
        ))}
      </div>

      <style>{`@keyframes carouselFill { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}
