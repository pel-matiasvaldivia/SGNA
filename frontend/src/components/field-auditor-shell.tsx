"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ClipboardList, LifeBuoy, User, LogOut, HardHat } from "lucide-react";
import PwaRegister from "@/components/pwa-register";
import OfflineSync from "@/components/offline-sync";

/**
 * Cáscara móvil EXCLUSIVA para el rol `auditor` (auditor en campo).
 *
 * En lugar de la consola web completa (sidebar con 20+ módulos), presenta una
 * experiencia tipo app: barra superior compacta + navegación inferior con solo
 * las secciones que el auditor necesita en sitio. El bloqueo de rutas ajenas lo
 * hace el DashboardLayout; acá solo va la presentación.
 */
const tabs = [
  { name: "Auditorías", path: "/dashboard/mis-auditorias", icon: ClipboardList },
  { name: "Ayuda", path: "/dashboard/ayuda", icon: LifeBuoy },
  { name: "Perfil", path: "/dashboard/profile", icon: User },
];

export default function FieldAuditorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const isActive = (p: string) => pathname === p || pathname.startsWith(p + "/");

  return (
    <div className="min-h-screen flex flex-col bg-muted/20 font-sans text-surface-foreground">
      {/* Top app bar */}
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md">
        <div className="flex items-center justify-between gap-2 px-4 h-14 max-w-md mx-auto w-full">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-white rounded-lg p-1 flex-none shadow-sm">
              <img src="/logo-auditorias.png" alt="Auditorías en Línea" className="h-6 w-auto object-contain" />
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-sm font-bold flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-secondary" /> Auditor en Campo
              </p>
              <p className="text-[10px] text-primary-foreground/70 truncate">
                {session?.user?.email || "…"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="flex-none inline-flex items-center gap-1.5 text-xs font-semibold text-primary-foreground/80 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-5 pb-24">
        {children}
      </main>

      {/* Bottom navigation (patrón app móvil) */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-white dark:bg-zinc-950 border-t border-border shadow-[0_-2px_8px_rgba(15,32,54,.06)]">
        <div className="max-w-md mx-auto grid grid-cols-3">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = isActive(t.path);
            return (
              <Link
                key={t.path}
                href={t.path}
                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                <span>{t.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* PWA + sincronización offline (clave para auditar sin conexión) */}
      <PwaRegister />
      <OfflineSync />
    </div>
  );
}
