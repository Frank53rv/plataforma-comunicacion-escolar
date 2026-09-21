// RF-40 Paneles diferenciados por rol · CU-09 · RN-04, RN-15
// Prueba: CP-RF-40
//
// Cada opción que GET /paneles/me puede declarar, con su ruta y su pantalla. Una opción sin
// pantalla registrada todavía no se dibuja: el panel del rol es la intersección entre lo que
// la interfaz de programación habilita y lo que el cliente ya sabe presentar. El cliente no
// agrega ninguna opción por su cuenta (RNF-21).
import Bandeja from "../anuncios/Bandeja.jsx";

// Vocabulario cerrado del Quality Spec: anuncio, publicación, constancia, curso, año
// lectivo, canal grupal, horario de disponibilidad.
export const SECCIONES = {
  anuncios: { etiqueta: "Anuncios", ruta: "/", elemento: Bandeja },
};

export const ETIQUETAS_DE_ROL = {
  directivo: "Directivo",
  docente: "Docente",
  tutor: "Tutor",
  alumno: "Alumno",
};
