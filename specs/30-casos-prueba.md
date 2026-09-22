<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Matriz de casos de prueba

## Resumen por grupo · Tabla 32

| Grupo de casos | Origen | Casos | Criterio de aprobación | Resultado esperado |
|---|---|---|---|---|
| Requisitos funcionales | Uno por cada requisito de la Tabla 10 | 47 | El flujo principal del caso de uso que lo realiza produce la postcondición comprometida | Token firmado con identidad, rol y vencimiento. El segundo intento responde 401 sin distinguir cuál de los dos datos falló |
| Reglas de negocio críticas | Reglas de la Tabla 12 con rechazo asociado | 12 | La operación se rechaza con el código del catálogo de la Tabla 24 y sin efectos parciales | Token firmado con identidad, rol y vencimiento. El segundo intento responde 401 sin distinguir cuál de los dos datos falló |
| Requisitos no funcionales verificables por prueba | Tabla 11, filas con umbral instrumentable | 10 | La medición alcanza el umbral declarado, conforme al protocolo de la Tabla 37 | Token firmado con identidad, rol y vencimiento. El segundo intento responde 401 sin distinguir cuál de los dos datos falló |
| Total | — | 69 | Umbral global del 80 % de casos aprobados | Token firmado con identidad, rol y vencimiento. El segundo intento responde 401 sin distinguir cuál de los dos datos falló |

> Nota. Sesenta y nueve casos: cuarenta y siete de requisitos funcionales y veintidós de no funcionales, en correspondencia uno a uno con las filas de la Tabla 15.
