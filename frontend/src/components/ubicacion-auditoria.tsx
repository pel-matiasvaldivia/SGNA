"use client";

import React from "react";
import { Building2, Clock, MapPin, Navigation, Phone, Mail, User, Target } from "lucide-react";

/**
 * Para dónde sale el auditor y a quién busca al llegar.
 *
 * Antes el listado mostraba el ÁREA auditada al lado de un ícono de mapa, que
 * no es una ubicación: el auditor sabía qué tenía que auditar pero no a qué
 * domicilio ir. Esto muestra los datos reales —organización, domicilio con pin,
 * horario, referente en sitio y alcance— y los resuelve el backend, así que
 * quedan en la copia offline y están disponibles sin señal.
 *
 * El teléfono y el mapa son enlaces nativos (`tel:` y la URL universal de
 * Google Maps): en el celular abren el discador y el mapa directamente, que es
 * lo que hace falta estando en la calle.
 */

export interface UbicacionAuditoria {
  organizacion?: string | null;
  // A qué se dedica la empresa auditada. Orienta qué mirar al llegar, sobre
  // todo al auditor externo que esta semana audita una bodega y la próxima un
  // frigorífico.
  empresa_actividad?: string | null;
  lugar_nombre?: string | null;
  direccion?: string | null;
  mapa_url?: string | null;
  jornada?: string | null;
  contacto?: {
    nombre?: string | null;
    cargo?: string | null;
    telefono?: string | null;
    email?: string | null;
    de_la_organizacion?: boolean;
    // "asignacion" | "empresa" | "organizacion": de dónde salió el referente.
    origen?: string;
  } | null;
  programa_alcance?: string | null;
}

/** Fila compacta para la tarjeta del listado. */
export function UbicacionResumen({ a }: { a: UbicacionAuditoria }) {
  const contacto = a.contacto;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {a.organizacion && (
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <Building2 className="w-3.5 h-3.5 text-primary" /> {a.organizacion}
        </span>
      )}
      {a.jornada && (
        <span className="inline-flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-primary" /> {a.jornada}
        </span>
      )}
      {a.direccion ? (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" /> {a.direccion}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-amber-700">
          <MapPin className="w-3.5 h-3.5" /> Sin domicilio cargado
        </span>
      )}
      {contacto?.nombre && (
        <span className="inline-flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-primary" /> {contacto.nombre}
        </span>
      )}
      {a.mapa_url && (
        <a
          href={a.mapa_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
        >
          <Navigation className="w-3.5 h-3.5" /> Ver en el mapa
        </a>
      )}
    </div>
  );
}

/** Bloque completo para la pantalla de ejecución. */
export function UbicacionDetalle({ a }: { a: UbicacionAuditoria }) {
  const contacto = a.contacto;
  const hayContacto = !!(contacto?.nombre || contacto?.telefono || contacto?.email);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Dónde */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-primary" /> Dónde
        </p>
        {a.organizacion && (
          <p className="text-sm font-bold text-foreground mt-1.5">{a.organizacion}</p>
        )}
        {a.empresa_actividad && (
          <p className="text-[11px] text-muted-foreground">{a.empresa_actividad}</p>
        )}
        {a.lugar_nombre && (
          <p className="text-xs font-semibold text-foreground mt-0.5">{a.lugar_nombre}</p>
        )}
        {a.direccion ? (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.direccion}</p>
        ) : (
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Todavía no hay domicilio cargado. Pedíselo al auditor líder antes de salir.
          </p>
        )}
        {a.jornada && (
          <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" /> {a.jornada}
          </p>
        )}
        {a.mapa_url && (
          <a
            href={a.mapa_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition shadow-sm"
          >
            <Navigation className="w-4 h-4" /> Abrir en el mapa
          </a>
        )}
      </div>

      {/* Con quién hablar */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-primary" /> Con quién hablar
        </p>
        {hayContacto ? (
          <>
            {contacto?.nombre && (
              <p className="text-sm font-bold text-foreground mt-1.5">{contacto.nombre}</p>
            )}
            {contacto?.cargo && (
              <p className="text-xs text-muted-foreground mt-0.5">{contacto.cargo}</p>
            )}
            {contacto?.telefono && (
              <a
                href={`tel:${contacto.telefono.replace(/\s/g, "")}`}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Phone className="w-3.5 h-3.5" /> {contacto.telefono}
              </a>
            )}
            {contacto?.email && (
              <a
                href={`mailto:${contacto.email}`}
                className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition break-all"
              >
                <Mail className="w-3.5 h-3.5 flex-none" /> {contacto.email}
              </a>
            )}
            {contacto?.de_la_organizacion && (
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed border-l-2 border-primary/30 pl-2">
                {contacto?.origen === "empresa"
                  ? "Es el contacto general de la empresa auditada, no el de esta visita en particular. Al llegar, pedí por el responsable del sector a auditar."
                  : "Es el contacto general de la organización. Al llegar, pedí por el responsable del sector a auditar."}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-amber-700 mt-1.5 leading-relaxed">
            No hay un referente cargado. Pedíselo al auditor líder: sin alguien a
            quien presentarse, el acceso al sitio puede demorarse.
          </p>
        )}
      </div>

      {/* Alcance del programa: qué entra y qué no en esta auditoría. */}
      {a.programa_alcance && (
        <div className="rounded-xl border border-border bg-muted/20 p-4 sm:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary" /> Alcance
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed whitespace-pre-line">
            {a.programa_alcance}
          </p>
        </div>
      )}
    </div>
  );
}
