// RF-40 Identidad visual por rol · CU-09 · RN-04
// Prueba: CP-RF-40
//
// Ícono decorativo por rol: escudo=directivo, libro=docente, casa=tutor, birrete=alumno.
// El atributo data-icono nombra la forma de cada rol. Trazo currentColor, 24×24, aria-hidden. Sin dependencias externas.
export default function IconoDeRol({ rol, className = "size-5" }) {
  const iconos = {
    directivo: (
      <svg
        data-icono="escudo"
        aria-hidden="true"
        data-testid="icono-rol"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    docente: (
      <svg
        data-icono="libro"
        aria-hidden="true"
        data-testid="icono-rol"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
    tutor: (
      <svg
        data-icono="casa"
        aria-hidden="true"
        data-testid="icono-rol"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    alumno: (
      <svg
        data-icono="birrete"
        aria-hidden="true"
        data-testid="icono-rol"
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 9l10-5 10 5-10 5-10-5z" />
        <path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5M22 9v6" />
      </svg>
    ),
  };

  return iconos[rol] ?? iconos.tutor;
}
