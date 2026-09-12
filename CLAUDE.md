# Contrato de construcción asistida

> Este archivo se carga automáticamente al iniciar cualquier sesión de asistencia en este
> repositorio. Es la traducción operativa del **Context Spec**, el **Boundary Spec**
> (Tabla 25) y el **Quality Spec** (Tabla 26) del punto 4.2 del documento de grado
> *«API REST de un colegio para una plataforma de comunicación escolar con notificaciones
> inteligentes»*. Fuente absoluta: la edición vigente de 75 páginas
> (`documento/TFG_ENTREGA_75paginas.docx`); la v5.2 queda como anexo normativo sólo para
> lo que esa edición condensó —ver D-21 de `specs/DECISIONES.md`.

## 0 · Regla de precedencia

La fuente de verdad es el **documento de grado**. Los archivos de `specs/` son una
extracción literal de sus tablas, generada por herramienta y no editada a mano.

1. Si `specs/` y el documento discrepan → **prevalece el documento**, y la discrepancia
   se anota en `specs/DECISIONES.md` antes de escribir una línea de código.
2. Si el código y `specs/` discrepan → **está mal el código**.
3. Si el documento **no dice nada** sobre algo que hace falta decidir → **no lo decidas**.
   Detené la tarea, registrá la pregunta en `specs/DECISIONES.md` y esperá al autor.
   Inventar un comportamiento no especificado es la falla más grave posible en este
   repositorio, porque rompe la matriz de trazabilidad de la Tabla 15, que es el
   instrumento de control declarado en el punto 2.4.

## 1 · Antes de escribir código, leer

| Qué vas a tocar | Leé obligatoriamente |
|---|---|
| Cualquier cosa | `specs/00-context-spec.md`, `specs/01-boundary-spec.md`, `specs/02-quality-spec.md` |
| Una operación de la API | `specs/20-endpoints.md`, `specs/23-convenciones-api.md`, `specs/24-formas-peticion-respuesta.md`, `specs/21-errores.md` |
| Lógica de negocio | `specs/12-reglas-negocio.md` y el caso de uso en `specs/14-casos-uso-narrativa.md` |
| Horarios, marcas de tiempo, motor de notificaciones | `specs/25-semantica-temporal.md` |
| Migraciones o modelos | `specs/15-diccionario-datos.md` y `specs/22-esquema-fisico.md` |
| Pruebas | `specs/30-casos-prueba.md` |
| Infraestructura o despliegue | `specs/40-stack.md`, `specs/41-variables-entorno.md`, `specs/43-infraestructura.md`, `specs/44-despliegue.md` |

No trabajes de memoria ni de resumen: abrí el archivo y citá la fila.

## 2 · Ocho prohibiciones absolutas (Boundary Spec, Tabla 25)

Son límites de **asunción**, no de sugerencia. Podés proponer cualquiera de estos cambios;
no podés aplicarlos por tu cuenta.

1. **Alcance.** No implementes funcionalidad que `specs/10-requisitos-funcionales.md` no
   enumere. No implementes ningún requisito `Should have` (los 11 marcados `S`): la Etapa 2
   resolvió que **ninguno integra el alcance comprometido**. Si una operación de
   `specs/20-endpoints.json` tiene `"should": true`, no se construye en esta entrega.
2. **Reglas de negocio.** No alteres, relajes ni suplas ninguna de las 33 reglas
   `RN-01…RN-33`. No resuelvas por tu cuenta un conflicto entre dos reglas.
3. **Modelo de datos.** No agregues, suprimas ni renombres entidades, atributos o
   restricciones respecto de `specs/22-esquema-fisico.md` (19 entidades).
4. **Contrato.** No crees rutas fuera de las 43 de `specs/20-endpoints.json`, no cambies
   el método ni la ruta de una existente, no alteres su lista de roles autorizados.
5. **Control de acceso.** Ninguna decisión de autorización se resuelve en el cliente.
   Ninguna operación que expone datos académicos omite la verificación de rol (RNF-21, RNF-01).
6. **Errores.** No emitas un estado HTTP fuera de los 9 de `specs/21-errores.json`.
   El catálogo es **cerrado**. Ningún cuerpo de error revela detalle interno.
7. **Infraestructura.** No incorpores servicios, contenedores ni dependencias que
   `specs/40-stack.md` no consigne. Cada componente extra consume horas de las 356 estimadas.
8. **Datos.** Ningún dato real de personas o de la institución en el código, las
   migraciones, las semillas ni las capturas. Sólo datos ficticios (puntos 1.6 y 1.7).

**Sobre el tiempo, además.** Las ocho prohibiciones vienen de la Tabla 25. Hay una novena
regla que no está en esa tabla sino en la prosa del punto 4.2, y que conviene tratar con el
mismo rigor porque es la que una asistencia completa por su cuenta sin darse cuenta: **no
asumas ninguna zona horaria, ninguna forma de leer la hora ni ninguna regla de franja
distinta de `specs/25-semantica-temporal.md`.** La zona es una sola, el almacenamiento es en
tiempo universal, la franja de disponibilidad puede cruzar la medianoche y diferir no es
descartar ni agrupar. La compuerta `tiempo` lo verifica.

## 3 · Ciclo de trabajo por requisito

Una rama por requisito funcional, conforme a la Tabla 31:

```
feature/RF-nn-descripcion-corta
```

Pasos obligatorios, en este orden:

1. **Situar.** Buscá `RF-nn` en `specs/16-trazabilidad.md`. Eso te da: la regla de negocio
   asociada, el caso de uso, el módulo de destino y el caso de prueba `CP-RF-nn`.
2. **Leer el caso de uso completo** en `specs/14-casos-uso-narrativa.md`. Los pasos
   numerados del flujo principal **son** la especificación de la operación: no se agrega
   ni se omite ninguno. Cada flujo de excepción `E1`, `E2`… debe tener su rechazo
   implementado con el estado del catálogo.
3. **Leer la fila del endpoint** en `specs/20-endpoints.md` y su forma en
   `specs/24-formas-peticion-respuesta.md`. Los nombres de campo son literalmente los del
   diccionario de la Tabla 14.
4. **Escribir la prueba primero**, con el `CP-RF-nn` de `specs/30-casos-prueba.md` como
   enunciado: mismos datos de entrada, mismo resultado esperado.
5. **Implementar** en el módulo que la Tabla 15 asigna. La lógica va en la API, nunca en
   el cliente.
6. **Verificar**: `bin/verificar`. Ninguna rama se integra con una compuerta en rojo.
7. **Commit** citando el código:
   `RF-nn: <qué hace> · CU-nn · RN-nn`

## 4 · Qué debe llevar cada unidad de código

Todo controlador, servicio, modelo y política lleva un comentario de encabezado con los
códigos que realiza. No es adorno: es lo que permite que la evidencia del punto 5.2 se
contraste contra la Tabla 15.

```ruby
# RF-17 Publicación de anuncios · CU-06 · RN-16, RN-17, RN-18, RN-19
# Prueba: CP-RF-17
```

## 5 · Compuertas de verificación

`bin/verificar` corre ocho compuertas. Están escritas para **fallar**, no para informar.
No hay integración continua —el punto 4.5 lo declara de forma expresa—: las compuertas se
corren en local antes de cada integración de rama, que es la condición que el Quality Spec
establece en lugar de una cadena de integración.

| Compuerta | Qué compara | Requisito que verifica |
|---|---|---|
| `contrato` | rutas del enrutador ↔ las 43 de la Tabla 18 | RNF-17 · CP-RNF-17 |
| `errores` | estados HTTP emitidos ↔ catálogo de 9 de la Tabla 24 | RNF-17 · Boundary 6 |
| `esquema` | tablas y columnas de `db/schema.rb` ↔ las 19 entidades de la Tabla 27 | Boundary 3 |
| `alcance` | ninguna ruta `Should have` implementada sin decisión registrada | Boundary 1 |
| `trazabilidad` | cada RF Must have tiene rama, código citado y `CP-RF-nn` | RNF-22 · CP-RNF-22 |
| `cobertura` | cobertura de líneas de la API ≥ 70 % | RNF-20 · CP-RNF-20 |
| `tiempo` | zona horaria, lectura de hora y franja de disponibilidad ↔ punto 4.2 | RF-33 · RN-24 · RN-32 |
| `estilo` | RuboCop y ESLint sin hallazgos ni excepciones por archivo (D-14) | Quality Spec · Tabla 26 |

## 6 · Cuando encuentres un hueco

No lo tapes. Escribí una entrada en `specs/DECISIONES.md` con este formato y detené la
tarea:

```
## D-nn · <título>
- **Dónde apareció:** RF-nn / CU-nn / archivo
- **Qué dice el documento:** <cita literal, con tabla y fila>
- **Qué no dice:** <lo que falta>
- **Alternativas:** A… B… C…
- **Consecuencia de cada una:**
- **Estado:** abierta
```

La adopción de cualquier alternativa exige **primero** actualizar el artefacto del
documento que la gobierna y registrar el cambio en el histórico de revisiones. Esa es la
condición que la nota de la Tabla 25 impone, y es lo que impide que el código diverja del
documento sin que la divergencia quede escrita.
