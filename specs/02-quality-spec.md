<!-- GENERADO desde TFG_entrega_5_Etapa4_v52.docx. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 37 · Quality Spec: estándares de código y umbrales verificables

| Aspecto | Estándar adoptado | Cómo se verifica |
|---|---|---|
| Estilo del servidor | RuboCop con la configuración por defecto del framework, sin excepciones por archivo | Ejecución del analizador en cada envío al repositorio; el incumplimiento detiene la integración de la rama |
| Estilo del cliente | ESLint y Prettier con la configuración recomendada para la biblioteca de interfaz | Ídem |
| Nomenclatura del dominio | Los identificadores de entidades y atributos reproducen literalmente los nombres del diccionario de la Tabla 21; los de operaciones, las rutas de la Tabla 27 | Inspección en la revisión de cada rama y contraste automatizado del enrutador contra la Tabla 27 |
| Vocabulario de la interfaz de usuario | Vocabulario cerrado: anuncio, publicación, constancia, acuse, curso, año lectivo, código de activación, canal grupal y horario de disponibilidad. Se prohíben los sinónimos | Inspección sobre las cadenas del cliente durante la redacción del manual |
| Manejo de excepciones | Un único manejador central que traduce toda excepción al formato de la Tabla 35. Ningún controlador emite un cuerpo de error propio | CP-RNF-17 y revisión del manejador |
| Transaccionalidad | Toda operación que escribe en más de una entidad se resuelve dentro de una transacción y rechaza sin efectos parciales | CP-RF-17 y la postcondición de excepción de CU-06 |
| Pruebas obligatorias | Cada operación de la Tabla 27 exige una prueba de su flujo principal, una por cada flujo de excepción declarado en su caso de uso y una de autorización por cada uno de los cuatro roles | CP-RNF-01 y CP-RNF-22 |
| Cobertura | Cobertura de líneas de la interfaz igual o superior al 70 %, con el umbral configurado en la propia herramienta | CP-RNF-20; por debajo del umbral la ejecución falla |
| Revisión del código asistido | Ninguna porción generada con asistencia se integra sin lectura previa y sin prueba que la ejercite | Historial de commits y ejecución de la suite antes de cada merge |

> Nota. Los umbrales de esta tabla no son nuevos: reproducen los que RNF-20, RNF-21 y RNF-22 ya comprometen, y los traducen a criterios que pueden aplicarse sobre una rama antes de integrarla. El último aspecto es el que da contenido operativo a la conclusión de la Tabla 29: si la asistencia desplaza la mitad del esfuerzo hacia la auditoría, esa auditoría tiene que estar definida como una condición de integración y no como una intención.
