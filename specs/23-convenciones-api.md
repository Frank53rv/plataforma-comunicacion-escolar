<!-- GENERADO desde TFG_ENTREGA_75paginas.docx, edición vigente. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 28 · Convenciones generales de la interfaz

| Aspecto | Convención | Fundamento |
|---|---|---|
| Prefijo de ruta | /api/v1. La versión mayor del prefijo cambia solo ante una incompatibilidad del contrato, conforme al criterio de versionado de la Tabla 31 | RNF-17 |
| Identificadores | Identificador universal único en las rutas y en los cuerpos. No se exponen enteros secuenciales | RN-15 |
| Autenticación | Encabezado de autorización con el esquema de portador y el token de RF-01. La conexión del canal de tiempo real presenta el mismo token | RF-01 · RNF-02 · RNF-21 |
| Formato de intercambio | JSON en petición y respuesta. Nombres de campo en minúsculas con guion bajo, iguales a los del diccionario de la Tabla 14 | Tabla 26, nomenclatura del dominio |
| Fechas y horas | Cadena conforme a ISO 8601 con desplazamiento explícito. El servidor almacena y responde en tiempo universal coordinado | RF-34 · RF-32 |
| Paginación | Parámetros pagina y por_pagina, con veinticinco elementos por omisión y cien como máximo. La respuesta incluye total, pagina y por_pagina junto a los datos | RF-22 · RF-28 |
| Ordenamiento | Parámetro orden con un campo y un sentido. El historial de anuncios y el de mensajes ordenan por fecha descendente por omisión; la colección de conversaciones del usuario, por nombre del curso | RF-22 · RNF-16 |
| Filtros | Parámetros de consulta nombrados como el campo que filtran: curso_id, remitente_id, desde, hasta | RF-22 |
| Respuesta de éxito | Objeto del recurso en las operaciones de un solo elemento; objeto con datos y paginación en las de colección. Sin envoltorio adicional | — |
| Respuesta de error | Objeto conforme a RFC 9457 (Nottingham et al., 2023) con los miembros de la norma más codigo y regla, según el catálogo de la Tabla 24 | RF-37 · RNF-17 |
| Idempotencia | Las operaciones de registro de estado admiten reemisión sin alterar la marca de tiempo original y responden igual que la primera vez | RF-36 |
| Tamaño de la carga | Cuerpo de petición de hasta 1 MB, salvo la carga de adjuntos, limitada a 5 MB por archivo | RN-33 |

> Nota. Las convenciones se aplican a la totalidad de las operaciones y por eso no se repiten en la tabla siguiente, que consigna únicamente lo propio de cada una. La paginación por omisión de veinticinco elementos se fija sobre el volumen declarado en RNF-09 —cuatrocientos anuncios y dieciséis mil mensajes en el conjunto de prueba—, de modo que el percentil 95 se mida sobre páginas de tamaño realista y no sobre respuestas completas.
