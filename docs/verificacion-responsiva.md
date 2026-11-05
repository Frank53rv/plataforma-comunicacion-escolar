# Verificación de la interfaz responsiva (RF-41 · RNF-18)

**Esta pasada la ejecuta una persona con navegador.** Las pruebas automáticas del cliente no
pueden medirla: Jest corre sobre jsdom, que no tiene motor de maquetado. Lo que sí verifican son
guardas estáticas (`tests/responsivo.test.js`) y que cada operación tenga su pantalla
(`tests/coberturaDeFlujos.test.js`). Esta lista es el instrumento que la Tabla 39 asigna a RNF-18
—«ejecutando la totalidad de las tareas críticas de la Tabla 17 en los tres anchos»— y, hecha por
el autor, es la referencia contra la que RNF-15 compara.

## Cómo

1. Levantar el entorno (`docker compose up -d --wait`) y cargar el conjunto de prueba
   (`bin/rails datos_de_prueba:cargar`). Cuentas `@datos-de-prueba.test`, contraseña `prueba-2026`.
2. Abrir `http://localhost:8090` en el navegador y activar el modo de dispositivo de las
   herramientas de desarrollo (F12 → modo responsivo).
3. Para **cada ancho** —360, 768 y 1280 px— ejecutar las 24 tareas y marcar la casilla.
4. Además, a **320 px**, recorrer las pantallas de la lista y comprobar que **no aparece barra de
   desplazamiento horizontal** en ninguna.
5. Guardar una captura por pantalla y por ancho como evidencia del punto 5.2.

## Qué se comprueba en cada tarea

- Se puede completar sin perder ninguna función respecto de 1280 px.
- Nada queda cortado, superpuesto o fuera de la pantalla; ningún botón es inalcanzable.
- Las secciones están accesibles: a 360 px, detrás del botón **Menú**.
- Los campos se pueden tocar y escribir cómodamente.

## Las 24 tareas críticas (Tabla 17)

| Cód. | Tarea | Rol | 360 | 768 | 1280 |
|---|---|---|:-:|:-:|:-:|
| TC-01 | Acceder por primera vez con la credencial provisional y sustituirla | Directivo | ☐ | ☐ | ☐ |
| TC-02 | Crear el año lectivo y los cursos que lo integran | Directivo | ☐ | ☐ | ☐ |
| TC-03 | Dar de alta a un docente y asignarlo a un curso como titular | Directivo | ☐ | ☐ | ☐ |
| TC-04 | Regenerar el código de activación de un docente | Directivo | ☐ | ☐ | ☐ |
| TC-05 | Desvincular a un docente designando otro titular en el mismo acto | Directivo | ☐ | ☐ | ☐ |
| TC-06 | Consultar el estado agregado de entrega y lectura por curso | Directivo | ☐ | ☐ | ☐ |
| TC-07 | Configurar el horario de disponibilidad y las preferencias de recepción | Directivo | ☐ | ☐ | ☐ |
| TC-08 | Activar la cuenta con el código recibido y definir la contraseña propia | Docente | ☐ | ☐ | ☐ |
| TC-09 | Dar de alta a un alumno, vincularlo al curso y registrar sus tutores | Docente | ☐ | ☐ | ☐ |
| TC-10 | Dar de baja a un alumno y a un tutor de su curso | Docente titular | ☐ | ☐ | ☐ |
| TC-11 | Publicar un anuncio dirigido a uno o varios de sus cursos | Docente | ☐ | ☐ | ☐ |
| TC-12 | Eliminar un anuncio propio ya publicado | Docente | ☐ | ☐ | ☐ |
| TC-13 | Consultar las constancias de lectura de un anuncio propio | Docente | ☐ | ☐ | ☐ |
| TC-14 | Enviar un mensaje en el canal grupal del curso | Docente | ☐ | ☐ | ☐ |
| TC-15 | Activar la cuenta con el código recibido y definir la contraseña propia | Tutor | ☐ | ☐ | ☐ |
| TC-16 | Iniciar sesión y reconocer la bandeja de anuncios como vista de entrada | Tutor | ☐ | ☐ | ☐ |
| TC-17 | Localizar un anuncio anterior mediante los filtros de historial | Tutor | ☐ | ☐ | ☐ |
| TC-18 | Abrir el detalle de un anuncio y registrar su lectura | Tutor | ☐ | ☐ | ☐ |
| TC-19 | Enviar un mensaje en el canal grupal del curso | Tutor | ☐ | ☐ | ☐ |
| TC-20 | Configurar el horario de disponibilidad y las preferencias de recepción | Tutor | ☐ | ☐ | ☐ |
| TC-21 | Activar la cuenta con el código recibido y definir la contraseña propia | Alumno | ☐ | ☐ | ☐ |
| TC-22 | Iniciar sesión y consultar los anuncios dirigidos a su curso | Alumno | ☐ | ☐ | ☐ |
| TC-23 | Abrir el detalle de un anuncio y registrar su lectura | Alumno | ☐ | ☐ | ☐ |
| TC-24 | Configurar sus preferencias de recepción | Alumno | ☐ | ☐ | ☐ |

## Sin desplazamiento horizontal a 320 px

Ingreso · Activar cuenta · Sustituir la credencial · Anuncios (bandeja y filtros) · Detalle de un
anuncio · Publicar un anuncio · Constancias · Canal grupal (con un mensaje de una palabra larga sin
espacios) · Horario de disponibilidad · Años lectivos · Cursos · Docentes · Alumnos y tutores ·
Supervisión.

## Cosas que esta lista NO cubre y quedan aparte

- **Avisos en segundo plano (Tabla 37, pasos 6 y 7):** requieren el túnel con certificado válido y
  credenciales reales de Firebase. Hoy están probados con dobles.
- **`IntersectionObserver` (vistas agrupadas, RF-35):** probado con un doble; confirmar en el
  navegador que al desplazar la bandeja se emiten las vistas en una sola petición.

## Resultado de la pasada automatizada (21-sep-2026)

Ejecutada con un navegador Chromium automatizado sobre la pila de demostración (nginx en
`localhost:8090`) y el conjunto de prueba de RNF-09. Las capturas y los guiones están en
`docs/evidencia-navegador/`.

- **24 tareas de la Tabla 17 × 360, 768 y 1280 px:** 72 ejecuciones, todas completadas.
- **100 pantallas de los cuatro roles × 320, 360, 768 y 1280 px:** ninguna con desplazamiento
  horizontal. Hizo falta `overflow-wrap:anywhere` en el armazón: una palabra larga sin espacios
  en un mensaje desbordaba 2333 px.
- **`IntersectionObserver`:** al desplazar la bandeja las vistas se emiten agrupadas en una sola
  petición (verificado en el navegador).

## Resultado de la pasada automatizada (8-oct-2026)

Repetida sobre `develop` después de integrar la identidad y la navegación por rol y la nueva
presentación de la bandeja y del canal grupal, con el conjunto de prueba de RNF-09.

- **24 tareas de la Tabla 17 × 360, 768 y 1280 px:** 72 ejecuciones, todas completadas,
  ninguna con desplazamiento horizontal ni errores de página.
- **100 pantallas de los cuatro roles × 320, 360, 768 y 1280 px:** ninguna con desplazamiento
  horizontal, ninguna vacía, ningún error de consola.
- **RNF-09, `GET /supervision/cursos`:** entre 0,10 y 0,27 s con el conjunto de prueba
  (2 cursos vigentes, 400 anuncios, 36.000 entregas).

**Alcance.** Es una pasada de un navegador automatizado, no de una persona: no mide RNF-13, RNF-14,
RNF-15 ni RNF-16, que son de la sesión de validación del incremento 6. Las casillas de la tabla
de arriba quedan para esa sesión.
