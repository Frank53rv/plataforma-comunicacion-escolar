<!-- GENERADO desde TFG_entrega_5_Etapa4_v52.docx. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 21 · Diccionario de datos del modelo entidad-relación

| Entidad | Descripción | Atributos principales | Restricciones |
|---|---|---|---|
| usuario | Persona con acceso al sistema, bajo un único rol. | id, nombre, apellido, correo, contraseña_hash, rol, estado, credencial_provisional, creado_en | Correo único. Rol restringido a directivo, docente, tutor o alumno. Estado con baja lógica. |
| codigo_activacion | Código de un solo uso para la activación de una cuenta o la recuperación de acceso. | id, usuario_id, codigo_hash, vence_en, usado_en, generado_por | Único por usuario entre los vigentes. Vencimiento de siete días. Se invalida al usarse. |
| preferencia | Configuración de recepción de notificaciones de conversación de un usuario. | id, usuario_id, hora_inicio, hora_fin, recibir_mensajes | Una por usuario. No alcanza a los anuncios institucionales. |
| anio_lectivo | Período académico que contiene los cursos y delimita el archivado. | id, anio, estado, abierto_en, cerrado_en | Un solo año lectivo en estado vigente. |
| curso | Unidad académica dentro de un año lectivo. | id, anio_lectivo_id, nombre, turno, estado | Nombre único dentro del año lectivo. |
| docente_curso | Vinculación entre un docente y un curso. | id, usuario_id, curso_id, es_titular, vigente_desde, vigente_hasta | Un único titular vigente por curso. Par usuario-curso único entre los vigentes. |
| alumno_curso | Vinculación entre un alumno y un curso. | id, usuario_id, curso_id, vigente_desde, vigente_hasta | Un alumno pertenece a un solo curso vigente por año lectivo (RN-30). |
| tutor_alumno | Vinculación entre un tutor y un alumno. | id, tutor_id, alumno_id, vigente_desde, vigente_hasta | Hasta dos tutores vigentes por alumno. Par único entre los vigentes. |
| anuncio | Comunicado institucional emitido por un docente. | id, autor_id, estado, programado_para, creado_en, eliminado_en, eliminado_por | Estado en borrador, programado, publicado, archivado o eliminado. Eliminación lógica. |
| anuncio_curso | Cursos a los que se dirige un anuncio. | id, anuncio_id, curso_id | Par único. |
| anuncio_version | Contenido publicado de un anuncio en un momento dado. | id, anuncio_id, numero_version, titulo, cuerpo, publicado_en | Número de versión único por anuncio. En el MVP existe una sola versión por anuncio. |
| adjunto | Archivo en formato PDF asociado a un anuncio o mensaje. | id, anuncio_version_id, mensaje_id, nombre, tipo_mime, tamano, ruta | Tipo restringido a PDF. Tamaño máximo de 5 MB por archivo y hasta tres archivos por anuncio o mensaje. Se asocia a una publicación de anuncio o a un mensaje, nunca a ambos a la vez. |
| entrega_anuncio | Constancia por persona y por publicación, con los cuatro estados. | id, anuncio_version_id, destinatario_id, canal, enviada_en, entregada_en, vista_en, leida_en, causa_fallo | Par publicación-destinatario único. Estados monótonos. Clave única por entrega y estado para garantizar idempotencia. El atributo causa_fallo registra la clasificación de la causa; el detalle técnico del fallo —código informado por el proveedor y suscripción afectada— no se replica aquí: reside en bitacora_envio, con la retención diferenciada de doce meses que fija RNF-07. |
| conversacion | Canal de mensajería asociado a un curso. | id, curso_id, tipo, estado | Tipo en grupal de tutores, grupal de alumnos o privada. Estado de solo lectura al cerrar el año lectivo. |
| participante | Vinculación entre un usuario y una conversación. | id, conversacion_id, usuario_id, incorporado_en | Par único. Deriva de la vinculación del usuario con el curso. |
| mensaje | Unidad de comunicación dentro de una conversación. | id, conversacion_id, autor_id, cuerpo, enviado_en | Autor debe ser participante vigente de la conversación. |
| puntero_lectura | Última posición leída por un usuario en una conversación. | id, conversacion_id, usuario_id, ultimo_mensaje_id, actualizado_en | Uno por par usuario-conversación. Sostiene el indicador de mensajes no leídos de RF-47. |
| suscripcion_push | Identificador de destino que el navegador de una persona entrega al registrarse para recibir notificaciones push. | id, usuario_id, token, navegador, estado, creada_en, invalidada_en | Token único. Una persona puede tener varias suscripciones vigentes, una por navegador. El estado pasa a inválida ante credencial rechazada por el servicio. |
| bitacora_envio | Registro técnico de cada intento de envío fallido, con la causa informada por el servicio de notificaciones. | id, entrega_anuncio_id, suscripcion_id, causa, codigo_proveedor, ocurrido_en | Retención de doce meses, distinta de la del resto de los datos de negocio conforme a RNF-07 y RN-27. No contiene el cuerpo del anuncio ni dato académico alguno. |

> Nota. Los atributos consignados son los principales de cada entidad; el esquema físico completo, con tipos de dato, índices y restricciones de integridad referencial, se documenta en la Tabla 38 del punto 4.2. La entidad entrega_anuncio genera una fila por destinatario y publicación: el curso piloto de treinta alumnos con hasta dos tutores cada uno produce alrededor de noventa filas por anuncio, volumen irrelevante para el motor de base de datos seleccionado. Las entidades suscripcion_push y bitacora_envio sostienen, respectivamente, el identificador de destino que RF-37 invalida ante credencial inválida y la bitácora técnica de fallos cuya retención de doce meses fija RNF-07, distinta de la del resto de los datos de negocio.
