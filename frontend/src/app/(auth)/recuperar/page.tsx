"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";

/**
 * "Olvidé mi contraseña": pide el enlace de recuperación.
 *
 * El backend responde siempre lo mismo, exista o no la cuenta, así que esta
 * pantalla tampoco puede decir "ese correo no está registrado": sería una
 * manera de averiguar quién trabaja en la plataforma desde un formulario
 * público. Por eso al enviar se muestra el mismo acuse en todos los casos.
 */
export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pedirEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auth/recuperar-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEnviado(data.message || "Si el correo corresponde a una cuenta activa, te enviamos un enlace.");
      } else {
        setError(data.detail || "No se pudo procesar el pedido. Intentá de nuevo.");
      }
    } catch {
      setError("No se pudo conectar con el servidor. Revisá tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-muted/20 px-6 py-12 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-border rounded-2xl shadow-xl p-8 space-y-6">
        <div className="flex flex-col items-center text-center">
          <img src="/logo-auditorias.png" alt="Auditorías en Línea" className="h-16 w-auto object-contain mb-3" />
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            {enviado ? <MailCheck className="w-6 h-6 text-primary" /> : <KeyRound className="w-6 h-6 text-primary" />}
          </div>
          <h1 className="text-xl font-bold font-heading">
            {enviado ? "Revisá tu correo" : "Recuperar contraseña"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {enviado
              ? "El enlace llega al correo de tu cuenta."
              : "Te enviamos un enlace al correo de tu cuenta para que elijas una contraseña nueva."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {enviado ? (
          <>
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-400 p-4 rounded-lg text-sm leading-relaxed">
              {enviado}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Si trabajás en planta y no tenés el correo a mano en el celular, pedile
              a un administrador de tu organización que te genere el acceso desde
              <strong> Configuración → Usuarios</strong>.
            </p>
          </>
        ) : (
          <form onSubmit={pedirEnlace} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-border bg-muted/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                placeholder="usuario@empresa.com"
                required
              />
              <p className="text-xs text-muted-foreground mt-2">
                Usá el mismo correo con el que ingresás a la plataforma.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition"
            >
              {loading ? "Enviando..." : "Enviarme el enlace"}
            </button>
          </form>
        )}

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
