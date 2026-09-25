<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 24 · Catálogo de errores de la interfaz de programación

| Estado | Cuándo se emite | Flujos que lo originan |
|---|---|---|
| 401 | Credencial inválida, cuenta dada de baja, token ausente, expirado o alterado, contraseña actual equivocada en el cambio de credencial e intento de activación de una cuenta dada de baja. El cliente distingue la contraseña actual equivocada al sustituir la credencial, que se informa conservando la sesión, del token vencido, que cierra la sesión. | CU-01 E1 y E2 · RNF-02 |
| 403 | Autenticado pero no habilitado: credencial provisional sin cambiar, rol sin la atribución, docente no vinculado al curso, anuncio del que no es autor, participación en conversación ajena, curso ajeno en la consulta de sus conversaciones, supervisión que no habilita emitir. También el curso o alumno inexistente en las operaciones de alta y el curso inexistente en la publicación de un anuncio, que responden 403, igual que uno ajeno, para no revelar la existencia del recurso. | CU-01 A · CU-02 A · CU-06 E1 · CU-08 E1 · CU-11 E1 · CU-12 E1 · CU-15 E1 |
| 404 | Recurso ajeno a las vinculaciones de quien consulta | CU-09 E1 |
| 409 | Conflicto con una regla de negocio del dominio, con el código de la regla consignado, incluida la designación de un segundo titular sobre un curso que ya lo tiene y la baja de un docente que conserva alguna vinculación vigente (RN-13). | CU-03 E1 y E2 · CU-04 E1 · CU-05 E1, E2 y E3 |
| 410 | Código de activación vencido, ya utilizado, inexistente o mal formado, que se equipara al inexistente. | CU-02 E1 |
| 413 | Archivo adjunto que supera los 5 MB | RN-33 |
| 415 | Archivo adjunto en un formato distinto de PDF | RN-33 |
| 422 | Petición bien formada con datos inaceptables, incluida la publicación con más de tres adjuntos: correo ya registrado, vinculación duplicada, persona con otro rol asignado, curso perteneciente a otro año lectivo, alumno o tutor dado de baja, alumno existente sin vinculación vigente en el año en curso —que no se revincula de manera automática—, hora con formato distinto de HH:MM y toda violación de una unicidad sin flujo de excepción propio, como un año calendario ya usado. | RN-33 y validaciones de forma |
| 500 | Fallo no previsto, registrado en la bitácora sin exponer detalle interno | — |

> Nota. El catálogo es cerrado: ningún rechazo de la interfaz emite un estado que no figure en esta tabla, y esa condición se verifica en CP-RNF-17 al contrastar el archivo OpenAPI contra el enrutador. Cada estado se deriva de un flujo de excepción ya especificado en el punto 2.3, de modo que la tabla no incorpora comportamiento nuevo sino que fija la forma en que el comportamiento comprometido se manifiesta ante quien consume la interfaz.
