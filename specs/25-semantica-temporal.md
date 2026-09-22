<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Semántica temporal y resolución del canal de entrega (punto 4.2)

Estas reglas **no están en ninguna tabla**: son prosa normativa del punto 4.2. Se extraen
acá porque el motor de notificaciones no es implementable sin ellas y porque son
exactamente el tipo de decisión que una asistencia inventaría si no las encontrara escritas.

## Regla de aplicación

- Toda marca de tiempo se **almacena** en tiempo universal coordinado.
- Toda hora de pared —`preferencia.hora_inicio`, `preferencia.hora_fin` y la hora de
  publicación programada— se **interpreta** en la zona declarada abajo.
- No se declara una zona por usuario. No se introduce ninguna otra zona en el código,
  ni configurable ni por omisión.
- El cálculo de la franja de disponibilidad es el que se enuncia abajo, **incluido el caso
  en que la franja cruza la medianoche**. Una comparación ingenua de extremos es incorrecta.

## Texto de la edición vigente

La zona de interpretación y presentación es la de la República del Paraguay, país donde se desarrolla el trabajo, identificador America/Asuncion. No deriva de la localización de la institución observada, que el punto 1.7 obliga a no identificar, sino del ámbito donde el producto se despliega y valida. Las horas de pared —hora_inicio y hora_fin de la entidad preferencia y la que el docente fija al programar una publicación— se interpretan en esa zona; el almacenamiento sigue en tiempo universal. No hay zona por usuario: el punto 1.6 acota el alcance a una institución, y una por persona sería alcance no comprometido ni verificable en la validación. Si se extendiera a husos distintos, la zona sería la de la institución, no la de la persona, y así se consigna en los trabajos futuros.
