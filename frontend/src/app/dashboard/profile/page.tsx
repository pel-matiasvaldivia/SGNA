"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { User, Lock, Save, MonitorSmartphone, XCircle, CheckCircle2 } from "lucide-react";

export default function UserProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState({ id: "", email: "", full_name: "", role: "", two_fa_enabled: true });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [sessions, setSessions] = useState<any[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchSessions();
    }
  }, [session]);

  const fetchProfile = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/me`, {
      headers: { Authorization: `Bearer ${(session as any).accessToken}` }
    });
    if (res.ok) setProfile(await res.json());
  };

  const fetchSessions = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/sessions`, {
      headers: { Authorization: `Bearer ${(session as any).accessToken}` }
    });
    if (res.ok) setSessions(await res.json());
  };

  const handleUpdateProfile = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any).accessToken}` },
        body: JSON.stringify({ full_name: profile.full_name })
      });
      if (res.ok) setSuccess("Perfil actualizado");
      else throw new Error("Error actualizando perfil");
    } catch(e:any) { setError(e.message); } finally { setLoading(false); setTimeout(() => setSuccess(null), 3000); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any).accessToken}` },
        body: JSON.stringify({ current_password: passwords.current, new_password: passwords.new })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        setPasswords({ current: "", new: "", confirm: "" });
      } else throw new Error(data.detail);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); setTimeout(() => setSuccess(null), 3000); }
  };

  const revokeSession = async (id: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/users/sessions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${(session as any).accessToken}` }
    });
    if (res.ok) fetchSessions();
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
          <User className="w-8 h-8 text-secondary" /> Mi Perfil
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gestiona tu información personal y seguridad.</p>
      </div>

      {success && <div className="p-4 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="w-4 h-4"/> {success}</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 text-sm font-bold"><XCircle className="w-4 h-4"/> {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-950 border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4">Información Personal</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Nombre Completo</label>
                <input type="text" value={profile.full_name} onChange={e=>setProfile({...profile, full_name: e.target.value})} className="w-full p-2 border rounded-lg bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Correo Electrónico (No modificable)</label>
                <input type="email" value={profile.email} disabled className="w-full p-2 border rounded-lg bg-muted text-sm text-muted-foreground" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Rol</label>
                <input type="text" value={profile.role.toUpperCase()} disabled className="w-full p-2 border rounded-lg bg-muted text-sm text-muted-foreground font-bold" />
              </div>
              <button onClick={handleUpdateProfile} disabled={loading} className="w-full bg-secondary text-white font-bold py-2.5 rounded-lg flex justify-center items-center gap-2 hover:opacity-90">
                <Save className="w-4 h-4" /> Guardar Cambios
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-secondary" /> Cambiar Contraseña</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Contraseña Actual</label>
                <input type="password" required value={passwords.current} onChange={e=>setPasswords({...passwords, current: e.target.value})} className="w-full p-2 border rounded-lg bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Nueva Contraseña</label>
                <input type="password" required value={passwords.new} onChange={e=>setPasswords({...passwords, new: e.target.value})} className="w-full p-2 border rounded-lg bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Confirmar Nueva Contraseña</label>
                <input type="password" required value={passwords.confirm} onChange={e=>setPasswords({...passwords, confirm: e.target.value})} className="w-full p-2 border rounded-lg bg-background text-sm" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold py-2.5 rounded-lg hover:opacity-90">
                Actualizar Contraseña
              </button>
            </form>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-zinc-950 border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><MonitorSmartphone className="w-5 h-5 text-secondary" /> Sesiones Activas</h3>
            <p className="text-sm text-muted-foreground mb-4">Cierra sesión en dispositivos que ya no utilices para mantener tu cuenta segura.</p>
            <div className="space-y-3">
              {sessions.map(s => (
                <div key={s.id} className={`p-4 border rounded-xl flex items-center justify-between ${s.current ? 'border-secondary bg-secondary/5' : 'border-border'}`}>
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      {s.device} 
                      {s.current && <span className="px-2 py-0.5 bg-secondary text-white text-[10px] rounded-full uppercase tracking-wider">Actual</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">IP: {s.ip}</div>
                  </div>
                  {!s.current && (
                    <button onClick={() => revokeSession(s.id)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg transition">Cerrar Sesión</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
