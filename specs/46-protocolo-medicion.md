<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 37 · Protocolo de medición de los requisitos no funcionales

| Requisito | Métrica comprometida | Instrumento | Escenario de medición | Incremento |
|---|---|---|---|---|
| RNF-01 | El 100 % de los endpoints que exponen datos académicos rechaza la petición sin token válido o con rol no autorizado | Suite RSpec de autorización | Las 36 operaciones HTTP Must have de la Tabla 18 por los cuatro roles, con el habilitado y con los no habilitados: 144 casos, conforme a CP-RNF-01. Quedan fuera las cinco operaciones cuyos requisitos son todos Should have, que no se construyen | 6 |
| RNF-08 | Entrega del mensaje al destinatario conectado en menos de dos segundos | Registro de marcas de tiempo del cliente y del servidor | Conversación sobre el entorno de demostración bajo carga nominal | 5 y 6 |
| RNF-09 | Respuesta de las consultas de anuncios e historial por debajo de 1,5 segundos en el percentil 95 | Medición sobre peticiones repetidas con la paginación por omisión de la Tabla 28 | Conjunto de prueba de dos años lectivos: 184 cuentas, 400 anuncios, 36.000 filas de entrega y 16.000 mensajes | 6 |
| RNF-10 | Cuarenta conexiones de tiempo real simultáneas sostenidas | Script de apertura concurrente de conexiones | Entorno de demostración sobre el equipo declarado en la Tabla 34 | 6 |
| RNF-17 | La totalidad de los endpoints descrita en OpenAPI y ejecutable desde una colección de validación | Colección de Postman contrastada contra el enrutador y contra la Tabla 18 | Las operaciones de la Tabla 18 con sus respuestas de éxito y de error del catálogo de la Tabla 24 | 6 |
| RNF-19 | El entorno completo se levanta por contenedores desde el repositorio, sin edición manual de archivos | Procedimiento de la Tabla 35 sobre una copia limpia del repositorio | Equipo sin estado previo, con las variables de la Tabla 30 provistas por entorno | 1, revalidado en 6 |
| RNF-20 | Cobertura de líneas igual o superior al 70 % | SimpleCov y Jest sobre la ejecución de cada suite completa | Código de la interfaz de programación y del cliente web | Cada incremento |
| RNF-13, RNF-14, RNF-15, RNF-16 y RNF-18 | Completitud sin asistencia, acciones erróneas, tiempo por tarea, localización en tres pasos y operabilidad en tres anchos | Sesión de validación conforme a las métricas de la Tabla 16 | De tres a cinco personas mayores de edad sobre las tareas críticas de la Tabla 17, en 360, 768 y 1280 píxeles | 6 |
| RNF-22 | Cada requisito Must have con caso de prueba asociado y con la ejecución aprobada de ese caso | Contraste de la Tabla 15 contra la Tabla 32 y registro de ejecución del punto 5.4 | Los casos de prueba de los requisitos Must have, incluido CP-RNF-22 | 6 |

> Nota. El escenario de medición de RNF-09 y RNF-10 es el conjunto de prueba que el propio requisito RNF-09 declara, poblado por el archivo de datos de prueba que el repositorio versiona, de modo que la medición se repita sobre el mismo volumen en cualquier equipo. Los requisitos RNF-02 a RNF-07, RNF-11, RNF-12 y RNF-21 no figuran en esta tabla porque su verificación no es una medición sino una comprobación: se ejecutan como casos de la matriz de la Tabla 32 o se inspeccionan sobre el código durante la revisión de la rama.
