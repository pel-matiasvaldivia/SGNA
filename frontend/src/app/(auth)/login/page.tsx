"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldCheck, Leaf, Cpu } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"login" | "2fa">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requires_2fa) {
          setStep("2fa");
        } else {
          // Bypass 2FA, trigger immediate login using 'BYPASS' code
          const result = await signIn("credentials", {
            email,
            code: "BYPASS",
            redirect: false,
          });

          if (result?.error) {
            setError("Error al iniciar sesión de forma directa.");
          } else {
            router.push("/");
          }
        }
      } else {
        setError(data.detail || "Error al iniciar sesión. Intente nuevamente.");
      }
    } catch (err) {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        code,
        redirect: false,
      });

      if (result?.error) {
        setError("Código de verificación inválido o vencido.");
      } else {
        router.push("/");
      }
    } catch (err) {
      setError("Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-muted/20 text-surface-foreground font-sans">
      {/* Brand & Value Prop Presentation Left Side */}
      <div className="hidden lg:flex lg:col-span-7 bg-primary text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative vector background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="relative z-10 space-y-4">
          <span className="bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full">
            AuditoríasEnLínea
          </span>
          <h2 className="text-4xl md:text-5xl font-heading font-bold leading-tight">
            Gestión Inteligente de Calidad, Normas ISO & Medio Ambiente
          </h2>
          <p className="text-primary-foreground/80 max-w-xl text-lg">
            La plataforma SaaS multitenante líder para el cumplimiento normativo impulsada por agentes inteligentes de IA.
          </p>
        </div>

        {/* Value pillars */}
        <div className="relative z-10 space-y-6 my-8">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Garantía ISO Certificable</h3>
              <p className="text-primary-foreground/75 text-sm">ISO 9001, 14001, 45001 y 27001 con flujos optimizados de control documental.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Leaf className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Huella de Carbono (GHG Protocol)</h3>
              <p className="text-primary-foreground/75 text-sm">Cálculo automatizado de emisiones Alcance 1, 2 y 3 con factores certificados.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 bg-white/10 rounded-lg">
              <Cpu className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Agentes de IA Conectables (MCP)</h3>
              <p className="text-primary-foreground/75 text-sm">Consultores ISO, generadores documentales y calculadoras de emisiones a su servicio.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} AuditoríasEnLínea. Todos los derechos reservados.
        </div>
      </div>

      {/* Auth Box Right Side */}
      <div className="lg:col-span-5 flex flex-col justify-center px-6 py-12 md:px-16 bg-white dark:bg-zinc-950 border-l border-border shadow-2xl relative z-10">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          {/* Logo Placeholder */}
          <div className="flex flex-col items-center lg:items-start">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <span className="text-primary font-bold text-xl tracking-tight">AeL</span>
            </div>
            <h1 className="text-2xl font-bold font-heading">
              {step === "login" ? "Ingresar a la Plataforma" : "Verificación de Seguridad"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 text-center lg:text-left">
              {step === "login"
                ? "Gestión de cumplimiento y huella de carbono para su organización"
                : `Hemos enviado un código temporal de 6 dígitos a su correo`}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {step === "login" ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-muted/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  placeholder="usuario@empresa.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-border bg-muted/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition"
              >
                {loading ? "Verificando..." : "Siguiente"}
              </button>
            </form>
          ) : (
            <form onSubmit={handle2FASubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Código 2FA de 6 Dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full text-center tracking-widest text-2xl font-bold px-4 py-3 rounded-lg border border-border bg-muted/10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
                  placeholder="000000"
                  required
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setStep("login")}
                  className="text-primary hover:underline font-semibold"
                >
                  ← Volver
                </button>
                <span className="text-muted-foreground">Válido por 10 minutos</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-secondary text-primary-foreground font-semibold rounded-lg hover:bg-secondary/95 focus:outline-none focus:ring-2 focus:ring-secondary/50 disabled:opacity-50 transition"
              >
                {loading ? "Validando..." : "Ingresar"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
