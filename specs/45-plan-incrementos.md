<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 36 · Plan de incrementos del producto mínimo viable

| Incremento | Paquetes | Módulos | Funcionalidad comprometida | Hito que cierra |
|---|---|---|---|---|
| 1 | WP1, WP2 y WP9, primer tramo | G y A | Entorno reproducible por contenedores y contrato OpenAPI publicado; identidad y acceso: alta, activación por código, autenticación, control de acceso por rol y baja lógica. Documentación de despliegue, redactada con el entorno que describe. Incorpora además RF-13, RF-14 y RF-15 —vinculación de alumnos y de tutores y asignación de docentes a cursos—, que dependen del alta de cuentas que este incremento construye. | H-04, parcial |
| 2 | WP3 y WP4 | B y C | Estructura académica —año lectivo, cursos y vinculaciones— y anuncios: publicación, resolución de destinatarios, historial y borrado lógico. Las vinculaciones de RF-13, RF-14 y RF-15 corresponden al incremento 1. | H-04, parcial |
| 3 | WP5 y WP6 | D y E | Mensajería: canal grupal del curso y persistencia del historial. Notificaciones y constancias: entrega push con degradación a aviso en la aplicación y registro de los cuatro estados por destinatario y publicación | H-04 |
| 4 | WP8, primera parte | G | Verificación del motor de notificaciones sobre las combinaciones de evento y rol de la Tabla 4; la correspondiente a la edición de un anuncio se verifica solo si RF-19 llega a incorporarse, por estar allí condicionada a ese requisito | H-05 |
| 5 | WP7 y WP9, segundo tramo | F y G | Cliente web: paneles diferenciados por rol, bandeja de anuncios como vista de entrada, conversación y preferencias, operables en los tres anchos de referencia, ejecutado en once ramas: dos de cimientos y nueve de pantallas. Manual de usuario, redactado a medida que cada pantalla queda operativa | H-06 |
| 6 | WP8, segunda parte, y WP9, tramo final | G | Ejecución de la matriz de pruebas funcionales y sesión de validación | H-07 |

> Nota. Los seis incrementos cubren los nueve paquetes de trabajo de la Tabla 21 y se anclan a los hitos de la Tabla 20, de la que toman su calendario. Dos paquetes se ejecutan en tramos. WP8, porque el hito H-05 exige verificar el motor de notificaciones antes de que el cliente web esté construido; ambos tramos se imputan al módulo G por tratarse de verificación transversal, aunque el primero recaiga sobre la funcionalidad del módulo E.
