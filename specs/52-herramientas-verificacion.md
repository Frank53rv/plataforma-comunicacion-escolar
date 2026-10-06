<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 40 · Herramientas de verificación del documento contra el código

| Herramienta | Qué verifica | Requisito |
|---|---|---|
| Extractor de especificaciones | Extrae las tablas de este documento a specs/, incluido el inventario de operaciones de la Tabla 18, que las compuertas leen como fuente. | RNF-17 · RNF-22 |
| Compuerta de contrato | Contrasta en tres sentidos el enrutador, el archivo OpenAPI y el inventario de la Tabla 18, con diferencia nula. | RNF-17 |
| Compuerta de errores | Contrasta los estados de error del contrato con el catálogo de la Tabla 24. | RNF-17 |
| Compuerta de esquema | Contrasta las migraciones con el esquema físico de la Tabla 27, sin contar las restricciones de verificación como columnas; exceptúa las tablas solid_queue_* y solid_cable_* que crean la cola y el canal. | Tabla 27 |
| Compuerta de alcance | Lee el encabezado de cada archivo —comentarios # o //— hasta la línea Prueba: y rechaza el código de requisitos Should have. | Tabla 25 |
| Compuerta de trazabilidad | Lee el mismo encabezado y exige, para cada requisito Must have, código, prueba y rama. | RNF-22 |
| Compuerta de tiempo | Recorre el código y las migraciones contra la semántica temporal del punto 4.2. | RF-32 · RF-34 |
| Compuerta de cobertura | Mide la cobertura de líneas de la interfaz y del cliente con el umbral del 70 %. | RNF-20 |
| Compuerta de estilo | Exige RuboCop, ESLint y Prettier sin hallazgos ni excepciones por archivo; falla si falta el informe. | Tabla 26 |

> Nota. Las compuertas son el instrumento con el que se verifica, antes de cada integración, que el código realiza lo que las tablas de este documento comprometen. La autorización por rol no es una compuerta: la contrasta la matriz de pruebas CP-RNF-01.
