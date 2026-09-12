# Paquete normativo del proyecto

Extracción literal del documento de grado *«API REST de un colegio para una plataforma de
comunicación escolar con notificaciones inteligentes»*.

**Dos niveles de fuente, por decisión D-21.** La mayoría de este paquete proviene de la
**edición vigente**, `documento/TFG_ENTREGA_75paginas.docx` (75 páginas, 40 tablas, 18
figuras): es la guía definitiva y gobierna la totalidad de las tablas, con su numeración
propia. Tres artefactos —marcados abajo— provienen en cambio del **anexo normativo**,
`documento/TFG_entrega_5_Etapa4_v52.docx` (v5.2), porque la edición vigente los condensó y
ya no los contiene: la narrativa de los quince casos de uso, los sesenta y nueve casos de
prueba individuales y el complemento de la semántica temporal. Cada archivo generado
declara en su encabezado de cuál de los dos documentos proviene.

**Estos archivos no se editan a mano.** Se regeneran con `tools/extraer_specs.py`, que lee
ambos documentos. Si hay que cambiar algo, se cambia en el documento correspondiente y se
vuelve a extraer; así la divergencia entre código y documento queda imposibilitada por
construcción y no por disciplina.

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
| `14-casos-uso-narrativa.md` | **ANEXO v5.2**, punto 2.3 | 15 CU con flujo principal, alternativos y de excepción — la edición vigente sólo conserva el resumen de la Tabla 13 |
| `15-diccionario-datos.md` | Tabla 14 | 19 entidades con atributos y restricciones |
| `16-trazabilidad.md` / `.json` | Tabla 15 | 69 filas: requisito → regla → CU → módulo → CP |
| `20-endpoints.md` / `.json` | Tabla 18 | 43 operaciones con método, ruta, roles y CU |
| `21-errores.md` / `.json` | Tabla 24 | Catálogo cerrado de 9 estados |
| `22-esquema-fisico.md` / `.json` | Tabla 27 | Tipos, claves, índices y restricciones |
| `23-convenciones-api.md` | Tabla 28 | Prefijo, paginación, fechas, forma del error |
| `24-formas-peticion-respuesta.md` | Tabla 29 | Petición y respuesta de las 43 operaciones |
| `25-semantica-temporal.md` | edición vigente + **complemento del ANEXO v5.2**, punto 4.2, prosa | Zona horaria; franja que cruza la medianoche, diferimiento y resolución del canal sólo están en el anexo |
| `30-casos-prueba.md` | Tabla 32 (resumen) + **ANEXO v5.2**, Tabla 43 (69 casos) | Resumen por grupo de la edición vigente, más los 69 `CP-RF-nn`/`CP-RNF-nn` individuales, que sólo están en el anexo |
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
2. Antes de construir `RF-nn`, se abre su fila en `16-trazabilidad.md` y su caso de uso en
   `14-casos-uso-narrativa.md` (este último, del anexo v5.2).
3. Antes de integrar la rama, `bin/verificar` contrasta el código contra estos archivos.
