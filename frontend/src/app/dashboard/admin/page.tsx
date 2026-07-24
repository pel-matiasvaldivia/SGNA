"use client";

import React, { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Plus, CheckCircle2, Globe, UserCheck, RefreshCw, X, Copy, AlertCircle, Trash, Ban, Play, Users, HardDrive } from "lucide-react";

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  two_factor_enabled: boolean;
  created_at: string;
}

export default function SuperadminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [metrics, setMetrics] = useState({ total_tenants: 0, active_tenants: 0, total_users: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form States
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  const [step, setStep] = useState(0); 
  const [provisioning, setProvisioning] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  useEffect(() => {
    const computed = name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
    setSlug(computed);
  }, [name]);

  const fetchData = async () => {
    try {
      if (!session?.user) return;
      setLoading(true);
      
      const [resT, resM] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/tenants`, { headers: { Authorization: `Bearer ${(session as any).accessToken}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/metrics`, { headers: { Authorization: `Bearer ${(session as any).accessToken}` } })
      ]);

      if (!resT.ok || !resM.ok) throw new Error("Error cargando consola global.");
      
      setTenants(await resT.json());
      setMetrics(await resM.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [session]);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !adminEmail.trim() || !adminPassword.trim()) return;
    try {
      setProvisioning(true); setError(null); setStep(1);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any).accessToken}` },
        body: JSON.stringify({ name, slug, admin_email: adminEmail, admin_password: adminPassword }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al aprovisionar.");
      }
      setStep(4);
      setSuccessData({ slug, adminEmail, adminPassword });
      fetchData();
    } catch (err: any) {
      setError(err.message); setProvisioning(false); setStep(0);
    }
  };

  const handleCopy = (txt: string) => { navigator.clipboard.writeText(txt); };

  const handleToggle2FA = async (tenantId: string, currentStatus: boolean) => {
    setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, two_factor_enabled: !currentStatus } : t));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/tenants/${tenantId}/toggle-2fa`, {
        method: "PUT", headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (!res.ok) throw new Error("Error 2FA");
    } catch (err) { fetchData(); }
  };

  const handleSuspend = async (tenantId: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/tenants/${tenantId}/suspend`, {
        method: "PUT", headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (tenantId: string) => {
    if(!confirm("¿ESTÁS SEGURO? Esta acción destruirá la base de datos entera del cliente, sus archivos y configuraciones. Es irreversible.")) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/tenants/${tenantId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleImpersonate = async (tenantId: string, tenantName: string) => {
    if (!confirm(`Vas a ingresar como administrador del tenant "${tenantName}". Tu sesión de superadmin será reemplazada por la sesión de ese cliente. Para volver, cerrá sesión y volvé a ingresar como superadmin.\n\n¿Continuar?`)) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/tenants/${tenantId}/impersonate`, {
        method: "POST", headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "No se pudo iniciar la impersonación.");
        return;
      }
      const data = await res.json();
      // Establish a real NextAuth session scoped to the tenant using the
      // backend-issued impersonation token, then land on the tenant dashboard.
      const result = await signIn("credentials", {
        impersonationToken: data.access_token,
        redirect: false,
      });
      if (result?.error) {
        setError("La impersonación falló al establecer la sesión.");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Ocurrió un error al intentar impersonar el tenant.");
    }
  };

  const closeModal = () => { setIsOpen(false); setStep(0); setProvisioning(false); setSuccessData(null); };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-secondary" /> Consola Global M17
          </h1>
          <p className="text-sm text-muted-foreground">Administración de tenants, usuarios, impersonación y métricas del SGI.</p>
        </div>
        <button onClick={() => setIsOpen(true)} className="flex items-center justify-center gap-2 py-2.5 px-5 bg-secondary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-95 shadow transition">
          <Plus className="w-4 h-4" /> Nuevo Tenant
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-red-800 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <div><strong>Error administrativo:</strong> {error}</div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-100 text-blue-600 rounded-lg"><Globe className="w-6 h-6" /></div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Tenants Totales</span>
            <span className="text-3xl font-extrabold tracking-tight block">{metrics.total_tenants}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Tenants Activos</span>
            <span className="text-3xl font-extrabold tracking-tight block">{metrics.active_tenants}</span>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-purple-100 text-purple-600 rounded-lg"><Users className="w-6 h-6" /></div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Usuarios (SGI)</span>
            <span className="text-3xl font-extrabold tracking-tight block">{metrics.total_users}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-muted-foreground">Listado de Empresas Aprovisionadas</h3>
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground bg-white border rounded-xl">Cargando base de datos global...</div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground bg-white border rounded-xl">No hay tenants registrados.</div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-4">Empresa (Slug)</th>
                  <th className="p-4">2FA</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha de Alta</th>
                  <th className="p-4 text-right">Acciones (M17)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition">
                    <td className="p-4">
                      <div className="font-semibold text-sm">{item.name}</div>
                      <div className="text-muted-foreground font-mono mt-0.5">{item.slug}</div>
                    </td>
                    <td className="p-4">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={item.two_factor_enabled}
                        onClick={() => handleToggle2FA(item.id, item.two_factor_enabled)}
                        title={item.two_factor_enabled ? "2FA activado — clic para desactivar" : "2FA desactivado — clic para activar"}
                        className="inline-flex items-center gap-2 group focus:outline-none"
                      >
                        <span className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${item.two_factor_enabled ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-600'}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${item.two_factor_enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </span>
                        <span className={`inline-flex items-center gap-1 font-bold text-[10px] tracking-wide ${item.two_factor_enabled ? 'text-green-700' : 'text-amber-700'}`}>
                          <ShieldCheck className="w-3.5 h-3.5" /> {item.two_factor_enabled ? "Activado" : "Desactivado"}
                        </span>
                      </button>
                    </td>
                    <td className="p-4">
                      {item.active ? <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-semibold">Activo</span> : <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-semibold">Suspendido</span>}
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right flex items-center justify-end gap-2">
                      <button onClick={() => handleImpersonate(item.id, item.name)} title="Impersonar Tenant" className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"><Play className="w-4 h-4" /></button>
                      <button onClick={() => handleSuspend(item.id)} title={item.active ? "Suspender" : "Activar"} className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition"><Ban className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(item.id)} title="Eliminar Base de Datos" className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"><Trash className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Deploy new tenant */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden animate-scale-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-bold text-base flex items-center gap-2"><Globe className="w-5 h-5 text-secondary" /> Aprovisionamiento de Tenant</h3>
              {!provisioning && <button onClick={closeModal} className="p-1.5 hover:bg-muted rounded-full transition"><X className="w-4 h-4" /></button>}
            </div>
            <div className="p-6">
              {!provisioning && !successData && (
                <form onSubmit={handleProvision} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Nombre de la Organización</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3.5 py-2 border rounded-lg text-sm bg-muted/20" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Slug URL (Auto)</label>
                    <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className="w-full px-3.5 py-2 border rounded-lg text-sm bg-muted/20 font-mono" />
                  </div>
                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5"><UserCheck className="w-4 h-4 text-primary" /> Credenciales Administrador</h4>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Correo</label>
                      <input type="email" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full px-3.5 py-2 border rounded-lg text-sm bg-muted/20" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1">Contraseña</label>
                      <input type="text" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full px-3.5 py-2 border rounded-lg text-sm bg-muted/20" />
                    </div>
                  </div>
                  <div className="pt-4"><button type="submit" className="w-full py-2.5 px-4 bg-secondary text-white font-bold rounded-lg text-sm">Aprovisionar & Lanzar Base de Datos</button></div>
                </form>
              )}

              {provisioning && !successData && (
                <div className="p-8 text-center space-y-6">
                  <RefreshCw className="w-12 h-12 text-secondary animate-spin mx-auto" />
                  <div className="space-y-3 max-w-sm mx-auto text-left text-xs font-medium border p-4 rounded-xl bg-muted/20">
                    <div className={step >= 1 ? "text-green-600 font-bold" : "text-muted-foreground"}>Step 1: Registro de Tenant</div>
                    <div className={step >= 2 ? "text-green-600 font-bold" : "text-muted-foreground"}>Step 2: Base de Datos & MinIO</div>
                    <div className={step >= 3 ? "text-green-600 font-bold" : "text-muted-foreground"}>Step 3: Usuario Administrador</div>
                  </div>
                </div>
              )}

              {successData && (
                <div className="space-y-6 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                  <h4 className="font-extrabold text-lg">¡Desplegado Exitosamente!</h4>
                  <div className="bg-muted/40 border p-5 rounded-xl text-left space-y-3 text-xs">
                    <div><span className="text-[10px] text-muted-foreground uppercase font-bold block">URL / Acceso</span><span className="font-semibold block text-primary">/login?tenant={successData.slug}</span></div>
                    <div><span className="text-[10px] text-muted-foreground uppercase font-bold block">Usuario Administrador</span><span className="font-semibold block font-mono">{successData.adminEmail}</span></div>
                    <div className="flex justify-between items-center gap-2">
                      <div><span className="text-[10px] text-muted-foreground uppercase font-bold block">Contraseña Temporal</span><span className="font-semibold block font-mono">{successData.adminPassword}</span></div>
                      <button onClick={() => handleCopy(successData.adminPassword)} className="p-2 border rounded-lg text-primary shadow-sm"><Copy className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <button onClick={closeModal} className="w-full py-2.5 px-4 bg-primary text-white font-bold rounded-lg text-sm">Finalizar</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
