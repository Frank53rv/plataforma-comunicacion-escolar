<!-- GENERADO desde Proyecto de grado entrega final.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 15 · Matriz de trazabilidad de requerimientos

| Cód. req. | Título | Tipo | Prior. | RN asociada | Artefacto de diseño | Módulo / componente | Caso de prueba |
|---|---|---|---|---|---|---|---|
| RF-01 | Autenticación de usuarios | Funcional | M | RN-15 | CU-01, Fig. 11 | A · Identidad y acceso | CP-RF-01 |
| RF-02 | Control de acceso basado en roles | Funcional | M | RN-04, RN-15 | CU-01, Fig. 14 | A · Identidad y acceso | CP-RF-02 |
| RF-03 | Alta de docentes y asignación a cursos | Funcional | M | RN-01, RN-02 | CU-04, Fig. 11 | A · Identidad y acceso | CP-RF-03 |
| RF-04 | Alta de alumnos y tutores | Funcional | M | RN-01, RN-03 | CU-05, Fig. 6 | A · Identidad y acceso | CP-RF-04 |
| RF-05 | Generación de código de activación | Funcional | M | RN-05 | CU-02, CU-05, Fig. 6 | A · Identidad y acceso | CP-RF-05 |
| RF-06 | Activación de cuenta | Funcional | M | RN-06 | CU-02, Fig. 6 | A · Identidad y acceso | CP-RF-06 |
| RF-07 | Regeneración de código de activación | Funcional | M | RN-07 | CU-04, CU-05 | A · Identidad y acceso | CP-RF-07 |
| RF-08 | Recuperación de contraseña | Funcional | S | RN-07 | CU-02 | A · Identidad y acceso | CP-RF-08 |
| RF-09 | Baja lógica de alumnos y tutores | Funcional | M | RN-10, RN-11 | CU-05, Fig. 11 | A · Identidad y acceso | CP-RF-09 |
| RF-10 | Restricción de baja de tutor vinculado | Funcional | M | RN-12 | CU-05 | A · Identidad y acceso | CP-RF-10 |
| RF-43 | Cambio obligatorio de credencial provisional | Funcional | M | RN-08, RN-09 | CU-02, Fig. 6 | A · Identidad y acceso | CP-RF-43 |
| RF-44 | Desvinculación y baja de docente | Funcional | M | RN-13, RN-14 | CU-04, Fig. 11 | A · Identidad y acceso | CP-RF-44 |
| RF-11 | Creación del año lectivo | Funcional | M | RN-02, RN-31 | CU-03, Fig. 11 | B · Estructura académica | CP-RF-11 |
| RF-12 | Administración de cursos | Funcional | M | RN-02 | CU-03, Fig. 11 | B · Estructura académica | CP-RF-12 |
| RF-13 | Vinculación de alumnos a cursos | Funcional | M | RN-01, RN-30 | CU-05, Fig. 11 | B · Estructura académica | CP-RF-13 |
| RF-14 | Vinculación de tutores a alumnos | Funcional | M | RN-04, RN-29 | CU-05, Fig. 11 | B · Estructura académica | CP-RF-14 |
| RF-15 | Vinculación de docentes a cursos | Funcional | M | RN-02, RN-13 | CU-04, Fig. 11 | B · Estructura académica | CP-RF-15 |
| RF-16 | Cierre del año lectivo | Funcional | S | RN-26 | CU-03, Fig. 10 | B · Estructura académica | CP-RF-16 |
| RF-17 | Publicación de anuncios | Funcional | M | RN-16, RN-17 | CU-06, Fig. 5, Fig. 7 | C · Anuncios | CP-RF-17 |
| RF-18 | Programación de la hora de envío | Funcional | S | RN-17 | CU-06, Fig. 5, Fig. 10 | C · Anuncios | CP-RF-18 |
| RF-19 | Edición con versionado | Funcional | S | RN-19 | CU-07, Fig. 10 | C · Anuncios | CP-RF-19 |
| RF-20 | Borrado lógico de anuncios | Funcional | M | RN-20 | CU-08, Fig. 10 | C · Anuncios | CP-RF-20 |
| RF-21 | Resolución de destinatarios | Funcional | M | RN-19 | CU-06, CU-07, Fig. 4, Fig. 7 | C · Anuncios | CP-RF-21 |
| RF-22 | Consulta del historial de anuncios | Funcional | M | RN-27, RN-28 | CU-09 | C · Anuncios | CP-RF-22 |
| RF-23 | Panel de constancias del docente | Funcional | M | RN-21 | CU-11 | C · Anuncios | CP-RF-23 |
| RF-45 | Consulta directiva del estado de la comunicación | Funcional | M | RN-22 | CU-09, CU-15 | C · Anuncios | CP-RF-45 |
| RF-25 | Canal grupal del curso | Funcional | M | RN-23 | CU-12, Fig. 8 | D · Mensajería | CP-RF-25 |
| RF-28 | Persistencia e historial de mensajes | Funcional | M | RN-27, RN-28 | CU-12, Fig. 12 | D · Mensajería | CP-RF-28 |
| RF-29 | Restricción de participación | Funcional | M | RN-23 | CU-12, Fig. 8 | D · Mensajería | CP-RF-29 |
| RF-24 | Canal grupal de alumnos | Funcional | S | RN-23 | CU-12 | D · Mensajería | CP-RF-24 |
| RF-26 | Conversación privada alumno-docente | Funcional | S | RN-23 | CU-12 | D · Mensajería | CP-RF-26 |
| RF-27 | Conversación privada tutor-docente | Funcional | S | RN-23 | CU-12 | D · Mensajería | CP-RF-27 |
| RF-30 | Adjuntos en formato PDF | Funcional | S | RN-33 | CU-12, Fig. 12 | D · Mensajería | CP-RF-30 |
| RF-46 | Supervisión directiva de conversaciones | Funcional | S | RN-25 | CU-15 | D · Mensajería | CP-RF-46 |
| RF-47 | Indicador de mensajes no leídos | Funcional | S | — | CU-12, Fig. 12 | D · Mensajería | CP-RF-47 |
| RF-31 | Notificación de anuncios | Funcional | M | RN-18 | CU-06, CU-14, Fig. 4 | E · Notificaciones | CP-RF-31 |
| RF-32 | Notificación de mensajes | Funcional | M | RN-24 | CU-12, CU-14, Fig. 8 | E · Notificaciones | CP-RF-32 |
| RF-33 | Configuración de preferencias | Funcional | M | RN-18, RN-24 | CU-13, Fig. 11 | E · Notificaciones | CP-RF-33 |
| RF-34 | Registro de estados de notificación | Funcional | M | RN-32 | CU-06, CU-10, CU-14, Fig. 9 | E · Notificaciones | CP-RF-34 |
| RF-35 | Emisión de eventos de vista en lote | Funcional | M | — | CU-10, Fig. 7 | E · Notificaciones | CP-RF-35 |
| RF-36 | Idempotencia del registro de eventos | Funcional | M | RN-32 | CU-10, Fig. 9 | E · Notificaciones | CP-RF-36 |
| RF-37 | Degradación ante fallo de entrega | Funcional | M | — | CU-14, Fig. 9 | E · Notificaciones | CP-RF-37 |
| RF-38 | Indicador de familia alcanzada | Funcional | S | RN-21 | CU-11 | E · Notificaciones | CP-RF-38 |
| RF-39 | Bandeja de anuncios como vista de entrada | Funcional | M | — | CU-09 | F · Cliente web | CP-RF-39 |
| RF-40 | Paneles diferenciados por rol | Funcional | M | RN-04, RN-15 | CU-09, Fig. 13 | F · Cliente web | CP-RF-40 |
| RF-41 | Interfaz responsiva | Funcional | M | — | Fig. 13 | F · Cliente web | CP-RF-41 |
| RF-42 | Cobertura de flujos en interfaz | Funcional | M | — | Fig. 13 | F · Cliente web | CP-RF-42 |
| RNF-01 | Control de acceso verificable | No funcional | M | RN-15 | Fig. 14 | A · Identidad y acceso | CP-RNF-01 |
| RNF-02 | Autenticidad de la sesión | No funcional | M | RN-15 | CU-01 | A · Identidad y acceso | CP-RNF-02 |
| RNF-03 | Resguardo de credenciales | No funcional | M | — | Fig. 11 | A · Identidad y acceso | CP-RNF-03 |
| RNF-04 | Trazabilidad de las acciones | No funcional | M | RN-14, RN-20 | Fig. 10, Fig. 12 | C · Anuncios | CP-RNF-04 |
| RNF-05 | No repudio de la constancia | No funcional | M | RN-32 | Fig. 9, Fig. 12 | E · Notificaciones | CP-RNF-05 |
| RNF-06 | Transporte cifrado | No funcional | M | — | Fig. 16 | G · Transversal | CP-RNF-06 |
| RNF-07 | Retención y minimización de datos | No funcional | M | RN-27, RN-28 | Fig. 12, Tabla 14 | G · Transversal | CP-RNF-07 |
| RNF-08 | Latencia de entrega de mensajes | No funcional | M | — | Fig. 8, Fig. 16 | D · Mensajería | CP-RNF-08 |
| RNF-09 | Tiempo de respuesta de consultas | No funcional | M | — | Fig. 14 | G · Transversal | CP-RNF-09 |
| RNF-10 | Capacidad de conexiones simultáneas | No funcional | M | — | Fig. 16 | D · Mensajería | CP-RNF-10 |
| RNF-11 | Tolerancia a la indisponibilidad del servicio push | No funcional | M | — | CU-14, Fig. 9 | E · Notificaciones | CP-RNF-11 |
| RNF-12 | Recuperación del envío diferido | No funcional | M | — | CU-14, Fig. 9 | E · Notificaciones | CP-RNF-12 |
| RNF-13 | Operabilidad por rol | No funcional | M | — | CU-09, Tabla 16 | F · Cliente web | CP-RNF-13 |
| RNF-14 | Protección frente a errores del usuario | No funcional | M | RN-11 | Tabla 27 | F · Cliente web | CP-RNF-14 |
| RNF-15 | Facilidad de aprendizaje | No funcional | M | — | Tabla 27 | F · Cliente web | CP-RNF-15 |
| RNF-16 | Localización de información publicada | No funcional | M | — | CU-09, Tabla 16 | F · Cliente web | CP-RNF-16 |
| RNF-17 | Documentación formal de la interfaz | No funcional | M | — | Fig. 14 | G · Transversal | CP-RNF-17 |
| RNF-18 | Adaptación a distintos dispositivos | No funcional | M | — | Fig. 13 | F · Cliente web | CP-RNF-18 |
| RNF-19 | Reproducibilidad del despliegue | No funcional | M | RN-08 | Fig. 16 | G · Transversal | CP-RNF-19 |
| RNF-20 | Cobertura de pruebas automatizadas | No funcional | M | — | Fig. 14 | G · Transversal | CP-RNF-20 |
| RNF-21 | Separación de responsabilidades | No funcional | M | — | Fig. 13, Fig. 14 | G · Transversal | CP-RNF-21 |
| RNF-22 | Completitud funcional del MVP | No funcional | M | — | Tabla 24 | G · Transversal | CP-RNF-22 |
