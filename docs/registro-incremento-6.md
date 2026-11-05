# Registro de ejecución · cierre del incremento 6

Ejecución del 05/11/2026 sobre `develop` con las correcciones de CP-RNF-06 y CP-RNF-19. Un caso consta como aprobado sólo si se ejecutó en esta sesión y produjo el resultado esperado.

## Resumen

| Indicador | Resultado |
|---|---|
| Suite de la interfaz (RSpec) | 536 ejemplos, 0 fallos |
| Suite del cliente (Jest) | 428 pruebas en 36 suites, 0 fallos |
| Cobertura de líneas de la interfaz | 98,9 % |
| Cobertura de líneas del cliente | 99,51 % |
| Compuertas | Ocho en verde: contrato, errores, esquema, alcance, trazabilidad, tiempo, cobertura y estilo |
| Casos aprobados en esta ejecución | 40 de los 58 del alcance comprometido |
| Casos fallidos | 8 |
| Casos pendientes | 6 |
| Casos aprobados antes y no repetidos hoy | 4 (RNF-08, RNF-09, RNF-10 y RNF-18) |
| Casos no ejecutables | 11 Should have, fuera del denominador |

Sumando los aprobados de hoy y los no repetidos da 44 de 58, 75,9 %. El umbral del 80 % exige 47. Si los 8 casos fallidos se aprueban tras integrar sus correcciones, el total sube a 52 de 58, 89,7 %.

Las suites en verde no contradicen los casos fallidos: las pruebas que detectan esos defectos están en las ramas de los hotfix del 26-oct-2026, sin integrar. Se ejecutaron contra el código actual sin integrarlas; la salida está en [hotfix-26-oct-contra-codigo-actual-2026-11-05.txt](evidencia/hotfix-26-oct-contra-codigo-actual-2026-11-05.txt).

## Casos ejecutados

| Caso | Requisito | Fecha | Comando | Resultado obtenido | Estado | Acción correctiva |
|---|---|---|---|---|---|---|
| CP-RF-01 | RF-01 · Autenticación de usuarios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | sesiones_spec.rb: 19 ejemplos, 0 fallos; api.test.js: 20 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-02 | RF-02 · Control de acceso basado en roles | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | traduccion_de_errores_spec.rb: 6 ejemplos, 0 fallos; autorizacion_spec.rb: 15 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RF-03 | RF-03 · Alta de docentes y asignación a cursos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | docentes_spec.rb: 11 ejemplos, 0 fallos; vinculaciones_docentes_spec.rb: 14 ejemplos, 0 fallos; administracionDeDocentes.test.jsx: 27 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-04 | RF-04 · Alta de alumnos y tutores | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | alumnos_y_tutores_spec.rb: 12 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-05 | RF-05 · Generación de código de activación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | codigo_activacion_spec.rb: 11 ejemplos, 0 fallos; alumnos_y_tutores_spec.rb: 12 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-06 | RF-06 · Activación de cuenta | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | activaciones_spec.rb: 13 ejemplos, 0 fallos; aplicacion.test.jsx: 23 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-07 | RF-07 · Regeneración de código de activación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | codigos_activacion_spec.rb: 16 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-09 | RF-09 · Baja lógica de alumnos y tutores | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura`; prueba de la rama del hotfix | baja_logica_spec.rb: 11 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos. Prueba del hotfix contra el código actual: **9 ejemplos, 1 fallo: el aviso de un anuncio sale a una cuenta dada de baja** | fallido | `hotfix/CP-RF-09-aviso-no-sale-a-cuentas-de-baja`, sin integrar |
| CP-RF-10 | RF-10 · Restricción de baja de tutor vinculado | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | restriccion_baja_tutor_spec.rb: 6 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-11 | RF-11 · Creación del año lectivo | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | anios_lectivos_spec.rb: 15 ejemplos, 0 fallos; administracionAcademica.test.jsx: 21 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-12 | RF-12 · Administración de cursos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura`; prueba de la rama del hotfix | cursos_spec.rb: 21 ejemplos, 0 fallos; nomina_de_cursos_spec.rb: 15 ejemplos, 0 fallos; administracionAcademica.test.jsx: 21 pruebas, 0 fallos. Prueba del hotfix contra el código actual: **23 ejemplos, 2 fallos: se crean y editan cursos fuera del año lectivo vigente** | fallido | `hotfix/CP-RF-12-cursos-en-anio-vigente`, sin integrar |
| CP-RF-13 | RF-13 · Vinculación de alumnos a cursos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | pertenencia_unica_spec.rb: 5 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-14 | RF-14 · Vinculación de tutores a alumnos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | vinculacion_de_tutores_spec.rb: 7 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-15 | RF-15 · Vinculación de docentes a cursos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | vinculaciones_docentes_spec.rb: 14 ejemplos, 0 fallos; administracionDeDocentes.test.jsx: 27 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-17 | RF-17 · Publicación de anuncios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | anuncios_spec.rb: 13 ejemplos, 0 fallos; publicar.test.jsx: 10 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-20 | RF-20 · Borrado lógico de anuncios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura`; prueba de la rama del hotfix | bandeja_sin_eliminados_spec.rb: 3 ejemplos, 0 fallos; borrado_logico_anuncios_spec.rb: 9 ejemplos, 0 fallos; detalle.test.jsx: 17 pruebas, 0 fallos. Prueba del hotfix contra el código actual: **10 ejemplos, 2 fallos: el aviso de un anuncio eliminado sale por push, también en un reintento** | fallido | `hotfix/CP-RF-20-aviso-de-anuncio-eliminado`, sin integrar |
| CP-RF-21 | RF-21 · Resolución de destinatarios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | resolucion_de_destinatarios_spec.rb: 2 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RF-22 | RF-22 · Consulta del historial de anuncios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | bandeja_con_version_spec.rb: 3 ejemplos, 0 fallos; bandeja_sin_eliminados_spec.rb: 3 ejemplos, 0 fallos; bandeja.test.jsx: 18 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-23 | RF-23 · Panel de constancias del docente | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura`; prueba de la rama del hotfix | panel_de_constancias_spec.rb: 11 ejemplos, 0 fallos; constancias.test.jsx: 13 pruebas, 0 fallos. Prueba del hotfix contra el código actual: **11 ejemplos, 1 fallo: la nómina de constancias omite a los tutores sin lectura** | fallido | `hotfix/CP-RF-23-constancias-incluyen-tutores`, sin integrar |
| CP-RF-25 | RF-25 · Canal grupal del curso | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | conversacion_channel_spec.rb: 15 ejemplos, 0 fallos; canal_grupal_curso_spec.rb: 18 ejemplos, 0 fallos; canalesDelCurso.test.jsx: 6 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-28 | RF-28 · Persistencia e historial de mensajes | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | conversacion_channel_spec.rb: 15 ejemplos, 0 fallos; historial_de_mensajes_spec.rb: 15 ejemplos, 0 fallos; conversacion.test.jsx: 24 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-29 | RF-29 · Restricción de participación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura`; prueba de la rama del hotfix | conversacion_channel_spec.rb: 15 ejemplos, 0 fallos; restriccion_de_participacion_spec.rb: 12 ejemplos, 0 fallos; canalesDelCurso.test.jsx: 6 pruebas, 0 fallos. Prueba del hotfix contra el código actual: **19 ejemplos, 4 fallos, 2 por un método que el hotfix agrega: el canal persiste y difunde lo que emite quien fue dado de baja o desvinculado con la conexión abierta** | fallido | `hotfix/CP-RF-29-canal-revalida-autorizacion`, sin integrar |
| CP-RF-31 | RF-31 · Notificación de anuncios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | matriz_de_notificaciones_spec.rb: 20 ejemplos, 0 fallos; notificacion_de_anuncios_spec.rb: 8 ejemplos, 0 fallos; instalacion.test.jsx: 6 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-32 | RF-32 · Notificación de mensajes | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | matriz_de_notificaciones_spec.rb: 20 ejemplos, 0 fallos; notificacion_de_mensajes_spec.rb: 17 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RF-33 | RF-33 · Configuración de preferencias | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | preferencia_spec.rb: 10 ejemplos, 0 fallos; preferencias_spec.rb: 10 ejemplos, 0 fallos; preferencias.test.jsx: 24 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-34 | RF-34 · Registro de estados de notificación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | registro_de_estados_spec.rb: 13 ejemplos, 0 fallos; bandeja.test.jsx: 18 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-35 | RF-35 · Emisión de eventos de vista en lote | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | bandeja_con_version_spec.rb: 3 ejemplos, 0 fallos; vistas_en_lote_spec.rb: 11 ejemplos, 0 fallos; acumuladorDeVistas.test.js: 7 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-36 | RF-36 · Idempotencia del registro de eventos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | idempotencia_de_eventos_spec.rb: 10 ejemplos, 0 fallos; detalle.test.jsx: 17 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-37 | RF-37 · Degradación ante fallo de entrega | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | cliente_fcm_spec.rb: 11 ejemplos, 0 fallos; degradacion_de_entrega_spec.rb: 15 ejemplos, 0 fallos; avisosPush.test.js: 15 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-39 | RF-39 · Bandeja de anuncios como vista de entrada | 05/11/2026 | `npm run test:cobertura` | aplicacion.test.jsx: 23 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-40 | RF-40 · Paneles diferenciados por rol | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura`; prueba de la rama del hotfix | panel_por_rol_spec.rb: 20 ejemplos, 0 fallos; api.test.js: 20 pruebas, 0 fallos. Prueba del hotfix contra el código actual: **7 pruebas, 6 fallos: una dirección de otro rol escrita a mano abre la pantalla ajena** | fallido | `hotfix/CP-RF-40-rutas-del-cliente-por-rol`, sin integrar |
| CP-RF-41 | RF-41 · Interfaz responsiva | 05/11/2026 | `npm run test:cobertura` | armazonDeMensajeria.test.jsx: 5 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-42 | RF-42 · Cobertura de flujos en interfaz | 05/11/2026 | `npm run test:cobertura` | coberturaDeFlujos.test.js: 5 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-43 | RF-43 · Cambio obligatorio de credencial provisional | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura`; prueba de la rama del hotfix | cambio_de_credencial_spec.rb: 14 ejemplos, 0 fallos; aplicacion.test.jsx: 23 pruebas, 0 fallos. Prueba del hotfix contra el código actual: **15 ejemplos, 1 fallo: la contraseña nueva puede ser igual a la provisional** | fallido | `hotfix/CP-RF-43-credencial-nueva-distinta`, sin integrar |
| CP-RF-44 | RF-44 · Desvinculación y baja de docente | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | desvinculacion_y_baja_docente_spec.rb: 14 ejemplos, 0 fallos; administracionDeDocentes.test.jsx: 27 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RF-45 | RF-45 · Consulta directiva del estado de la comunicación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | supervision_directiva_spec.rb: 10 ejemplos, 0 fallos; supervision.test.jsx: 10 pruebas, 0 fallos | aprobado | Ninguna |
| CP-RNF-01 | RNF-01 · Control de acceso verificable | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | autorizacion_spec.rb: 15 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RNF-02 | RNF-02 · Autenticidad de la sesión | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | sesiones_spec.rb: 19 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RNF-03 | RNF-03 · Resguardo de credenciales | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | sesiones_spec.rb: 19 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RNF-04 | RNF-04 · Trazabilidad de las acciones | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | borrado_logico_anuncios_spec.rb: 9 ejemplos, 0 fallos; consulta_historial_anuncios_spec.rb: 16 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RNF-05 | RNF-05 · No repudio de la constancia | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | registro_de_estados_spec.rb: 13 ejemplos, 0 fallos; idempotencia_de_eventos_spec.rb: 10 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RNF-06 | RNF-06 · Transporte cifrado | 05/11/2026 | curl sobre el túnel (ver [evidencia](evidencia/cp-rnf-06-reejecucion-2026-11-05.txt)) | Primera pasada: HTTPS 401 con certificado válido, pero texto plano con token válido: **200 con datos**. Reejecución: HTTPS con certificado válido (Google Trust Services, vence 03/01/2027); texto plano 301 en /api/v1/, / y /cable, 0 datos servidos | aprobado | `hotfix/CP-RNF-06-sin-texto-plano`, integrada en develop. Los puertos 3000 y 8090 del equipo siguen en texto plano para uso local |
| CP-RNF-07 | RNF-07 · Retención y minimización de datos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | degradacion_de_entrega_spec.rb: 15 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RNF-11 | RNF-11 · Tolerancia a la indisponibilidad del servicio push | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | notificacion_de_anuncios_spec.rb: 8 ejemplos, 0 fallos; degradacion_de_entrega_spec.rb: 15 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RNF-12 | RNF-12 · Recuperación del envío diferido | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | degradacion_de_entrega_spec.rb: 15 ejemplos, 0 fallos; cliente_fcm_spec.rb: 11 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RNF-17 | RNF-17 · Documentación formal de la interfaz | 05/11/2026 | `bin/verificar`; `npx newman run openapi/postman_collection.json …`; `npx newman run docs/registro-qa/postman/…`; rspec del hotfix | Compuerta de contrato: 36 rutas, 41 operaciones descritas, diferencia nula. Colección de openapi/: 36 peticiones, **0 aserciones**, 401×21, 404×13, 422×2, ninguna 2xx. Colección con aserciones: 178 peticiones, 217 aserciones, 0 fallos. errores_del_catalogo_spec.rb (hotfix) contra el código actual: **6 ejemplos, 6 fallos** | fallido | Las respuestas a entradas inválidas salen del catálogo: `hotfix/CP-RNF-17-errores-dentro-del-catalogo` y `hotfix/CP-RNF-17-contrato-openapi`, sin integrar. Falta decidir qué colección es la de validación |
| CP-RNF-19 | RNF-19 · Reproducibilidad del despliegue | 05/11/2026 | Pasos 1 a 6 y 8 de la Tabla 37 (ver [primera pasada](evidencia/cp-rnf-19-2026-11-05.txt) y [reejecución](evidencia/cp-rnf-19-reejecucion-2026-11-05.txt)) | Primera pasada: construcción sin caché en 225 s; **el contenedor de la interfaz sale en el paso 3** porque Solid Queue consulta tablas que crea el paso 4. Reejecución: construcción sin caché en 207 s (3 min 27 s), tres servicios saludables en 21 s, 184 cuentas, 400 anuncios, 36.000 entregas, 16.000 mensajes, 2.000 de bitácora, sin editar archivos versionados | pendiente | `hotfix/CP-RNF-19-migraciones-al-arrancar`, integrada en develop. Falta el paso 7, en un teléfono |
| CP-RNF-20 | RNF-20 · Cobertura de pruebas automatizadas | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura`; `bin/verificar` | Interfaz 98,90 % (1349/1364 líneas). Cliente 99,51 % (1036/1041 líneas). Umbral 70 % | aprobado | Ninguna |
| CP-RNF-21 | RNF-21 · Separación de responsabilidades | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | autorizacion_spec.rb: 15 ejemplos, 0 fallos; panel_por_rol_spec.rb: 20 ejemplos, 0 fallos | aprobado | Ninguna |
| CP-RNF-22 | RNF-22 · Completitud funcional del MVP | 05/11/2026 | Contraste de la Tabla 15 contra este registro; compuerta de trazabilidad | Compuerta: 36 de 36 Must have con código, prueba y rama. La condición de ejecución aprobada no se cumple mientras haya casos Must have fallidos o pendientes | pendiente | Depende de los casos fallidos y de la sesión de validación |

## Casos no ejecutados en esta sesión

| Caso | Requisito | Estado | Motivo |
|---|---|---|---|
| CP-RNF-13 | RNF-13 · Operabilidad por rol | Pendiente | Requiere la sesión de validación con personas, todavía no realizada. |
| CP-RNF-14 | RNF-14 · Protección frente a errores del usuario | Pendiente | Requiere la sesión de validación con personas, todavía no realizada. |
| CP-RNF-15 | RNF-15 · Facilidad de aprendizaje | Pendiente | Requiere la sesión de validación con personas, todavía no realizada. |
| CP-RNF-16 | RNF-16 · Localización de información publicada | Pendiente | Requiere la sesión de validación con personas, todavía no realizada. |
| CP-RNF-08 | RNF-08 · Latencia de entrega de mensajes | No reejecutado | Tabla I1 lo registra aprobado: Medición del 21/09/2026: percentil 95 de 197 ms, máximo 254 ms (Tabla 39). No se repitió en esta sesión. |
| CP-RNF-09 | RNF-09 · Tiempo de respuesta de consultas | No reejecutado | Tabla I1 lo registra aprobado: Medición del 21/09/2026: percentil 95 entre 72 y 559 ms (Tabla 39). No se repitió en esta sesión. |
| CP-RNF-10 | RNF-10 · Capacidad de conexiones simultáneas | No reejecutado | Tabla I1 lo registra aprobado: Medición del 21/09/2026: 40 conexiones, 2.000 entregas sin pérdida (Tabla 39). No se repitió en esta sesión. |
| CP-RNF-18 | RNF-18 · Adaptación a distintos dispositivos | No reejecutado | Tabla I1 lo registra aprobado: 72 ejecuciones de las 24 tareas críticas y cien pantallas sin desplazamiento horizontal, 08/10/2026 (punto 5.3). No se repitió en esta sesión. |
| CP-RF-08 | RF-08 · Recuperación de contraseña | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-16 | RF-16 · Cierre del año lectivo | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-18 | RF-18 · Programación de la hora de envío | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-19 | RF-19 · Edición con versionado | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-24 | RF-24 · Canal grupal de alumnos | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-26 | RF-26 · Conversación privada alumno-docente | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-27 | RF-27 · Conversación privada tutor-docente | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-30 | RF-30 · Adjuntos en formato PDF | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-38 | RF-38 · Indicador de familia alcanzada | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-46 | RF-46 · Supervisión directiva de conversaciones | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |
| CP-RF-47 | RF-47 · Indicador de mensajes no leídos | No ejecutable | Requisito Should have, no construido. Fuera del denominador del umbral. |

## Pasos 6 y 7 de la Tabla 37 · push en un teléfono

Requieren una persona con el teléfono en la mano. El paso 6 quedó verificado con `curl`; falta comprobarlo desde el dispositivo.

1. Levantá el entorno y el túnel. Reconstruí la imagen para tomar las correcciones:
   ```bash
   docker compose up -d --build
   cloudflared tunnel --url http://localhost:8090
   ```
2. Cargá el dominio que asigne el túnel en `APP_HOST` y `CORS_ORIGENES` del `.env`, y volvé a ejecutar `docker compose up -d`.
3. En el teléfono, abrí `https://<dominio>` y entrá con una cuenta ficticia, con la contraseña `prueba-2026`: tutor `alba.aquino.137@datos-de-prueba.test` o alumno `alba.baez.124@datos-de-prueba.test`.
4. Agregá el cliente a la pantalla de inicio. En iPhone, desde Safari: Compartir → Agregar a pantalla de inicio. En Android, con «Instalar aplicación» de la barra superior.
5. Abrilo desde el ícono, entrá a «Horario de disponibilidad» y activá «Avisos en este dispositivo», concediendo el permiso.
6. Comprobá que la suscripción quedó registrada:
   ```bash
   docker compose exec api bin/rails runner 'p SuscripcionPush.order(creada_en: :desc).limit(3).pluck(:estado, :navegador, :creada_en)'
   ```
7. Cerrá la aplicación y, desde otra sesión, publicá un anuncio con el docente `mabel.ibarra.4@datos-de-prueba.test` a un curso del tutor o del alumno.

Resultado, a completar por el autor:

- [ ] Paso 6 desde el teléfono: el cliente abre por HTTPS con certificado válido
- [ ] Paso 7: la suscripción push queda registrada
- [ ] El aviso llega con la aplicación cerrada

Fecha: ______ · Dispositivo y navegador: ______ · Observaciones: ______

CP-RNF-19 pasa a aprobado cuando se marquen las tres casillas.

## Para actualizar el documento

Estas diferencias surgieron de la ejecución. El `.docx` no se modificó.

| Lugar | Qué dice hoy | Qué se encontró |
|---|---|---|
| Tabla I1 y su nota | «Ningún caso registra estado fallido»; CP-RF-09, 12, 20, 23, 29, 40 y 43 aprobados | Los ocho casos de la tabla de arriba constan como fallidos hasta integrar sus correcciones |
| Tabla 29 | 19 columnas `timestamptz` | El esquema de `develop` y `main` tiene `timestamp` sin zona. La corrección está en `hotfix/CP-RNF-12-fechas-con-zona`, cuya prueba da 20 ejemplos y 12 fallos contra el código actual. La compuerta de esquema compara columnas y no tipos. El nombre de esa rama no corresponde a RNF-12, que es la recuperación del envío diferido y aprueba |
| Tabla 37 y su nota | Pasos 6, 7 y 8 sin ejecutar; construcción en 3 min 24 s | Pasos 1 a 6 y 8 ejecutados; construcción en 3 min 27 s. El paso 3 prepara el esquema antes de arrancar la interfaz |
| Tabla 39, filas RNF-17 y RNF-19 | Colección sin ejecutar; pasos 6 a 8 sin ejecutar | Ver CP-RNF-17 y CP-RNF-19 arriba |
| Tablas 25 y 36 | nginx entrega archivos y reenvía; el cifrado termina en el túnel | Además redirige a HTTPS lo que el túnel informa como recibido sin cifrar |
| Tabla 31, GET /cursos, y Tabla 40 | No mencionan `alumnos_vinculados` | La respuesta y el archivo OpenAPI lo incluyen |
| Tabla 15, «Artefacto de diseño» | RNF-22 → Tabla 24 (riesgos); RNF-14 y RNF-15 → Tabla 27 (Boundary Spec) | Parecen citas renumeradas por aritmética: en la edición anterior decían Tabla 22 y Tabla 25. Conviene revisarlas |
| Figura 18 | `docs/` fuera del control de versiones | `docs/` pasa a versionarse, salvo `docs/prompt-actualizacion-docx.md` |
| Tabla 34 | — | Las citas de seis pruebas a casos individuales ya no son textuales, porque la tabla resume por grupo: se conservan como descripción, sin comillas |

## Notas de ejecución

- La suite se ejecuta con `RAILS_ENV=test`. El contenedor define `RAILS_ENV=development` y `rails_helper.rb` no lo sobrescribe, de modo que `docker compose exec api bundle exec rspec`, sin esa variable, correría sobre la base de desarrollo.
- La evidencia de la fase 3, tomada sobre `main` antes de integrar, está en [rspec-2026-11-05.txt](evidencia/rspec-2026-11-05.txt), [jest-2026-11-05.txt](evidencia/jest-2026-11-05.txt) y [verificar-2026-11-05.txt](evidencia/verificar-2026-11-05.txt). La de `develop` con las correcciones, en los archivos `*-develop-2026-11-05.txt`.
- La primera pasada de CP-RNF-19 clonó de GitHub. La reejecución clonó del repositorio local, porque las correcciones no están publicadas.
