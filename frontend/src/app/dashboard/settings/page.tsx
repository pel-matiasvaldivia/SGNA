"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Settings, Users, Mail, Save, Plus, Shield, CheckCircle2, XCircle, MailCheck, Loader2, ShieldCheck, Smartphone } from "lucide-react";

interface PermData {
  modules: { key: string; label: string; path: string }[];
  profiles: { key: string; label: string; field?: boolean; system?: boolean }[];
  permissions: Record<string, string[]>;
}

const RESERVED_PROFILE_KEYS = ["admin", "superadmin", "empleado", "auditor", "collaborator", "inicio"];

export default function TenantSettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Users State
  const [users, setUsers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("empleado");

  // SMTP State
  const [smtp, setSmtp] = useState({ host: "", port: "", user: "", password: "", encryption: "tls" });
  const [testing, setTesting] = useState(false);
  const [smtpTest, setSmtpTest] = useState<{ success: boolean; message: string; detail?: string } | null>(null);

  // Permissions State
  const [perm, setPerm] = useState<PermData | null>(null);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileField, setNewProfileField] = useState(false);

  useEffect(() => {
    if (session?.user) {
      if (activeTab === "users") { fetchUsers(); fetchPermissions(); }
      if (activeTab === "smtp") fetchSmtp();
      if (activeTab === "permissions") fetchPermissions();
    }
  }, [activeTab, session]);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/users`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSmtp = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/smtp`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSmtp({ ...smtp, ...data });
      }
    } catch (e) { console.error(e); }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/users/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any).accessToken}` },
        body: JSON.stringify({ email: inviteEmail, full_name: inviteName, role: inviteRole }),
      });
      if (res.ok) {
        setSuccess("Invitación enviada con éxito.");
        setInviteEmail(""); setInviteName("");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.detail);
      }
    } finally { setLoading(false); setTimeout(() => setSuccess(null), 3000); }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    setSmtpTest(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/smtp/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any).accessToken}` },
        body: JSON.stringify({
          smtp_host: smtp.host,
          smtp_port: smtp.port,
          smtp_user: smtp.user,
          smtp_password: smtp.password,
          smtp_encryption: smtp.encryption,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSmtpTest(data);
      } else {
        setSmtpTest({ success: false, message: data.detail || "No se pudo ejecutar la prueba SMTP." });
      }
    } catch (e: any) {
      setSmtpTest({ success: false, message: "No se pudo conectar con el servidor para ejecutar la prueba." });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSmtp = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/smtp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any).accessToken}` },
        body: JSON.stringify({ smtp_host: smtp.host, smtp_port: smtp.port, smtp_user: smtp.user, smtp_password: smtp.password, smtp_encryption: smtp.encryption }),
      });
      if (res.ok) {
        setSuccess("Configuración SMTP guardada.");
      }
    } finally { setLoading(false); setTimeout(() => setSuccess(null), 3000); }
  };

  const fetchPermissions = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/permissions`, {
        headers: { Authorization: `Bearer ${(session as any).accessToken}` },
      });
      if (res.ok) setPerm(await res.json());
    } catch (e) { console.error(e); }
  };

  const togglePerm = (profileKey: string, moduleKey: string) => {
    setPerm((prev) => {
      if (!prev) return prev;
      const current = prev.permissions[profileKey] || [];
      const next = current.includes(moduleKey)
        ? current.filter((k) => k !== moduleKey)
        : [...current, moduleKey];
      return { ...prev, permissions: { ...prev.permissions, [profileKey]: next } };
    });
  };

  const addProfile = () => {
    const label = newProfileName.trim();
    if (!label || !perm) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
    if (!key) return;
    if (RESERVED_PROFILE_KEYS.includes(key) || perm.profiles.some((p) => p.key === key)) {
      alert("Ya existe un perfil con ese nombre (o es un nombre reservado).");
      return;
    }
    setPerm({
      ...perm,
      profiles: [...perm.profiles, { key, label, field: newProfileField, system: false }],
      permissions: { ...perm.permissions, [key]: [] },
    });
    setNewProfileName("");
    setNewProfileField(false);
  };

  const removeProfile = (key: string) => {
    if (!perm) return;
    setPerm({
      ...perm,
      profiles: perm.profiles.filter((p) => p.key !== key),
      permissions: Object.fromEntries(Object.entries(perm.permissions).filter(([k]) => k !== key)),
    });
  };

  const handleSavePermissions = async () => {
    if (!perm) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/permissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${(session as any).accessToken}` },
        body: JSON.stringify({
          permissions: perm.permissions,
          custom_profiles: perm.profiles
            .filter((p) => !p.system)
            .map((p) => ({ key: p.key, label: p.label, field: !!p.field })),
        }),
      });
      if (res.ok) {
        setSuccess("Permisos actualizados. Cada usuario los verá al recargar.");
      } else {
        const data = await res.json();
        alert(data.detail || "No se pudieron guardar los permisos.");
      }
    } finally { setLoading(false); setTimeout(() => setSuccess(null), 4000); }
  };

  const toggleUser = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/users/${id}/toggle`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${(session as any).accessToken}` }
      });
      if (res.ok) fetchUsers();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-heading flex items-center gap-2">
            <Settings className="w-8 h-8 text-secondary" /> Configuración del Tenant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Administración de usuarios, roles, y parámetros generales de la empresa.</p>
        </div>
      </div>

      {success && (
        <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 p-4 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-400">
          <CheckCircle2 className="w-5 h-5" /> <span className="font-semibold text-sm">{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button onClick={() => setActiveTab("users")} className={`px-6 py-3 font-semibold text-sm transition border-b-2 ${activeTab === 'users' ? 'border-secondary text-surface-foreground' : 'border-transparent text-muted-foreground hover:text-surface-foreground'}`}>
          <Users className="w-4 h-4 inline-block mr-2" /> Usuarios y Roles
        </button>
        <button onClick={() => setActiveTab("permissions")} className={`px-6 py-3 font-semibold text-sm transition border-b-2 ${activeTab === 'permissions' ? 'border-secondary text-surface-foreground' : 'border-transparent text-muted-foreground hover:text-surface-foreground'}`}>
          <Shield className="w-4 h-4 inline-block mr-2" /> Permisos y Perfiles
        </button>
        <button onClick={() => setActiveTab("smtp")} className={`px-6 py-3 font-semibold text-sm transition border-b-2 ${activeTab === 'smtp' ? 'border-secondary text-surface-foreground' : 'border-transparent text-muted-foreground hover:text-surface-foreground'}`}>
          <Mail className="w-4 h-4 inline-block mr-2" /> Envío de Correos (SMTP)
        </button>
      </div>

      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">Directorio de Usuarios</h3>
            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 uppercase text-xs font-bold text-muted-foreground">
                  <tr>
                    <th className="p-4">Nombre / Correo</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-muted/20">
                      <td className="p-4">
                        <div className="font-bold">{user.full_name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="p-4"><span className="px-2 py-1 bg-muted rounded font-semibold text-xs uppercase">{user.role}</span></td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => toggleUser(user.id)} className="text-xs font-bold text-secondary hover:underline">
                          {user.active ? 'Desactivar' : 'Activar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <div className="bg-muted/10 border border-border rounded-xl p-6 shadow-sm sticky top-6">
              <h3 className="font-bold text-lg flex items-center gap-2 mb-4"><Plus className="w-5 h-5 text-secondary" /> Invitar Usuario</h3>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Nombre Completo</label>
                  <input type="text" required value={inviteName} onChange={e=>setInviteName(e.target.value)} className="w-full p-2 border rounded-lg bg-background text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Correo Electrónico</label>
                  <input type="email" required value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} className="w-full p-2 border rounded-lg bg-background text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Rol en el SGI</label>
                  <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} className="w-full p-2 border rounded-lg bg-background text-sm">
                    {(perm?.profiles ?? [
                      { key: "empleado", label: "Empleado Base" },
                      { key: "auditor", label: "Auditor de Campo" },
                    ]).map((p) => (
                      <option key={p.key} value={p.key}>{p.label}</option>
                    ))}
                    <option value="admin">Administrador del Tenant</option>
                  </select>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-secondary text-white font-bold py-2.5 rounded-lg hover:opacity-90 transition">
                  {loading ? 'Enviando...' : 'Enviar Invitación'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === "permissions" && (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" /> Permisos y Perfiles
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Definí qué secciones ve cada perfil de tu organización. Marcá o desmarcá los módulos y guardá.
                Los perfiles <b>Administrador</b> y <b>Superadmin</b> siempre ven todo.
              </p>
            </div>
            <button
              onClick={handleSavePermissions}
              disabled={loading || !perm}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> Guardar cambios
            </button>
          </div>

          {!perm ? (
            <div className="bg-white dark:bg-zinc-950 border border-border rounded-xl p-12 text-center text-muted-foreground italic shadow-sm">
              Cargando perfiles…
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-xl bg-white dark:bg-zinc-950 shadow-sm">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 uppercase text-xs font-bold text-muted-foreground">
                  <tr>
                    <th className="p-3 text-left sticky left-0 bg-muted/40">Sección</th>
                    {perm.profiles.map((pr) => (
                      <th key={pr.key} className="p-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 justify-center">
                          {pr.field && <Smartphone className="w-3.5 h-3.5" />} {pr.label}
                          {!pr.system && (
                            <button
                              onClick={() => removeProfile(pr.key)}
                              title="Eliminar perfil"
                              className="ml-1 text-muted-foreground hover:text-red-600 transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </span>
                        {!pr.system && <span className="block text-[9px] font-normal text-muted-foreground normal-case">personalizado</span>}
                      </th>
                    ))}
                    <th className="p-3 text-center whitespace-nowrap text-secondary">
                      <span className="inline-flex items-center gap-1 justify-center">
                        <ShieldCheck className="w-3.5 h-3.5" /> Administrador
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {perm.modules.map((mod) => (
                    <tr key={mod.key} className="hover:bg-muted/20">
                      <td className="p-3 font-medium text-foreground sticky left-0 bg-white dark:bg-zinc-950">{mod.label}</td>
                      {perm.profiles.map((pr) => (
                        <td key={pr.key} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={(perm.permissions[pr.key] || []).includes(mod.key)}
                            onChange={() => togglePerm(pr.key, mod.key)}
                            className="w-4 h-4 accent-secondary cursor-pointer"
                          />
                        </td>
                      ))}
                      <td className="p-3 text-center">
                        <input type="checkbox" checked disabled title="El administrador siempre tiene acceso" className="w-4 h-4 opacity-50" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Crear perfil personalizado */}
          <div className="bg-muted/10 border border-border rounded-xl p-4 shadow-sm">
            <h4 className="font-bold text-sm flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-secondary" /> Crear perfil personalizado
            </h4>
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Nombre del perfil</label>
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Ej: Supervisor de Planta"
                  className="w-full p-2 border rounded-lg bg-background text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground pb-2.5 cursor-pointer">
                <input type="checkbox" checked={newProfileField} onChange={(e) => setNewProfileField(e.target.checked)} className="w-4 h-4 accent-secondary" />
                <Smartphone className="w-4 h-4" /> App móvil de campo
              </label>
              <button
                onClick={addProfile}
                disabled={!perm || !newProfileName.trim()}
                className="bg-secondary text-white font-bold px-5 py-2.5 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                Agregar perfil
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              El perfil nuevo empieza sin accesos: marcá sus módulos en la tabla y <b>guardá los cambios</b>. Después vas a poder asignarlo al invitar usuarios.
            </p>
          </div>

          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            Los perfiles marcados con app de campo usan la navegación móvil simplificada (como Auditor de Campo).
            Ayuda y Perfil están siempre disponibles para todos.
          </p>
        </div>
      )}

      {activeTab === "smtp" && (
        <div className="max-w-2xl bg-white dark:bg-zinc-950 border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-2">Servidor de Salida (SMTP)</h3>
          <p className="text-sm text-muted-foreground mb-6">Configura tu propio servidor SMTP para que las notificaciones y reportes lleguen a tus empleados con tu dominio.</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Host SMTP</label>
                <input type="text" value={smtp.host || ''} onChange={e=>setSmtp({...smtp, host: e.target.value})} placeholder="smtp.gmail.com" className="w-full p-2 border rounded-lg bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Puerto</label>
                <input type="text" value={smtp.port || ''} onChange={e=>setSmtp({...smtp, port: e.target.value})} placeholder="587" className="w-full p-2 border rounded-lg bg-background text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Usuario / Email</label>
                <input type="text" value={smtp.user || ''} onChange={e=>setSmtp({...smtp, user: e.target.value})} placeholder="no-reply@miempresa.com" className="w-full p-2 border rounded-lg bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Contraseña / App Password</label>
                <input type="password" value={smtp.password || ''} onChange={e=>setSmtp({...smtp, password: e.target.value})} placeholder="••••••••" className="w-full p-2 border rounded-lg bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground block mb-1">Cifrado</label>
              <select value={smtp.encryption || 'tls'} onChange={e=>setSmtp({...smtp, encryption: e.target.value})} className="w-full p-2 border rounded-lg bg-background text-sm">
                <option value="tls">STARTTLS</option>
                <option value="ssl">SSL</option>
                <option value="none">Ninguno</option>
              </select>
            </div>
            {smtpTest && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 text-sm ${smtpTest.success ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'}`}>
                {smtpTest.success ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <div className="space-y-1 min-w-0">
                  <div className="font-bold">{smtpTest.success ? "Prueba exitosa" : "La prueba falló"}</div>
                  <div>{smtpTest.message}</div>
                  {smtpTest.detail && (
                    <div className="text-xs opacity-75 font-mono break-words">{smtpTest.detail}</div>
                  )}
                </div>
              </div>
            )}
            <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
              <button onClick={handleTestSmtp} disabled={testing || loading} className="border border-border bg-background text-foreground font-bold px-6 py-2.5 rounded-lg hover:bg-muted/40 transition flex items-center justify-center gap-2 disabled:opacity-60">
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
                {testing ? "Verificando..." : "Verificar configuración"}
              </button>
              <button onClick={handleSaveSmtp} disabled={loading || testing} className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 font-bold px-6 py-2.5 rounded-lg hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-60">
                <Save className="w-4 h-4" /> Guardar Configuración
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              La verificación usa los datos del formulario y envía un correo de prueba a tu correo de acceso.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
