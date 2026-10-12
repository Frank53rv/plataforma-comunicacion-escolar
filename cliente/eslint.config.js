// Quality Spec, Tabla 37 · «ESLint y Prettier con la configuración recomendada para la
// biblioteca de interfaz». Es la configuración que el propio Vite propone para React,
// más la desactivación de las reglas de formato que resuelve Prettier.
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

export default [
  // Artefactos, no código fuente: la construcción, el informe de cobertura que deja la
  // compuerta homónima y las dependencias.
  { ignores: ["dist", "tmp", "coverage", "node_modules"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node, ...globals.jest },
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: "module" },
    },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Plantilla de Vite: los componentes y constantes en mayúscula se usan desde JSX,
      // que la regla base no reconoce como uso.
      "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
  prettier,
];
