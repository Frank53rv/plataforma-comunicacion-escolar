<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 13 · Especificación resumida de los casos de uso

| Código | Caso de uso | Actor principal | Actores secundarios | Precondición | Postcondición | Requisitos que realiza |
|---|---|---|---|---|---|---|
| CU-01 | Autenticarse | Directivo, docente, tutor, alumno | — | La cuenta existe y está activada. | El usuario obtiene un token válido con su identidad y su rol. | RF-01, RF-02 |
| CU-02 | Activar cuenta con código | Tutor, alumno, docente, directivo | — | Existe un código de activación vigente asociado a la persona. | La cuenta queda activa con contraseña propia y el código se invalida. | RF-05, RF-06, RF-08, RF-43 |
| CU-03 | Administrar año lectivo y cursos | Directivo | — | El directivo está autenticado. | El año lectivo y sus cursos quedan creados o modificados. | RF-11, RF-12, RF-16 |
| CU-04 | Administrar docentes y asignaciones | Directivo | — | Existe un año lectivo vigente con cursos. | El docente queda dado de alta, asignado, desvinculado o dado de baja, con titularidad definida. | RF-03, RF-07, RF-15, RF-44 |
| CU-05 | Administrar alumnos y tutores | Docente, directivo | — | El docente está vinculado al curso. | Alumnos y tutores quedan registrados, vinculados o dados de baja, con su código generado. | RF-04, RF-05, RF-07, RF-09, RF-10, RF-13, RF-14 |
| CU-06 | Publicar anuncio | Docente | Servicio de notificaciones | El docente está vinculado a al menos un curso del año lectivo vigente. | El anuncio queda publicado, los destinatarios resueltos y las filas de entrega creadas en estado enviada. | RF-17, RF-18, RF-21, RF-31, RF-34 |
| CU-07 | Editar anuncio | Docente | Servicio de notificaciones | Existe un anuncio propio publicado. | Se genera una publicación nueva con destinatarios resueltos nuevamente. | RF-19, RF-21 |
| CU-08 | Eliminar anuncio | Docente | — | Existe un anuncio propio publicado. | El anuncio queda eliminado lógicamente, con autor y fecha, y sus filas de entrega conservadas. | RF-20 |
| CU-09 | Consultar anuncios e historial | Directivo, docente, tutor, alumno | — | El usuario está autenticado. | El usuario obtiene los anuncios que le corresponden, filtrados. | RF-22, RF-39, RF-40, RF-45 |
| CU-10 | Registrar vista y lectura | Tutor, alumno | — | Existe al menos una fila de entrega dirigida al usuario. | Los estados vista y leída quedan registrados con marca de tiempo, de forma monótona e idempotente. | RF-34, RF-35, RF-36 |
| CU-11 | Consultar constancias de lectura | Docente | — | El docente publicó al menos un anuncio. | El docente obtiene el recuento de lecturas y la nómina de quienes no leyeron. | RF-23, RF-38 |
| CU-12 | Participar en conversación | Docente, tutor, alumno | — | El usuario está vinculado al curso de la conversación. | El mensaje queda persistido y difundido a los participantes conectados. | RF-24, RF-25, RF-26, RF-27, RF-28, RF-29, RF-30, RF-32, RF-47 |
| CU-13 | Configurar preferencias | Directivo, docente, tutor, alumno | — | El usuario está autenticado. | El horario de disponibilidad y las preferencias de recepción quedan registrados. | RF-33 |
| CU-14 | Entregar notificación | Sistema (temporizador de la cola de trabajos) | Servicio de notificaciones | Existe una fila de entrega en estado enviada. | La entrega queda registrada como entregada por acuse del cliente, o con causa de fallo y degradación a aviso en la aplicación. | RF-31, RF-32, RF-34, RF-37 |
| CU-15 | Supervisar estado de la comunicación | Directivo | — | Existe un año lectivo vigente con anuncios publicados. | El directivo obtiene el estado agregado de entrega y lectura por curso y, cuando RF-46 se incorpore, el acceso a las conversaciones del año lectivo vigente, con la supervisión declarada a sus participantes. | RF-45, RF-46 |

> Nota. La tabla presenta la vista sinóptica de los quince casos de uso. La especificación de cada uno —flujo principal, flujos alternativos, flujos de excepción y reglas de negocio aplicadas— se desarrolla a continuación, y los cuatro de mayor complejidad se representan además en los diagramas de actividades y de secuencia de este mismo punto. Los casos de prueba derivados de cada flujo se documentan en el plan de pruebas de la Etapa 4.
