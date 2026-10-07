"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";

// Mismo mínimo que valida el backend (app/schemas/auth.py: PASSWORD_MIN_LEN).
const MIN_LARGO = 8;

/**
 * Canje del enlace de recuperación por una contraseña nueva.
 *
 * El enlace se consulta antes de mostrar el formulario: si venció o ya se usó,
 * no tiene sentido hacer que la persona elija una contraseña para después
 * rechazarla. Es un solo uso, así que al terminar vuelve al login.
 */
function FormularioRestablecer() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const api = process.env.NEXT_PUBLIC_API_URL || "";

  const [verificando, setVerificando] = useState(true);
  const [valido, setValido] = useState(false);
  const [motivo, setMotivo] = useState<string | null>(null);
  const [emailParcial, setEmailParcial] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState("");

  const verificar = useCallback(async () => {
    if (!token) {
      setVerificando(false);
      setValido(false);
      setMotivo("El enlace está incompleto. Abrilo tal como llegó en el correo.");
      return;
    }
    try {
      const res = await fetch(
        `${api}/api/v1/auth/restablecer-password?token=${encodeURIComponent(token)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.valido) {
        setValido(true);
        setEmailParcial(data.email_parcial || null);
      } else {
        setValido(false);
        setMotivo(data.motivo || "El enlace no es válido o venció. Pedí uno nuevo.");
      }
    } catch {
      setValido(false);
      setMotivo("No se pudo verificar el enlace. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setVerificando(false);
    }
  }, [api, token]);

  useEffect(() => {
    verificar();
  }, [verificar]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < MIN_LARGO) {
      setError(`La contraseña tiene que tener al menos ${MIN_LARGO} caracteres.`);
      return;
    }
    if (password !== repetir) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`${api}/api/v1/auth/restablecer-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setListo(true);
      } else {
        setError(data.detail || "No se pudo cambiar la contraseña. Pedí un enlace nuevo.");
      }
    } catch {
      setError("No se pudo conectar con el servidor. Revisá tu conexión.");
    } finally {
      setGuardando(false);
    }
  };

  if (verificando) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">Verificando el enlace...</p>
      </div>
    );
  }

  if (listo) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-xl bg-green-100 dark:bg-green-950/40 flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold font-heading">Contraseña cambiada</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ya podés ingresar a la plataforma con la contraseña nueva.
          </p>
        </div>
        <Link
          href="/login"
          className="block w-full text-center py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition"
        >
          Ingresar
        </Link>
      </div>
    );
  }

  if (!valido) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-xl font-bold font-heading">El enlace no sirve</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{motivo}</p>
        </div>
        <Link
          href="/recuperar"
          className="block w-full text-center py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 transition"
        >
          Pedir un enlace nuevo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
          <LockKeyhole className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-xl font-bold font-heading">Elegí tu contraseña nueva</h1>
        {emailParcial && (
          <p className="text-sm text-muted-foreground mt-1">
            Para la cuenta <strong className="text-foreground">{emailParcial}</strong>
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={guardar} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
            Contraseña nueva
          </label>
          <div className="relative">
            <input
              id="password"
              type={verClave ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-muted/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
              placeholder="••••••••"
              minLength={MIN_LARGO}
              required
            />
            <button
              type="button"
              onClick={() => setVerClave((v) => !v)}
              aria-label={verClave ? "Ocultar la contraseña" : "Mostrar la contraseña"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              {verClave ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Al menos {MIN_LARGO} caracteres. Evitá la que ya usás en otros servicios.
          </p>
        </div>

        <div>
          <label htmlFor="repetir" className="block text-sm font-semibold text-foreground mb-2">
            Repetir la contraseña
          </label>
          <input
            id="repetir"
            type={verClave ? "text" : "password"}
            autoComplete="new-password"
            value={repetir}
            onChange={(e) => setRepetir(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-muted/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            placeholder="••••••••"
            minLength={MIN_LARGO}
            required
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition"
        >
          {guardando ? "Guardando..." : "Cambiar mi contraseña"}
        </button>
      </form>
    </div>
  );
}

export default function RestablecerPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-muted/20 px-6 py-12 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-border rounded-2xl shadow-xl p-8 space-y-6">
        <div className="flex justify-center">
          <img src="/logo-auditorias.png" alt="Auditorías en Línea" className="h-16 w-auto object-contain" />
        </div>

        {/* useSearchParams necesita un límite de Suspense para que la página
            pueda prerenderizarse (Next 15). */}
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-sm">Cargando...</p>
            </div>
          }
        >
          <FormularioRestablecer />
        </Suspense>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a ingresar
        </Link>
      </div>
    </div>
  );
}
