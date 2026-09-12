<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 25 · Boundary Spec: límites de la asistencia de inteligencia artificial

| Ámbito | Qué no puede asumir ni modificar | Por qué |
|---|---|---|
| Alcance funcional | Incorporar funcionalidad que la Tabla 10 no enumere, o implementar un requisito clasificado Should have sin decisión expresa registrada | El punto 1.5 declara que el conjunto enumerado define el límite del producto mínimo viable, y la Etapa 2 resolvió que ningún Should have integra el alcance comprometido |
| Reglas de negocio | Alterar, relajar o suplir cualquiera de las 33 reglas de la Tabla 12, ni resolver un conflicto entre reglas por su cuenta | Las reglas provienen de la definición del dominio y su modificación es una decisión del autor, no del código |
| Modelo de datos | Agregar, suprimir o renombrar entidades, atributos o restricciones del diccionario de la Tabla 14 y del modelo de la Figura 15 | El diccionario es la fuente de verdad del esquema; toda divergencia rompería la trazabilidad de la Tabla 15 |
| Contrato de la interfaz | Crear rutas que la Tabla 18 no declare, cambiar el método o la ruta de una operación existente, o alterar los roles autorizados de una operación | RNF-17 exige diferencia nula entre enrutador, archivo OpenAPI e inventario, y RNF-01 se construye sobre la columna de roles |
| Control de acceso | Resolver una decisión de autorización en el cliente, u omitir la verificación de rol en una operación que expone datos académicos | RNF-21 y RNF-01. Es el compromiso central del objetivo específico 2 y lo que hace verificable el resguardo de datos de menores |
| Errores | Emitir un código de estado que el catálogo de la Tabla 24 no contemple, o revelar en el cuerpo de error información que los criterios de no divulgación excluyen | El catálogo es cerrado y los dos criterios de no divulgación se derivan de CU-01 E1 y de RN-15 |
| Infraestructura | Incorporar servicios, contenedores o dependencias que la Tabla 23 no consigne | El punto 2.5 declara el criterio de eliminar todo componente no exigido por un requisito, y cada componente adicional consume horas de las 356 presupuestadas |
| Datos | Introducir datos reales de personas o de la institución en el código, en las migraciones, en los datos de prueba o en las capturas | El punto 1.7 obliga al resguardo de la información y el 1.6 declara que el entorno opera con datos de prueba |

> Nota. El límite es de asunción, no de sugerencia: la asistencia puede proponer cualquiera de estas modificaciones y el autor puede adoptarlas, pero la adopción exige actualizar primero el artefacto del documento que la gobierna y registrar el cambio en el histórico de revisiones. Lo que la especificación prohíbe es que el código diverja del documento sin que esa divergencia quede escrita, que es exactamente el modo en que una matriz de trazabilidad deja de ser un instrumento de control.
