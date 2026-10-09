"use client";

import React from "react";
import { useSession } from "next-auth/react";
import {
  Building2,
  Check,
  Loader2,
  MapPin,
  Navigation,
  Pencil,
  Phone,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";

/**
 * Cartera de empresas auditadas.
 *
 * La plataforma asumía que la organización auditaba su propia casa: la ficha
 * de la organización era a la vez quién usa el sistema y qué se audita. Un
 * auditor externo con varios clientes mandaba a su equipo al domicilio de su
 * propio estudio. Acá se cargan los clientes, y cada asignación apunta a uno.
 *
 * El formulario pide una sola cosa obligatoria —el nombre— y el resto es
 * opcional a propósito: una empresa se da de alta en el momento en que entra
 * el trabajo, muchas veces con el domicilio todavía sin confirmar, y obligar a
 * completar diez campos para poder planificar la visita hace que se cargue
 * cualquier cosa con tal de seguir.
 */

type Empresa = {
  id: string;
  nombre: string;
  identificacion?: string | null;
  actividad?: string | null;
  domicilio?: string | null;
  lat?: number | null;
  lng?: number | null;
  telefono?: string | null;
  contacto_nombre?: string | null;
  contacto_cargo?: string | null;
  contacto_telefono?: string | null;
  contacto_email?: string | null;
  notas?: string | null;
  activa: boolean;
  mapa_url?: string | null;
  auditorias?: number | null;
};

const VACIA = {
  nombre: "",
  identificacion: "",
  actividad: "",
  domicilio: "",
  telefono: "",
  contacto_nombre: "",
  contacto_cargo: "",
  contacto_telefono: "",
  contacto_email: "",
  notas: "",
};

const api = (ruta: string) => `${process.env.NEXT_PUBLIC_API_URL || ""}/api/v1${ruta}`;

export default function EmpresasAuditadas() {
  const { data: session } = useSession();
  const token = (session as any)?.accessToken;

  const [empresas, setEmpresas] = React.useState<Empresa[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [verInactivas, setVerInactivas] = React.useState(false);
  const [form, setForm] = React.useState({ ...VACIA });
  const [editando, setEditando] = React.useState<string | null>(null);
  const [abierto, setAbierto] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const cabeceras = React.useMemo(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token]
  );

  const traer = React.useCallback(async () => {
    if (!token) return;
    try {
      const r = await fetch(api(`/auditorias/empresas?incluir_inactivas=${verInactivas}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setEmpresas(await r.json());
    } catch {
      /* el estado vacío ya explica que no hay nada */
    } finally {
      setCargando(false);
    }
  }, [token, verInactivas]);

  React.useEffect(() => {
    traer();
  }, [traer]);

  const limpiar = () => {
    setForm({ ...VACIA });
    setEditando(null);
    setAbierto(false);
    setError(null);
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError(null);
    // Las cadenas vacías se mandan como null: un domicilio "" no es un
    // domicilio, y guardado así el enriquecido lo tomaría como cargado.
    const cuerpo: any = {};
    Object.entries(form).forEach(([k, v]) => {
      cuerpo[k] = (v || "").trim() || null;
    });
    cuerpo.nombre = (form.nombre || "").trim();
    try {
      const r = await fetch(
        editando ? api(`/auditorias/empresas/${editando}`) : api("/auditorias/empresas"),
        { method: editando ? "PATCH" : "POST", headers: cabeceras, body: JSON.stringify(cuerpo) }
      );
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d?.detail || "No se pudo guardar la empresa.");
      limpiar();
      traer();
    } catch (err: any) {
      setError(err?.message || "No se pudo guardar la empresa.");
    } finally {
      setGuardando(false);
    }
  };

  const editar = (e: Empresa) => {
    setForm({
      nombre: e.nombre || "",
      identificacion: e.identificacion || "",
      actividad: e.actividad || "",
      domicilio: e.domicilio || "",
      telefono: e.telefono || "",
      contacto_nombre: e.contacto_nombre || "",
      contacto_cargo: e.contacto_cargo || "",
      contacto_telefono: e.contacto_telefono || "",
      contacto_email: e.contacto_email || "",
      notas: e.notas || "",
    });
    setEditando(e.id);
    setAbierto(true);
    setError(null);
  };

  const alternarActiva = async (e: Empresa) => {
    await fetch(api(`/auditorias/empresas/${e.id}`), {
      method: "PATCH",
      headers: cabeceras,
      body: JSON.stringify({ activa: !e.activa }),
    });
    traer();
  };

  const borrar = async (e: Empresa) => {
    if (!confirm(`¿Borrar «${e.nombre}» de la cartera?`)) return;
    const r = await fetch(api(`/auditorias/empresas/${e.id}`), {
      method: "DELETE",
      headers: cabeceras,
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      // El backend no deja borrar una empresa con auditorías: ofrecemos acá
      // mismo la salida que corresponde, en vez de dejar al usuario con un
      // error y sin saber qué hacer.
      if (r.status === 409 && confirm(`${d.detail}\n\n¿Querés desactivarla ahora?`)) {
        await alternarActiva(e);
        return;
      }
      alert(d?.detail || "No se pudo borrar la empresa.");
      return;
    }
    traer();
  };

  const campo = (
    id: keyof typeof VACIA,
    etiqueta: string,
    extra: React.InputHTMLAttributes<HTMLInputElement> = {}
  ) => (
    <div>
      <label htmlFor={`emp-${id}`} className="block text-xs font-semibold text-muted-foreground mb-1">
        {etiqueta}
      </label>
      <input
        id={`emp-${id}`}
        value={form[id]}
        onChange={(ev) => setForm({ ...form, [id]: ev.target.value })}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
        {...extra}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <h3 className="font-bold text-lg">Empresas auditadas</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tus clientes. Cada auditoría apunta a una, y el auditor de campo recibe{" "}
            <strong>el nombre y el domicilio de esa empresa</strong> —en la app y en el correo
            de asignación— en vez de los de tu organización. Si auditás tu propia casa, no
            hace falta cargar nada acá.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (abierto ? limpiar() : setAbierto(true))}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow-sm hover:brightness-110 transition flex-none"
        >
          {abierto ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {abierto ? "Cancelar" : "Agregar empresa"}
        </button>
      </div>

      {abierto && (
        <form
          onSubmit={guardar}
          className="bg-white dark:bg-zinc-950 rounded-xl border border-border p-5 space-y-4 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {editando ? "Editar empresa" : "Nueva empresa"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campo("nombre", "Nombre *", { required: true, placeholder: "Bodega La Esperanza" })}
            {campo("identificacion", "CUIT / identificación", { placeholder: "30-12345678-9" })}
          </div>
          {campo("actividad", "A qué se dedica", {
            placeholder: "Elaboración de vinos · Metalurgia · Transporte de carga",
          })}

          <div className="pt-2 border-t border-border space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Dónde se audita
            </p>
            {campo("domicilio", "Domicilio", {
              placeholder: "Ruta 40 Sur 2200, Luján de Cuyo, Mendoza",
            })}
            {form.domicilio.trim() && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(form.domicilio)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
              >
                <Navigation className="w-3.5 h-3.5" /> Comprobar que el mapa lo encuentra
              </a>
            )}
            {campo("telefono", "Teléfono de la empresa", { placeholder: "261 499-1000" })}
          </div>

          <div className="pt-2 border-t border-border space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Con quién hablar al llegar
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {campo("contacto_nombre", "Referente", { placeholder: "Ramiro Ponce" })}
              {campo("contacto_cargo", "Cargo", { placeholder: "Jefe de Planta" })}
              {campo("contacto_telefono", "Teléfono del referente", { placeholder: "261 555-7777" })}
              {campo("contacto_email", "Correo del referente", { type: "email" })}
            </div>
          </div>

          {campo("notas", "Notas internas", { placeholder: "Acceso por portón 3, pedir casco" })}

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando || !form.nombre.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-white text-sm font-semibold disabled:opacity-40 transition"
            >
              {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editando ? "Guardar cambios" : "Agregar a la cartera"}
            </button>
            <button
              type="button"
              onClick={limpiar}
              className="px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={verInactivas}
          onChange={(e) => setVerInactivas(e.target.checked)}
          className="rounded border-border"
        />
        Mostrar también las empresas desactivadas
      </label>

      {cargando ? (
        <p className="text-sm text-muted-foreground italic">Cargando…</p>
      ) : empresas.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-dashed border-border p-8 text-center space-y-2">
          <Building2 className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-semibold">Todavía no cargaste ninguna empresa</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Si auditás tu propia organización no hace falta: las asignaciones usan el
            domicilio y el contacto de tu ficha. Cargá empresas solo si auditás a terceros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {empresas.map((e) => (
            <div
              key={e.id}
              className={`bg-white dark:bg-zinc-950 rounded-xl border border-border p-4 shadow-sm space-y-3 ${
                e.activa ? "" : "opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-bold text-sm truncate">{e.nombre}</h4>
                  {e.actividad && (
                    <p className="text-xs text-muted-foreground truncate">{e.actividad}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-none">
                  {!e.activa && (
                    <span className="text-[10px] font-bold uppercase bg-muted text-muted-foreground px-2 py-1 rounded-full">
                      Desactivada
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => editar(e)}
                    aria-label={`Editar ${e.nombre}`}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => alternarActiva(e)}
                    aria-label={e.activa ? `Desactivar ${e.nombre}` : `Reactivar ${e.nombre}`}
                    title={e.activa ? "Desactivar (sale del selector)" : "Reactivar"}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => borrar(e)}
                    aria-label={`Borrar ${e.nombre}`}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                {e.domicilio ? (
                  <p className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 flex-none mt-0.5" />
                    <span>{e.domicilio}</span>
                    {e.mapa_url && (
                      <a
                        href={e.mapa_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-secondary font-semibold hover:underline flex-none"
                      >
                        mapa
                      </a>
                    )}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-amber-600">
                    <MapPin className="w-3.5 h-3.5 flex-none" />
                    Sin domicilio: el auditor no va a saber a dónde ir
                  </p>
                )}
                {e.contacto_nombre ? (
                  <p className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 flex-none" />
                    {e.contacto_nombre}
                    {e.contacto_cargo ? ` · ${e.contacto_cargo}` : ""}
                    {e.contacto_telefono ? ` · ${e.contacto_telefono}` : ""}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-amber-600">
                    <Phone className="w-3.5 h-3.5 flex-none" />
                    Sin referente en sitio
                  </p>
                )}
              </div>

              <p className="text-[11px] text-muted-foreground pt-2 border-t border-border">
                {e.auditorias ? `${e.auditorias} auditoría(s) asignada(s)` : "Sin auditorías todavía"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
