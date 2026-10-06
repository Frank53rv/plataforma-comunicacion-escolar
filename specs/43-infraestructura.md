<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 34 · Matriz de infraestructura del sistema

| Componente | Tecnología | Función | Entorno de ejecución |
|---|---|---|---|
| Cliente web | React 19, construido con Vite 8 y servido por nginx, que reenvía /api/v1/ y /cable a la interfaz | Interfaz de operación para los cuatro roles. Archivos estáticos, sin renderizado en el servidor | Contenedor propio. Se consume desde el navegador del usuario |
| Interfaz de programación | Ruby on Rails 8.1 en modo interfaz, con ActionCable y el supervisor de Solid Queue en el mismo proceso | Persistencia, autenticación, control de acceso, reglas de negocio, motor de notificaciones y canal de tiempo real. La cola ejecuta la verificación del acuse a los quince minutos, los reintentos a 1, 5 y 15 minutos —cuatro intentos en total— y la purga de la bitácora, diaria a las 03:00 de Asunción según config/recurring.yml | Contenedor propio sobre el subsistema Linux del equipo de desarrollo |
| Base de datos | PostgreSQL 18 | Único almacén: datos de negocio, cola de trabajos en segundo plano y mecanismo de publicación y suscripción | Contenedor propio, con volumen persistente |
| Exposición | Cloudflare Tunnel | Nombre de dominio y certificado válido hacia internet, sin abrir puertos del equipo | Proceso auxiliar junto a la composición |
| Servicio de notificaciones push | Firebase Cloud Messaging | Entrega de avisos al navegador del destinatario, incluso con la aplicación cerrada | Servicio de terceros. Único componente externo |
| Dispositivo del usuario | Navegador con service worker | Presentación de la interfaz y recepción de los avisos push | Equipo de escritorio o dispositivo móvil del usuario |

> Nota. Las tres primeras filas son las unidades de ejecución propias que la Figura 16 representa con el estereotipo de entorno de ejecución; la quinta es el nodo externo. La orquestación de los tres contenedores se realiza con una única definición de composición, que es lo que hace verificable la reproducibilidad comprometida en RNF-19 y ejecutable el caso CP-RNF-19.
