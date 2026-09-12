<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 30 · Variables de entorno del despliegue

| Variable | Qué provee | Origen del compromiso |
|---|---|---|
| DATABASE_URL | Cadena de conexión al motor de base de datos, con credenciales propias de la instalación | RNF-19 |
| RAILS_MASTER_KEY | Clave de descifrado de las credenciales cifradas del framework | RNF-03 · ISO/IEC 27001 |
| JWT_SECRET_KEY | Clave de firma y verificación del token de sesión | RF-01 · RNF-02 |
| JWT_EXPIRACION_HORAS | Vigencia del token, no superior a veinticuatro horas | RNF-02 |
| DIRECTIVO_CORREO | Identificación de la cuenta directiva semilla | RN-08 · RF-43 |
| DIRECTIVO_CREDENCIAL_PROVISIONAL | Credencial provisional de la cuenta directiva, que se repone por esta vía y exige cambio en el primer acceso | RN-08 · RF-43 |
| FCM_PROJECT_ID | Identificación del proyecto en el servicio de notificaciones push | RF-31 · RF-32 |
| FCM_CREDENCIAL_JSON | Credencial de servicio del proveedor de notificaciones push | RF-31 · RF-37 |
| VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY | Par de claves de identificación del emisor ante el servicio de push web | RF-31 · RNF-11 |
| APP_HOST | Nombre de dominio con el que el entorno se expone, condición del certificado válido | RNF-06 · RNF-19 |
| CORS_ORIGENES | Orígenes autorizados a consumir la interfaz desde el navegador | RNF-06 · RNF-21 |
| RETENCION_BITACORA_MESES | Plazo de conservación de la bitácora técnica de fallos de envío | RNF-07 · RN-27 |
| ADJUNTO_TAMANO_MAXIMO_MB y ADJUNTO_CANTIDAD_MAXIMA | Límites del archivo adjunto | RN-33 · RF-30 |

> Nota. El repositorio incluye un archivo de ejemplo con la totalidad de estas variables, su descripción y un valor de muestra que no es utilizable en ninguna instalación real; el archivo con los valores efectivos nunca se versiona. Es lo que permite que CP-RNF-19 se ejecute sobre un repositorio recién clonado sin editar ningún archivo manualmente.
