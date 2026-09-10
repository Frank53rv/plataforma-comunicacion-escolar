# Plantilla de prompt por requisito

Se usa tal cual, cambiando sólo el código. Sirve para que cada sesión de asistencia
arranque desde el documento y no desde la memoria de la sesión anterior.

```
Vamos a construir RF-nn.

Antes de escribir nada:
1. Abrí specs/16-trazabilidad.md y citame la fila de RF-nn completa: regla de negocio
   asociada, caso de uso, artefacto de diseño, módulo y caso de prueba.
2. Abrí specs/14-casos-uso-narrativa.md y transcribí el caso de uso completo.
3. Abrí specs/20-endpoints.md y citame la fila de la operación: método, ruta, roles
   autorizados. Después specs/24-formas-peticion-respuesta.md para su petición y respuesta.
4. Abrí specs/12-reglas-negocio.md y transcribí cada RN que el caso de uso declara.
5. Listame los flujos de excepción del caso de uso y, para cada uno, el estado del
   catálogo de specs/21-errores.md que le corresponde.
5b. Si el requisito toca horarios, marcas de tiempo o el motor de notificaciones, abrí
   specs/25-semantica-temporal.md y citame la regla que aplica. No resuelvas nada de
   tiempo de memoria.

Recién entonces:
6. Escribí el spec de prueba usando CP-RF-nn de specs/30-casos-prueba.md como enunciado:
   mismos datos de entrada, mismo resultado esperado, sin agregar ni quitar aserciones.
7. Implementá en el módulo que la trazabilidad asigna, con el comentario de encabezado
   que CLAUDE.md exige.
8. Corré bin/verificar y pegame la salida.

Si en cualquiera de los pasos el documento no alcanza para decidir: pará, escribí la
entrada en specs/DECISIONES.md y avisame. No completes el hueco por tu cuenta.
```

## Verificación de fidelidad, para cerrar la rama

```
Contrastá lo que implementaste contra specs/14-casos-uso-narrativa.md, paso por paso:
¿algún paso del flujo principal quedó sin implementar? ¿implementaste algo que el flujo
no pide? ¿cada flujo de excepción tiene su rechazo con el estado del catálogo? ¿cada RN
declarada en el caso de uso está verificada en alguna aserción? Respondé con una tabla de
tres columnas: elemento del documento · dónde está en el código · cómo se prueba.
```
