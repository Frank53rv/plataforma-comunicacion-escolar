<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 14 · Diccionario de datos del modelo entidad-relación

| Entidad | Descripción |
|---|---|
| usuario | Persona con acceso al sistema, bajo un único rol. |
| codigo_activacion | Código de un solo uso para la activación de una cuenta o la recuperación de acceso. |
| preferencia | Configuración de recepción de notificaciones de conversación de un usuario. |
| anio_lectivo | Período académico que contiene los cursos y delimita el archivado. |
| curso | Unidad académica dentro de un año lectivo. |
| docente_curso | Vinculación entre un docente y un curso. |
| alumno_curso | Vinculación entre un alumno y un curso. |
| tutor_alumno | Vinculación entre un tutor y un alumno. |
| anuncio | Comunicado institucional emitido por un docente. |
| anuncio_curso | Cursos a los que se dirige un anuncio. |
| anuncio_version | Contenido publicado de un anuncio en un momento dado. |
| adjunto | Archivo en formato PDF asociado a un anuncio o mensaje. |
| entrega_anuncio | Constancia por persona y por publicación, con los cuatro estados. |
| conversacion | Canal de mensajería asociado a un curso. |
| participante | Vinculación entre un usuario y una conversación. La fila se registra al acceder a la conversación; incorporado_en es el inicio del día, en America/Asuncion, de la vinculación que hace participante al usuario —para el docente, su vinculación al curso; para el tutor, la más tardía entre su vinculación al alumno y la del alumno al curso—. La pertenencia (RN-23) se evalúa siempre contra las vinculaciones vigentes. |
| mensaje | Unidad de comunicación dentro de una conversación. |
| puntero_lectura | Última posición leída por un usuario en una conversación. |
| suscripcion_push | Identificador de destino que el navegador de una persona entrega al registrarse para recibir notificaciones push. |
| bitacora_envio | Registro técnico de cada intento de envío fallido, con la causa informada por el servicio de notificaciones. |

> Nota. Los atributos consignados son los principales de cada entidad; el esquema físico completo, con tipos de dato, índices y restricciones de integridad referencial, se documenta en la Tabla 27 del punto 4.2. La entidad entrega_anuncio genera una fila por destinatario y publicación: el curso piloto de treinta alumnos con hasta dos tutores cada uno produce alrededor de noventa filas por anuncio, volumen irrelevante para el motor de base de datos seleccionado.
