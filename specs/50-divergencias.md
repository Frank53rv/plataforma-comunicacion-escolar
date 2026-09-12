<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 38 · Divergencias entre el documento y la versión construida

| Cód. | Objeto | Qué compromete el documento | Qué hace la versión construida | Tratamiento |
|---|---|---|---|---|
| D-01 | Clave foránea de adjunto hacia mensaje | Tabla 27: «FK a anuncio_version y a mensaje» | La versión construida declara únicamente la clave hacia anuncio_version. | Defecto: se corrige en el código |
| D-02 | Cola de trabajos y canal de tiempo real | Tabla 23 y decisión D-08 | Solid Queue y Solid Cable se declaran en la configuración pero no están instalados: no existen sus tablas ni el proceso de cola. Ninguna funcionalidad construida los utiliza todavía. | Deuda declarada: condiciona RF-37 y RNF-12 |
| D-03 | Ubicación de los módulos en el repositorio | Figura 18 y paso 1 de la Tabla 35 | No existe ningún módulo de dominio: api/app/ contiene únicamente las carpetas por defecto del framework —compartido, controllers, jobs y models—. La correspondencia con los siete módulos de la columna «Módulo / componente» está pendiente de construcción. | Decisión: se corrige la Figura 18 en la próxima versión |
| D-04 | Credencial de muestra del archivo de entorno | Nota de la Tabla 30: valor «no utilizable en ninguna instalación real» | El archivo de ejemplo trae una credencial de base utilizable. Su nota la justifica diciendo que sólo vive en la red privada de la composición, pero ésta publica el puerto 5432 al equipo anfitrión, de modo que la credencial es alcanzable desde fuera. | Defecto: se corrige en el repositorio |
| D-05 | Tipo de la columna turno | Tabla 27: turno_enum | Se construyó como varchar(20) con restricción de verificación. | Decisión D-07: registrada |
| D-06 | Código de activación en la respuesta de alta de docente | Tabla 29: «sin el código en claro» | La respuesta devuelve el código en claro por no existir servicio de correo que lo entregue. | Decisión D-10: registrada |
| D-07 | Alcance de la restricción de monotonía | Tabla 38 | La restricción verifica que ninguna marca sea anterior al envío, y no el orden entre entregada, vista y leída. El índice único del código cubre la mitad del predicado. | Decisión D-09: registrada |
| D-08 | Momento de construcción de RF-13, RF-14 y RF-15 | Tabla 36: incremento 2 | Se construyeron en el incremento 1 por depender del alta de cuentas. | Corrección de plan: incorporada a la Tabla 36 |
| D-09 | Código de activación del tutor ya existente | Tabla 29 lista el código sin excepción | Cuando el tutor ya existe y solo se lo vincula, el campo se devuelve nulo. | Precisión: incorporada a la Tabla 29 |
| D-10 | Representación del código de activación | Tabla 29: «con vence_en y el código» | La representación incluye además id y usuario_id. | Precisión: incorporada a la Tabla 29 |

> Nota. Las divergencias D-01 y D-04 son defectos y se corrigen en el código. D-02 es deuda declarada y condiciona la verificación de RF-37 y de RNF-12, que no puede realizarse mientras la cola no exista. Las restantes son decisiones o precisiones ya incorporadas a las tablas que se citan.
