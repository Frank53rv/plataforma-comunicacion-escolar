# Paquete normativo del proyecto

Extracción literal del documento de grado *«API REST de un colegio para una plataforma de
comunicación escolar con notificaciones inteligentes»*.

**Fuente única.** Este paquete proviene íntegramente de la edición vigente,
`documento/TFG_ENTREGA_75paginas.docx` (75 páginas, 40 tablas, 18 figuras): es la guía
definitiva y gobierna la totalidad de las tablas, con su numeración propia. No hay ningún
otro documento normativo.

**Estos archivos no se editan a mano.** Se regeneran con `tools/extraer_specs.py`. Si hay
que cambiar algo, se cambia en el documento y se vuelve a extraer; así la divergencia entre
código y documento queda imposibilitada por construcción y no por disciplina.

## Contenido

| Archivo | Origen | Qué fija |
|---|---|---|
| `00-context-spec.md` | edición vigente, punto 4.2, prosa | Rol de la asistencia y fuentes de verdad |
| `01-boundary-spec.md` | Tabla 25 | Ámbitos que la asistencia no puede asumir |
| `02-quality-spec.md` | Tabla 26 | Estándares de código con su forma de verificación |
| `10-requisitos-funcionales.md` / `.json` | Tabla 10 | 47 RF · 36 Must · 11 Should |
| `11-requisitos-no-funcionales.md` | Tabla 11 | 22 RNF con métrica de aceptación |
| `12-reglas-negocio.md` / `.json` | Tabla 12 | 33 reglas RN-01…RN-33 |
| `13-casos-uso-resumen.md` | Tabla 13 | 15 CU: actor, precondición, postcondición |
| `15-diccionario-datos.md` | Tabla 14 | 19 entidades con atributos y restricciones |
| `16-trazabilidad.md` / `.json` | Tabla 15 | 69 filas: requisito → regla → CU → módulo → CP-RF-nn/CP-RNF-nn |
| `20-endpoints.md` / `.json` | Tabla 18 | 43 operaciones con método, ruta, roles y CU |
| `21-errores.md` / `.json` | Tabla 24 | Catálogo cerrado de 9 estados |
| `22-esquema-fisico.md` / `.json` | Tabla 27 | Tipos, claves, índices y restricciones |
| `23-convenciones-api.md` | Tabla 28 | Prefijo, paginación, fechas, forma del error |
| `24-formas-peticion-respuesta.md` | Tabla 29 | Petición y respuesta de las 43 operaciones |
| `25-semantica-temporal.md` | edición vigente, punto 4.2, prosa | Zona horaria de interpretación; almacenamiento en tiempo universal |
| `30-casos-prueba.md` | Tabla 32 | Resumen por grupo, con criterio de aprobación y umbral global |
| `31-tareas-criticas.md` | Tabla 17 | Tareas críticas por rol (RNF-13, RNF-15, RNF-18) |
| `40-stack.md` | Tabla 23 | Selección tecnológica por capa |
| `41-variables-entorno.md` | Tabla 30 | Variables del despliegue (RNF-19) |
| `42-ramificacion-versionado.md` | Tabla 31 | Modelo de ramas y SemVer |
| `43-infraestructura.md` | Tabla 34 | Contenedores y componentes |
| `44-despliegue.md` | Tabla 35 | Procedimiento del entorno de demostración |
| `45-plan-incrementos.md` | Tabla 36 | Plan de incrementos del producto mínimo viable |
| `46-protocolo-medicion.md` | Tabla 37 | Protocolo de medición de los requisitos no funcionales |
| `50-divergencias.md` | Tabla 38 | Divergencias entre el documento y la versión construida |
| `51-decisiones-del-documento.md` | Tabla 39 | Decisiones que el documento mismo registra donde no determinaba la cuestión |
| `52-herramientas-verificacion.md` | Tabla 40 | Modificaciones aplicadas a las herramientas de verificación |
| `DECISIONES.md` | — | Huecos detectados por esta asistencia y su resolución, con fecha (registro propio, distinto de `51-decisiones-del-documento.md`) |

## Cómo se usa

1. La asistencia lee `../CLAUDE.md` al abrir el repositorio.
2. Antes de construir `RF-nn`, se abre su fila en `16-trazabilidad.md`: da la regla, el
   caso de uso (con su postcondición en `13-casos-uso-resumen.md`), el módulo y el
   `CP-RF-nn`. El código citado que el requisito exige es la Tabla 10 y esa postcondición;
   el criterio de aprobación de la prueba es el de su grupo en `30-casos-prueba.md`.
3. Antes de integrar la rama, `bin/verificar` contrasta el código contra estos archivos.
