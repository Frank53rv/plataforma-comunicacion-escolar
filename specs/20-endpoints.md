<!-- GENERADO desde TFG_entrega_5_Etapa4_v52.docx. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 27 · Inventario de endpoints de la interfaz de programación

| Método y ruta | Operación | Roles autorizados | Caso de uso | Requisitos que realiza |
|---|---|---|---|---|
| POST /api/v1/sesiones | Autenticar y emitir el token | Sin autenticar | CU-01 | RF-01 |
| DELETE /api/v1/sesiones | Cerrar la sesión activa | Directivo, docente, tutor, alumno | CU-01 | RF-01 |
| POST /api/v1/activaciones | Canjear el código y definir la contraseña | Sin autenticar | CU-02 | RF-06 |
| POST /api/v1/recuperaciones | Restablecer el acceso mediante código regenerado | Sin autenticar | CU-02 | RF-08 (Should) |
| PATCH /api/v1/usuarios/me/contrasena | Sustituir la credencial provisional | Directivo, docente, tutor, alumno | CU-02 | RF-43 |
| POST /api/v1/anios-lectivos | Crear el año lectivo | Directivo | CU-03 | RF-11 |
| GET /api/v1/anios-lectivos | Consultar los años lectivos | Directivo | CU-03 | RF-11 |
| PATCH /api/v1/anios-lectivos/{id} | Cerrar el año lectivo | Directivo | CU-03 | RF-16 (Should) |
| POST /api/v1/cursos | Crear un curso del año lectivo vigente | Directivo | CU-03 | RF-12 |
| GET /api/v1/cursos | Consultar los cursos | Directivo, docente | CU-03, CU-09 | RF-12 |
| PATCH /api/v1/cursos/{id} | Editar un curso | Directivo | CU-03 | RF-12 |
| POST /api/v1/docentes | Dar de alta a un docente y generar su código | Directivo | CU-04 | RF-03, RF-05 |
| POST /api/v1/cursos/{id}/docentes | Vincular un docente al curso con su atributo de titularidad | Directivo | CU-04 | RF-15 |
| DELETE /api/v1/cursos/{id}/docentes/{usuarioId} | Desvincular al docente designando otro titular | Directivo | CU-04 | RF-44 |
| DELETE /api/v1/docentes/{id} | Dar de baja lógica a un docente | Directivo | CU-04 | RF-44 |
| POST /api/v1/usuarios/{id}/codigos-activacion | Regenerar el código de activación | Directivo (docentes), docente (alumnos y tutores) | CU-04, CU-05 | RF-07 |
| POST /api/v1/alumnos | Dar de alta a un alumno y vincularlo a un curso | Docente | CU-05 | RF-04, RF-05, RF-13 |
| POST /api/v1/alumnos/{id}/tutores | Vincular un tutor al alumno | Docente | CU-05 | RF-04, RF-05, RF-14 |
| DELETE /api/v1/alumnos/{id} | Dar de baja lógica a un alumno | Directivo, docente titular | CU-05 | RF-09 |
| DELETE /api/v1/tutores/{id} | Dar de baja lógica a un tutor | Directivo, docente titular | CU-05 | RF-09, RF-10 |
| POST /api/v1/anuncios | Publicar un anuncio de forma inmediata o programada | Docente | CU-06 | RF-17, RF-18 (Should), RF-21, RF-31 |
| PATCH /api/v1/anuncios/{id} | Editar el anuncio generando una versión nueva | Docente autor | CU-07 | RF-19 (Should), RF-21 |
| DELETE /api/v1/anuncios/{id} | Eliminar lógicamente el anuncio | Docente autor | CU-08 | RF-20 |
| GET /api/v1/anuncios | Consultar el historial filtrado por fecha, curso y remitente | Directivo, docente, tutor, alumno | CU-09 | RF-22, RF-39 |
| GET /api/v1/anuncios/{id} | Consultar el detalle de un anuncio | Directivo, docente, tutor, alumno | CU-09 | RF-22 |
| GET /api/v1/anuncios/{id}/constancias | Consultar el recuento de lecturas y la nómina de quienes no leyeron | Docente autor | CU-11 | RF-23, RF-38 (Should) |
| GET /api/v1/paneles/me | Obtener el panel correspondiente al rol autenticado | Directivo, docente, tutor, alumno | CU-09 | RF-40 |
| GET /api/v1/supervision/cursos | Consultar el estado agregado de entrega y lectura por curso | Directivo | CU-09, CU-15 | RF-45 |
| POST /api/v1/entregas/acuses | Registrar el acuse de recepción emitido por el cliente | Tutor, alumno | CU-14 | RF-34 |
| POST /api/v1/entregas/vistas | Registrar en lote los eventos de vista | Tutor, alumno | CU-10 | RF-34, RF-35, RF-36 |
| POST /api/v1/entregas/lecturas | Registrar el evento de lectura | Tutor, alumno | CU-10 | RF-34, RF-36 |
| GET /api/v1/cursos/{id}/conversaciones | Obtener los canales del curso que corresponden al rol | Docente, tutor, alumno | CU-12 | RF-24 (Should), RF-25, RF-26 (Should), RF-27 (Should) |
| GET /api/v1/conversaciones | Consultar las conversaciones del usuario y sus mensajes no leídos | Docente, tutor, alumno | CU-12 | RF-25, RF-47 (Should) |
| GET /api/v1/conversaciones/{id}/mensajes | Consultar el historial paginado de la conversación | Participantes de la conversación | CU-12 | RF-28, RF-29 |
| POST /api/v1/conversaciones/{id}/mensajes | Emitir un mensaje en la conversación | Participantes de la conversación | CU-12 | RF-25, RF-29, RF-32 |
| POST /api/v1/conversaciones/{id}/adjuntos | Adjuntar un archivo en formato PDF | Participantes de la conversación | CU-12 | RF-30 (Should) |
| PUT /api/v1/conversaciones/{id}/puntero-lectura | Actualizar el puntero de lectura | Participantes de la conversación | CU-12 | RF-47 (Should) |
| GET /api/v1/supervision/conversaciones | Acceder a las conversaciones del año lectivo vigente | Directivo | CU-15 | RF-46 (Should) |
| GET /api/v1/usuarios/me/preferencias | Consultar el horario de disponibilidad y las preferencias | Directivo, docente, tutor, alumno | CU-13 | RF-33 |
| PUT /api/v1/usuarios/me/preferencias | Configurar el horario de disponibilidad y las preferencias | Directivo, docente, tutor, alumno | CU-13 | RF-33 |
| POST /api/v1/suscripciones-push | Registrar el identificador de destino del navegador | Directivo, docente, tutor, alumno | CU-14 | RF-37 |
| DELETE /api/v1/suscripciones-push/{id} | Invalidar un identificador de destino | Directivo, docente, tutor, alumno | CU-14 | RF-37 |
| WSS /cable | Establecer el canal de tiempo real, autenticado con el mismo token | Docente, tutor, alumno | CU-12 | RF-25, RF-29, RF-32 |

> Nota. Cuarenta y dos operaciones sobre HTTP más el canal de tiempo real, derivadas de los quince casos de uso de la Tabla 20. La columna de roles autorizados es el insumo directo de RNF-01: la matriz de pruebas de autorización de la Etapa 4 se construye como el producto de esta columna por los cuatro roles, de modo que cada operación se prueba tanto con el rol habilitado como con los no habilitados. La verificación de RNF-17 consiste en contrastar las rutas declaradas en el enrutador de la aplicación contra las descritas en el archivo OpenAPI y contra esta tabla, con diferencia nula en los tres sentidos. El prefijo de versión de la ruta y la forma concreta de los parámetros se fijan en las Tablas 39 y 40 del punto 4.2, sin alterar el conjunto de operaciones que esta tabla compromete.
