"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ShieldCheck, Plus, CheckCircle2, Clock, Globe, UserCheck, Key, RefreshCw, X, Copy, AlertCircle } from "lucide-react";

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: string;
}

export default function SuperadminPage() {
  const { data: session } = useSession();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form States
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Provisioning logs
  const [step, setStep] = useState(0); // 0: Idle, 1: DB Entry, 2: Schema Creation, 3: Admin Registration, 4: Success
  const [provisioning, setProvisioning] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    const computed = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
    setSlug(computed);
  }, [name]);

  const fetchTenants = async () => {
    try {
      if (!session?.user) return;
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/tenants`, {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("No se pudo cargar la base global de tenants.");
      }
      const data = await res.json();
      setTenants(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar la consola de superadmin.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, [session]);

  const handleProvision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !adminEmail.trim() || !adminPassword.trim()) return;

    try {
      setProvisioning(true);
      setError(null);
      
      // Step 1: Request sent to api
      setStep(1);
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/admin/tenants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify({
          name,
          slug,
          admin_email: adminEmail,
          admin_password: adminPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Error al aprovisionar.");
      }

      setStep(2);
      // Brief aesthetic pause to show steps transitions
      await new Promise(r => setTimeout(r, 800));
      setStep(3);
      await new Promise(r => setTimeout(r, 800));
      setStep(4);

      setSuccessData({
        name,
        slug,
        adminEmail,
        adminPassword
      });

      // Clear fields
      setName("");
      setSlug("");
      setAdminEmail("");
      setAdminPassword("");

      // Refresh list
      await fetchTenants();
    } catch (err: any) {
      setError(err.message || "Error al inicializar tenant");
      setStep(0);
      setProvisioning(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("¡Copiado al portapapeles!");
  };

  const closeModal = () => {
    setIsOpen(false);
    setStep(0);
    setProvisioning(false);
    setSuccessData(null);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-secondary" /> Consola Global de Superadmin
          </h1>
          <p className="text-sm text-muted-foreground">
            Aprovisiona bases de datos aisladas físicamente por cliente y configura administradores en segundos.
          </p>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-secondary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-95 shadow transition"
        >
          <Plus className="w-4 h-4" /> Desplegar Nuevo Tenant
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500 p-4 rounded-r-lg text-sm text-red-800 dark:text-red-300 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <div>
            <strong>Error administrativo detectado:</strong> {error}
          </div>
        </div>
      )}

      {/* Grid count summary statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-border shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-primary/10 rounded-lg text-primary">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Total Clientes / Tenants</span>
            <span className="text-3xl font-extrabold tracking-tight block">{tenants.length}</span>
          </div>
        </div>
      </div>

      {/* List / Table grid */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg text-muted-foreground">Listado de Empresas Aprovisionadas</h3>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm">
            Cargando base de datos global...
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm">
            No se han registrado tenants. Presiona "Desplegar Nuevo Tenant" para iniciar.
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40 border-b border-border font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="p-4">Organización / Empresa</th>
                  <th className="p-4">Identificador (Slug)</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Fecha de Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/10 transition">
                    <td className="p-4 font-semibold text-sm">{item.name}</td>
                    <td className="p-4">
                      <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono font-medium">
                        {item.slug}
                      </span>
                    </td>
                    <td className="p-4">
                      {item.active ? (
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-semibold">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
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
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Globe className="w-5 h-5 text-secondary" /> Aprovisionamiento de Tenant
              </h3>
              {!provisioning && (
                <button onClick={closeModal} className="p-1.5 hover:bg-muted rounded-full transition">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6">
              
              {/* Form Input Mode */}
              {!provisioning && !successData && (
                <form onSubmit={handleProvision} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Nombre de la Organización / Cliente
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Metales Industriales S.A."
                      className="w-full px-3.5 py-2 border border-input bg-muted/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Slug URL Identificador (Auto-generado)
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="ej: metales-industriales"
                      className="w-full px-3.5 py-2 border border-input bg-muted/20 rounded-lg text-sm font-mono focus:outline-none"
                    />
                  </div>

                  <div className="border-t border-border pt-4 mt-2 space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-primary" /> Credenciales Iniciales Administrador
                    </h4>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Correo de Acceso
                      </label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="ej: admin@metales.com"
                        className="w-full px-3.5 py-2 border border-input bg-muted/20 rounded-lg text-sm focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                        Contraseña Temporal
                      </label>
                      <input
                        type="text"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Escribe o autocompleta contraseña..."
                        className="w-full px-3.5 py-2 border border-input bg-muted/20 rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-secondary text-white font-bold rounded-lg text-sm hover:opacity-95 shadow transition"
                    >
                      Aprovisionar & Lanzar Base de Datos
                    </button>
                  </div>
                </form>
              )}

              {/* Provisioning Loader Step Sequence Mode */}
              {provisioning && !successData && (
                <div className="p-8 text-center space-y-6">
                  <RefreshCw className="w-12 h-12 text-secondary animate-spin mx-auto" />
                  
                  <div className="space-y-3 max-w-sm mx-auto text-left text-xs font-medium border border-border p-4 rounded-xl bg-muted/20">
                    <div className="flex items-center gap-2">
                      <span className={step >= 1 ? "text-green-600 font-bold" : "text-muted-foreground"}>
                        {step >= 2 ? "✓" : "⚡"} Step 1: Creando registro global Tenants
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={step >= 2 ? "text-green-600 font-bold" : "text-muted-foreground"}>
                        {step >= 3 ? "✓" : step === 2 ? "⚡ Procesando..." : "○ Pending:"} Step 2: Generando base de datos aislada (CREATE SCHEMA)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={step >= 3 ? "text-green-600 font-bold" : "text-muted-foreground"}>
                        {step >= 4 ? "✓" : step === 3 ? "⚡ Procesando..." : "○ Pending:"} Step 3: Autoprovisionando tablas del sistema e inyectando Admin
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Result Credentials Panel */}
              {successData && (
                <div className="space-y-6 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                  <div>
                    <h4 className="font-extrabold text-lg text-surface-foreground">¡Base de Datos Desplegada Exitosamente!</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      El schema PostgreSQL y las credenciales reguladas están listos.
                    </p>
                  </div>

                  <div className="bg-muted/40 border border-border p-5 rounded-xl text-left space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">URL / Acceso</span>
                      <span className="font-semibold block break-all text-primary">
                        http://localhost:3000/login?tenant={successData.slug}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold block">Usuario Administrador</span>
                      <span className="font-semibold block text-surface-foreground font-mono">{successData.adminEmail}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Contraseña Temporal</span>
                        <span className="font-semibold block text-surface-foreground font-mono">{successData.adminPassword}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(successData.adminPassword)}
                        className="p-2 bg-white hover:bg-muted border border-border rounded-lg text-primary shadow-sm"
                        title="Copiar contraseña"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={closeModal}
                    className="w-full py-2.5 px-4 bg-primary text-white font-bold rounded-lg text-sm hover:opacity-95 shadow transition"
                  >
                    Entendido, finalizar
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
