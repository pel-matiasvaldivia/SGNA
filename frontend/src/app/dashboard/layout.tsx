"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { FolderClosed, CheckSquare, AlertOctagon, Home, LogOut, ShieldCheck, User } from "lucide-react";

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

  const navItems = [
    { name: "Inicio", path: "/dashboard", icon: Home },
    { name: "Gestión Documental (DMS)", path: "/dashboard/documents", icon: FolderClosed },
    { name: "Aprobaciones de Calidad", path: "/dashboard/approvals", icon: CheckSquare },
    { name: "No Conformidades (ISO 9001)", path: "/dashboard/iso9001", icon: AlertOctagon },
  ];

  if (userRole === "superadmin") {
    navItems.push({ name: "Consola de Superadmin", path: "/dashboard/admin", icon: ShieldCheck });
  }

  return (
    <div className="min-h-screen flex bg-muted/30 font-sans text-surface-foreground">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col justify-between shadow-xl relative z-20">
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center font-bold text-white text-sm shadow">
              AeL
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm block">AuditoríasEnLínea</span>
              <span className="text-xs text-primary-foreground/60 block">SaaS Multitenant</span>
            </div>
          </div>

          {/* Nav items */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
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
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 mb-3">
            <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div className="overflow-hidden">
              <span className="font-semibold text-xs block truncate">
                {session?.user?.email || "Cargando..."}
              </span>
              <span className="text-[10px] text-primary-foreground/60 block uppercase truncate">
                { (session as any)?.tenantSlug || "default" }
              </span>
            </div>
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
            <span className="bg-secondary/15 text-secondary px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
              Tenant: { (session as any)?.tenantSlug || "public" }
            </span>
          </div>
        </header>

        {/* Dynamic page render */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
