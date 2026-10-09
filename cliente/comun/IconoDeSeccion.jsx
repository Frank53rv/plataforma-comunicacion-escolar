// RF-41 Interfaz responsiva · RF-40 Paneles diferenciados por rol · CU-09 · RN-04
// Prueba: CP-RF-41
//
// Ícono decorativo de cada opción del panel, para que la barra inferior se lea de un vistazo en
// el teléfono. El nombre de la opción va siempre escrito al lado: el ícono no la reemplaza.
const TRAZOS = {
  anuncios: (
    <path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
  ),
  publicar_anuncio: <path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />,
  constancias: <path d="M9 3h6v4H9zM7 5H5v16h14V5h-2M9 14l2 2 4-4" />,
  conversaciones: <path d="M4 5h16v11H9l-5 4V5z" />,
  preferencias: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  supervision: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  anios_lectivos: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  cursos: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  docentes: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  alumnos: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 20a7 7 0 0 0-3-5.7" />
    </>
  ),
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  cerrar: <path d="M6 6l12 12M18 6 6 18" />,
  salir: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
};

export default function IconoDeSeccion({ seccion, className = "size-5" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {TRAZOS[seccion] ?? TRAZOS.anuncios}
    </svg>
  );
}
