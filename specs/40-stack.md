<!-- GENERADO desde TFG_entrega_5_Etapa4_v52.docx. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 34 · Selección tecnológica definitiva y justificación por capa

| Capa | Tecnología y versión | Por qué esta elección | Requisito que la sostiene |
|---|---|---|---|
| Lenguaje y framework del servidor | Ruby 4.0 · Ruby on Rails 8.1 en modo interfaz | Provee enrutamiento, capa de acceso a datos, serialización, cola de trabajos y canal de tiempo real en un solo framework, sin sumar servicios. Es el stack en el que el autor declara un año de experiencia previa, lo que reduce el riesgo R-07 | RNF-21 · RNF-08 |
| Base de datos | PostgreSQL 18 | Integridad referencial, transacciones y control de acceso a nivel de motor. Único almacén: aloja datos de negocio, cola de trabajos y publicación-suscripción, conforme a la Tabla 24 | RNF-07 · RN-28 |
| Canal de tiempo real | ActionCable con adaptador Solid Cable | Difusión sobre conexiones persistentes respaldada por la misma base de datos, sin almacén en memoria adicional. La comparación está en la Tabla 24 | RNF-08 · RF-25 |
| Cola de trabajos | Solid Queue | Ejecución diferida del envío de notificaciones y de los reintentos, sobre la misma base de datos | RF-37 · RNF-12 |
| Biblioteca y construcción del cliente | React 19 · Vite 8 · React Router | Produce archivos estáticos y elimina el proceso de servidor de renderizado, innecesario para paneles autenticados conforme a la Tabla 23. Es el stack con dos años de experiencia declarada | RF-40 · RNF-21 |
| Estilos | Tailwind CSS 4.3 | Clases utilitarias orientadas al diseño responsivo en los tres anchos de referencia. El proyecto usa los patrones que la biblioteca provee y no diseña un sistema propio, conforme a la exclusión del punto 1.6 | RF-41 · RNF-18 |
| Servidor de archivos estáticos | nginx | Entrega los archivos producidos por la construcción del cliente y termina la conexión cifrada | RNF-06 |
| Autenticación y cifrado | JSON Web Token (RFC 7519; IETF, 2015) · bcrypt | Token firmado verificable sin estado en cada petición, incluida la del canal de tiempo real, y derivación no reversible de contraseñas | RF-01 · RNF-02 · RNF-03 |
| Notificaciones push | Firebase Cloud Messaging, nivel gratuito | Único componente externo. Entrega a navegadores con la aplicación cerrada. Su indisponibilidad no impide operar, conforme a RNF-11 | RF-31 · RF-32 |
| Contenerización y orquestación | Docker con Docker Compose | Levanta el entorno completo desde el repositorio sin edición manual de archivos | RNF-19 |
| Pruebas | RSpec · Jest y React Testing Library · SimpleCov | Pruebas de unidad e integración del servidor y de comportamiento de los componentes del cliente, con medición de cobertura de líneas | RNF-20 · RNF-22 |
| Documentación y validación de la interfaz | OpenAPI · Postman | Contrato legible por máquina y colección de validación ejecutable | RNF-17 |
| Control de versiones | Git · GitHub, repositorio privado | Historial de commits, ramas y merges como evidencia de autoría y frecuencia de trabajo | Template, punto 5.2 |
| Exposición del entorno | Cloudflare Tunnel | Expone el entorno de demostración sobre HTTPS con certificado válido, condición del push web y de la verificación del transporte cifrado | RNF-06 · RNF-19 |

> Nota. Las versiones se expresan por serie mayor y menor, y se actualizan únicamente dentro de la serie de parches durante la ejecución. La verificación contra la publicación oficial de cada producto se realizó al redactar la Tabla 10 y se repitió al fijar estas versiones como definitivas. La caché de aplicación no figura en esta tabla porque el producto mínimo viable no compromete ninguna: si la medición de CP-RNF-09 lo justificara, se incorporaría el componente nativo sobre la resolución de destinatarios, sin agregar infraestructura, conforme a la nota de la Tabla 24.
