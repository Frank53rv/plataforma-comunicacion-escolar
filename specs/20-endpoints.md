<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 18 · Inventario de endpoints de la interfaz de programación

| Método y ruta | Roles autorizados | Caso de uso | Requisitos que realiza |
|---|---|---|---|
| POST /api/v1/sesiones | Sin autenticar | CU-01 | RF-01 |
| DELETE /api/v1/sesiones | Directivo, docente, tutor, alumno | CU-01 | RF-01 |
| POST /api/v1/activaciones | Sin autenticar | CU-02 | RF-06 |
| POST /api/v1/recuperaciones | Sin autenticar | CU-02 | RF-08 (Should) |
| PATCH /api/v1/usuarios/me/contrasena | Directivo, docente, tutor, alumno | CU-02 | RF-43 |
| POST /api/v1/anios-lectivos | Directivo | CU-03 | RF-11 |
| GET /api/v1/anios-lectivos | Directivo | CU-03 | RF-11 |
| PATCH /api/v1/anios-lectivos/{id} | Directivo | CU-03 | RF-16 (Should) |
| POST /api/v1/cursos | Directivo | CU-03 | RF-12 |
| GET /api/v1/cursos | Directivo (todos los cursos), docente (cursos con vinculación vigente) | CU-03, CU-09 | RF-12 |
| PATCH /api/v1/cursos/{id} | Directivo | CU-03 | RF-12 |
| POST /api/v1/docentes | Directivo | CU-04 | RF-03, RF-05 |
| POST /api/v1/cursos/{id}/docentes | Directivo | CU-04 | RF-15 |
| DELETE /api/v1/cursos/{id}/docentes/{usuarioId} | Directivo | CU-04 | RF-44 |
| DELETE /api/v1/docentes/{id} | Directivo | CU-04 | RF-44 |
| POST /api/v1/usuarios/{id}/codigos-activacion | Directivo (docentes), docente (alumnos y tutores) | CU-04, CU-05 | RF-07 |
| POST /api/v1/alumnos | Docente | CU-05 | RF-04, RF-05, RF-13 |
| POST /api/v1/alumnos/{id}/tutores | Docente | CU-05 | RF-04, RF-05, RF-14 |
| DELETE /api/v1/alumnos/{id} | Directivo, docente titular | CU-05 | RF-09 |
| DELETE /api/v1/tutores/{id} | Directivo, docente titular | CU-05 | RF-09, RF-10 |
| POST /api/v1/anuncios | Docente | CU-06 | RF-17, RF-18 (Should), RF-21, RF-31 |
| DELETE /api/v1/anuncios/{id} | Docente autor | CU-08 | RF-20 |
| GET /api/v1/anuncios | Directivo, docente, tutor, alumno | CU-09 | RF-22, RF-39 |
| GET /api/v1/anuncios/{id} | Directivo, docente, tutor, alumno | CU-09 | RF-22 |
| GET /api/v1/anuncios/{id}/constancias | Docente autor | CU-11 | RF-23, RF-38 (Should) |
| GET /api/v1/paneles/me | Directivo, docente, tutor, alumno | CU-09 | RF-40 |
| GET /api/v1/supervision/cursos | Directivo | CU-09, CU-15 | RF-45 |
| POST /api/v1/entregas/acuses | Tutor, alumno | CU-14 | RF-34 |
| POST /api/v1/entregas/vistas | Tutor, alumno | CU-10 | RF-34, RF-35, RF-36 |
| POST /api/v1/entregas/lecturas | Tutor, alumno | CU-10 | RF-34, RF-36 |
| GET /api/v1/cursos/{id}/conversaciones | Docente, tutor, alumno | CU-12 | RF-24 (Should), RF-25, RF-26 (Should), RF-27 (Should) |
| GET /api/v1/conversaciones | Docente, tutor, alumno | CU-12 | RF-25, RF-47 (Should) |
| GET /api/v1/conversaciones/{id}/mensajes | Participantes de la conversación | CU-12 | RF-28, RF-29 |
| POST /api/v1/conversaciones/{id}/mensajes | Participantes de la conversación | CU-12 | RF-25, RF-29, RF-32 |
| POST /api/v1/conversaciones/{id}/adjuntos | Participantes de la conversación | CU-12 | RF-30 (Should) |
| PUT /api/v1/conversaciones/{id}/puntero-lectura | Participantes de la conversación | CU-12 | RF-47 (Should) |
| GET /api/v1/supervision/conversaciones | Directivo | CU-15 | RF-46 (Should) |
| GET /api/v1/usuarios/me/preferencias | Directivo, docente, tutor, alumno | CU-13 | RF-33 |
| PUT /api/v1/usuarios/me/preferencias | Directivo, docente, tutor, alumno | CU-13 | RF-33 |
| POST /api/v1/suscripciones-push | Directivo, docente, tutor, alumno | CU-14 | RF-37 |
| DELETE /api/v1/suscripciones-push/{id} | Directivo, docente, tutor, alumno | CU-14 | RF-37 |
| WSS /cable | Docente, tutor, alumno | CU-12 | RF-25, RF-29, RF-32 |

> Nota. Cuarenta y una operaciones sobre HTTP más el canal de tiempo real, derivadas de los quince casos de uso de la Tabla 13. CU-07 no dispone de operación propia: se realiza como eliminación del anuncio (CU-08) seguida de una publicación nueva (CU-06). La columna de roles autorizados es el insumo directo de RNF-01: la matriz de pruebas de autorización de la Etapa 4 se construye como el producto de esta columna por los cuatro roles, de modo que cada operación se prueba tanto con el rol habilitado como con los no habilitados.
