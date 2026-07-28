"use client";

import { useEffect } from "react";

/**
 * Registra el Service Worker para habilitar la PWA (instalación + offline).
 * No renderiza nada. Se monta una vez en el layout del dashboard.
 */
export default function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Evitar registro en entorno de desarrollo con HMR.
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* el registro puede fallar en contextos no seguros; se ignora */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register);

    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
