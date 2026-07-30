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

// Rutas permitidas para el rol `auditor` (experiencia de campo exclusiva).
const AUDITOR_ALLOWED = ["/dashboard/mis-auditorias", "/dashboard/profile", "/dashboard/ayuda"];
const isAuditorAllowed = (path: string) =>
  AUDITOR_ALLOWED.some((p) => path === p || path.startsWith(p + "/"));

// Rutas permitidas para roles base (empleado). Los roles no listados
// (admin, superadmin) ven la consola completa. Ayuda y Perfil van siempre.
const ROLE_ALLOWED: Record<string, string[]> = {
  empleado: [
    "/dashboard",             // Inicio
    "/dashboard/documents",   // Gestión Documental (DMS)
    "/dashboard/capacitacion",// Planes y Competencias
    "/dashboard/iso9001",     // No Conformidades (reportar)
    "/dashboard/sst",         // Seguridad y Salud (SST)
    "/dashboard/profile",
    "/dashboard/ayuda",
  ],
  // `collaborator` es el rol base heredado: mismo alcance que empleado.
  collaborator: [
    "/dashboard",
    "/dashboard/documents",
    "/dashboard/capacitacion",
    "/dashboard/iso9001",
    "/dashboard/sst",
    "/dashboard/profile",
    "/dashboard/ayuda",
  ],
};

// "/dashboard" (Inicio) matchea solo exacto; el resto por prefijo.
const isPathAllowedForRole = (role: string | undefined, path: string): boolean => {
  const allowed = role ? ROLE_ALLOWED[role] : undefined;
  if (!allowed) return true; // rol sin restricción → todo permitido
  return allowed.some((p) =>
    p === "/dashboard" ? path === "/dashboard" : path === p || path.startsWith(p + "/")
  );
};

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

  // El auditor en campo queda confinado a su módulo: si intenta abrir cualquier
  // otra sección (o cae en el home web), lo devolvemos a "Mis Auditorías".
  const auditorBlocked = userRole === "auditor" && !isAuditorAllowed(pathname);
  // Roles base (empleado/collaborator): si abren una sección fuera de su
  // alcance, los devolvemos al Inicio.
  const roleBlocked = userRole !== "auditor" && !isPathAllowedForRole(userRole, pathname);
  React.useEffect(() => {
    if (status !== "authenticated") return;
    if (auditorBlocked) {
      router.replace("/dashboard/mis-auditorias");
    } else if (roleBlocked) {
      router.replace("/dashboard");
    }
  }, [status, auditorBlocked, roleBlocked, router]);

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

  // Roles base ven solo las secciones de su alcance.
  const visibleNav = navItems.filter((item) => isPathAllowedForRole(userRole, item.path));

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
