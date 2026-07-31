"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FolderClosed, CheckSquare, AlertOctagon, Home, LogOut, ShieldCheck, User, ClipboardCheck, Globe, Target, Workflow, FileSearch, Leaf, Activity, FileSignature, Presentation, Shuffle, Sliders, GraduationCap, HeartHandshake, Sparkles, Truck, HardHat, Wrench, Settings, LifeBuoy, ClipboardList } from "lucide-react";
import OnboardingTour from "@/components/onboarding-tour";
import PwaRegister from "@/components/pwa-register";
import OfflineSync from "@/components/offline-sync";
import FieldAuditorShell from "@/components/field-auditor-shell";

// Catálogo de gating (key de módulo -> ruta). Refleja el catálogo del backend
// (app/data/modules_catalog.py) y sirve de fallback inmediato antes de que
// llegue la configuración de permisos del tenant.
const MODULE_PATH: Record<string, string> = {
  inicio: "/dashboard",
  diagnosticos: "/dashboard/diagnosticos",
  contexto: "/dashboard/contexto",
  planificacion: "/dashboard/planificacion",
  procesos: "/dashboard/procesos",
  documents: "/dashboard/documents",
  approvals: "/dashboard/approvals",
  auditorias: "/dashboard/auditorias",
  "mis-auditorias": "/dashboard/mis-auditorias",
  iso9001: "/dashboard/iso9001",
  cambios: "/dashboard/cambios",
  equipos: "/dashboard/equipos",
  capacitacion: "/dashboard/capacitacion",
  satisfaccion: "/dashboard/satisfaccion",
  proveedores: "/dashboard/proveedores",
  huella: "/dashboard/huella",
  kpis: "/dashboard/kpis",
  direccion: "/dashboard/direccion",
  reportes: "/dashboard/reportes",
  "ia-auditor": "/dashboard/ia-auditor",
  sst: "/dashboard/sst",
  mantenimiento: "/dashboard/mantenimiento",
};

// Alcance por defecto por perfil (coincide con DEFAULT_PERMISSIONS del backend).
const DEFAULT_ROLE_MODULES: Record<string, string[]> = {
  empleado: ["inicio", "documents", "capacitacion", "iso9001", "sst"],
  collaborator: ["inicio", "documents", "capacitacion", "iso9001", "sst"],
  auditor: ["mis-auditorias"],
};

// Perfil y Ayuda siempre accesibles. admin/superadmin ven todo (sin restricción).
const ALWAYS_PATHS = ["/dashboard/profile", "/dashboard/ayuda"];
const FULL_ROLES = ["admin", "superadmin"];

// "/dashboard" (Inicio) matchea solo exacto; el resto por prefijo.
const pathMatches = (allowed: string[], path: string): boolean =>
  allowed.some((p) =>
    p === "/dashboard" ? path === "/dashboard" : path === p || path.startsWith(p + "/")
  );

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const userRole = (session?.user as any)?.role;

  // Config de permisos por perfil del tenant (la administra el admin en
  // Configuración → Permisos y Perfiles). Se lee una vez; hasta que llega, se
  // usan los defaults, así el gating funciona sin parpadeos.
  const [permConfig, setPermConfig] = React.useState<Record<string, string[]> | null>(null);
  React.useEffect(() => {
    if (status !== "authenticated") return;
    const token = (session as any)?.accessToken;
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.permissions) setPermConfig(d.permissions); })
      .catch(() => {});
  }, [status, session]);

  // Rutas permitidas para el rol actual. null => sin restricción (ve todo).
  const allowedPaths = React.useMemo<string[] | null>(() => {
    if (!userRole || FULL_ROLES.includes(userRole)) return null;
    const keys = permConfig?.[userRole] ?? DEFAULT_ROLE_MODULES[userRole];
    if (!keys) return null; // rol desconocido: no restringir para no dejar a nadie afuera
    const paths = keys.map((k) => MODULE_PATH[k]).filter(Boolean) as string[];
    return [...paths, ...ALWAYS_PATHS];
  }, [userRole, permConfig]);

  const isAllowed = (path: string) => allowedPaths === null || pathMatches(allowedPaths, path);

  // Primer destino permitido del rol (evita bucles de redirección si, por
  // ejemplo, se desactivó "Inicio" para el perfil). Perfil siempre está.
  const landingPath = React.useMemo(() => {
    if (allowedPaths === null || allowedPaths.includes("/dashboard")) return "/dashboard";
    const firstModule = allowedPaths.find((p) => !ALWAYS_PATHS.includes(p));
    return firstModule || "/dashboard/profile";
  }, [allowedPaths]);

  // Roles restringidos: si abren algo fuera de su alcance, van a su destino seguro.
  const auditorBlocked = userRole === "auditor" && !isAllowed(pathname);
  const roleBlocked = userRole !== "auditor" && allowedPaths !== null && !isAllowed(pathname);
  React.useEffect(() => {
    if (status !== "authenticated") return;
    if (auditorBlocked || roleBlocked) {
      router.replace(landingPath);
    }
  }, [status, auditorBlocked, roleBlocked, landingPath, router]);

  // Mientras resuelve la sesión, evitamos mostrar la consola web (que además
  // provocaría un parpadeo antes de conmutar a la vista de auditor).
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 text-sm text-muted-foreground italic">
        Cargando…
      </div>
    );
  }

  // Rol auditor → cáscara móvil exclusiva (no la consola web).
  if (userRole === "auditor") {
    return (
      <FieldAuditorShell>
        {auditorBlocked ? (
          <div className="py-16 text-center text-sm text-muted-foreground italic">
            Redirigiendo a tus auditorías…
          </div>
        ) : (
          children
        )}
      </FieldAuditorShell>
    );
  }

  const navItems = [
    { name: "Inicio", path: "/dashboard", icon: Home },
    { name: "Diagnóstico y Brechas", path: "/dashboard/diagnosticos", icon: ClipboardCheck },
    { name: "Contexto Organizacional", path: "/dashboard/contexto", icon: Globe },
    { name: "Planificación SGI", path: "/dashboard/planificacion", icon: Target },
    { name: "Gestión de Procesos", path: "/dashboard/procesos", icon: Workflow },
    { name: "Gestión Documental (DMS)", path: "/dashboard/documents", icon: FolderClosed },
    { name: "Aprobaciones de Calidad", path: "/dashboard/approvals", icon: CheckSquare },
    { name: "Auditorías Internas", path: "/dashboard/auditorias", icon: FileSearch },
    { name: "Mis Auditorías (Campo)", path: "/dashboard/mis-auditorias", icon: ClipboardList },
    { name: "No Conformidades (ISO 9001)", path: "/dashboard/iso9001", icon: AlertOctagon },
    { name: "Control de Cambios", path: "/dashboard/cambios", icon: Shuffle },
    { name: "Equipos y Calibración", path: "/dashboard/equipos", icon: Sliders },
    { name: "Planes y Competencias", path: "/dashboard/capacitacion", icon: GraduationCap },
    { name: "Satisfacción de Clientes", path: "/dashboard/satisfaccion", icon: HeartHandshake },
    { name: "Gestión de Proveedores", path: "/dashboard/proveedores", icon: Truck },
    { name: "Huella de Carbono", path: "/dashboard/huella", icon: Leaf },
    { name: "KPIs e Indicadores", path: "/dashboard/kpis", icon: Activity },
    { name: "Revisión Dirección", path: "/dashboard/direccion", icon: FileSignature },
    { name: "Reporte SGI", path: "/dashboard/reportes", icon: Presentation },
    { name: "Auditor de IA Hub", path: "/dashboard/ia-auditor", icon: Sparkles },
    { name: "Seguridad y Salud (SST)", path: "/dashboard/sst", icon: HardHat },
    { name: "Mantenimiento (CMMS)", path: "/dashboard/mantenimiento", icon: Wrench },
  ];

  if (userRole === "superadmin") {
    navItems.push({ name: "Consola de Superadmin", path: "/dashboard/admin", icon: ShieldCheck });
  }

  // Cada rol ve solo las secciones de su alcance (admin/superadmin: todas).
  const visibleNav = navItems.filter((item) => isAllowed(item.path));

  return (
    <div className="min-h-screen flex bg-muted/30 font-sans text-surface-foreground">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col justify-between shadow-xl relative z-20">
        <div>
          {/* Logo Brand Header */}
          <div className="p-4 border-b border-white/10">
            <div className="bg-white rounded-xl px-3 py-2.5 flex items-center justify-center shadow-sm">
              <img src="/logo-auditorias.png" alt="Auditorías en Línea" className="h-11 w-auto object-contain" />
            </div>
            <span className="text-[10px] text-primary-foreground/50 block text-center mt-2 uppercase tracking-wider">SaaS Multitenant</span>
          </div>

          {/* Nav items */}
          <nav className="p-4 space-y-1">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? "bg-secondary text-primary-foreground shadow"
                      : "hover:bg-white/10 text-primary-foreground/80 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar / Session status */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="space-y-2">
            <Link href="/dashboard/ayuda" className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${pathname === "/dashboard/ayuda" ? "bg-secondary text-primary-foreground shadow" : "hover:bg-white/10 text-primary-foreground/80 hover:text-white"}`}>
              <LifeBuoy className="w-4 h-4" /> Centro de Ayuda
            </Link>
            {(userRole === "admin" || userRole === "superadmin") && (
              <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition hover:bg-white/10 text-primary-foreground/80 hover:text-white">
                <Settings className="w-4 h-4" /> Configuración Tenant
              </Link>
            )}
            <Link href="/dashboard/profile" className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition group">
              <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center group-hover:bg-secondary/40 transition">
                <User className="w-4 h-4 text-secondary-foreground" />
              </div>
              <div className="overflow-hidden flex-1">
                <span className="font-semibold text-xs block truncate text-white">
                  {session?.user?.email || "Cargando..."}
                </span>
                <span className="text-[10px] text-primary-foreground/60 block uppercase truncate">
                  {userRole} • Mi Perfil
                </span>
              </div>
            </Link>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold hover:bg-red-500/20 hover:text-red-300 text-primary-foreground/70 transition border border-transparent hover:border-red-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main contents container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-zinc-950 border-b border-border flex items-center justify-between px-8 relative z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-secondary" />
            <h2 className="font-bold text-sm tracking-wide text-muted-foreground uppercase">
              Consola de Operaciones
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/dashboard/ayuda" title="Centro de Ayuda" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-secondary transition">
              <LifeBuoy className="w-4 h-4" /> <span className="hidden sm:inline">Ayuda</span>
            </Link>
            <span className="bg-secondary/15 text-secondary px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
              Tenant: { (session as any)?.tenantSlug || "public" }
            </span>
          </div>
        </header>

        {/* Dynamic page render */}
        <main className="flex-1 overflow-y-auto p-8">
          {roleBlocked ? (
            <div className="py-16 text-center text-sm text-muted-foreground italic">
              No tenés acceso a esta sección. Redirigiendo…
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* First-time onboarding tour (auto-opens once per user; replayable from Help) */}
      <OnboardingTour />

      {/* PWA: registro del service worker + indicador de sincronización offline */}
      <PwaRegister />
      <OfflineSync />
    </div>
  );
}
