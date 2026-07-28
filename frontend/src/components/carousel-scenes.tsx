"use client";

import React from "react";

/**
 * Escenas ilustradas para el carrusel del hero (vectoriales, estilo flat moderno
 * con profundidad: degradados, sombras suaves y luz ambiente).
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
        <linearGradient id="a-bg" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#F2F7FD" />
          <stop offset="0.55" stopColor="#DCE9F8" />
          <stop offset="1" stopColor="#C5DBF2" />
        </linearGradient>
        <radialGradient id="a-glow" cx="0.68" cy="0.32" r="0.5">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="a-vest" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB534" />
          <stop offset="1" stopColor="#F59211" />
        </linearGradient>
        <linearGradient id="a-helmet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD54A" />
          <stop offset="1" stopColor="#F4B400" />
        </linearGradient>
        <linearGradient id="a-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6CDA6" />
          <stop offset="1" stopColor="#E8B387" />
        </linearGradient>
        <linearGradient id="a-card" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F1F6FD" />
        </linearGradient>
        <filter id="a-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#0B2E5C" floodOpacity="0.18" />
        </filter>
        <filter id="a-shadow-sm" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#0B2E5C" floodOpacity="0.16" />
        </filter>
      </defs>

      <rect width="800" height="500" fill="url(#a-bg)" />
      <rect width="800" height="500" fill="url(#a-glow)" />
      {/* blobs decorativos */}
      <circle cx="720" cy="70" r="150" fill="#2E7DF5" opacity="0.09" />
      <circle cx="560" cy="450" r="200" fill="#003F87" opacity="0.06" />
      {/* textura de puntos sutil */}
      <g fill="#003F87" opacity="0.05">
        {Array.from({ length: 5 }).map((_, r) =>
          Array.from({ length: 8 }).map((_, c) => (
            <circle key={`${r}-${c}`} cx={470 + c * 42} cy={70 + r * 42} r="2.2" />
          ))
        )}
      </g>

      {/* nave / galpón al fondo */}
      <g opacity="0.55" filter="url(#a-shadow-sm)">
        <rect x="470" y="248" width="300" height="150" rx="10" fill="#C3D8EF" />
        <path d="M470 248 L560 200 L650 248 Z" fill="#B0CBE9" />
        <path d="M620 248 L710 200 L800 248 L800 258 L620 258 Z" fill="#B0CBE9" />
        <rect x="500" y="300" width="42" height="62" rx="5" fill="#9BBEE3" />
        <rect x="560" y="300" width="42" height="62" rx="5" fill="#9BBEE3" />
        <rect x="700" y="285" width="55" height="40" rx="4" fill="#AECAE7" />
      </g>

      {/* piso con degradé */}
      <ellipse cx="620" cy="432" rx="250" ry="34" fill="#003F87" opacity="0.08" />

      {/* pallet de cajas */}
      <g filter="url(#a-shadow-sm)">
        <rect x="695" y="352" width="78" height="66" rx="5" fill="#E4A85A" />
        <rect x="695" y="352" width="78" height="18" rx="5" fill="#D0913F" />
        <rect x="730" y="352" width="8" height="66" fill="#C9862F" opacity="0.55" />
        <rect x="690" y="418" width="88" height="8" rx="2" fill="#B07636" />
      </g>

      {/* auditor de campo (derecha) */}
      <g filter="url(#a-shadow)">
        <ellipse cx="600" cy="434" rx="58" ry="13" fill="#0B2E5C" opacity="0.14" />
        {/* piernas */}
        <rect x="579" y="356" width="17" height="74" rx="8" fill="#33465F" />
        <rect x="602" y="356" width="17" height="74" rx="8" fill="#41576F" />
        {/* botas */}
        <rect x="576" y="424" width="22" height="12" rx="4" fill="#22303F" />
        <rect x="600" y="424" width="22" height="12" rx="4" fill="#22303F" />
        {/* chaleco hi-vis con degradé */}
        <path d="M565 300 q35 -24 70 0 l7 72 q-42 17 -84 0 Z" fill="url(#a-vest)" />
        <rect x="591" y="298" width="18" height="78" rx="2" fill="#FFC24D" opacity="0.85" />
        {/* franjas reflectivas */}
        <rect x="569" y="330" width="62" height="8" rx="2" fill="#EAF2F7" opacity="0.9" />
        <rect x="569" y="350" width="62" height="8" rx="2" fill="#EAF2F7" opacity="0.9" />
        {/* brazos */}
        <path d="M566 306 q-26 22 -15 50" stroke="url(#a-vest)" strokeWidth="16" fill="none" strokeLinecap="round" />
        <path d="M634 306 q24 20 13 46" stroke="url(#a-vest)" strokeWidth="16" fill="none" strokeLinecap="round" />
        {/* cuello */}
        <rect x="590" y="286" width="20" height="16" rx="6" fill="#E8B387" />
        {/* cara */}
        <circle cx="600" cy="270" r="27" fill="url(#a-skin)" />
        <path d="M600 270 a27 27 0 0 1 0 27 Z" fill="#000" opacity="0.04" />
        {/* casco */}
        <path d="M571 267 a29 29 0 0 1 58 0 Z" fill="url(#a-helmet)" />
        <rect x="567" y="265" width="66" height="9" rx="4" fill="#E4A600" />
        <path d="M578 250 q22 -12 44 0" stroke="#FFE082" strokeWidth="3" fill="none" opacity="0.8" />
        {/* teléfono en la mano con checklist */}
        <g transform="rotate(-11 558 358)" filter="url(#a-shadow-sm)">
          <rect x="538" y="330" width="42" height="70" rx="8" fill="#0F1B2D" />
          <rect x="543" y="337" width="32" height="56" rx="3" fill="#FFFFFF" />
          <rect x="547" y="342" width="24" height="5" rx="2" fill="#003F87" opacity="0.5" />
          <circle cx="550" cy="356" r="4.5" fill="#2E7D32" />
          <path d="M547.5 356 l2 2 l3.5 -3.5" stroke="#fff" strokeWidth="1.4" fill="none" />
          <rect x="558" y="353" width="13" height="4" rx="2" fill="#CBD8E6" />
          <circle cx="550" cy="370" r="4.5" fill="#2E7D32" />
          <path d="M547.5 370 l2 2 l3.5 -3.5" stroke="#fff" strokeWidth="1.4" fill="none" />
          <rect x="558" y="367" width="13" height="4" rx="2" fill="#CBD8E6" />
          <circle cx="550" cy="384" r="4.5" fill="#E2E8F0" />
          <rect x="558" y="381" width="13" height="4" rx="2" fill="#E2E8F0" />
        </g>
      </g>

      {/* tarjeta flotante: asignación del líder */}
      <g filter="url(#a-shadow)">
        <rect x="424" y="66" width="216" height="100" rx="16" fill="url(#a-card)" stroke="#E2ECF7" />
        {/* avatar líder */}
        <circle cx="456" cy="98" r="17" fill="#003F87" />
        <circle cx="456" cy="93" r="7.5" fill="#F6CDA6" />
        <path d="M443 107 a13 11 0 0 1 26 0 Z" fill="#DCE7F5" />
        <text x="484" y="94" fontFamily="system-ui, sans-serif" fontSize="12.5" fontWeight="700" fill="#0F2036">Auditor líder</text>
        <text x="484" y="111" fontFamily="system-ui, sans-serif" fontSize="10" fill="#6B7C90">asignó una auditoría</text>
        <rect x="442" y="126" width="182" height="28" rx="8" fill="#EAF2FC" />
        <circle cx="458" cy="140" r="6.5" fill="#2E7D32" />
        <path d="M454.7 140 l2.2 2.2 l4.3 -4.3" stroke="#fff" strokeWidth="1.7" fill="none" />
        <text x="472" y="144" fontFamily="system-ui, sans-serif" fontSize="10.5" fontWeight="600" fill="#0F2036">Depósito Central · ISO 45001</text>
      </g>

      {/* flecha punteada líder → campo con documento */}
      <path d="M538 168 q34 56 58 96" stroke="#003F87" strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round" fill="none" opacity="0.55" />
      <g filter="url(#a-shadow-sm)">
        <rect x="556" y="205" width="26" height="30" rx="4" fill="#fff" stroke="#CFE0F2" transform="rotate(12 569 220)" />
        <rect x="561" y="212" width="14" height="2.5" rx="1" fill="#94AFCB" transform="rotate(12 569 220)" />
        <rect x="560" y="218" width="16" height="2.5" rx="1" fill="#94AFCB" transform="rotate(12 569 220)" />
        <rect x="559" y="224" width="12" height="2.5" rx="1" fill="#94AFCB" transform="rotate(12 569 220)" />
      </g>
      <path d="M592 260 l7 13 l-14 -2 Z" fill="#003F87" opacity="0.6" />
    </svg>
  );
}

/* ---------- Escena 2: reportes ante la alta dirección ---------- */
export function SceneBoard() {
  return (
    <svg {...svgProps} role="img" aria-label="Auditor líder presentando reportes a la alta dirección">
      <defs>
        <linearGradient id="b-bg" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#EFF5FF" />
          <stop offset="0.55" stopColor="#D9E8FB" />
          <stop offset="1" stopColor="#C3DCF6" />
        </linearGradient>
        <radialGradient id="b-glow" cx="0.72" cy="0.28" r="0.55">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="b-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EDF3FB" />
        </linearGradient>
        <linearGradient id="b-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E93FF" />
          <stop offset="1" stopColor="#007BFF" />
        </linearGradient>
        <linearGradient id="b-bar2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0B57B8" />
          <stop offset="1" stopColor="#003F87" />
        </linearGradient>
        <linearGradient id="b-blazer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0A54A8" />
          <stop offset="1" stopColor="#003F87" />
        </linearGradient>
        <filter id="b-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#0B2E5C" floodOpacity="0.18" />
        </filter>
        <filter id="b-shadow-sm" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#0B2E5C" floodOpacity="0.15" />
        </filter>
      </defs>

      <rect width="800" height="500" fill="url(#b-bg)" />
      <rect width="800" height="500" fill="url(#b-glow)" />
      <circle cx="720" cy="70" r="150" fill="#2E93FF" opacity="0.10" />
      <circle cx="520" cy="450" r="190" fill="#003F87" opacity="0.05" />

      {/* pantalla de presentación */}
      <g filter="url(#b-shadow)">
        <rect x="466" y="52" width="312" height="196" rx="14" fill="url(#b-screen)" stroke="#D2E0F1" />
        <rect x="466" y="52" width="312" height="32" rx="14" fill="url(#b-bar2)" />
        <circle cx="482" cy="68" r="4" fill="#7FB2F0" />
        <text x="496" y="72" fontFamily="system-ui, sans-serif" fontSize="12.5" fontWeight="700" fill="#fff">Panel de Cumplimiento</text>
        {/* KPI tiles */}
        <g filter="url(#b-shadow-sm)">
          <rect x="484" y="98" width="86" height="46" rx="8" fill="#EAF8EF" />
          <rect x="580" y="98" width="86" height="46" rx="8" fill="#EAF2FC" />
          <rect x="676" y="98" width="86" height="46" rx="8" fill="#FBEEF0" />
        </g>
        <text x="496" y="122" fontFamily="system-ui, sans-serif" fontSize="17" fontWeight="800" fill="#2E7D32">98%</text>
        <text x="496" y="136" fontFamily="system-ui, sans-serif" fontSize="7.5" fill="#6B7C90">CUMPLIMIENTO</text>
        <text x="592" y="122" fontFamily="system-ui, sans-serif" fontSize="17" fontWeight="800" fill="#003F87">12</text>
        <text x="592" y="136" fontFamily="system-ui, sans-serif" fontSize="7.5" fill="#6B7C90">AUDITORÍAS</text>
        <text x="688" y="122" fontFamily="system-ui, sans-serif" fontSize="17" fontWeight="800" fill="#DC2626">3</text>
        <text x="688" y="136" fontFamily="system-ui, sans-serif" fontSize="7.5" fill="#6B7C90">NC ABIERTAS</text>
        {/* gráfico de barras */}
        <g>
          <rect x="484" y="156" width="172" height="80" rx="8" fill="#F5F9FD" />
          <line x1="494" y1="222" x2="646" y2="222" stroke="#DCE6F2" strokeWidth="1" />
          <rect x="502" y="198" width="17" height="24" rx="3" fill="url(#b-bar)" />
          <rect x="526" y="182" width="17" height="40" rx="3" fill="url(#b-bar)" />
          <rect x="550" y="204" width="17" height="18" rx="3" fill="#9AC7F5" />
          <rect x="574" y="170" width="17" height="52" rx="3" fill="url(#b-bar2)" />
          <rect x="598" y="190" width="17" height="32" rx="3" fill="url(#b-bar)" />
          <rect x="622" y="178" width="17" height="44" rx="3" fill="url(#b-bar2)" />
        </g>
        {/* donut de tendencia */}
        <g transform="translate(712 196)">
          <circle r="30" fill="none" stroke="#E2ECF7" strokeWidth="10" />
          <circle r="30" fill="none" stroke="#2E7D32" strokeWidth="10" strokeLinecap="round"
            strokeDasharray="150 190" transform="rotate(-90)" />
          <text x="0" y="4" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="12" fontWeight="800" fill="#2E7D32">78%</text>
        </g>
      </g>
      {/* soporte de la pantalla */}
      <rect x="614" y="248" width="16" height="28" fill="#B4C7DE" />
      <rect x="586" y="276" width="72" height="8" rx="4" fill="#A6BDD8" />

      {/* presentador (líder) */}
      <g filter="url(#b-shadow)">
        <ellipse cx="452" cy="394" rx="48" ry="13" fill="#0B2E5C" opacity="0.16" />
        <rect x="437" y="332" width="16" height="62" rx="7" fill="#22344A" />
        <rect x="454" y="332" width="16" height="62" rx="7" fill="#2A3F58" />
        <rect x="433" y="388" width="22" height="11" rx="4" fill="#1B2938" />
        <rect x="456" y="388" width="22" height="11" rx="4" fill="#1B2938" />
        {/* saco */}
        <path d="M423 288 q29 -19 58 0 l7 50 q-36 15 -72 0 Z" fill="url(#b-blazer)" />
        <path d="M452 286 l0 54" stroke="#fff" strokeWidth="2" opacity="0.45" />
        <path d="M441 300 l11 10 l-9 8 Z" fill="#fff" opacity="0.9" />
        {/* corbata */}
        <path d="M452 300 l4 8 l-4 20 l-4 -20 Z" fill="#2E93FF" />
        {/* brazo señalando la pantalla */}
        <path d="M481 296 q36 -10 42 -36" stroke="url(#b-blazer)" strokeWidth="14" fill="none" strokeLinecap="round" />
        <circle cx="526" cy="256" r="7.5" fill="#F6CDA6" />
        {/* otro brazo */}
        <path d="M423 296 q-17 15 -11 36" stroke="url(#b-blazer)" strokeWidth="14" fill="none" strokeLinecap="round" />
        {/* cabeza */}
        <circle cx="452" cy="260" r="25" fill="#F6CDA6" />
        <path d="M452 260 a25 25 0 0 1 0 25 Z" fill="#000" opacity="0.04" />
        <path d="M428 256 a24 24 0 0 1 48 0 q-24 -13 -48 0 Z" fill="#3A2A1E" />
      </g>

      {/* mesa + ejecutivos (primer plano) */}
      <g>
        <rect x="452" y="412" width="348" height="88" fill="#D6E2F1" />
        <rect x="452" y="412" width="348" height="12" fill="#C0D2E9" />
        <rect x="452" y="412" width="348" height="88" fill="url(#b-glow)" opacity="0.5" />
        {/* ejecutivo 1 */}
        <g filter="url(#b-shadow-sm)">
          <path d="M536 412 q0 -42 36 -42 q36 0 36 42 Z" fill="#546678" />
          <circle cx="572" cy="360" r="21" fill="#E8B48C" />
          <path d="M552 356 a20 20 0 0 1 40 0 q-20 -13 -40 0 Z" fill="#2B2B2B" />
        </g>
        {/* ejecutivo 2 */}
        <g filter="url(#b-shadow-sm)">
          <path d="M636 412 q0 -38 32 -38 q32 0 32 38 Z" fill="#6E5140" />
          <circle cx="668" cy="366" r="19" fill="#F6CDA6" />
          <path d="M650 362 a18 18 0 0 1 36 0 q-18 -13 -36 0 Z" fill="#5E3F26" />
        </g>
        {/* laptop */}
        <g filter="url(#b-shadow-sm)">
          <rect x="470" y="392" width="44" height="28" rx="2" fill="#1E293B" />
          <rect x="474" y="396" width="36" height="20" rx="1" fill="#38BDF8" opacity="0.75" />
          <rect x="466" y="418" width="52" height="4" rx="2" fill="#0F172A" />
        </g>
        {/* taza */}
        <g>
          <ellipse cx="726" cy="404" rx="9" ry="4" fill="#0B2E5C" opacity="0.12" />
          <rect x="718" y="392" width="16" height="12" rx="3" fill="#fff" stroke="#CBD8E6" />
          <path d="M734 395 q6 1 6 6 q0 5 -6 6" stroke="#CBD8E6" fill="none" strokeWidth="1.5" />
        </g>
      </g>
    </svg>
  );
}

/* ---------- Escena 3: una plataforma para cualquier empresa ---------- */
export function ScenePlatform() {
  return (
    <svg {...svgProps} role="img" aria-label="Plataforma que sirve para cualquier empresa e industria">
      <defs>
        <linearGradient id="p-bg" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#EEF9F1" />
          <stop offset="0.55" stopColor="#DCF0E2" />
          <stop offset="1" stopColor="#C7E7D2" />
        </linearGradient>
        <radialGradient id="p-halo" cx="0.72" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#2E7D32" stopOpacity="0.14" />
          <stop offset="1" stopColor="#2E7D32" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="p-screen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EFF7F1" />
        </linearGradient>
        <linearGradient id="p-line" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2E7D32" stopOpacity="0.15" />
          <stop offset="1" stopColor="#2E7D32" stopOpacity="0.5" />
        </linearGradient>
        <filter id="p-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#0B3D1E" floodOpacity="0.16" />
        </filter>
        <filter id="p-shadow-sm" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#0B3D1E" floodOpacity="0.14" />
        </filter>
      </defs>

      <rect width="800" height="500" fill="url(#p-bg)" />
      <rect width="800" height="500" fill="url(#p-halo)" />
      <circle cx="726" cy="80" r="120" fill="#2E93FF" opacity="0.08" />

      {/* halo concéntrico alrededor del centro */}
      <g fill="none" stroke="#2E7D32" opacity="0.14">
        <circle cx="600" cy="250" r="150" strokeWidth="1.5" />
        <circle cx="600" cy="250" r="200" strokeWidth="1.5" />
      </g>

      {/* líneas de conexión al centro */}
      <g stroke="url(#p-line)" strokeWidth="2.5" strokeDasharray="2 8" strokeLinecap="round" fill="none">
        <path d="M600 250 L472 116" />
        <path d="M600 250 L742 112" />
        <path d="M600 250 L456 344" />
        <path d="M600 250 L748 356" />
      </g>
      {/* nodos en las líneas */}
      <g fill="#2E7D32">
        <circle cx="536" cy="183" r="2.5" /><circle cx="671" cy="181" r="2.5" />
        <circle cx="528" cy="297" r="2.5" /><circle cx="674" cy="303" r="2.5" />
      </g>

      {/* tablet central con dashboard */}
      <g filter="url(#p-shadow)">
        <ellipse cx="600" cy="332" rx="124" ry="20" fill="#0B3D1E" opacity="0.12" />
        <rect x="512" y="170" width="176" height="158" rx="16" fill="#0F1B2D" />
        <rect x="520" y="178" width="160" height="142" rx="9" fill="url(#p-screen)" />
        {/* header */}
        <rect x="520" y="178" width="160" height="24" rx="9" fill="#003F87" />
        <circle cx="533" cy="190" r="4" fill="#fff" opacity="0.85" />
        <rect x="544" y="187" width="64" height="6" rx="3" fill="#fff" opacity="0.55" />
        {/* tiles */}
        <rect x="530" y="210" width="46" height="36" rx="6" fill="#EAF8EF" />
        <rect x="582" y="210" width="46" height="36" rx="6" fill="#EAF2FC" />
        <rect x="634" y="210" width="36" height="36" rx="6" fill="#FBEEF0" />
        <rect x="537" y="230" width="20" height="4" rx="2" fill="#2E7D32" opacity="0.5" />
        <rect x="589" y="230" width="20" height="4" rx="2" fill="#007BFF" opacity="0.5" />
        {/* mini barras + línea */}
        <rect x="530" y="284" width="11" height="24" rx="2" fill="#2E7D32" />
        <rect x="545" y="276" width="11" height="32" rx="2" fill="#3FA94D" />
        <rect x="560" y="290" width="11" height="18" rx="2" fill="#8ED0A2" />
        <polyline points="586,300 606,284 626,290 660,268" fill="none" stroke="#007BFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="660" cy="268" r="3.5" fill="#007BFF" />
      </g>

      {/* industria: fábrica (arriba izq) */}
      <g transform="translate(430 74)" filter="url(#p-shadow-sm)">
        <circle cx="26" cy="26" r="32" fill="#fff" />
        <path d="M13 34 L13 21 L22 26 L22 19 L31 24 L31 17 L39 17 L39 34 Z" fill="#003F87" />
        <rect x="15" y="12" width="4" height="7" fill="#8FA6C0" />
        <circle cx="17" cy="10" r="2.5" fill="#C7D5E6" />
      </g>
      {/* salud: hospital (arriba der) */}
      <g transform="translate(704 70)" filter="url(#p-shadow-sm)">
        <circle cx="26" cy="26" r="32" fill="#fff" />
        <rect x="13" y="15" width="26" height="24" rx="4" fill="#E11D48" />
        <rect x="23" y="19" width="5" height="16" fill="#fff" />
        <rect x="17" y="25" width="17" height="5" fill="#fff" />
      </g>
      {/* construcción: grúa torre (abajo izq) */}
      <g transform="translate(414 300)" filter="url(#p-shadow-sm)">
        <circle cx="28" cy="28" r="32" fill="#fff" />
        {/* base */}
        <rect x="20" y="45" width="16" height="4" rx="1" fill="#B45309" />
        {/* mástil vertical con reticulado */}
        <rect x="26" y="17" width="4" height="29" fill="#F59E0B" />
        <line x1="26" y1="23" x2="30" y2="27" stroke="#D97706" strokeWidth="0.9" />
        <line x1="26" y1="29" x2="30" y2="33" stroke="#D97706" strokeWidth="0.9" />
        <line x1="26" y1="35" x2="30" y2="39" stroke="#D97706" strokeWidth="0.9" />
        {/* cabina del operador */}
        <rect x="22" y="17" width="6" height="5" rx="1" fill="#334155" />
        {/* pluma (brazo largo) */}
        <rect x="25" y="14" width="21" height="3.4" rx="1" fill="#F59E0B" />
        {/* contrapluma + contrapeso */}
        <rect x="14" y="14" width="11" height="3.4" rx="1" fill="#F59E0B" />
        <rect x="12" y="13" width="6" height="6" rx="1" fill="#334155" />
        {/* tirantes desde el ápice */}
        <path d="M28 8 L19 15.7 M28 8 L44 15.7" stroke="#D97706" strokeWidth="1.1" fill="none" />
        {/* cable + gancho con carga */}
        <line x1="42" y1="17.4" x2="42" y2="27" stroke="#334155" strokeWidth="1" />
        <rect x="38" y="27" width="8" height="6" rx="1" fill="#64748B" />
      </g>
      {/* servicios/oficina: torre (abajo der) */}
      <g transform="translate(720 322)" filter="url(#p-shadow-sm)">
        <circle cx="26" cy="26" r="32" fill="#fff" />
        <rect x="15" y="12" width="22" height="32" rx="2" fill="#007BFF" />
        <g fill="#fff">
          <rect x="19" y="16" width="4" height="4" /><rect x="29" y="16" width="4" height="4" />
          <rect x="19" y="24" width="4" height="4" /><rect x="29" y="24" width="4" height="4" />
          <rect x="19" y="32" width="4" height="4" /><rect x="29" y="32" width="4" height="4" />
        </g>
      </g>

      {/* etiqueta flotante */}
      <g filter="url(#p-shadow-sm)">
        <rect x="506" y="352" width="188" height="32" rx="16" fill="#fff" />
        <circle cx="525" cy="368" r="8" fill="#2E7D32" />
        <path d="M521.5 368 l2.5 2.5 l4.5 -4.5" stroke="#fff" strokeWidth="1.8" fill="none" />
        <text x="540" y="372" fontFamily="system-ui, sans-serif" fontSize="11.5" fontWeight="700" fill="#0F2036">Cualquier industria y tamaño</text>
      </g>
    </svg>
  );
}
