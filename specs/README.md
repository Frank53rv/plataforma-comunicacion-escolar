# Paquete normativo del proyecto

Extracción literal del documento de grado *«API REST de un colegio para una plataforma de
comunicación escolar con notificaciones inteligentes»*, **versión 5.2** (179 páginas,
48 tablas, 18 figuras).

**Estos archivos no se editan a mano.** Se regeneran desde el `.docx` con
`tools/extraer_specs.py`. Si hay que cambiar algo, se cambia en el documento y se vuelve a
extraer; así la divergencia entre código y documento queda imposibilitada por construcción
y no por disciplina.

## Contenido

| Archivo | Origen | Qué fija |
|---|---|---|
| `00-context-spec.md` | punto 4.2, prosa | Rol de la asistencia y fuentes de verdad |
| `01-boundary-spec.md` | Tabla 36 | Ocho ámbitos que la asistencia no puede asumir |
| `02-quality-spec.md` | Tabla 37 | Nueve estándares con su forma de verificación |
| `10-requisitos-funcionales.md` / `.json` | Tabla 17 | 47 RF · 36 Must · 11 Should |
| `11-requisitos-no-funcionales.md` | Tabla 18 | 22 RNF con métrica de aceptación |
| `12-reglas-negocio.md` / `.json` | Tabla 19 | 33 reglas RN-01…RN-33 |
| `13-casos-uso-resumen.md` | Tabla 20 | 15 CU: actor, precondición, postcondición |
| `14-casos-uso-narrativa.md` | punto 2.3 | 15 CU con flujo principal, alternativos y de excepción |
| `15-diccionario-datos.md` | Tabla 21 | 19 entidades con atributos y restricciones |
| `16-trazabilidad.md` / `.json` | Tabla 22 | 69 filas: requisito → regla → CU → módulo → CP |
| `20-endpoints.md` / `.json` | Tabla 27 | 43 operaciones con método, ruta, roles y CU |
| `21-errores.md` / `.json` | Tabla 35 | Catálogo cerrado de 9 estados |
| `22-esquema-fisico.md` / `.json` | Tabla 38 | Tipos, claves, índices y restricciones |
| `23-convenciones-api.md` | Tabla 39 | Prefijo, paginación, fechas, forma del error |
| `24-formas-peticion-respuesta.md` | Tabla 40 | Petición y respuesta de las 43 operaciones |
| `25-semantica-temporal.md` | punto 4.2, prosa | Zona horaria, franja que cruza la medianoche, diferimiento y resolución del canal |
| `30-casos-prueba.md` / `.json` | Tabla 43 | 69 casos CP-RF-nn y CP-RNF-nn |
| `31-tareas-criticas.md` | Tabla 26 | Tareas críticas por rol (RNF-13, RNF-15, RNF-18) |
| `40-stack.md` | Tabla 34 | Selección tecnológica por capa |
| `41-variables-entorno.md` | Tabla 41 | Variables del despliegue (RNF-19) |
| `42-ramificacion-versionado.md` | Tabla 42 | Modelo de ramas y SemVer |
| `43-infraestructura.md` | Tabla 45 | Contenedores y componentes |
| `44-despliegue.md` | Tabla 46 | Procedimiento del entorno de demostración |
| `DECISIONES.md` | — | Huecos detectados y su resolución, con fecha |

## Cómo se usa

1. La asistencia lee `../CLAUDE.md` al abrir el repositorio.
2. Antes de construir `RF-nn`, se abre su fila en `16-trazabilidad.md` y su caso de uso en
   `14-casos-uso-narrativa.md`.
3. Antes de integrar la rama, `bin/verificar` contrasta el código contra estos archivos.
