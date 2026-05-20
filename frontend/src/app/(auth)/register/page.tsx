"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Building, User, Lock, Mail, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [empresa, setEmpresa] = useState("");
  const [cuit, setCuit] = useState("");
  const [sector, setSector] = useState("Tecnología");
  const [normas, setNormas] = useState<string[]>(["ISO 9001"]);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleNormaToggle = (norma: string) => {
    if (normas.includes(norma)) {
      setNormas(normas.filter(n => n !== norma));
    } else {
      setNormas([...normas, norma]);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/onboarding/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa_nombre: empresa,
          cuit_rut: cuit,
          sector: sector,
          normas: normas,
          admin_email: adminEmail,
          admin_password: adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error en el registro");

      // Redirect to login with tenant slug
      router.push(data.login_url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 font-sans text-zinc-100">
      {/* Background gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary/20 rounded-full blur-[100px]" />

      <div className="w-full max-w-xl z-10">
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-secondary shadow-xl mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold font-heading mb-2 text-white">Únete a AuditoríasEnLínea</h1>
          <p className="text-zinc-400">Digitaliza tu Sistema de Gestión Integrado en minutos.</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-slide-up relative overflow-hidden">
          {/* Progress bar */}
          <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
            <div className={`h-full bg-secondary transition-all duration-500 ease-in-out`} style={{ width: `${(step / 3) * 100}%` }}></div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-950/50 border border-red-900/50 rounded-xl text-red-200 text-sm font-medium">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><Building className="text-secondary w-5 h-5" /> 1. Datos de la Empresa</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Nombre de la Empresa</label>
                  <input type="text" value={empresa} onChange={e => setEmpresa(e.target.value)} placeholder="Ej: TechCorp S.A." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary transition outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">CUIT / RUT</label>
                  <input type="text" value={cuit} onChange={e => setCuit(e.target.value)} placeholder="Ej: 30-12345678-9" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-secondary transition outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Sector Industrial</label>
                  <select value={sector} onChange={e => setSector(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:border-secondary transition outline-none appearance-none">
                    <option value="Tecnología">Tecnología y Software</option>
                    <option value="Manufactura">Manufactura e Industria</option>
                    <option value="Servicios">Servicios Generales</option>
                    <option value="Logística">Transporte y Logística</option>
                    <option value="Construcción">Construcción</option>
                  </select>
                </div>
              </div>
              <button disabled={!empresa || !cuit} onClick={() => setStep(2)} className="w-full bg-white text-zinc-950 font-bold p-3 rounded-xl hover:bg-zinc-200 transition flex justify-center items-center gap-2 disabled:opacity-50">
                Siguiente <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><ShieldCheck className="text-secondary w-5 h-5" /> 2. Normas a Implementar</h2>
              <p className="text-sm text-zinc-400">Selecciona los alcances que deseas habilitar inicialmente en tu espacio.</p>
              <div className="grid grid-cols-1 gap-3">
                {["ISO 9001", "ISO 14001", "ISO 45001", "ISO 27001"].map(norma => (
                  <label key={norma} className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${normas.includes(norma) ? 'border-secondary bg-secondary/10' : 'border-zinc-800 hover:border-zinc-700'}`}>
                    <input type="checkbox" checked={normas.includes(norma)} onChange={() => handleNormaToggle(norma)} className="w-4 h-4 accent-secondary" />
                    <span className="font-semibold">{norma}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="px-6 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition">Volver</button>
                <button disabled={normas.length === 0} onClick={() => setStep(3)} className="flex-1 bg-white text-zinc-950 font-bold p-3 rounded-xl hover:bg-zinc-200 transition flex justify-center items-center gap-2 disabled:opacity-50">
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-bold flex items-center gap-2"><User className="text-secondary w-5 h-5" /> 3. Credenciales del Administrador</h2>
              <p className="text-sm text-zinc-400">Crea el usuario que tendrá el control total sobre la cuenta de la empresa.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Correo Electrónico Laboral</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="admin@empresa.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pl-10 text-sm focus:border-secondary transition outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase mb-2 block">Contraseña Segura</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="••••••••" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 pl-10 text-sm focus:border-secondary transition outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setStep(2)} className="px-6 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition">Volver</button>
                <button 
                  disabled={!adminEmail || !adminPassword || loading} 
                  onClick={handleRegister} 
                  className="flex-1 bg-gradient-to-r from-primary to-secondary text-white font-bold p-3 rounded-xl hover:opacity-90 transition flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-secondary/20"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finalizar y Desplegar Tenant"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
