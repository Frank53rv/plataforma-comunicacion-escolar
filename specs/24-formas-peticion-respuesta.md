<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 29 · Formas de petición y respuesta por operación

| Operación | Parámetros o cuerpo de la petición | Cuerpo de la respuesta de éxito |
|---|---|---|
| POST /sesiones | correo, contrasena | token, vence_en, usuario con id, nombre, apellido, rol y credencial_provisional |
| DELETE /sesiones | sin cuerpo | sin cuerpo |
| POST /activaciones | codigo, contrasena | token, vence_en, usuario. Sólo se canjea el código de una cuenta en estado pendiente: una cuenta activa no se reactiva por código |
| POST /recuperaciones | codigo, contrasena | token, vence_en, usuario |
| PATCH /usuarios/me/contrasena | contrasena_actual, contrasena_nueva | usuario con credencial_provisional en falso |
| POST /anios-lectivos | anio | recurso anio_lectivo |
| GET /anios-lectivos | sin parámetros | colección de anio_lectivo |
| PATCH /anios-lectivos/{id} | estado igual a cerrado | recurso anio_lectivo con cerrado_en |
| POST /cursos | anio_lectivo_id, nombre, turno | recurso curso |
| GET /cursos | anio_lectivo_id opcional, estado opcional | colección de curso; cada curso trae docentes, con es_titular, y alumnos con sus tutores, con id, nombre, apellido, correo y estado, sobre vinculaciones vigentes. El directivo recibe todos los cursos; el docente, sólo aquellos con vinculación vigente |
| PATCH /cursos/{id} | nombre, turno | recurso curso |
| POST /docentes | nombre, apellido, correo | recurso usuario y codigo_activacion con vence_en y el código en claro, devuelto una sola vez |
| POST /cursos/{id}/docentes | usuario_id, es_titular | recurso docente_curso |
| DELETE /cursos/{id}/docentes/{usuarioId} | titular_reemplazo_id, obligatorio si el desvinculado es titular: otro docente vinculado y habilitado, que asume la titularidad desde el día de la operación | recurso docente_curso con vigente_hasta |
| DELETE /docentes/{id} | sin cuerpo | recurso usuario con estado dado de baja. Responde 409 (RN-13) mientras el docente conserve cualquier vinculación vigente |
| POST /usuarios/{id}/codigos-activacion | sin cuerpo | codigo_activacion con id, usuario_id, vence_en y el código en claro, devuelto una sola vez. Sólo se regenera el código de una cuenta en estado pendiente; el anterior recibe usado_en |
| POST /alumnos | nombre, apellido, correo, curso_id | recurso usuario, alumno_curso y codigo_activacion con vence_en y el código en claro, devuelto una sola vez |
| POST /alumnos/{id}/tutores | nombre, apellido, correo | recurso usuario, tutor_alumno y codigo_activacion con id, usuario_id, vence_en y el código en claro, devuelto una sola vez. Cuando el tutor ya existe y la operación sólo lo vincula, codigo_activacion se devuelve nulo: la cuenta ya está activa y no se emite código. |
| DELETE /alumnos/{id} | sin cuerpo | recurso usuario con estado dado de baja |
| DELETE /tutores/{id} | sin cuerpo | recurso usuario con estado dado de baja |
| POST /anuncios | titulo, cuerpo, cursos como lista de identificadores | recurso anuncio con su anuncio_version y la cantidad de destinatarios resueltos |
| DELETE /anuncios/{id} | sin cuerpo | recurso anuncio con eliminado_en y eliminado_por |
| GET /anuncios | curso_id, remitente_id, desde, hasta, orden (publicado_en:desc por omisión o publicado_en:asc), pagina, por_pagina | colección de anuncio con titulo, publicado_en, autor, anuncio_version_id —con el que el cliente emite las vistas de RF-35— y el estado de lectura de quien consulta. Excluye los anuncios eliminados |
| GET /anuncios/{id} | sin parámetros | recurso anuncio con su versión vigente, sus cursos y sus adjuntos, lista que se devuelve vacía |
| GET /anuncios/{id}/constancias | pagina, por_pagina | total de destinatarios, cantidad con lectura registrada y nómina de quienes no leyeron |
| GET /paneles/me | sin parámetros | rol, nombre, opciones_habilitadas, anuncios_sin_leer y cursos con id y nombre según el vínculo vigente. opciones_habilitadas lista identificadores de sección derivados de los roles de la Tabla 18 —anuncios, publicar_anuncio, constancias, conversaciones (sólo si la persona tiene un canal), preferencias, supervision, anios_lectivos, cursos, docentes y alumnos— y la capacidad altas_de_alumnos_y_tutores del docente, que no es una sección |
| GET /supervision/cursos | anio_lectivo_id | por curso: cantidad de anuncios, enviadas, entregadas, vistas y leídas |
| POST /entregas/acuses | anuncio_version_ids como lista | registrada y omitida_por_idempotencia. Cuentan como omitidas las publicaciones sin fila propia, con el estado ya registrado o repetidas en el lote. Sólo tutor y alumno; 403 al resto |
| POST /entregas/vistas | anuncio_version_ids como lista | registrada y omitida_por_idempotencia. Cuentan como omitidas las publicaciones sin fila propia, con el estado ya registrado o repetidas en el lote. Sólo tutor y alumno; 403 al resto |
| POST /entregas/lecturas | anuncio_version_id | entrega_anuncio con leida_en; 404 si no hay fila propia. Sólo tutor y alumno; 403 al resto |
| GET /cursos/{id}/conversaciones | sin parámetros | datos con las conversaciones del curso visibles para el rol, con tipo y estado, más total, pagina 1 y por_pagina 25. Un usuario no vinculado al curso recibe 403 (no_vinculado_al_curso) y quien no integra la conversación, 403 (no_participa_de_la_conversacion) |
| GET /conversaciones | pagina, por_pagina | colección de conversacion con último mensaje, ordenada por nombre del curso |
| GET /conversaciones/{id}/mensajes | pagina, por_pagina, desde, hasta, remitente_id, orden | colección de mensaje con autor y enviado_en. remitente_id filtra por autor; el orden es por enviado_en descendente, invertible con orden=enviado_en:asc |
| POST /conversaciones/{id}/mensajes | cuerpo | recurso mensaje |
| POST /conversaciones/{id}/adjuntos | archivo en formato multiparte, mensaje_id | recurso adjunto |
| PUT /conversaciones/{id}/puntero-lectura | ultimo_mensaje_id | puntero_lectura con actualizado_en y la cantidad de no leídos restante |
| GET /supervision/conversaciones | curso_id, pagina, por_pagina | colección de conversacion del año vigente, en modo de solo lectura |
| GET /usuarios/me/preferencias | sin parámetros | id, usuario_id, hora_inicio, hora_fin, recibir_mensajes. Sin fila configurada responde 00:00–00:00 y recibir_mensajes verdadero, sin id |
| PUT /usuarios/me/preferencias | hora_inicio, hora_fin y recibir_mensajes, los tres obligatorios; horas con formato HH:MM, o 422 | recurso preferencia con id, usuario_id, hora_inicio, hora_fin y recibir_mensajes |
| POST /suscripciones-push | token, navegador | suscripción vigente, sin el token. Reenviar el mismo token de la misma persona devuelve la misma suscripción; un token registrado por otra persona pasa a quien lo presenta; una suscripción inválida se reactiva |
| DELETE /suscripciones-push/{id} | sin cuerpo | recurso suscripcion_push con estado invalida e invalidada_en. Es idempotente y responde 404 si la suscripción es ajena |
| WSS /cable | token en el parámetro de conexión, canal y conversacion_id en la suscripción | confirmación de suscripción y, en adelante, mensajes difundidos. Se rechaza la conexión sin token válido, de cuenta dada de baja o con credencial provisional, y la suscripción de quien no integra la conversación |

> Nota. Cuarenta y dos operaciones, las mismas de la Tabla 18. Dos precisiones que el resguardo impone. El código de activación se devuelve en claro una sola vez, en la respuesta de la operación que lo genera o regenera, y no vuelve a ser recuperable: la entidad almacena su derivación y no el valor, del mismo modo que la contraseña, conforme a RN-06 y RNF-03. El código tiene la forma LLLLLLLL-SSSSSSSS: el localizador son los ocho primeros caracteres hexadecimales del identificador de la fila, y el secreto, ocho caracteres del alfabeto de Crockford derivados con bcrypt; se acepta transcrito a mano. El cliente conoce el identificador de su suscripción push por la respuesta de su registro, porque no existe operación que lea suscripciones.
