# Plantilla de prompt por requisito

Se usa tal cual, cambiando sólo el código. Sirve para que cada sesión de asistencia
arranque desde el documento y no desde la memoria de la sesión anterior.

```
Vamos a construir RF-nn.

Antes de escribir nada:
1. Abrí specs/16-trazabilidad.md y citame la fila de RF-nn completa: regla de negocio
   asociada, caso de uso, artefacto de diseño (figura), módulo y caso de prueba.
2. Abrí specs/13-casos-uso-resumen.md y citame el caso de uso completo: actor,
   precondición y postcondición. No hay narrativa paso a paso: la especificación de la
   operación es esa postcondición más la fila del endpoint y la de sus reglas.
3. Abrí specs/20-endpoints.md y citame la fila de la operación: método, ruta, roles
   autorizados. Después specs/24-formas-peticion-respuesta.md para su petición y respuesta.
4. Abrí specs/12-reglas-negocio.md y transcribí cada RN que el caso de uso declara.
5. Listame los flujos de excepción del caso de uso y, para cada uno, el estado del
   catálogo de specs/21-errores.md que le corresponde.
5b. Si el requisito toca horarios, marcas de tiempo o el motor de notificaciones, abrí
   specs/25-semantica-temporal.md y citame la regla que aplica. No resuelvas nada de
   tiempo de memoria.

Recién entonces:
6. Escribí el spec de prueba con CP-RF-nn como enunciado: el requisito de
   specs/10-requisitos-funcionales.md y la postcondición del caso de uso son los datos de
   entrada y el resultado esperado; el criterio de aprobación es el de su grupo en
   specs/30-casos-prueba.md.
7. Implementá en el módulo que la trazabilidad asigna, con el comentario de encabezado
   que CLAUDE.md exige.
8. Corré bin/verificar y pegame la salida.

Si en cualquiera de los pasos el documento no alcanza para decidir: pará, escribí la
entrada en specs/DECISIONES.md y avisame. No completes el hueco por tu cuenta.
```

## Verificación de fidelidad, para cerrar la rama

```
Contrastá lo que implementaste contra la fila de RF-nn en specs/16-trazabilidad.md y
contra el caso de uso en specs/13-casos-uso-resumen.md: ¿la postcondición del caso de uso
queda satisfecha? ¿implementaste algo que ni el requisito ni la postcondición piden?
¿cada flujo de excepción que fija specs/21-errores.md tiene su rechazo con el estado del
catálogo? ¿cada RN que la trazabilidad asocia al requisito está verificada en alguna
aserción? Respondé con una tabla de tres columnas: elemento del documento · dónde está en
el código · cómo se prueba.
```
