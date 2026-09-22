// RF-40 Paneles diferenciados por rol · RF-42 Cobertura de flujos en interfaz · CU-09 · RN-04,
// RN-15
// Prueba: CP-RF-40 · CP-RF-42
//
// Cada opción que GET /paneles/me puede declarar, con su ruta y su pantalla. Una opción sin
// pantalla registrada todavía no se dibuja: el panel del rol es la intersección entre lo que
// la interfaz de programación habilita y lo que el cliente ya sabe presentar. El cliente no
// agrega ninguna opción por su cuenta (RNF-21).
import Bandeja from "../anuncios/Bandeja.jsx";
import Detalle from "../anuncios/Detalle.jsx";
import Conversacion from "../conversacion/Conversacion.jsx";
import CanalesDelCurso from "../conversacion/CanalesDelCurso.jsx";
import Conversaciones from "../conversacion/Conversaciones.jsx";
import AniosLectivos from "../paneles/directivo/AniosLectivos.jsx";
import Cursos from "../paneles/directivo/Cursos.jsx";
import Docentes from "../paneles/directivo/Docentes.jsx";
import Supervision from "../paneles/directivo/Supervision.jsx";
import Alumnos from "../paneles/comun/Alumnos.jsx";
import Preferencias from "../preferencias/Preferencias.jsx";
import Constancias from "../paneles/docente/Constancias.jsx";
import ListadoDeConstancias from "../paneles/docente/ListadoDeConstancias.jsx";
import Publicar from "../paneles/docente/Publicar.jsx";

// Vocabulario cerrado del Quality Spec: anuncio, publicación, constancia, curso, año
// lectivo, canal grupal, horario de disponibilidad.
export const SECCIONES = {
  anuncios: {
    etiqueta: "Anuncios",
    ruta: "/",
    elemento: Bandeja,
    subrutas: [{ ruta: "/anuncios/:id", elemento: Detalle }],
  },
  publicar_anuncio: {
    etiqueta: "Publicar un anuncio",
    ruta: "/publicar",
    elemento: Publicar,
  },
  conversaciones: {
    etiqueta: "Canal grupal",
    ruta: "/conversaciones",
    elemento: Conversaciones,
    subrutas: [
      { ruta: "/conversaciones/:id", elemento: Conversacion },
      { ruta: "/cursos/:id/canal", elemento: CanalesDelCurso },
    ],
  },
  preferencias: {
    etiqueta: "Horario de disponibilidad",
    ruta: "/preferencias",
    elemento: Preferencias,
  },
  anios_lectivos: {
    etiqueta: "Años lectivos",
    ruta: "/anios-lectivos",
    elemento: AniosLectivos,
  },
  cursos: { etiqueta: "Cursos", ruta: "/cursos", elemento: Cursos },
  docentes: { etiqueta: "Docentes", ruta: "/docentes", elemento: Docentes },
  alumnos: {
    etiqueta: "Alumnos y tutores",
    ruta: "/alumnos",
    elemento: Alumnos,
  },
  supervision: {
    etiqueta: "Supervisión",
    ruta: "/supervision",
    elemento: Supervision,
  },
  constancias: {
    etiqueta: "Constancias",
    ruta: "/constancias",
    elemento: ListadoDeConstancias,
    subrutas: [{ ruta: "/anuncios/:id/constancias", elemento: Constancias }],
  },
};

export const ETIQUETAS_DE_ROL = {
  directivo: "Directivo",
  docente: "Docente",
  tutor: "Tutor",
  alumno: "Alumno",
};
