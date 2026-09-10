<!-- GENERADO desde TFG_entrega_5_Etapa4_v52.docx. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Semántica temporal y resolución del canal de entrega (punto 4.2)

Estas reglas **no están en ninguna tabla**: son prosa normativa del punto 4.2 del documento.
Se extraen acá porque el motor de notificaciones no es implementable sin ellas y porque son
exactamente el tipo de decisión que una asistencia inventaría si no las encontrara escritas.

## Regla de aplicación

- Toda marca de tiempo se **almacena** en tiempo universal coordinado.
- Toda hora de pared —`preferencia.hora_inicio`, `preferencia.hora_fin` y la hora de
  publicación programada— se **interpreta** en la zona declarada abajo.
- No se declara una zona por usuario. No se introduce ninguna otra zona en el código,
  ni configurable ni por omisión.
- El cálculo de la franja de disponibilidad es el que se enuncia abajo, **incluido el caso
  en que la franja cruza la medianoche**. Una comparación ingenua de extremos es incorrecta.

## Texto del documento

Las convenciones de la Tabla 39 fijan el formato en que las marcas de tiempo viajan por la interfaz y establecen que el servidor almacena y responde en tiempo universal coordinado, criterio que el esquema físico de la Tabla 38 realiza con el tipo de dato correspondiente. Resta declarar la referencia de interpretación, sin la cual las horas que la persona configura no designan ningún instante: la entidad preferencia de la Tabla 21 declara hora_inicio y hora_fin como horas de pared, sin zona asociada, y sobre ellas resuelven el requisito RF-33 y la regla RN-24, que son los que la Tabla 38 asocia a esa entidad.

La zona de interpretación y de presentación es la de la República del Paraguay, país en que se desarrolla el trabajo, correspondiente al identificador America/Asuncion. No se deriva de la localización de la institución observada, que el punto 1.7 obliga a no identificar, sino del ámbito en que el producto se despliega y se valida. Las horas de pared —los atributos hora_inicio y hora_fin de la entidad preferencia y la hora que el docente fija al programar una publicación— se interpretan en esa zona; el almacenamiento permanece en tiempo universal. No se declara una zona por usuario: el punto 1.6 acota el alcance a una única institución, de modo que una zona por persona constituiría alcance no comprometido y no verificable en la sesión de validación. Si el sistema se extendiera a instituciones de husos distintos, la zona correspondería a la institución y no a la persona, y así corresponde consignarlo entre los trabajos futuros.

La franja de disponibilidad admite que la hora final sea anterior a la inicial, caso en el que cruza la medianoche; una franja de 22:00 a 07:00 es la más natural para un tutor que trabaja, y bajo una comparación ingenua designaría el conjunto vacío. Sea h la hora local del instante evaluado. Cuando la hora inicial es anterior a la final, la persona está disponible si h es igual o posterior a la inicial y anterior a la final. Cuando la hora final es igual o anterior a la inicial, está disponible si h es igual o posterior a la inicial, o bien anterior a la final. El extremo inicial se incluye y el final se excluye, de modo que dos franjas contiguas no se solapan ni dejan instante sin cubrir. La igualdad de ambos extremos designa disponibilidad permanente, lectura que evita que una configuración accidental silencie a una persona, resultado que la regla RN-24 prohíbe de manera expresa.

Diferir una notificación consiste en encolarla con un instante anterior al cual no se envía, igual al comienzo de la próxima franja de disponibilidad del destinatario, calculado en la zona declarada en esta subsección. La notificación no se elimina, no se agrupa con otras ni se sustituye por una posterior: agrupar tres mensajes diferidos en un solo aviso sería una forma de descarte parcial, y la regla RN-24 no la autoriza. Los anuncios no se difieren en ningún caso, porque la regla RN-18 y el requisito RF-31 establecen que ignoran el horario de disponibilidad por tratarse de comunicación institucional.

La hora de publicación programada, cuando el requisito RF-18 llegue a incorporarse —el punto 3.2.2 no lo compromete y condiciona su reincorporación al consumo real del paquete WP6—, se interpreta en la misma zona. Un instante situado en el pasado se rechaza en la validación, porque RF-18 admite únicamente fecha y hora futuras; el rechazo se responde con el estado que la Tabla 35 asigna a la petición bien formada con contenido improcesable. La publicación inmediata, que es el caso ordinario y el único comprometido, resuelve los destinatarios en ese mismo instante conforme a la regla RN-19. Con el mismo criterio se computa la retención que fijan la regla RN-27 y el requisito RNF-07: los datos de negocio de un año lectivo se conservan hasta el cierre del año lectivo siguiente al suyo, tomado del atributo que registra ese cierre, mientras que la bitácora de envío se conserva doce meses desde cada registro, con independencia del año lectivo, por contener datos técnicos y ningún dato académico.

## Resolución del canal de entrega

Una precisión sobre la creación de la fila de entrega. El requisito RF-37 enumera tres condiciones de fallo —indisponibilidad del servicio de notificaciones, ausencia de acuse del cliente y falta de soporte del navegador— y ordena registrar la causa en las tres, a lo que el caso CU-14 agrega la credencial inválida. Ninguna de esas cuatro cubre un supuesto que el uso real produce: el destinatario cuyo navegador admite el mecanismo pero que nunca concedió el permiso, de modo que no registra ninguna suscripción vigente al momento de notificar. No se trata de un fallo, porque no hubo envío que fracasara: la fila nace con el canal establecido en la aplicación y sin causa registrada, y el aviso se entrega allí conforme a RNF-11. Registrar una causa exigiría un intento previo que no llegó a producirse, y confundiría la ausencia de destino con la falla del canal, que es precisamente la distinción sobre la que RF-37 se apoya.
