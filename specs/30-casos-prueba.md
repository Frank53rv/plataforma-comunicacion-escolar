<!-- GENERADO desde TFG_entrega_5_Etapa4_v52.docx. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 43 · Matriz de casos de prueba

| Cód. | Req. | Descripción del caso | Datos de entrada | Resultado esperado |
|---|---|---|---|---|
| CP-RF-01 | RF-01 | Autenticación con credencial válida y con credencial inválida | Correo y contraseña de una cuenta activa; luego la misma con contraseña errónea | Token firmado con identidad, rol y vencimiento. El segundo intento responde 401 sin distinguir cuál de los dos datos falló |
| CP-RF-02 | RF-02 | Acceso a una operación de datos académicos con cada uno de los cuatro roles | Token de directivo, docente, tutor y alumno sobre la misma operación | Solo el rol habilitado obtiene respuesta; los tres restantes, 403 |
| CP-RF-03 | RF-03 | Alta de docente y asignación a curso con titularidad | Datos del docente, curso y atributo de titular | Docente creado, vinculado como titular y con código de activación generado |
| CP-RF-04 | RF-04 | Alta de alumno con hasta dos tutores | Datos del alumno, su curso y dos tutores | Alumno y tutores creados y vinculados, con un código por persona |
| CP-RF-05 | RF-05 | Generación del código al registrar a una persona | Alta de un tutor | Código de un solo uso, con vencimiento a siete días, asociado a esa persona |
| CP-RF-06 | RF-06 | Activación con código vigente y reintento del mismo código | Código vigente y contraseña propia; luego el mismo código | Cuenta activa y código invalidado. El segundo canje responde 410 |
| CP-RF-07 | RF-07 | Regeneración de código por el rol habilitado y por uno que no lo es | Docente del curso; luego docente ajeno al curso | Código anterior invalidado y nuevo vigente. El docente ajeno obtiene 403 |
| CP-RF-08 | RF-08 | Restablecimiento de acceso mediante código regenerado | Persona sin contraseña y código nuevo | Acceso restablecido sin intervención de servicio de correo saliente |
| CP-RF-09 | RF-09 | Baja lógica de alumno y de tutor | Identificador de una persona activa | Acceso revocado, historial y autoría conservados |
| CP-RF-10 | RF-10 | Baja de tutor que mantiene un alumno activo | Tutor vinculado a un alumno activo | Rechazo 409 con la regla RN-12 consignada |
| CP-RF-11 | RF-11 | Creación del año lectivo y de un segundo con el anterior vigente | Dos altas sucesivas de año lectivo | La primera se crea; la segunda se rechaza con 409 y RN-31 |
| CP-RF-12 | RF-12 | Creación y edición de curso, con nombre repetido en el mismo año | Dos cursos de igual nombre en el año lectivo vigente | El segundo se rechaza con 409 |
| CP-RF-13 | RF-13 | Vinculación de un alumno a un segundo curso vigente | Alumno ya vinculado y otro curso del mismo año | Rechazo 409 con RN-30 |
| CP-RF-14 | RF-14 | Vinculación de un tercer tutor | Alumno con dos tutores vigentes | Rechazo 409 con RN-29 |
| CP-RF-15 | RF-15 | Vinculación de varios docentes a un curso con un único titular | Dos docentes, uno marcado como titular | Ambos vinculados y un solo titular vigente |
| CP-RF-16 | RF-16 | Cierre del año lectivo | Año lectivo vigente con cursos y conversaciones | Cursos y conversaciones en solo lectura, creación del período siguiente habilitada y cuentas conservadas |
| CP-RF-17 | RF-17 | Publicación sobre un curso asignado y sobre uno ajeno | Anuncio sobre curso propio; luego sobre curso ajeno | El primero se publica; el segundo se rechaza con 403 y sin efectos parciales |
| CP-RF-18 | RF-18 | Programación de la hora de envío | Anuncio con fecha y hora futuras | Estado programado; destinatarios resueltos y envío encolado en la hora fijada |
| CP-RF-19 | RF-19 | Edición con versionado | Anuncio publicado y contenido corregido | Versión nueva, destinatarios resueltos otra vez y acuses anteriores fuera del contador vigente |
| CP-RF-20 | RF-20 | Borrado lógico de anuncio propio y de anuncio ajeno | Anuncio propio; luego de otro docente | El propio se elimina con autor y fecha, conservando las filas de entrega; el ajeno responde 403 |
| CP-RF-21 | RF-21 | Resolución de destinatarios en la publicación efectiva | Alumno incorporado al curso con posterioridad a la publicación | El alumno incorporado después no recibe la publicación anterior |
| CP-RF-22 | RF-22 | Historial filtrado por fecha, curso y remitente | Consulta con los tres filtros combinados | Solo los anuncios que corresponden a las vinculaciones del usuario; el ajeno responde 404 |
| CP-RF-23 | RF-23 | Constancias del anuncio propio y del ajeno | Anuncio con destinatarios que leyeron y que no leyeron | Recuento sobre el total y nómina de quienes no leyeron; el ajeno responde 403 |
| CP-RF-24 | RF-24 | Canal grupal de alumnos separado del de tutores | Curso con alumnos y tutores vinculados | Dos canales distintos, cada uno con sus participantes |
| CP-RF-25 | RF-25 | Canal grupal existente desde la creación del curso | Curso recién creado | Canal disponible, integrado por sus docentes y los tutores de sus alumnos |
| CP-RF-26 | RF-26 | Conversación privada entre alumno y docente | Docente del curso del alumno; luego docente de otro curso | La primera se admite; la segunda se rechaza con 403 |
| CP-RF-27 | RF-27 | Conversación privada entre tutor y docente | Docente del curso del hijo; luego docente ajeno | La primera se admite; la segunda se rechaza con 403 |
| CP-RF-28 | RF-28 | Persistencia y recuperación por fecha y participante | Conversación con mensajes de varias jornadas | La totalidad de los mensajes se recupera, paginada |
| CP-RF-29 | RF-29 | Participación de un usuario no vinculado al curso | Token de un usuario ajeno a la conversación | Suscripción rechazada con 403 |
| CP-RF-30 | RF-30 | Adjunto válido, formato inválido, exceso de tamaño y exceso de cantidad | PDF de 2 MB; una imagen; PDF de 8 MB; un cuarto archivo | Aceptado; 415; 413; 422 respectivamente |
| CP-RF-31 | RF-31 | Notificación de anuncio con independencia del horario | Destinatario fuera de su franja de disponibilidad | La notificación se emite igualmente, conforme a RN-18 |
| CP-RF-32 | RF-32 | Notificación de mensaje dentro y fuera de la franja | Mensaje a un destinatario dentro y fuera de su horario | Dentro se emite; fuera se difiere y no se descarta |
| CP-RF-33 | RF-33 | Configuración de horario de disponibilidad y preferencias | Franja horaria y preferencias nuevas | Quedan registradas y se aplican al siguiente mensaje; los anuncios no resultan alcanzados |
| CP-RF-34 | RF-34 | Registro monótono de los cuatro estados | Eventos en orden y en desorden | Los cuatro estados quedan con marca de tiempo y el estado actual no degrada |
| CP-RF-35 | RF-35 | Emisión agrupada de los eventos de vista | Cinco anuncios que ingresan al área visible | Una sola petición con los cinco identificadores |
| CP-RF-36 | RF-36 | Idempotencia del registro de eventos | Reemisión de un evento ya registrado | Respuesta correcta sin alterar la marca de tiempo original |
| CP-RF-37 | RF-37 | Degradación ante credencial inválida del proveedor | Respuesta de credencial inválida del servicio push | Identificador de destino invalidado, aviso en la aplicación, causa registrada y sin reintento |
| CP-RF-38 | RF-38 | Indicador de familia alcanzada | Alumno con dos tutores, uno de los cuales registró lectura | El indicador resulta verdadero |
| CP-RF-39 | RF-39 | Bandeja de anuncios como vista de entrada | Autenticación con cada uno de los cuatro roles | La bandeja es la primera vista en los cuatro casos |
| CP-RF-40 | RF-40 | Paneles sin opciones ajenas al rol | Sesión de tutor y sesión de alumno | Ninguna opción de administración académica resulta visible ni alcanzable |
| CP-RF-41 | RF-41 | Operabilidad en los tres anchos de referencia | Las veinticuatro tareas críticas de la Tabla 26 en 360, 768 y 1280 píxeles | Completadas sin pérdida de función y sin desplazamiento horizontal a partir de 320 píxeles |
| CP-RF-42 | RF-42 | Cobertura de flujos desde la interfaz | Las veinticuatro tareas críticas de la Tabla 26 | Todas ejecutables sin recurrir a herramientas de composición de peticiones |
| CP-RF-43 | RF-43 | Bloqueo hasta el cambio de la credencial provisional | Primer acceso con credencial provisional | Token emitido; toda otra operación responde 403 hasta completar el cambio |
| CP-RF-44 | RF-44 | Desvinculación de docente titular sin designar reemplazo | Docente titular a desvincular, sin y con titular designado | Sin designación, 409; con designación, desvinculación exitosa y autoría conservada |
| CP-RF-45 | RF-45 | Consulta directiva del estado agregado | Sesión de directivo sobre el año lectivo vigente | Anuncios de la totalidad de los cursos y estado agregado de entrega y lectura por curso |
| CP-RF-46 | RF-46 | Supervisión directiva de conversaciones | Sesión de directivo sobre una conversación del año vigente | Acceso de lectura con la supervisión declarada; el intento de emitir responde 403 |
| CP-RF-47 | RF-47 | Indicador de mensajes no leídos | Conversación con mensajes posteriores al puntero de lectura | Cantidad correcta, que se reduce al actualizarse el puntero |
| CP-RNF-01 | RNF-01 | Autorización por cada combinación de operación y rol | Las 37 operaciones Must have por los cuatro roles: 148 casos | Sin token, 401 en el 100 %; con rol no autorizado, 403 en el 100 % |
| CP-RNF-02 | RNF-02 | Autenticidad y vencimiento del token | Token válido, token expirado y token alterado | El válido se acepta; los otros dos se rechazan con 401. El vencimiento no supera las 24 horas |
| CP-RNF-03 | RNF-03 | Resguardo no reversible de credenciales | Consulta directa sobre la tabla de usuarios | Ninguna consulta devuelve una contraseña recuperable |
| CP-RNF-04 | RNF-04 | Trazabilidad de las acciones sobre anuncios | Publicación, edición y eliminación | Las tres registran autor y marca de tiempo; el 100 % de los anuncios resulta atribuible |
| CP-RNF-05 | RNF-05 | No repudio de la constancia | Intento de modificación de un acuse ya registrado | El registro no admite modificación posterior |
| CP-RNF-06 | RNF-06 | Transporte cifrado | Petición sobre HTTPS y petición en texto plano | La primera se atiende con certificado válido; la segunda no es aceptada |
| CP-RNF-07 | RNF-07 | Retención y minimización de datos | Registros de negocio y de bitácora con antigüedad superior al plazo | Los de negocio se conservan el año en curso más uno; la bitácora, doce meses. El cliente no persiste historial en el navegador |
| CP-RNF-08 | RNF-08 | Latencia de entrega de mensajes | Mensaje a un destinatario conectado, en condiciones controladas | Entrega en menos de dos segundos |
| CP-RNF-09 | RNF-09 | Tiempo de respuesta de las consultas | 100 peticiones consecutivas sobre el conjunto de prueba declarado en la Tabla 18 | Percentil 95 inferior a 1,5 segundos |
| CP-RNF-10 | RNF-10 | Capacidad de conexiones simultáneas | 40 conexiones concurrentes mediante script de prueba | Sostenidas sin degradar la latencia comprometida en RNF-08 |
| CP-RNF-11 | RNF-11 | Tolerancia a la indisponibilidad del servicio push | Servicio externo inaccesible | Publicar, consultar y conversar siguen disponibles; el aviso se entrega en la aplicación y la causa queda registrada |
| CP-RNF-12 | RNF-12 | Recuperación del envío diferido | Fallo transitorio y fallo por credencial inválida | El transitorio se reintenta desde la cola; el de credencial se cierra con causa y no se reintenta |
| CP-RNF-13 | RNF-13 | Operabilidad por rol | Sesión de validación con entre tres y cinco personas sobre las tareas de la Tabla 26 | Al menos el 90 % del total de ejecuciones completado sin intervención de otra persona |
| CP-RNF-14 | RNF-14 | Protección frente a errores del usuario | Ejecución de las tareas críticas, incluidas las destructivas | Promedio de hasta una acción errónea por tarea; toda acción destructiva exige confirmación explícita |
| CP-RNF-15 | RNF-15 | Facilidad de aprendizaje | Tiempo por tarea contrastado contra el de referencia medido por el autor | Ninguna tarea supera el doble del tiempo de referencia |
| CP-RNF-16 | RNF-16 | Localización de información publicada | Búsqueda de un anuncio publicado con anterioridad | Resuelta en un máximo de tres pasos desde la vista de entrada |
| CP-RNF-17 | RNF-17 | Documentación formal de la interfaz | Rutas del enrutador, archivo OpenAPI e inventario de la Tabla 27 | Diferencia nula en los tres sentidos y colección de validación ejecutable |
| CP-RNF-18 | RNF-18 | Adaptación a distintos dispositivos | Las veinticuatro tareas críticas en 360, 768 y 1280 píxeles | Operables sin pérdida de función y sin desplazamiento horizontal desde 320 píxeles |
| CP-RNF-19 | RNF-19 | Reproducibilidad del despliegue | Repositorio recién clonado y archivo de variables de entorno | El entorno completo se levanta por contenedores sin edición manual de archivos |
| CP-RNF-20 | RNF-20 | Cobertura de pruebas automatizadas | Ejecución completa de la suite con la herramienta de medición configurada | Cobertura de líneas igual o superior al 70 %; por debajo, la ejecución falla |
| CP-RNF-21 | RNF-21 | Separación de responsabilidades | Casos de autorización ejecutados contra la interfaz sin intervención del cliente | Todas las reglas se satisfacen en la interfaz; ninguna se satisface únicamente desde el cliente |
| CP-RNF-22 | RNF-22 | Completitud funcional del producto mínimo viable | Matriz de trazabilidad contrastada contra la ejecución de la suite | El 100 % de los Must have cuenta con caso asociado y ejecución aprobada |

> Nota. Sesenta y nueve casos: cuarenta y siete de requisitos funcionales y veintidós de no funcionales, en correspondencia uno a uno con las filas de la Tabla 22. Los casos que verifican requisitos clasificados Should have —CP-RF-08, CP-RF-16, CP-RF-18, CP-RF-19, CP-RF-24, CP-RF-26, CP-RF-27, CP-RF-30, CP-RF-38, CP-RF-46 y CP-RF-47— se ejecutan únicamente si esos requisitos se incorporan conforme al criterio de la Etapa 2, y su exclusión no afecta al umbral del 80 % del objetivo general, que se calcula sobre los casos efectivamente ejecutados. Los códigos de estado que aparecen en la columna de resultado esperado pertenecen al catálogo cerrado de la Tabla 35.
