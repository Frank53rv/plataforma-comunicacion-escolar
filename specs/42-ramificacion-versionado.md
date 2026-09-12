<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 31 · Modelo de ramificación y criterio de versionado

| Rama o elemento | Contenido | Condición para integrar |
|---|---|---|
| main | Versión estable y entregable. Cada integración corresponde a un incremento demostrado en un punto de control | Suite completa aprobada y revisión del autor registrada en el merge |
| develop | Código integrado y funcional sobre el que se ejecutan las pruebas | Suite de la rama de origen aprobada y analizadores de estilo sin hallazgos |
| feature/RF-nn-descripcion | Una rama por requisito funcional, nombrada con su código de la Tabla 10 | Prueba del flujo principal, de cada flujo de excepción del caso de uso y de autorización por los cuatro roles |
| hotfix/CP-nn | Corrección derivada de un caso de prueba rechazado en la verificación | Caso de prueba que originó la corrección, en estado aprobado |
| Versión mayor | Incompatibilidad en el contrato de la Tabla 18 | Decisión del autor, registrada en el histórico de revisiones |
| Versión menor | Incorporación de un requisito funcional completo | Requisito con su caso de prueba aprobado |
| Versión parche | Corrección sin cambio de contrato | Caso de prueba aprobado |

> Nota. El nombre de la rama incorpora el código del requisito de la Tabla 10 por una razón que excede la prolijidad: convierte el historial del repositorio en evidencia directa de la matriz de trazabilidad, de modo que la verificación de RNF-22 en la Etapa 4 pueda contrastar cada requisito Must have contra la rama que lo construyó y el caso de prueba que lo aprobó. Los archivos de especificación que gobiernan la asistencia de inteligencia artificial —el Context, el Boundary y el Quality Spec de este punto— se versionan junto con el código, en una carpeta propia, para que toda modificación de los límites quede fechada y atribuida.
