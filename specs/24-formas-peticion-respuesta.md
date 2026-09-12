<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 29 · Formas de petición y respuesta por operación

| Operación | Parámetros o cuerpo de la petición | Cuerpo de la respuesta de éxito |
|---|---|---|
| POST /sesiones | correo, contrasena | token, vence_en, usuario con id, nombre, apellido, rol y credencial_provisional |
| DELETE /sesiones | sin cuerpo | sin cuerpo |
| POST /activaciones | codigo, contrasena | token, vence_en, usuario |
| POST /recuperaciones | codigo, contrasena | token, vence_en, usuario |
| PATCH /usuarios/me/contrasena | contrasena_actual, contrasena_nueva | usuario con credencial_provisional en falso |
| POST /anios-lectivos | anio | recurso anio_lectivo |
| GET /anios-lectivos | sin parámetros | colección de anio_lectivo |
| PATCH /anios-lectivos/{id} | estado igual a cerrado | recurso anio_lectivo con cerrado_en |
| POST /cursos | anio_lectivo_id, nombre, turno | recurso curso |
| GET /cursos | anio_lectivo_id opcional, estado opcional | colección de curso con la cantidad de alumnos vinculados |
| PATCH /cursos/{id} | nombre, turno | recurso curso |
| POST /docentes | nombre, apellido, correo | recurso usuario y codigo_activacion con vence_en, sin el código en claro. La versión construida devuelve el código de activación en claro en esta respuesta, contra lo que esta tabla comprometía, por la decisión D-10: sin servicio de correo, es la única vía de entrega del código al destinatario. |
| POST /cursos/{id}/docentes | usuario_id, es_titular | recurso docente_curso |
| DELETE /cursos/{id}/docentes/{usuarioId} | titular_reemplazo_id, obligatorio si el desvinculado es titular | recurso docente_curso con vigente_hasta |
| DELETE /docentes/{id} | sin cuerpo | recurso usuario con estado dado de baja |
| POST /usuarios/{id}/codigos-activacion | sin cuerpo | codigo_activacion con vence_en y el código en claro, devuelto una sola vez. La representación incluye además id y usuario_id, que esta tabla no consignaba. |
| POST /alumnos | nombre, apellido, correo, curso_id | recurso usuario, alumno_curso y codigo_activacion |
| POST /alumnos/{id}/tutores | nombre, apellido, correo | recurso usuario, tutor_alumno y codigo_activacion. Cuando el tutor ya existe y la operación sólo lo vincula, codigo_activacion se devuelve nulo: la cuenta ya está activa y no se emite código. La representación del código incluye además id y usuario_id. |
| DELETE /alumnos/{id} | sin cuerpo | recurso usuario con estado dado de baja |
| DELETE /tutores/{id} | sin cuerpo | recurso usuario con estado dado de baja |
| POST /anuncios | titulo, cuerpo, cursos como lista de identificadores, programado_para opcional, adjuntos opcional | recurso anuncio con su anuncio_version y la cantidad de destinatarios resueltos |
| PATCH /anuncios/{id} | titulo, cuerpo | recurso anuncio con la nueva anuncio_version y los destinatarios resueltos otra vez |
| DELETE /anuncios/{id} | sin cuerpo | recurso anuncio con eliminado_en y eliminado_por |
| GET /anuncios | curso_id, remitente_id, desde, hasta, pagina, por_pagina | colección de anuncio con titulo, publicado_en, autor y el estado de lectura de quien consulta |
| GET /anuncios/{id} | sin parámetros | recurso anuncio con su version vigente, sus cursos y sus adjuntos |
| GET /anuncios/{id}/constancias | pagina, por_pagina | total de destinatarios, cantidad con lectura registrada, nómina de quienes no leyeron y familia_alcanzada por alumno |
| GET /paneles/me | sin parámetros | rol, nombre, opciones habilitadas y cantidad de anuncios sin leer |
| GET /supervision/cursos | anio_lectivo_id | por curso: cantidad de anuncios, enviadas, entregadas, vistas y leídas |
| POST /entregas/acuses | anuncio_version_ids como lista | cantidad registrada y omitida por idempotencia |
| POST /entregas/vistas | anuncio_version_ids como lista | cantidad registrada y omitida por idempotencia |
| POST /entregas/lecturas | anuncio_version_id | entrega_anuncio con leida_en |
| GET /cursos/{id}/conversaciones | sin parámetros | conversaciones del curso visibles para el rol, con tipo y estado |
| GET /conversaciones | pagina, por_pagina | colección de conversacion con último mensaje y cantidad de no leídos |
| GET /conversaciones/{id}/mensajes | pagina, por_pagina, desde, hasta | colección de mensaje con autor y enviado_en |
| POST /conversaciones/{id}/mensajes | cuerpo | recurso mensaje |
| POST /conversaciones/{id}/adjuntos | archivo en formato multiparte, mensaje_id | recurso adjunto |
| PUT /conversaciones/{id}/puntero-lectura | ultimo_mensaje_id | puntero_lectura con actualizado_en y la cantidad de no leídos restante |
| GET /supervision/conversaciones | curso_id, pagina, por_pagina | colección de conversacion del año vigente, en modo de solo lectura |
| GET /usuarios/me/preferencias | sin parámetros | hora_inicio, hora_fin, recibir_mensajes |
| PUT /usuarios/me/preferencias | hora_inicio, hora_fin, recibir_mensajes | recurso preferencia |
| POST /suscripciones-push | token, navegador | recurso suscripcion_push |
| DELETE /suscripciones-push/{id} | sin cuerpo | recurso suscripcion_push con estado inválida |
| WSS /cable | token en el parámetro de conexión, canal y conversacion_id en la suscripción | confirmación de suscripción y, en adelante, mensajes difundidos |

> Nota. Cuarenta y tres operaciones, las mismas de la Tabla 18. Dos precisiones que el resguardo impone. El código de activación se devuelve en claro una sola vez, en la respuesta de la operación que lo genera o regenera, y no vuelve a ser recuperable: la entidad almacena su derivación y no el valor, del mismo modo que la contraseña, conforme a RN-06 y RNF-03.
