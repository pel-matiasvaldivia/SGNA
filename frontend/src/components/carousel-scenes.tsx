"use client";

import React from "react";

/**
 * Escenas ilustradas para el carrusel del hero (vectoriales, estilo flat moderno).
 * Full-bleed: llenan el contenedor con preserveAspectRatio="slice".
 * Los sujetos se ubican hacia el centro-derecha para no quedar tapados por la
 * tarjeta de texto de la izquierda.
 */

const svgProps = {
  viewBox: "0 0 800 500",
  preserveAspectRatio: "xMidYMid slice",
  className: "w-full h-full",
  xmlns: "http://www.w3.org/2000/svg",
} as const;

/* ---------- Escena 1: el líder asigna, el auditor de campo ejecuta ---------- */
export function SceneAssign() {
  return (
    <svg {...svgProps} role="img" aria-label="Auditor líder asignando una auditoría a un auditor de campo">
      <defs>
        <linearGradient id="a-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EAF2FC" />
          <stop offset="1" stopColor="#CFE0F5" />
        </linearGradient>
        <linearGradient id="a-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#F1F6FD" />
        </linearGradient>
      </defs>

      <rect width="800" height="500" fill="url(#a-bg)" />
      {/* blobs */}
      <circle cx="700" cy="90" r="150" fill="#007BFF" opacity="0.08" />
      <circle cx="560" cy="420" r="180" fill="#003F87" opacity="0.06" />

      {/* nave / galpón al fondo */}
      <g opacity="0.5">
        <rect x="470" y="250" width="300" height="150" rx="8" fill="#B9D2ED" />
        <path d="M470 250 L560 205 L650 250 Z" fill="#A9C7E8" />
        <path d="M620 250 L710 205 L800 250 L800 260 L620 260 Z" fill="#A9C7E8" />
        <rect x="500" y="300" width="40" height="60" rx="4" fill="#8FB6DF" />
        <rect x="560" y="300" width="40" height="60" rx="4" fill="#8FB6DF" />
      </g>

      {/* piso */}
      <ellipse cx="620" cy="430" rx="240" ry="30" fill="#003F87" opacity="0.07" />

      {/* cajas */}
      <g>
        <rect x="700" y="360" width="70" height="60" rx="4" fill="#E0A24E" />
        <rect x="700" y="360" width="70" height="16" rx="4" fill="#C98A38" />
        <rect x="726" y="360" width="8" height="60" fill="#C98A38" opacity="0.6" />
      </g>

      {/* auditor de campo (derecha) */}
      <g>
        <ellipse cx="600" cy="432" rx="55" ry="12" fill="#003F87" opacity="0.10" />
        {/* piernas */}
        <rect x="580" y="360" width="16" height="70" rx="7" fill="#334155" />
        <rect x="602" y="360" width="16" height="70" rx="7" fill="#3B4A61" />
        {/* chaleco hi-vis */}
        <path d="M566 300 q34 -22 68 0 l6 70 q-40 16 -80 0 Z" fill="#F5A623" />
        <rect x="592" y="298" width="16" height="76" fill="#F7B94E" opacity="0.9" />
        {/* franjas reflectivas */}
        <rect x="570" y="330" width="60" height="7" fill="#EFEFEF" opacity="0.85" />
        <rect x="570" y="348" width="60" height="7" fill="#EFEFEF" opacity="0.85" />
        {/* brazos */}
        <path d="M566 306 q-24 20 -14 46" stroke="#F5A623" strokeWidth="15" fill="none" strokeLinecap="round" />
        <path d="M634 306 q22 18 12 42" stroke="#F5A623" strokeWidth="15" fill="none" strokeLinecap="round" />
        {/* cara */}
        <circle cx="600" cy="272" r="26" fill="#F0C6A0" />
        {/* casco */}
        <path d="M572 268 a28 28 0 0 1 56 0 Z" fill="#FFC107" />
        <rect x="568" y="266" width="64" height="8" rx="4" fill="#E0A800" />
        {/* teléfono en la mano */}
        <g transform="rotate(-12 560 356)">
          <rect x="540" y="330" width="40" height="66" rx="7" fill="#0F172A" />
          <rect x="545" y="337" width="30" height="52" rx="3" fill="#fff" />
          <rect x="549" y="343" width="22" height="4" rx="2" fill="#94A3B8" />
          <circle cx="552" cy="356" r="4" fill="#2E7D32" />
          <rect x="559" y="354" width="12" height="4" rx="2" fill="#CBD5E1" />
          <circle cx="552" cy="368" r="4" fill="#2E7D32" />
          <rect x="559" y="366" width="12" height="4" rx="2" fill="#CBD5E1" />
        </g>
      </g>

      {/* tarjeta flotante: asignación del líder */}
      <g>
        <rect x="428" y="70" width="210" height="96" rx="14" fill="url(#a-card)" stroke="#E2E8F0" />
        {/* avatar líder */}
        <circle cx="458" cy="100" r="16" fill="#003F87" />
        <circle cx="458" cy="95" r="7" fill="#F0C6A0" />
        <path d="M446 108 a12 10 0 0 1 24 0 Z" fill="#DDE7F3" />
        <text x="484" y="96" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="700" fill="#0F172A">Auditor líder</text>
        <text x="484" y="112" fontFamily="system-ui, sans-serif" fontSize="10" fill="#64748B">asignó una auditoría</text>
        <rect x="446" y="126" width="174" height="26" rx="6" fill="#EAF2FC" />
        <circle cx="460" cy="139" r="6" fill="#2E7D32" />
        <path d="M457 139 l2 2 l4 -4" stroke="#fff" strokeWidth="1.6" fill="none" />
        <text x="474" y="143" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="600" fill="#0F172A">Depósito Central · ISO 45001</text>
      </g>

      {/* flecha punteada líder → campo */}
      <path d="M540 168 q30 60 55 100" stroke="#003F87" strokeWidth="2.5" strokeDasharray="4 6" fill="none" opacity="0.55" />
      <path d="M592 262 l6 12 l-13 -2 Z" fill="#003F87" opacity="0.6" />
    </svg>
  );
}

/* ---------- Escena 2: reportes ante la alta dirección ---------- */
export function SceneBoard() {
  return (
    <svg {...svgProps} role="img" aria-label="Auditor líder presentando reportes a la alta dirección">
      <defs>
        <linearGradient id="b-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9F1FF" />
          <stop offset="1" stopColor="#CFE2FB" />
        </linearGradient>
        <linearGradient id="b-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#EEF4FC" />
        </linearGradient>
      </defs>

      <rect width="800" height="500" fill="url(#b-bg)" />
      <circle cx="710" cy="80" r="140" fill="#007BFF" opacity="0.08" />
      <circle cx="520" cy="440" r="170" fill="#003F87" opacity="0.05" />

      {/* pantalla de presentación */}
      <g>
        <rect x="470" y="60" width="300" height="185" rx="12" fill="url(#b-screen)" stroke="#D5E1F0" />
        <rect x="470" y="60" width="300" height="30" rx="12" fill="#003F87" />
        <text x="486" y="80" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="700" fill="#fff">Panel de Cumplimiento</text>
        {/* KPI tiles */}
        <g>
          <rect x="486" y="102" width="80" height="42" rx="6" fill="#EAF7EE" />
          <text x="496" y="122" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="800" fill="#2E7D32">98%</text>
          <text x="496" y="136" fontFamily="system-ui, sans-serif" fontSize="8" fill="#64748B">CUMPLIMIENTO</text>
          <rect x="576" y="102" width="80" height="42" rx="6" fill="#EAF2FC" />
          <text x="586" y="122" fontFamily="system-ui, sans-serif" fontSize="16" fontWeight="800" fill="#003F87">12</text>
          <text x="586" y="136" fontFamily="system-ui, sans-serif" fontSize="8" fill="#64748B">AUDITORÍAS</text>
        </g>
        {/* gráfico de barras */}
        <g>
          <rect x="486" y="156" width="170" height="72" rx="6" fill="#F5F8FD" />
          <rect x="500" y="196" width="16" height="24" rx="2" fill="#007BFF" />
          <rect x="524" y="182" width="16" height="38" rx="2" fill="#007BFF" />
          <rect x="548" y="200" width="16" height="20" rx="2" fill="#94C2F5" />
          <rect x="572" y="172" width="16" height="48" rx="2" fill="#003F87" />
          <rect x="596" y="188" width="16" height="32" rx="2" fill="#007BFF" />
          <rect x="620" y="178" width="16" height="42" rx="2" fill="#003F87" />
        </g>
        {/* línea de tendencia */}
        <polyline points="672,214 692,196 712,204 732,176 752,184" fill="none" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="732" cy="176" r="3.5" fill="#2E7D32" />
      </g>
      {/* pie de la pantalla */}
      <rect x="612" y="245" width="16" height="26" fill="#B9CBE0" />
      <rect x="585" y="271" width="70" height="7" rx="3" fill="#A9BFD8" />

      {/* presentador (líder) */}
      <g>
        <ellipse cx="452" cy="392" rx="46" ry="12" fill="#003F87" opacity="0.10" />
        <rect x="438" y="330" width="15" height="60" rx="7" fill="#243447" />
        <rect x="454" y="330" width="15" height="60" rx="7" fill="#2E4055" />
        {/* saco */}
        <path d="M424 288 q28 -18 56 0 l6 48 q-34 14 -68 0 Z" fill="#003F87" />
        <path d="M452 286 l0 52" stroke="#fff" strokeWidth="2" opacity="0.5" />
        {/* brazo señalando la pantalla */}
        <path d="M480 296 q34 -8 40 -34" stroke="#003F87" strokeWidth="13" fill="none" strokeLinecap="round" />
        <circle cx="524" cy="258" r="7" fill="#F0C6A0" />
        {/* otro brazo */}
        <path d="M424 296 q-16 14 -10 34" stroke="#003F87" strokeWidth="13" fill="none" strokeLinecap="round" />
        {/* cabeza */}
        <circle cx="452" cy="262" r="24" fill="#F0C6A0" />
        <path d="M430 258 a22 22 0 0 1 44 0 q-22 -12 -44 0 Z" fill="#3B2A20" />
      </g>

      {/* mesa + ejecutivos (primer plano) */}
      <g>
        <rect x="470" y="410" width="330" height="90" fill="#D8E3F0" />
        <rect x="470" y="410" width="330" height="12" fill="#C4D4E8" />
        {/* ejecutivo 1 */}
        <g>
          <path d="M540 410 q0 -40 34 -40 q34 0 34 40 Z" fill="#5B6B7F" />
          <circle cx="574" cy="360" r="20" fill="#E8B48C" />
          <path d="M556 356 a18 18 0 0 1 36 0 q-18 -12 -36 0 Z" fill="#2B2B2B" />
        </g>
        {/* ejecutivo 2 */}
        <g>
          <path d="M636 410 q0 -36 30 -36 q30 0 30 36 Z" fill="#7A5C46" />
          <circle cx="666" cy="366" r="18" fill="#F0C6A0" />
          <path d="M650 362 a16 16 0 0 1 32 0 q-16 -12 -32 0 Z" fill="#6B4A2E" />
        </g>
        {/* laptop */}
        <rect x="486" y="392" width="40" height="26" rx="2" fill="#1E293B" />
        <rect x="490" y="396" width="32" height="18" rx="1" fill="#38BDF8" opacity="0.7" />
        {/* taza */}
        <circle cx="720" cy="400" r="7" fill="#fff" stroke="#CBD5E1" />
      </g>
    </svg>
  );
}

/* ---------- Escena 3: una plataforma para cualquier empresa ---------- */
export function ScenePlatform() {
  return (
    <svg {...svgProps} role="img" aria-label="Plataforma que sirve para cualquier empresa e industria">
      <defs>
        <linearGradient id="p-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E9F6EE" />
          <stop offset="1" stopColor="#D2ECDB" />
        </linearGradient>
        <linearGradient id="p-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#EFF7F1" />
        </linearGradient>
      </defs>

      <rect width="800" height="500" fill="url(#p-bg)" />
      <circle cx="600" cy="250" r="220" fill="#2E7D32" opacity="0.05" />
      <circle cx="720" cy="90" r="120" fill="#007BFF" opacity="0.07" />

      {/* líneas de conexión al centro */}
      <g stroke="#2E7D32" strokeWidth="2" opacity="0.35" strokeDasharray="3 6" fill="none">
        <path d="M600 250 L470 120" />
        <path d="M600 250 L735 120" />
        <path d="M600 250 L455 340" />
        <path d="M600 250 L745 350" />
      </g>

      {/* tablet central con dashboard */}
      <g>
        <ellipse cx="600" cy="330" rx="120" ry="20" fill="#2E7D32" opacity="0.10" />
        <rect x="516" y="176" width="168" height="150" rx="14" fill="#0F172A" />
        <rect x="524" y="184" width="152" height="134" rx="8" fill="url(#p-screen)" />
        {/* header */}
        <rect x="524" y="184" width="152" height="22" rx="8" fill="#003F87" />
        <circle cx="536" cy="195" r="3.5" fill="#fff" opacity="0.8" />
        <rect x="546" y="192" width="60" height="6" rx="3" fill="#fff" opacity="0.6" />
        {/* tiles */}
        <rect x="534" y="214" width="44" height="34" rx="5" fill="#EAF7EE" />
        <rect x="584" y="214" width="44" height="34" rx="5" fill="#EAF2FC" />
        <rect x="634" y="214" width="34" height="34" rx="5" fill="#FDECEC" />
        {/* mini barras */}
        <rect x="536" y="286" width="10" height="20" rx="2" fill="#2E7D32" />
        <rect x="550" y="278" width="10" height="28" rx="2" fill="#2E7D32" />
        <rect x="564" y="290" width="10" height="16" rx="2" fill="#8ED0A2" />
        <polyline points="590,300 610,286 630,292 662,272" fill="none" stroke="#007BFF" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* industria: fábrica (arriba izq) */}
      <g transform="translate(430 78)">
        <circle cx="24" cy="24" r="30" fill="#fff" stroke="#DCE9E0" />
        <path d="M12 32 L12 20 L20 25 L20 18 L28 23 L28 16 L36 16 L36 32 Z" fill="#003F87" />
        <rect x="14" y="12" width="4" height="6" fill="#94A3B8" />
      </g>
      {/* salud: hospital (arriba der) */}
      <g transform="translate(706 78)">
        <circle cx="24" cy="24" r="30" fill="#fff" stroke="#DCE9E0" />
        <rect x="12" y="14" width="24" height="22" rx="3" fill="#E11D48" opacity="0.9" />
        <rect x="22" y="18" width="4" height="14" fill="#fff" />
        <rect x="17" y="23" width="14" height="4" fill="#fff" />
      </g>
      {/* construcción: grúa (abajo izq) */}
      <g transform="translate(418 300)">
        <circle cx="26" cy="26" r="30" fill="#fff" stroke="#DCE9E0" />
        <rect x="22" y="12" width="5" height="34" fill="#F59E0B" />
        <rect x="12" y="12" width="30" height="5" fill="#F59E0B" />
        <line x1="16" y1="17" x2="16" y2="28" stroke="#334155" strokeWidth="1.5" />
        <rect x="20" y="44" width="14" height="4" fill="#334155" />
      </g>
      {/* servicios/oficina: torre (abajo der) */}
      <g transform="translate(720 320)">
        <circle cx="24" cy="24" r="30" fill="#fff" stroke="#DCE9E0" />
        <rect x="14" y="12" width="20" height="30" rx="2" fill="#007BFF" />
        <rect x="18" y="16" width="4" height="4" fill="#fff" />
        <rect x="26" y="16" width="4" height="4" fill="#fff" />
        <rect x="18" y="24" width="4" height="4" fill="#fff" />
        <rect x="26" y="24" width="4" height="4" fill="#fff" />
        <rect x="18" y="32" width="4" height="4" fill="#fff" />
        <rect x="26" y="32" width="4" height="4" fill="#fff" />
      </g>

      {/* etiqueta flotante */}
      <g>
        <rect x="512" y="352" width="176" height="30" rx="15" fill="#fff" stroke="#DCE9E0" />
        <circle cx="530" cy="367" r="7" fill="#2E7D32" />
        <path d="M527 367 l2 2 l4 -4" stroke="#fff" strokeWidth="1.6" fill="none" />
        <text x="544" y="371" fontFamily="system-ui, sans-serif" fontSize="11" fontWeight="700" fill="#0F172A">Cualquier industria y tamaño</text>
      </g>
    </svg>
  );
}
