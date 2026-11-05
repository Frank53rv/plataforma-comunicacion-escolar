# Paquete normativo del proyecto

Extracción literal del documento de grado *«API REST de un colegio para una plataforma de
comunicación escolar con notificaciones inteligentes»*.

**Fuente única.** Este paquete proviene íntegramente de la edición v6,
`documento/Proyecto de grado entrega final.docx` (41 tablas numeradas, 22 figuras): es la
guía definitiva y gobierna la totalidad de las tablas, con su numeración propia. Del 1 al 22
la numeración coincide con la edición de 39 tablas; desde la 23 sube dos números. Las tablas
de los anexos, rotuladas con letra y número, no se extraen. No hay ningún otro documento
normativo.

**Estos archivos no se editan a mano.** Se regeneran con `tools/extraer_specs.py`. Si hay
que cambiar algo, se cambia en el documento y se vuelve a extraer; así la divergencia entre
código y documento queda imposibilitada por construcción y no por disciplina.

## Contenido

| Archivo | Origen | Qué fija |
|---|---|---|
| `00-context-spec.md` | edición v6, punto 4.2, prosa | Rol de la asistencia y fuentes de verdad |
| `01-boundary-spec.md` | Tabla 27 | Ámbitos que la asistencia no puede asumir |
| `02-quality-spec.md` | Tabla 28 | Estándares de código con su forma de verificación |
| `10-requisitos-funcionales.md` / `.json` | Tabla 10 | 47 RF · 36 Must · 11 Should |
| `11-requisitos-no-funcionales.md` | Tabla 11 | 22 RNF con métrica de aceptación |
| `12-reglas-negocio.md` / `.json` | Tabla 12 | 33 reglas RN-01…RN-33 |
| `13-casos-uso-resumen.md` | Tabla 13 | 15 CU: actor, precondición, postcondición |
| `15-diccionario-datos.md` | Tabla 14 | 19 entidades con atributos y restricciones |
| `16-trazabilidad.md` / `.json` | Tabla 15 | 69 filas: requisito → regla → CU → módulo → CP-RF-nn/CP-RNF-nn |
| `20-endpoints.md` / `.json` | Tabla 18 | 42 operaciones —41 sobre HTTP y el canal de tiempo real— con método, ruta, roles y CU |
| `21-errores.md` / `.json` | Tabla 26 | Catálogo cerrado de 9 estados |
| `22-esquema-fisico.md` / `.json` | Tabla 29 | Tipos, claves, índices y restricciones |
| `23-convenciones-api.md` | Tabla 30 | Prefijo, paginación, fechas, forma del error |
| `24-formas-peticion-respuesta.md` | Tabla 31 | Petición y respuesta de las 42 operaciones |
| `25-semantica-temporal.md` | edición v6, punto 4.2, prosa | Zona horaria de interpretación; almacenamiento en tiempo universal |
| `30-casos-prueba.md` | Tabla 34 | Resumen por grupo, con criterio de aprobación y umbral sobre los 58 casos del alcance comprometido |
| `31-tareas-criticas.md` | Tabla 17 | Tareas críticas por rol (RNF-13, RNF-15, RNF-18) |
| `40-stack.md` | Tabla 25 | Selección tecnológica por capa |
| `41-variables-entorno.md` | Tabla 32 | Variables del despliegue (RNF-19) |
| `42-ramificacion-versionado.md` | Tabla 33 | Modelo de ramas y SemVer |
| `43-infraestructura.md` | Tabla 36 | Contenedores y componentes |
| `44-despliegue.md` | Tabla 37 | Procedimiento del entorno de demostración |
| `45-plan-incrementos.md` | Tabla 38 | Plan de incrementos del producto mínimo viable |
| `46-protocolo-medicion.md` | Tabla 39 | Protocolo de medición de los requisitos no funcionales |
| `51-decisiones-del-documento.md` | Tabla 40 | Decisiones de detalle adoptadas en la construcción |
| `52-herramientas-verificacion.md` | Tabla 41 | Herramientas de verificación del documento contra el código |
| `DECISIONES.md` | — | Huecos detectados por esta asistencia y su resolución, con fecha (registro propio, distinto de `51-decisiones-del-documento.md`) |

## Cómo se usa

1. La asistencia lee `../CLAUDE.md` al abrir el repositorio.
2. Antes de construir `RF-nn`, se abre su fila en `16-trazabilidad.md`: da la regla, el
   caso de uso (con su postcondición en `13-casos-uso-resumen.md`), el módulo y el
   `CP-RF-nn`. El código citado que el requisito exige es la Tabla 10 y esa postcondición;
   el criterio de aprobación de la prueba es el de su grupo en `30-casos-prueba.md`.
3. Antes de integrar la rama, `bin/verificar` contrasta el código contra estos archivos.
