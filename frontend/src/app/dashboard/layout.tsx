"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { LogOut, ShieldCheck, User, Settings, LifeBuoy, Menu, X, ChevronDown } from "lucide-react";
import OnboardingTour from "@/components/onboarding-tour";
import PwaRegister from "@/components/pwa-register";
import OfflineSync from "@/components/offline-sync";
import FieldAuditorShell from "@/components/field-auditor-shell";
import PlanAviso from "@/components/plan-aviso";
import { INICIO, NAV_GROUPS, grupoDeRuta, type NavItem } from "@/lib/nav-groups";

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

// Rutas que no son módulos y por lo tanto no las recorta ni el perfil ni la
// edición. Quién puede hacer qué dentro de ellas lo decide el backend: la
// consola de superadmin y los endpoints de Configuración exigen el rol por su
// cuenta, y el menú solo muestra sus enlaces a quien corresponde.
//
// Configuración tiene que estar acá. Al aparecer las ediciones, `allowedPaths`
// dejó de ser `null` para los administradores, y como /dashboard/settings no es
// la ruta de ningún módulo, el admin de una organización con edición quedaba
// expulsado de Configuración: justo la pantalla desde la que se cambia la
// edición. Elegir el alcance equivocado no tiene que ser un camino sin vuelta.
const ALWAYS_PATHS = [
  "/dashboard/profile",
  "/dashboard/ayuda",
  "/dashboard/settings",
  "/dashboard/admin",
];
// Tiene que coincidir con FULL_ROLES de backend/app/data/modules_catalog.py.
// `superadmin_impersonation` faltaba acá: el backend le daba acceso a todo y
// esta pantalla no le mostraba ningún módulo, así que impersonar un tenant
// terminaba siempre en Mi Perfil con el menú vacío. La prueba
// backend/tests/test_impersonacion.py compara las dos listas.
const FULL_ROLES = ["admin", "superadmin", "superadmin_impersonation"];

// Piso mínimo de secciones para que agrupar tenga sentido (ver `navPlana`).
const UMBRAL_AGRUPAR = 4;

// Cuántos módulos tiene que haber por grupo, en promedio, para que agrupar
// ahorre lectura en vez de agregarla. Con la edición Auditorías quedan 5
// módulos repartidos en 4 grupos: cuatro encabezados para abrir y cerrar, de
// uno o dos ítems cada uno. Eso es más trabajo que una lista de cinco.
const MINIMO_POR_GRUPO = 2;

// Preferencia por usuario-navegador: qué grupos del menú quedaron abiertos.
const NAV_ABIERTOS_KEY = "sgna_nav_grupos_v1";

// Asistente de alta: una sola pregunta, qué edición usa la organización.
const WIZARD_PATH = "/dashboard/wizard";

// "/dashboard" (Inicio) matchea solo exacto; el resto por prefijo.
const pathMatches = (allowed: string[], path: string): boolean =>
  allowed.some((p) =>
    p === "/dashboard" ? path === "/dashboard" : path === p || path.startsWith(p + "/")
  );

/** Un enlace del menú. Se usa igual dentro de un grupo que suelto. */
function EnlaceNav({ item, pathname }: { item: NavItem; pathname: string }) {
  const Icon = item.icon;
  // Inicio solo matchea exacto; el resto también en sus subrutas, para que el
  // detalle de una auditoría siga marcando su sección en el menú.
  const isActive =
    item.path === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === item.path || pathname.startsWith(item.path + "/");
  return (
    <Link
      href={item.path}
      aria-current={isActive ? "page" : undefined}
      /* px-3 y no px-4: con la barra en 256px, «Aprobaciones de Calidad» se
         cortaba justo en la palabra que importa. */
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
        isActive
          ? "bg-secondary text-primary-foreground shadow"
          : "hover:bg-white/10 text-primary-foreground/80 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4 flex-none" />
      <span className="truncate">{item.name}</span>
    </Link>
  );
}

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

  // Sidebar como cajón en móvil: fuera de pantalla salvo que se abra. En
  // escritorio (lg+) es columna fija y este estado no se usa.
  const [navOpen, setNavOpen] = React.useState(false);

  // Navegar cierra el cajón: si no, queda tapando la sección recién abierta.
  React.useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  // Escape cierra, como cualquier capa modal.
  React.useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  // Config de permisos por perfil del tenant (la administra el admin en
  // Configuración → Permisos y Perfiles). Se lee una vez al montar.
  const [permConfig, setPermConfig] = React.useState<Record<string, string[]> | null>(null);
  const [fieldRoles, setFieldRoles] = React.useState<string[]>(["auditor"]); // perfiles con app móvil
  // Módulos que habilita la EDICIÓN contratada. null = sin recorte (completa).
  const [edicionModulos, setEdicionModulos] = React.useState<string[] | null>(null);
  // Si la organización todavía no eligió edición, al admin se le pregunta una vez.
  const [edicionElegida, setEdicionElegida] = React.useState(true);
  // La consulta terminó (bien o mal). Sin esto, un fallo de red dejaba a los
  // perfiles restringidos en «Cargando…» para siempre.
  const [permListo, setPermListo] = React.useState(false);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    const token = (session as any)?.accessToken;
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1/tenant/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.permissions) setPermConfig(d.permissions);
        if (Array.isArray(d?.profiles)) {
          setFieldRoles(d.profiles.filter((p: any) => p.field).map((p: any) => p.key));
        }
        if (d) {
          setEdicionModulos(Array.isArray(d.edicion_modulos) ? d.edicion_modulos : null);
          setEdicionElegida(d.edicion_elegida !== false);
        }
      })
      .catch(() => {})
      .finally(() => setPermListo(true));
  }, [status, session]);

  // Grupos abiertos del menú. Arranca todo cerrado salvo el grupo de la sección
  // actual; lo que el usuario abre o cierra a mano se recuerda entre sesiones.
  const [abiertos, setAbiertos] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    // En ventana privada o con el almacenamiento bloqueado esto tira: el menú
    // tiene que seguir funcionando igual, solo sin recordar nada.
    try {
      const guardado = window.localStorage.getItem(NAV_ABIERTOS_KEY);
      if (guardado) setAbiertos(JSON.parse(guardado) || {});
    } catch {
      /* sin preferencia guardada */
    }
  }, []);

  // El grupo de la sección actual se abre solo: entrar por un enlace directo,
  // recargar o volver con el botón de atrás no debe dejar el menú sin mostrar
  // dónde está parado el usuario. No se persiste —es estado derivado de la ruta.
  React.useEffect(() => {
    const id = grupoDeRuta(pathname);
    if (!id) return;
    setAbiertos((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }, [pathname]);

  const alternarGrupo = (id: string) => {
    setAbiertos((prev) => {
      const siguiente = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(NAV_ABIERTOS_KEY, JSON.stringify(siguiente));
      } catch {
        /* no se puede recordar; el menú funciona igual */
      }
      return siguiente;
    });
  };

  const isFull = !userRole || FULL_ROLES.includes(userRole);
  const isFieldRole = !!userRole && fieldRoles.includes(userRole);

  // Rutas permitidas: intersección de la EDICIÓN contratada y el ALCANCE DEL
  // PERFIL, igual que `allowed_modules_for_role` en el backend. null => sin
  // restricción. Un rol restringido sin config conocida queda con acceso vacío
  // (coherente con el enforcement del backend), nunca con acceso total.
  //
  // La edición aplica también a admin/superadmin: no tienen límite de perfil,
  // pero sí de lo que la organización contrató.
  const allowedPaths = React.useMemo<string[] | null>(() => {
    const aRutas = (keys: string[]) =>
      keys.map((k) => MODULE_PATH[k]).filter(Boolean) as string[];

    const porEdicion = edicionModulos === null ? null : aRutas(edicionModulos);
    const porPerfil = isFull
      ? null
      : aRutas(permConfig?.[userRole!] ?? DEFAULT_ROLE_MODULES[userRole!] ?? []);

    if (porEdicion === null && porPerfil === null) return null;
    const interseccion =
      porEdicion === null
        ? porPerfil!
        : porPerfil === null
          ? porEdicion
          : porPerfil.filter((p) => porEdicion.includes(p));
    return [...interseccion, ...ALWAYS_PATHS];
  }, [isFull, userRole, permConfig, edicionModulos]);

  const isAllowed = (path: string) => allowedPaths === null || pathMatches(allowedPaths, path);

  // Primer destino permitido del rol (evita bucles de redirección si, por
  // ejemplo, se desactivó "Inicio" para el perfil). Perfil siempre está.
  const landingPath = React.useMemo(() => {
    if (allowedPaths === null || allowedPaths.includes("/dashboard")) return "/dashboard";
    const firstModule = allowedPaths.find((p) => !ALWAYS_PATHS.includes(p));
    return firstModule || "/dashboard/profile";
  }, [allowedPaths]);

  // El asistente de alta es una ruta del dashboard, pero se dibuja sin la
  // consola alrededor: es la pantalla donde todavía no se decidió qué módulos
  // hay, así que mostrar el menú detrás sería mostrar justo lo que se pregunta.
  const enAsistente = pathname === WIZARD_PATH;

  // Roles restringidos: si abren algo fuera de su alcance, van a su destino
  // seguro. El asistente queda exento: no es un módulo.
  const outOfScope = !enAsistente && allowedPaths !== null && !isAllowed(pathname);
  React.useEffect(() => {
    if (status !== "authenticated") return;
    if (outOfScope) router.replace(landingPath);
  }, [status, outOfScope, landingPath, router]);

  // La organización todavía no eligió edición: se le pregunta una vez, y solo
  // a quien puede contestarla. Para el resto no cambia nada —sin edición
  // elegida el backend resuelve «completa», así que nadie queda sin acceso.
  const debeElegirEdicion = permListo && !edicionElegida && isFull && !isFieldRole;
  React.useEffect(() => {
    if (status !== "authenticated") return;
    if (debeElegirEdicion && !enAsistente) router.replace(WIZARD_PATH);
  }, [status, debeElegirEdicion, enAsistente, router]);

  // Esperamos la sesión y la config del tenant: sin esto, un admin de una
  // organización con edición «Auditorías» veía por un instante los 22 módulos,
  // y un perfil restringido la consola completa.
  if (status === "loading" || !permListo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 text-sm text-muted-foreground italic">
        Cargando…
      </div>
    );
  }

  if (enAsistente) return <>{children}</>;

  // Perfil de campo (auditor u otro con `field`) → cáscara móvil exclusiva.
  if (isFieldRole) {
    return (
      <FieldAuditorShell>
        {outOfScope ? (
          <div className="py-16 text-center text-sm text-muted-foreground italic">
            Redirigiendo a tus auditorías…
          </div>
        ) : (
          children
        )}
      </FieldAuditorShell>
    );
  }

  // Ítems sueltos: Inicio arriba de los grupos, la consola de superadmin al final.
  const itemsSueltos: NavItem[] = [INICIO];
  if (userRole === "superadmin") {
    itemsSueltos.push({
      key: "admin",
      name: "Consola de Superadmin",
      path: "/dashboard/admin",
      icon: ShieldCheck,
    });
  }

  // Cada rol ve solo las secciones de su alcance (admin/superadmin: todas). Un
  // grupo que se queda sin ítems no se dibuja: un encabezado vacío haría pensar
  // que falta un permiso cuando el módulo simplemente no es de ese perfil.
  const sueltosVisibles = itemsSueltos.filter((item) => isAllowed(item.path));
  const gruposVisibles = NAV_GROUPS
    .map((grupo) => ({ ...grupo, items: grupo.items.filter((item) => isAllowed(item.path)) }))
    .filter((grupo) => grupo.items.length > 0);

  const totalVisible =
    sueltosVisibles.length + gruposVisibles.reduce((n, g) => n + g.items.length, 0);

  // Agrupar solo cuando reduce lectura. No alcanza con un número fijo: lo que
  // estorba no es tener pocos módulos sino tener pocos POR GRUPO, y eso depende
  // de cuántos grupos sobrevivieron al recorte de la edición y del perfil.
  const navPlana =
    totalVisible <= Math.max(UMBRAL_AGRUPAR, gruposVisibles.length * MINIMO_POR_GRUPO);

  return (
    <div className="min-h-screen flex bg-muted/30 font-sans text-surface-foreground">
      {/* Telón del cajón móvil. Solo existe mientras está abierto y nunca en lg+. */}
      {navOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar navigation. En móvil es un cajón deslizante; desde lg queda fija.
          `overflow-y-auto` porque los 22 módulos no entran en una pantalla baja. */}
      <aside
        id="nav-principal"
        className={`fixed inset-y-0 left-0 z-40 w-64 max-w-[85vw] overflow-y-auto overscroll-contain bg-primary text-primary-foreground flex flex-col justify-between shadow-xl transition-transform duration-200 ease-out lg:static lg:z-20 lg:max-w-none lg:translate-x-0 lg:transition-none ${
          navOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-4 border-b border-white/10">
            {/* Con el cajón abierto, el botón del header queda debajo: el cierre
                tiene que estar acá adentro, no solo en el telón. */}
            <div className="flex justify-end lg:hidden -mt-1 mb-1">
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Cerrar menú"
                className="p-2 -mr-2 rounded-lg text-primary-foreground/70 hover:bg-white/10 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-white rounded-xl px-3 py-2.5 flex items-center justify-center shadow-sm">
              <img src="/logo-auditorias.png" alt="Auditorías en Línea" className="h-11 w-auto object-contain" />
            </div>
            {/* Decía "SaaS Multitenant": jerga de quien construye la plataforma,
                no de quien la usa. Y tiene que seguir a la edición: anunciar un
                "sistema de gestión integrado" en una consola que solo audita es
                prometer veintidós secciones y mostrar seis. */}
            <span className="text-[10px] text-primary-foreground/50 block text-center mt-2 uppercase tracking-wider">
              {edicionModulos === null ? "Sistema de Gestión Integrado" : "Auditorías Internas"}
            </span>
          </div>

          {/* Nav items: Inicio suelto, después los grupos colapsables. */}
          <nav className="p-4 space-y-1">
            {sueltosVisibles.map((item) => (
              <EnlaceNav key={item.path} item={item} pathname={pathname} />
            ))}

            {navPlana
              ? gruposVisibles.flatMap((grupo) =>
                  grupo.items.map((item) => (
                    <EnlaceNav key={item.path} item={item} pathname={pathname} />
                  ))
                )
              : gruposVisibles.map((grupo) => {
                  const abierto = !!abiertos[grupo.id];
                  // El grupo cerrado que contiene la sección actual se marca:
                  // si no, al colapsarlo se pierde toda referencia de dónde está.
                  const contieneActiva = grupo.items.some(
                    (item) => pathname === item.path || pathname.startsWith(item.path + "/")
                  );
                  return (
                    <div key={grupo.id} className="pt-2 first:pt-1">
                      <button
                        type="button"
                        onClick={() => alternarGrupo(grupo.id)}
                        aria-expanded={abierto}
                        aria-controls={`nav-grupo-${grupo.id}`}
                        /* Sin `uppercase tracking-wider`: con la barra en 256px
                           «Diagnóstico y planificación» se cortaba a
                           «DIAGNÓSTICO Y PLANIFIC…», que es justo la palabra
                           que distingue el grupo. */
                        className="w-full flex items-center justify-between gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-primary-foreground/55 hover:text-white hover:bg-white/5 transition"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="truncate">{grupo.label}</span>
                          {!abierto && contieneActiva && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-secondary flex-none"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 flex-none transition-transform ${
                            abierto ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </button>
                      {abierto && (
                        <div id={`nav-grupo-${grupo.id}`} className="mt-1 space-y-1">
                          {grupo.items.map((item) => (
                            <EnlaceNav key={item.path} item={item} pathname={pathname} />
                          ))}
                        </div>
                      )}
                    </div>
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
        <header className="h-16 bg-white dark:bg-zinc-950 border-b border-border flex items-center justify-between gap-2 px-4 lg:px-8 relative z-10 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              aria-label={navOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={navOpen}
              aria-controls="nav-principal"
              className="lg:hidden -ml-1 p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
            >
              {navOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <ShieldCheck className="w-5 h-5 flex-none text-secondary" />
            <h2 className="font-bold text-sm tracking-wide text-muted-foreground uppercase truncate">
              Consola de Operaciones
            </h2>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold flex-none">
            <Link href="/dashboard/ayuda" title="Centro de Ayuda" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-secondary transition">
              <LifeBuoy className="w-4 h-4" /> <span className="hidden sm:inline">Ayuda</span>
            </Link>
            <span className="hidden sm:inline bg-secondary/15 text-secondary px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
              Tenant: { (session as any)?.tenantSlug || "public" }
            </span>
          </div>
        </header>

        {/* Dynamic page render */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Aviso de plan: se muestra solo si la prueba está por vencer o si,
              vencida, hay algún tope superado. Va acá para que aparezca en
              todas las secciones del panel, no solo en el inicio. */}
          <PlanAviso />
          {outOfScope ? (
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
