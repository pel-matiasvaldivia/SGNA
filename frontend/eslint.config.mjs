import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// Flat config (ESLint 9). Se usa el CLI de ESLint y no `next lint`, que quedó
// deprecado en Next 15 y se elimina en Next 16.
//
// `eslint-config-next` todavía se publica en el formato viejo (eslintrc), así
// que se adapta con FlatCompat. Trae de una vez las reglas de React, hooks,
// accesibilidad e imports, más las propias de Next.
const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  {
    // Artefactos de build y dependencias: nada que lintear, y recorrerlos
    // vuelve lentísima cualquier corrida.
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },

  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    rules: {
      // El proyecto usa `any` en los límites con la API y con next-auth, donde
      // los tipos los define el backend. Queda como aviso para no normalizarlo,
      // pero sin frenar el build.
      "@typescript-eslint/no-explicit-any": "warn",
      // Variables sin usar son casi siempre un descuido real; se permite el
      // prefijo _ para los parámetros que hay que declarar y no se usan.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
