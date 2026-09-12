<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 10 · Matriz de requisitos funcionales

| Código | Requisito funcional | Descripción | Compl. | Prior. |
|---|---|---|---|---|
| Módulo A — Gestión de identidad y acceso |  |  |  |  |
| RF-01 | Autenticación de usuarios | El sistema debe autenticar a cada usuario mediante credenciales y emitir un token JSON Web Token firmado, con vencimiento, que transporte su identidad y su rol. | Alta | M |
| RF-02 | Control de acceso basado en roles | El sistema debe verificar el rol del usuario autenticado en la totalidad de los endpoints que exponen datos académicos, sobre los cuatro roles definidos. | Alta | M |
| RF-03 | Alta de docentes y asignación a cursos | El directivo debe poder registrar docentes y asignarlos a uno o varios cursos, indicando en la vinculación cuál de ellos es el titular. | Media | M |
| RF-04 | Alta de alumnos y tutores | El docente debe poder registrar alumnos de sus cursos y hasta dos tutores por alumno. | Media | M |
| RF-05 | Generación de código de activación | Al registrar a una persona, el sistema debe generar un código de activación de un solo uso, con vencimiento de siete días, asociado a ella. | Media | M |
| RF-06 | Activación de cuenta | La persona debe poder activar su cuenta ingresando el código válido y definiendo su propia contraseña. El código se invalida al ser utilizado. | Media | M |
| RF-07 | Regeneración de código de activación | El docente debe poder regenerar el código de un alumno o tutor de sus cursos, y el directivo el de un docente, cuando el anterior venció o se perdió, invalidando el previo. | Baja | M |
| RF-08 | Recuperación de contraseña | El sistema debe permitir restablecer la contraseña mediante un código regenerado según RF-07, sin requerir servicio de correo saliente. | Baja | S |
| RF-09 | Baja lógica de alumnos y tutores | El directivo o el docente titular del curso deben poder dar de baja a un alumno o a un tutor. La baja revoca el acceso y conserva la totalidad del historial asociado. | Media | M |
| RF-10 | Restricción de baja de tutor vinculado | El sistema debe impedir la baja de un tutor que mantenga al menos un alumno activo en cualquier curso. | Baja | M |
| RF-43 | Cambio obligatorio de credencial provisional | El sistema debe exigir el cambio de la contraseña provisional en el primer acceso y no debe habilitar ninguna otra operación hasta que el cambio se complete. Aplica a la credencial semilla del directivo, provista por variable de entorno. | Baja | M |
| RF-44 | Desvinculación y baja de docente | El directivo debe poder desvincular a un docente de un curso y darlo de baja lógica. Sus anuncios y mensajes se conservan con su autoría histórica y sus constancias asociadas permanecen. Si el docente era titular, la desvinculación exige designar otro titular en el mismo acto. | Media | M |
| Módulo B — Estructura académica |  |  |  |  |
| RF-11 | Creación del año lectivo | El directivo debe poder crear un año lectivo, que actúa como contenedor de los cursos y delimita el archivado. | Baja | M |
| RF-12 | Administración de cursos | El directivo debe poder crear y editar cursos dentro del año lectivo vigente. | Baja | M |
| RF-13 | Vinculación de alumnos a cursos | El sistema debe permitir vincular cada alumno a un curso del año lectivo vigente. | Baja | M |
| RF-14 | Vinculación de tutores a alumnos | El sistema debe permitir vincular hasta dos tutores por alumno, y un mismo tutor a varios alumnos, bajo una única cuenta y sin perfiles separados. | Media | M |
| RF-15 | Vinculación de docentes a cursos | El sistema debe permitir vincular uno o varios docentes a un mismo curso, distinguiendo mediante un atributo de la vinculación cuál posee las atribuciones de titular. | Media | M |
| RF-16 | Cierre del año lectivo | Al cerrar el año lectivo, el sistema debe dejar los cursos y sus conversaciones en modo de solo lectura y habilitar la creación de los cursos del período siguiente, conservando las cuentas de los alumnos que continúan. | Media | S |
| Módulo C — Anuncios |  |  |  |  |
| RF-17 | Publicación de anuncios | El docente debe poder redactar y publicar anuncios dirigidos a los tutores y alumnos de los cursos que tiene asignados. | Media | M |
| RF-18 | Programación de la hora de envío | El docente debe poder fijar una fecha y hora futuras de publicación. En ausencia de programación, el anuncio se publica al confirmarse. | Media | S |
| RF-19 | Edición con versionado | La edición de un anuncio debe generar una versión nueva, resolver nuevamente los destinatarios, volver a notificarlos e invalidar los acuses de la versión anterior a efectos del contador vigente, conservando los registros históricos. | Alta | S |
| RF-20 | Borrado lógico de anuncios | El docente debe poder eliminar un anuncio propio. La eliminación es lógica, deja registro de autor y fecha, y conserva las filas de entrega asociadas. | Baja | M |
| RF-21 | Resolución de destinatarios | El sistema debe resolver el conjunto de destinatarios en cada publicación efectiva —inicial o de reemplazo— y no en el momento de la redacción. Las personas incorporadas al curso con posterioridad no reciben publicaciones anteriores. | Media | M |
| RF-22 | Consulta del historial de anuncios | Todo usuario debe poder recuperar los anuncios que le corresponden, filtrando por fecha, curso y remitente. | Media | M |
| RF-23 | Panel de constancias del docente | El docente debe poder consultar, por anuncio, la cantidad de destinatarios que registraron lectura sobre el total y la nómina de quienes no lo hicieron. | Media | M |
| RF-45 | Consulta directiva del estado de la comunicación | El directivo debe poder consultar los anuncios de la totalidad de los cursos del año lectivo vigente y el estado agregado de entrega y lectura por curso. | Media | M |
| Módulo D — Mensajería |  |  |  |  |
| RF-24 | Canal grupal de alumnos | Cada curso debe disponer de un canal grupal en tiempo real integrado por sus docentes y sus alumnos, separado del de tutores. | Media | S |
| RF-25 | Canal grupal del curso | Cada curso debe disponer de un canal grupal en tiempo real integrado por sus docentes y los tutores de sus alumnos, existente desde la creación del curso. | Alta | M |
| RF-26 | Conversación privada alumno-docente | El alumno debe poder mantener conversaciones privadas únicamente con docentes vinculados a su curso. | Media | S |
| RF-27 | Conversación privada tutor-docente | El tutor debe poder mantener conversaciones privadas únicamente con docentes vinculados al curso de su hijo. | Media | S |
| RF-28 | Persistencia e historial de mensajes | El sistema debe persistir la totalidad de los mensajes y permitir su recuperación por fecha y por participante. | Media | M |
| RF-29 | Restricción de participación | El sistema debe impedir la participación de cualquier usuario en una conversación de un curso al que no se encuentre vinculado. | Media | M |
| RF-30 | Adjuntos en formato PDF | El sistema debe permitir adjuntar archivos en formato PDF, rechazando cualquier otro formato, todo archivo que supere los 5 MB y toda publicación que incluya más de tres archivos. | Media | S |
| RF-46 | Supervisión directiva de conversaciones | El directivo debe poder acceder a las conversaciones de los cursos del año lectivo vigente. La supervisión debe declararse de forma visible y permanente a todos los participantes. | Media | S |
| RF-47 | Indicador de mensajes no leídos | El sistema debe presentar, por conversación, la cantidad de mensajes posteriores al puntero de lectura del usuario. | Baja | S |
| Módulo E — Notificaciones y constancias |  |  |  |  |
| RF-31 | Notificación de anuncios | El sistema debe emitir una notificación push a cada destinatario al publicarse un anuncio, con independencia de su horario de disponibilidad. Los anuncios institucionales no son configurables por el destinatario. | Media | M |
| RF-32 | Notificación de mensajes | El sistema debe emitir notificación por mensaje de conversación aplicando el rol del destinatario, su horario de disponibilidad y sus preferencias; fuera del horario configurado la notificación se difiere, no se descarta. | Alta | M |
| RF-33 | Configuración de preferencias | Cada usuario debe poder configurar su horario de disponibilidad y sus preferencias de recepción para los mensajes de conversación. La interfaz debe indicar de forma visible que los anuncios institucionales no están alcanzados por esta configuración. | Media | M |
| RF-34 | Registro de estados de notificación | El sistema debe registrar, por persona y por publicación, los estados enviada, entregada, vista y leída, cada uno con marca de tiempo. Los estados no retroceden. | Alta | M |
| RF-35 | Emisión de eventos de vista en lote | El cliente debe acumular los identificadores de los anuncios que ingresan al área visible y emitirlos agrupados en una sola petición. | Media | M |
| RF-36 | Idempotencia del registro de eventos | El registro de un evento de estado debe ser idempotente: la reemisión del mismo evento no altera la marca de tiempo original. | Media | M |
| RF-37 | Degradación ante fallo de entrega | Ante indisponibilidad del servicio push, ausencia de acuse del cliente o falta de soporte del navegador, el sistema debe entregar el aviso dentro de la aplicación y registrar la causa, sin reintentar de manera indefinida ante credenciales inválidas. | Alta | M |
| RF-38 | Indicador de familia alcanzada | El sistema debe calcular, de forma derivada, si al menos uno de los tutores de un alumno registró lectura de la publicación vigente de un anuncio. | Baja | S |
| Módulo F — Cliente web |  |  |  |  |
| RF-39 | Bandeja de anuncios como vista de entrada | El panel de cada rol debe presentar la bandeja de anuncios como vista inicial tras la autenticación. | Baja | M |
| RF-40 | Paneles diferenciados por rol | El cliente debe presentar paneles con las funciones correspondientes al rol de la persona autenticada, sin exponer opciones ajenas a él. | Alta | M |
| RF-41 | Interfaz responsiva | El cliente debe ser operable desde navegador en dispositivos de escritorio y móviles, en los anchos de referencia de 360 px, 768 px y 1280 px. | Media | M |
| RF-42 | Cobertura de flujos en interfaz | La totalidad de los flujos comprometidos debe poder ejecutarse desde el cliente web, sin recurrir a herramientas de composición de peticiones. | Media | M |

> Nota. Prioridad MoSCoW: M Must have, S Should have, C Could have, W Won't have. El conjunto comprende 36 requisitos Must have y 11 Should have.
