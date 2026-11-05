<!-- GENERADO desde Proyecto de grado entrega final.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Matriz de casos de prueba

## Resumen por grupo · Tabla 34

| Grupo de casos | Origen | Casos | Criterio de aprobación | Resultado esperado |
|---|---|---|---|---|
| Requisitos funcionales | Uno por cada requisito de la Tabla 10 | 47 | El flujo principal del caso de uso que lo realiza produce la postcondición comprometida, y cada flujo de excepción, su rechazo | La operación produce la postcondición de su caso de uso, con los campos de respuesta de la Tabla 31; los rechazos llevan el código de la Tabla 26 y ninguna escritura persiste |
| Requisitos no funcionales medidos | Filas de la Tabla 11 con instrumento de medición en la Tabla 39 | 13 | La medición alcanza el umbral declarado, conforme al protocolo de la Tabla 39 | El valor medido alcanza el umbral de la Tabla 11 con el instrumento de la Tabla 39 |
| Requisitos no funcionales comprobados | RNF-02 a RNF-07, RNF-11, RNF-12 y RNF-21, según la nota de la Tabla 39 | 9 | La comprobación sobre el código, el contrato o un caso automatizado confirma la propiedad declarada | La propiedad que enuncia la Tabla 11 se verifica sin excepción |
| Total | — | 69, de los cuales 58 integran el alcance comprometido | Umbral global del 80 % de casos aprobados, sobre los casos del alcance comprometido | Al menos el 80 % de los cincuenta y ocho casos del alcance comprometido en estado aprobado |

> Nota. Sesenta y nueve casos: cuarenta y siete de requisitos funcionales y veintidós de no funcionales —trece medidos y nueve comprobados—, en correspondencia uno a uno con las filas de la Tabla 15. Los rechazos por reglas de negocio no forman un grupo aparte: se verifican dentro del caso del requisito que realiza cada regla, según la columna «RN asociada» de la Tabla 15 y las tablas de decisiones del Anexo F. Los once casos de requisitos Should have se definen para que la matriz cubra todas las filas de la Tabla 15, pero no integran el denominador del umbral: la Etapa 2 resolvió que ningún Should have integra el alcance comprometido, según el límite de alcance funcional de la Tabla 27 y el riesgo R-02. El porcentaje de cumplimiento se calcula, por eso, sobre los cincuenta y ocho casos de ese alcance —los treinta y seis de requisitos funcionales Must have y los veintidós de no funcionales—, y se informa también sobre los sesenta y nueve definidos. Si un Should have se incorpora por decisión registrada, su caso ingresa al denominador.
