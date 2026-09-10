# Registro de decisiones y huecos

Toda divergencia entre el código y el documento se anota acá **antes** de escribirse, con
las alternativas y su consecuencia. Una decisión adoptada exige, además, actualizar el
artefacto del documento que la gobierna y registrar el cambio en el histórico de
revisiones (nota de la Tabla 36).

Formato de las entradas: ver `../CLAUDE.md`, punto 6.
La marca `adoptado: RF-nn` en una entrada habilita a la compuerta `alcance` a aceptar ese
requisito Should have; sin ella, construirlo deja la rama en rojo.

**Actualizado el 10 de septiembre de 2026**, contra el documento en su versión 5.2.

---

## D-01 · Nomenclatura de las tablas en el motor
- **Dónde apareció:** Tabla 38, esquema físico · primera migración
- **Qué dice el documento:** las 19 entidades se nombran en singular —`usuario`,
  `curso`, `anuncio`, `entrega_anuncio`…— y el Quality Spec exige que los identificadores
  «reproduzcan literalmente los nombres del diccionario de la Tabla 21».
- **Qué no dice:** si el nombre de la tabla física debe conservar el singular o seguir la
  pluralización que el framework aplica por convención.
- **Alternativas:**
  - **A.** Tablas en plural (`usuarios`), modelos en singular (`Usuario`). Es la convención
    del framework y no exige configuración.
  - **B.** Tablas en singular, forzadas con `self.table_name`. Literalidad total con la
    Tabla 38, al costo de una línea por modelo y de romper la convención.
- **Estado: RESUELTA · se adopta B.**
- **Fundamento:** la Tabla 38 nombra las diecinueve entidades en singular y el `CLAUDE.md`
  establece que ante discrepancia prevalece el documento. Adoptar la convención del
  framework haría que el primer artefacto construido ya se apartara de la especificación,
  que es exactamente lo que el mecanismo de fidelidad existe para impedir. El costo es de
  una línea por modelo, diecinueve en total, y no toca el contrato ni las reglas.

## D-02 · Elevación de RF-24 a Must have
- **Dónde apareció:** Tabla 17 · canal grupal de alumnos
- **Estado: CERRADA · no se eleva. El documento ya lo resolvía.**
- **Fundamento:** la nota de la Tabla 17 clasifica RF-24 como Should have con un criterio
  explícito: «cada uno replica un mecanismo que otro requisito Must have ya demuestra —…
  el canal de tiempo real de RF-25 en el caso de los tres requisitos de conversación—, de
  modo que su implementación no aporta evidencia adicional sobre el objeto de estudio».
  Elevarlo contradiría esa nota y reabriría la clasificación MoSCoW de una etapa ya
  presentada. La preocupación que originó la entrada —que sería el único canal propio del
  rol alumno— no se sostiene: el alumno participa del canal del curso de RF-25, que sí es
  Must have, de modo que no queda sin canal. Se consigna entre los trabajos futuros.

## D-03 · Notificación de anuncios entre docentes
- **Dónde apareció:** Tabla 4, matriz de notificaciones por rol
- **Estado: CERRADA · no era un hueco. La Tabla 4 lo declara.**
- **Fundamento:** en la fila «Publicación de un anuncio en un curso», la columna del rol
  docente dice **No**. El docente figura como emisor y no como destinatario. No hay
  decisión que tomar ni cambio que hacer en RF-21 ni en el paso 4 de CU-06.

## D-04 · Destinatario sin suscripción push vigente
- **Dónde apareció:** RF-37 y CU-14 · resolución del canal de entrega
- **Qué dice el documento:** RF-37 enumera tres condiciones de fallo —indisponibilidad del
  servicio, ausencia de acuse del cliente y falta de soporte del navegador— y ordena
  registrar la causa en las tres; CU-14 agrega la credencial inválida.
- **Qué no decía:** qué ocurre con quien tiene un navegador compatible pero nunca concedió
  el permiso, de modo que no registra ninguna suscripción vigente al notificar.
- **Estado: RESUELTA · incorporada al documento en el punto 4.2, bloque del esquema físico.**
- **Fundamento:** no es un fallo, porque no hubo envío que fracasara. La fila de entrega
  nace con el canal establecido en la aplicación y sin causa registrada, y el aviso se
  entrega allí conforme a RNF-11. No se agrega un quinto valor al atributo `causa_fallo`:
  registrar una causa exigiría un intento previo que no se produjo, y confundiría la
  ausencia de destino con la falla del canal.

---

## Pendiente de decisión del autor

- **Partida G-04 de la Tabla 28.** El documento en su versión 5.2 corrigió el conteo a
  cuarenta operaciones autenticadas por cuatro roles, 160 casos, y conservó las 24 horas
  presupuestadas, por tratarse de una suite parametrizada sobre la columna de roles de la
  Tabla 27. Si se prefiere ampliar la partida, hay que recalcular el total de la Tabla 28
  y la red de la Tabla 31.
