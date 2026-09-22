// Tabla 34 · Jest y React Testing Library para las pruebas de comportamiento de los
// componentes del cliente.
module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/tests/**/*.test.{js,jsx}"],
  setupFilesAfterEnv: ["<rootDir>/tests/preparacion.js"],
  // RNF-20 · la cobertura cuenta todo el código fuente, no sólo lo que las pruebas importan.
  // El punto de entrada también cuenta: tests/puntoDeEntrada.test.jsx lo monta de verdad.
  collectCoverageFrom: [
    "comun/**/*.{js,jsx}",
    "paneles/**/*.{js,jsx}",
    "anuncios/**/*.{js,jsx}",
    "conversacion/**/*.{js,jsx}",
    "preferencias/**/*.{js,jsx}",
  ],
  moduleNameMapper: { "\\.css$": "<rootDir>/tests/estiloVacio.js" },
};
