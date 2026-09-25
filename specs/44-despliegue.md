<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 35 · Procedimiento de despliegue del entorno de demostración

| Paso | Acción | Verificación |
|---|---|---|
| 1 | Clonar el repositorio en la distribución del subsistema Linux | El árbol de carpetas coincide con la Figura 18 |
| 2 | Copiar el archivo de ejemplo de variables de entorno y cargar los valores propios de la instalación | Ninguna variable de la Tabla 30 queda sin valor; RAILS_MASTER_KEY lleva la clave real de la instalación |
| 3 | Levantar los tres servicios con la herramienta de composición | Los tres contenedores alcanzan estado saludable sin edición manual de ningún archivo |
| 4 | Ejecutar migraciones, cargar el archivo de datos de prueba y preparar la base de pruebas con RAILS_ENV=test bin/rails db:prepare | El esquema corresponde al diccionario de la Tabla 14 y el volumen al declarado en RNF-09 |
| 5 | Reponer la credencial provisional de la cuenta directiva por variable de entorno, con bin/rails directivo:reponer_credencial | El primer acceso exige el cambio de credencial, conforme a CP-RF-43 |
| 6 | Iniciar el túnel y comprobar el certificado del dominio asignado | La interfaz responde sobre HTTPS y rechaza la petición en texto plano, conforme a CP-RNF-06 |
| 7 | Registrar el cliente en el dispositivo de prueba, agregándolo a la pantalla de inicio | La suscripción push queda registrada |
| 8 | Ejecutar la colección de validación sobre la totalidad de las operaciones | Diferencia nula entre enrutador, archivo OpenAPI y Tabla 18, conforme a CP-RNF-17 |

> Nota.  El procedimiento es el instrumento de verificación de RNF-19 y el contenido de la documentación de despliegue que el punto 5.1 exige como entregable. Su condición de aceptación es que los ocho pasos se completen sobre un repositorio recién clonado y sin editar manualmente ningún archivo del proyecto: la única intervención admitida es la carga de valores en el archivo de variables de entorno, que es exactamente lo que el requisito prevé. El nombre del proyecto de la composición es fijo: una segunda copia en el mismo equipo se levanta con la opción -p. Ejecutado desde una copia limpia, con sólo los valores del archivo de variables cargados, el procedimiento completó la construcción sin caché de las dos imágenes en 3 min 24 s, las migraciones, la carga del conjunto de prueba, la reposición de la cuenta directiva, las suites y los tres servicios en estado saludable; los pasos 6, 7 y 8 no se ejecutaron sobre esa copia.
