<!-- GENERADO desde TFG_entrega_5_Etapa4_v52.docx. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 46 · Procedimiento de despliegue del entorno de demostración

| Paso | Acción | Verificación |
|---|---|---|
| 1 | Clonar el repositorio en la distribución del subsistema Linux | El árbol de carpetas coincide con la Figura 18 |
| 2 | Copiar el archivo de ejemplo de variables de entorno y completar los valores propios de la instalación | Ninguna variable de la Tabla 41 queda sin valor |
| 3 | Levantar los tres servicios con la herramienta de composición | Los tres contenedores alcanzan estado saludable sin edición manual de ningún archivo |
| 4 | Ejecutar migraciones y cargar el archivo de datos de prueba | El esquema corresponde al diccionario de la Tabla 21 y el volumen al declarado en RNF-09 |
| 5 | Reponer la credencial provisional de la cuenta directiva por variable de entorno | El primer acceso exige el cambio de credencial, conforme a CP-RF-43 |
| 6 | Iniciar el túnel y comprobar el certificado del dominio asignado | La interfaz responde sobre HTTPS y rechaza la petición en texto plano, conforme a CP-RNF-06 |
| 7 | Registrar el cliente en el dispositivo de prueba, agregándolo a la pantalla de inicio | La suscripción push queda registrada y el aviso llega al dispositivo |
| 8 | Ejecutar la colección de validación sobre la totalidad de las operaciones | Diferencia nula entre enrutador, archivo OpenAPI y Tabla 27, conforme a CP-RNF-17 |

> Nota. El procedimiento es el instrumento de verificación de RNF-19 y el contenido de la documentación de despliegue que el punto 5.1 exige como entregable. Su condición de aceptación es que los ocho pasos se completen sobre un repositorio recién clonado y sin editar manualmente ningún archivo del proyecto: la única intervención admitida es la carga de valores en el archivo de variables de entorno, que es exactamente lo que el requisito prevé.
