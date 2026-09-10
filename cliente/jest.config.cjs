// Tabla 34 · Jest y React Testing Library para las pruebas de comportamiento de los
// componentes del cliente.
module.exports = {
  testEnvironment: "jsdom",
  testMatch: ["<rootDir>/tests/**/*.test.jsx"],
  setupFilesAfterEnv: ["<rootDir>/tests/preparacion.js"],
  moduleNameMapper: { "\\.css$": "<rootDir>/tests/estiloVacio.js" },
};
