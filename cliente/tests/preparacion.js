require("@testing-library/jest-dom");

// jsdom no trae TextEncoder ni TextDecoder, que react-router usa al cargarse.
const { TextDecoder, TextEncoder } = require("node:util");
Object.assign(globalThis, { TextDecoder, TextEncoder });
