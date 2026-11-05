# Registro de ejecución · cierre del incremento 6

Ejecución del 05/11/2026 sobre el código de la versión v1.0.1. Un caso consta como aprobado sólo si se ejecutó y produjo el resultado esperado.

## Resumen

| Indicador | Resultado |
|---|---|
| Suite de la interfaz (RSpec) | 553 ejemplos, 0 fallos |
| Suite del cliente (Jest) | 435 pruebas en 37 suites, 0 fallos |
| Cobertura de líneas de la interfaz | 98,72 % (1394/1412) |
| Cobertura de líneas del cliente | 99,52 % (1041/1046) |
| Compuertas | Ocho en verde: contrato, errores, esquema, alcance, trazabilidad, tiempo, cobertura y estilo |
| Casos aprobados | 52 de los 58 del alcance comprometido: 89,7 %, umbral del 80 % |
| Casos fallidos | 0 |
| Casos pendientes | 6: CP-RNF-13 a 16, CP-RNF-19 y CP-RNF-22 |
| Casos no ejecutables | 11 Should have, fuera del denominador. Sobre los 69 definidos, 75,4 % |

## Casos ejecutados

| Caso | Requisito | Fecha | Comando | Resultado obtenido | Estado |
|---|---|---|---|---|---|
| CP-RF-01 | RF-01 · Autenticación de usuarios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | sesiones_spec.rb: 19 ejemplos, 0 fallos; api.test.js: 20 pruebas, 0 fallos | aprobado |
| CP-RF-02 | RF-02 · Control de acceso basado en roles | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | traduccion_de_errores_spec.rb: 6 ejemplos, 0 fallos; autorizacion_spec.rb: 15 ejemplos, 0 fallos | aprobado |
| CP-RF-03 | RF-03 · Alta de docentes y asignación a cursos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | docentes_spec.rb: 11 ejemplos, 0 fallos; vinculaciones_docentes_spec.rb: 14 ejemplos, 0 fallos; administracionDeDocentes.test.jsx: 27 pruebas, 0 fallos | aprobado |
| CP-RF-04 | RF-04 · Alta de alumnos y tutores | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | alumnos_y_tutores_spec.rb: 12 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado |
| CP-RF-05 | RF-05 · Generación de código de activación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | codigo_activacion_spec.rb: 11 ejemplos, 0 fallos; alumnos_y_tutores_spec.rb: 12 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado |
| CP-RF-06 | RF-06 · Activación de cuenta | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | activaciones_spec.rb: 13 ejemplos, 0 fallos; aplicacion.test.jsx: 23 pruebas, 0 fallos | aprobado |
| CP-RF-07 | RF-07 · Regeneración de código de activación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | codigos_activacion_spec.rb: 16 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado |
| CP-RF-09 | RF-09 · Baja lógica de alumnos y tutores | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | baja_logica_spec.rb: 11 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado |
| CP-RF-10 | RF-10 · Restricción de baja de tutor vinculado | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | restriccion_baja_tutor_spec.rb: 6 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado |
| CP-RF-11 | RF-11 · Creación del año lectivo | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | anios_lectivos_spec.rb: 15 ejemplos, 0 fallos; administracionAcademica.test.jsx: 21 pruebas, 0 fallos | aprobado |
| CP-RF-12 | RF-12 · Administración de cursos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | cursos_spec.rb: 23 ejemplos, 0 fallos; nomina_de_cursos_spec.rb: 15 ejemplos, 0 fallos; administracionAcademica.test.jsx: 21 pruebas, 0 fallos | aprobado |
| CP-RF-13 | RF-13 · Vinculación de alumnos a cursos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | pertenencia_unica_spec.rb: 5 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado |
| CP-RF-14 | RF-14 · Vinculación de tutores a alumnos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | vinculacion_de_tutores_spec.rb: 7 ejemplos, 0 fallos; administracionDeAlumnos.test.jsx: 31 pruebas, 0 fallos | aprobado |
| CP-RF-15 | RF-15 · Vinculación de docentes a cursos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | vinculaciones_docentes_spec.rb: 14 ejemplos, 0 fallos; administracionDeDocentes.test.jsx: 27 pruebas, 0 fallos | aprobado |
| CP-RF-17 | RF-17 · Publicación de anuncios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | anuncios_spec.rb: 13 ejemplos, 0 fallos; publicar.test.jsx: 10 pruebas, 0 fallos | aprobado |
| CP-RF-20 | RF-20 · Borrado lógico de anuncios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | bandeja_sin_eliminados_spec.rb: 3 ejemplos, 0 fallos; borrado_logico_anuncios_spec.rb: 9 ejemplos, 0 fallos; detalle.test.jsx: 17 pruebas, 0 fallos | aprobado |
| CP-RF-21 | RF-21 · Resolución de destinatarios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | resolucion_de_destinatarios_spec.rb: 2 ejemplos, 0 fallos | aprobado |
| CP-RF-22 | RF-22 · Consulta del historial de anuncios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | bandeja_con_version_spec.rb: 3 ejemplos, 0 fallos; bandeja_sin_eliminados_spec.rb: 3 ejemplos, 0 fallos; bandeja.test.jsx: 18 pruebas, 0 fallos | aprobado |
| CP-RF-23 | RF-23 · Panel de constancias del docente | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | panel_de_constancias_spec.rb: 11 ejemplos, 0 fallos; constancias.test.jsx: 13 pruebas, 0 fallos | aprobado |
| CP-RF-25 | RF-25 · Canal grupal del curso | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | conversacion_channel_spec.rb: 20 ejemplos, 0 fallos; canal_grupal_curso_spec.rb: 18 ejemplos, 0 fallos; canalesDelCurso.test.jsx: 6 pruebas, 0 fallos. En un navegador real, a 360 px, el tutor con el canal abierto ve el mensaje del docente sin recargar, a los 204 ms | aprobado |
| CP-RF-28 | RF-28 · Persistencia e historial de mensajes | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | conversacion_channel_spec.rb: 20 ejemplos, 0 fallos; historial_de_mensajes_spec.rb: 15 ejemplos, 0 fallos; conversacion.test.jsx: 24 pruebas, 0 fallos | aprobado |
| CP-RF-29 | RF-29 · Restricción de participación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | conversacion_channel_spec.rb: 20 ejemplos, 0 fallos; restriccion_de_participacion_spec.rb: 12 ejemplos, 0 fallos; canalesDelCurso.test.jsx: 6 pruebas, 0 fallos | aprobado |
| CP-RF-31 | RF-31 · Notificación de anuncios | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | matriz_de_notificaciones_spec.rb: 20 ejemplos, 0 fallos; notificacion_de_anuncios_spec.rb: 11 ejemplos, 0 fallos; instalacion.test.jsx: 6 pruebas, 0 fallos | aprobado |
| CP-RF-32 | RF-32 · Notificación de mensajes | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | matriz_de_notificaciones_spec.rb: 20 ejemplos, 0 fallos; notificacion_de_mensajes_spec.rb: 17 ejemplos, 0 fallos | aprobado |
| CP-RF-33 | RF-33 · Configuración de preferencias | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | preferencia_spec.rb: 10 ejemplos, 0 fallos; preferencias_spec.rb: 10 ejemplos, 0 fallos; preferencias.test.jsx: 24 pruebas, 0 fallos | aprobado |
| CP-RF-34 | RF-34 · Registro de estados de notificación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | registro_de_estados_spec.rb: 13 ejemplos, 0 fallos; bandeja.test.jsx: 18 pruebas, 0 fallos | aprobado |
| CP-RF-35 | RF-35 · Emisión de eventos de vista en lote | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | bandeja_con_version_spec.rb: 3 ejemplos, 0 fallos; vistas_en_lote_spec.rb: 11 ejemplos, 0 fallos; acumuladorDeVistas.test.js: 7 pruebas, 0 fallos | aprobado |
| CP-RF-36 | RF-36 · Idempotencia del registro de eventos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | idempotencia_de_eventos_spec.rb: 10 ejemplos, 0 fallos; detalle.test.jsx: 17 pruebas, 0 fallos | aprobado |
| CP-RF-37 | RF-37 · Degradación ante fallo de entrega | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | cliente_fcm_spec.rb: 11 ejemplos, 0 fallos; degradacion_de_entrega_spec.rb: 15 ejemplos, 0 fallos; avisosPush.test.js: 15 pruebas, 0 fallos | aprobado |
| CP-RF-39 | RF-39 · Bandeja de anuncios como vista de entrada | 05/11/2026 | `npm run test:cobertura` | aplicacion.test.jsx: 23 pruebas, 0 fallos | aprobado |
| CP-RF-40 | RF-40 · Paneles diferenciados por rol | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | panel_por_rol_spec.rb: 20 ejemplos, 0 fallos; api.test.js: 20 pruebas, 0 fallos; rutasPorRol.test.jsx: 7 pruebas, 0 fallos | aprobado |
| CP-RF-41 | RF-41 · Interfaz responsiva | 05/11/2026 | `npm run test:cobertura` | armazonDeMensajeria.test.jsx: 5 pruebas, 0 fallos | aprobado |
| CP-RF-42 | RF-42 · Cobertura de flujos en interfaz | 05/11/2026 | `npm run test:cobertura` | coberturaDeFlujos.test.js: 5 pruebas, 0 fallos | aprobado |
| CP-RF-43 | RF-43 · Cambio obligatorio de credencial provisional | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | cambio_de_credencial_spec.rb: 15 ejemplos, 0 fallos; aplicacion.test.jsx: 23 pruebas, 0 fallos | aprobado |
| CP-RF-44 | RF-44 · Desvinculación y baja de docente | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | desvinculacion_y_baja_docente_spec.rb: 14 ejemplos, 0 fallos; administracionDeDocentes.test.jsx: 27 pruebas, 0 fallos | aprobado |
| CP-RF-45 | RF-45 · Consulta directiva del estado de la comunicación | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura` | supervision_directiva_spec.rb: 10 ejemplos, 0 fallos; supervision.test.jsx: 10 pruebas, 0 fallos | aprobado |
| CP-RNF-01 | RNF-01 · Control de acceso verificable | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | autorizacion_spec.rb: 15 ejemplos, 0 fallos | aprobado |
| CP-RNF-02 | RNF-02 · Autenticidad de la sesión | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | sesiones_spec.rb: 19 ejemplos, 0 fallos | aprobado |
| CP-RNF-03 | RNF-03 · Resguardo de credenciales | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | sesiones_spec.rb: 19 ejemplos, 0 fallos | aprobado |
| CP-RNF-04 | RNF-04 · Trazabilidad de las acciones | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | borrado_logico_anuncios_spec.rb: 9 ejemplos, 0 fallos; consulta_historial_anuncios_spec.rb: 16 ejemplos, 0 fallos | aprobado |
| CP-RNF-05 | RNF-05 · No repudio de la constancia | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | registro_de_estados_spec.rb: 13 ejemplos, 0 fallos; idempotencia_de_eventos_spec.rb: 10 ejemplos, 0 fallos | aprobado |
| CP-RNF-06 | RNF-06 · Transporte cifrado | 05/11/2026 | `curl` sobre el túnel ([evidencia](evidencia/cp-rnf-06-final-2026-11-05.txt)) | HTTPS con certificado válido (Google Trust Services, vence 03/01/2027). Texto plano, también con token válido: 301 en /api/v1/, / y /cable, sin datos. Puertos publicados sólo en 127.0.0.1 | aprobado |
| CP-RNF-07 | RNF-07 · Retención y minimización de datos | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | degradacion_de_entrega_spec.rb: 15 ejemplos, 0 fallos | aprobado |
| CP-RNF-08 | RNF-08 · Latencia de entrega de mensajes | 05/11/2026 | `node scripts/medir-latencia.js --emisor … --receptores …` ([evidencia](evidencia/rnf-08-latencia-2026-11-05.json)) | 11 conexiones y 50 mensajes: 550 entregas, 0 perdidas; percentil 95 de 299 ms y máximo de 443 ms, umbral 2000 ms | aprobado |
| CP-RNF-09 | RNF-09 · Tiempo de respuesta de consultas | 05/11/2026 | `node scripts/medir-consultas.js …` ([evidencia](evidencia/rnf-09-consultas-2026-11-05.json)) | 100 peticiones por consulta: percentil 95 entre 62 y 524 ms en las 8 consultas, umbral 1500 ms | aprobado |
| CP-RNF-10 | RNF-10 · Capacidad de conexiones simultáneas | 05/11/2026 | `node scripts/medir-latencia.js` con 40 conexiones, tres corridas ([1](evidencia/rnf-10-conexiones-1-2026-11-05.json), [2](evidencia/rnf-10-conexiones-2-2026-11-05.json), [3](evidencia/rnf-10-conexiones-3-2026-11-05.json)) | 40 conexiones sostenidas: 2000 entregas por corrida, 0 perdidas; percentil 95 de 549, 587, 553 ms | aprobado |
| CP-RNF-11 | RNF-11 · Tolerancia a la indisponibilidad del servicio push | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | notificacion_de_anuncios_spec.rb: 11 ejemplos, 0 fallos; degradacion_de_entrega_spec.rb: 15 ejemplos, 0 fallos | aprobado |
| CP-RNF-12 | RNF-12 · Recuperación del envío diferido | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | degradacion_de_entrega_spec.rb: 15 ejemplos, 0 fallos; cliente_fcm_spec.rb: 11 ejemplos, 0 fallos | aprobado |
| CP-RNF-17 | RNF-17 · Documentación formal de la interfaz | 05/11/2026 | `bin/verificar`; `npx newman run openapi/postman_collection.json -e openapi/postman_environment.json --reporters cli,json --reporter-json-export docs/evidencia/newman-2026-11-05.json`; `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | Compuerta de contrato: 36 rutas, 41 operaciones descritas, diferencia nula. Colección: 178 peticiones, 217 aserciones, 0 fallos; 36 de 36 operaciones Must have y ninguna Should have. errores_del_catalogo_spec.rb: 6 ejemplos, 0 fallos | aprobado |
| CP-RNF-18 | RNF-18 · Adaptación a distintos dispositivos | 05/11/2026 | Navegador automatizado: `node tareas.mjs <ancho>`; `node pasada.mjs` ([evidencia](evidencia-navegador/)) | 72 ejecuciones de las 24 tareas críticas en 360, 768 y 1280 px, todas completadas; 100 pantallas en 320, 360, 768 y 1280 px sin desplazamiento horizontal ni errores de consola | aprobado |
| CP-RNF-19 | RNF-19 · Reproducibilidad del despliegue | 05/11/2026 | Pasos 1 a 6 y 8 de la Tabla 37 sobre un clon nuevo ([evidencia](evidencia/cp-rnf-19-final-2026-11-05.txt)) | Construcción sin caché en 168 s (2 min 48 s); tres servicios saludables en 20 s, sin intervención; 184 cuentas, 400 anuncios, 36.000 entregas, 16.000 mensajes y 2.000 de bitácora; ningún archivo versionado editado | pendiente: falta el paso 7, en un teléfono |
| CP-RNF-20 | RNF-20 · Cobertura de pruebas automatizadas | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec`; `npm run test:cobertura`; `bin/verificar` | Interfaz 98,72 % (1394/1412 líneas). Cliente 99,52 % (1041/1046 líneas). Umbral 70 % | aprobado |
| CP-RNF-21 | RNF-21 · Separación de responsabilidades | 05/11/2026 | `docker compose run --rm -e RAILS_ENV=test api bundle exec rspec` | autorizacion_spec.rb: 15 ejemplos, 0 fallos; panel_por_rol_spec.rb: 20 ejemplos, 0 fallos | aprobado |
| CP-RNF-22 | RNF-22 · Completitud funcional del MVP | 05/11/2026 | Contraste de la Tabla 15 contra este registro; compuerta de trazabilidad | Compuerta: 36 de 36 Must have con código, prueba y rama. Los 36 casos funcionales Must have aprobados; quedan pendientes CP-RNF-13 a 16 y CP-RNF-19 | pendiente: depende de esos casos |

## Casos no ejecutados

| Caso | Requisito | Estado | Motivo |
|---|---|---|---|
| CP-RNF-13 | RNF-13 · Operabilidad por rol | Pendiente | Requiere la sesión de validación con personas, todavía no realizada. |
| CP-RNF-14 | RNF-14 · Protección frente a errores del usuario | Pendiente | Requiere la sesión de validación con personas, todavía no realizada. |
| CP-RNF-15 | RNF-15 · Facilidad de aprendizaje | Pendiente | Requiere la sesión de validación con personas, todavía no realizada. |
| CP-RNF-16 | RNF-16 · Localización de información publicada | Pendiente | Requiere la sesión de validación con personas, todavía no realizada. |
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

## Fallas halladas y corregidas en esta ejecución

| Caso | Falla observada | Corrección | Reejecución |
|---|---|---|---|
| CP-RNF-19 | En un clon nuevo, la interfaz salía en el paso 3: Solid Queue consultaba tablas que recién creaba el paso 4 | `hotfix/CP-RNF-19-migraciones-al-arrancar` | Tres servicios saludables sin intervención |
| CP-RNF-06 | Por texto plano y con token válido, el túnel servía 200 con datos. Los puertos escuchaban en todas las direcciones | `hotfix/CP-RNF-06-sin-texto-plano`, `hotfix/CP-RNF-06-puertos-solo-locales` | 301 sin datos; puertos sólo en 127.0.0.1 |
| CP-RNF-17 | La colección de openapi/ no tenía aserciones: 0 fallos con 401, 404 y 422 en todas las respuestas | `hotfix/CP-RNF-17-coleccion-con-aserciones` | 178 peticiones, 217 aserciones, 0 fallos |
| CP-RNF-17 | JSON mal formado, byte nulo, estado desconocido y codificación inválida no respondían 422; una ruta inexistente respondía text/html: 6 de 6 ejemplos fallidos | `hotfix/CP-RNF-17-errores-dentro-del-catalogo`, `hotfix/CP-RNF-17-contrato-openapi` | 6 de 6 aprobados |
| CP-RNF-17 | Un cuerpo de más de 1 MB respondía 413 con una página HTML de nginx | `hotfix/CP-RNF-17-limite-de-carga` | 413 con application/problem+json |
| CP-RF-09 | El aviso de un anuncio salía a una cuenta dada de baja: 1 de 9 ejemplos fallido | `hotfix/CP-RF-09-aviso-no-sale-a-cuentas-de-baja` | Aprobado |
| CP-RF-12 | Se creaban y editaban cursos fuera del año lectivo vigente: 2 de 23 ejemplos fallidos | `hotfix/CP-RF-12-cursos-en-anio-vigente` | Aprobado |
| CP-RF-20 | El aviso de un anuncio eliminado salía por push, también en un reintento: 2 de 10 ejemplos fallidos | `hotfix/CP-RF-20-aviso-de-anuncio-eliminado` | Aprobado |
| CP-RF-23 | La nómina de constancias omitía a los tutores sin lectura: 1 de 11 ejemplos fallido | `hotfix/CP-RF-23-constancias-incluyen-tutores` | Aprobado |
| CP-RF-29 | El canal persistía y difundía lo que emitía quien fue dado de baja o desvinculado con la conexión abierta: 4 de 19 ejemplos fallidos, 2 por un método que la corrección agrega | `hotfix/CP-RF-29-canal-revalida-autorizacion` | Aprobado |
| CP-RF-25 | Tras integrar la corrección de CP-RF-29, lo difundido llegaba como texto y se perdían todas las entregas en tiempo real: 550 de 550 perdidas en la medición de RNF-08, con la suite en verde | `hotfix/CP-RF-25-difusion-decodificada`, con prueba de regresión | 550 entregas, 0 perdidas; 204 ms en un navegador real |
| CP-RF-40 | Una dirección de otro rol escrita a mano abría la pantalla ajena: 6 de 7 pruebas fallidas | `hotfix/CP-RF-40-rutas-del-cliente-por-rol` | Aprobado |
| CP-RF-43 | La contraseña nueva podía ser igual a la provisional: 1 de 15 ejemplos fallido | `hotfix/CP-RF-43-credencial-nueva-distinta` | Aprobado; 422 con RN-09 |

La salida de las pruebas de los hotfix del 26-oct-2026 contra el código anterior está en [hotfix-26-oct-contra-codigo-actual-2026-11-05.txt](evidencia/hotfix-26-oct-contra-codigo-actual-2026-11-05.txt). Las primeras pasadas de CP-RNF-06 y CP-RNF-19 están en los archivos `cp-rnf-*-2026-11-05.txt` y `*-reejecucion-*`.

**Marcas de tiempo.** Por decisión del autor del 05/11/2026, las columnas conservan el tipo `timestamp` en tiempo universal coordinado. La rama `hotfix/CP-RNF-12-fechas-con-zona` no se integró.

## Pasos 6 y 7 de la Tabla 37 · push en un teléfono

Requieren una persona con el teléfono en la mano. El paso 6 quedó verificado con `curl`; falta comprobarlo desde el dispositivo.

1. Levantá el entorno y el túnel. Reconstruí las imágenes para tomar las correcciones:
   ```bash
   docker compose up -d --build
   cloudflared tunnel --url http://localhost:8090
   ```
2. Cargá el dominio que asigne el túnel en `APP_HOST` y `CORS_ORIGENES` del `.env`, y volvé a ejecutar `docker compose up -d`.
3. En el teléfono, abrí `https://<dominio>` y entrá con una cuenta ficticia, con la contraseña `prueba-2026`: tutor `ana.nunez.138@datos-de-prueba.test` o alumno `nora.zarate.95@datos-de-prueba.test`. Si la base no tiene el conjunto de prueba, cargalo con `docker compose exec api bin/rails datos_de_prueba:cargar`.
4. Agregá el cliente a la pantalla de inicio. En iPhone, desde Safari: Compartir → Agregar a pantalla de inicio. En Android, con «Instalar aplicación» de la barra superior.
5. Abrilo desde el ícono, entrá a «Horario de disponibilidad» y activá «Avisos en este dispositivo», concediendo el permiso.
6. Comprobá que la suscripción quedó registrada:
   ```bash
   docker compose exec api bin/rails runner 'p SuscripcionPush.order(creada_en: :desc).limit(3).pluck(:estado, :navegador, :creada_en)'
   ```
7. Cerrá la aplicación y, desde otra sesión, publicá un anuncio con el docente `tomas.ojeda.3@datos-de-prueba.test` al curso Primero A.

Resultado, a completar por el autor:

- [ ] Paso 6 desde el teléfono: el cliente abre por HTTPS con certificado válido
- [ ] Paso 7: la suscripción push queda registrada
- [ ] El aviso llega con la aplicación cerrada

Fecha: ______ · Dispositivo y navegador: ______ · Observaciones: ______

CP-RNF-19 pasa a aprobado cuando se marquen las tres casillas.

## Notas de ejecución

- La suite se ejecuta con `RAILS_ENV=test`. El contenedor define `RAILS_ENV=development` y `rails_helper.rb` no lo sobrescribe, de modo que `docker compose exec api bundle exec rspec`, sin esa variable, correría sobre la base de desarrollo.
- `docs/evidencia/newman-2026-11-05.json` se guarda sin cuerpos de respuesta ni tokens.
- RNF-10 se midió con 40 conexiones sobre el canal de Primero A: el docente emisor, otro docente y 36 tutores, más dos tutores con una segunda conexión.
- Las mediciones se tomaron en un solo equipo y sin túnel, con el conjunto de prueba de RNF-09.
