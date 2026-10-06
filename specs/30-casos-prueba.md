<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Matriz de casos de prueba

## Resumen por grupo · Tabla 32

| Grupo de casos | Origen | Casos | Criterio de aprobación | Resultado esperado |
|---|---|---|---|---|
| Requisitos funcionales | Uno por cada requisito de la Tabla 10 | 47 | El flujo principal del caso de uso que lo realiza produce la postcondición comprometida | La operación produce la postcondición de su caso de uso, con los campos de respuesta de la Tabla 29 |
| Reglas de negocio críticas | Reglas de la Tabla 12 con rechazo asociado | 12 | La operación se rechaza con el código del catálogo de la Tabla 24 y sin efectos parciales | Rechazo con el código de la Tabla 24 y la regla consignada en el cuerpo del error; ninguna escritura persiste |
| Requisitos no funcionales verificables por prueba | Tabla 11, filas con umbral instrumentable | 10 | La medición alcanza el umbral declarado, conforme al protocolo de la Tabla 37 | El valor medido o comprobado alcanza el umbral de la Tabla 11 con el instrumento de la Tabla 37 |
| Total | — | 69 | Umbral global del 80 % de casos aprobados | Al menos el 80 % de los sesenta y nueve casos en estado aprobado |

> Nota. Sesenta y nueve casos: cuarenta y siete de requisitos funcionales y veintidós de no funcionales, en correspondencia uno a uno con las filas de la Tabla 15.
