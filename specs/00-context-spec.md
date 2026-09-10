<!-- GENERADO desde TFG_entrega_5_Etapa4_v52.docx. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Context Spec (punto 4.2 del documento de grado)

La Tabla 1 declara el uso de asistencia de inteligencia artificial en la generación de código, y la Tabla 29 estableció que esa asistencia no reduce el esfuerzo total sino que lo desplaza hacia la especificación y la verificación. Las tres especificaciones que siguen son el instrumento de ese desplazamiento: existen para que el código generado quede dictado por lo que el documento comprometió y no al revés, y para que la auditoría —el 50 % del esfuerzo asistido— tenga un criterio contra el cual auditar en lugar de un juicio caso por caso.

Context Spec. El rol de la asistencia es el de escritura acelerada sobre una arquitectura ya decidida, no el de diseño. La arquitectura es la del punto 4.1 y el stack el de la Tabla 34. La lógica de negocio, el control de acceso y el motor de notificaciones residen en la interfaz de programación y nunca en el cliente, conforme a RNF-21. La estructura de carpetas reproduce los siete módulos de la columna «Módulo / componente» de la Tabla 22, según la Figura 18, de modo que toda unidad de código sea rastreable hasta un requisito. Las fuentes de verdad del dominio son la Tabla 17 para los requisitos, la Tabla 19 para las reglas de negocio, la Tabla 20 para los flujos, la Tabla 21 para el diccionario de datos y la Tabla 27 para el contrato de la interfaz: ninguna instrucción a la asistencia puede contradecirlas, y ante discrepancia prevalece el documento.
