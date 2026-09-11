# Registro de decisiones y huecos

Toda divergencia entre el código y el documento se anota acá **antes** de escribirse, con
las alternativas y su consecuencia. Una decisión adoptada exige, además, actualizar el
artefacto del documento que la gobierna y registrar el cambio en el histórico de
revisiones (nota de la Tabla 36).

Formato de las entradas: ver `../CLAUDE.md`, punto 6.
La marca `adoptado: RF-nn` en una entrada habilita a la compuerta `alcance` a aceptar ese
requisito Should have; sin ella, construirlo deja la rama en rojo.

**Actualizado el 11 de septiembre de 2026**, contra el documento en su versión 5.2.

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

## D-05 · El flag `should` del inventario se calcula por operación y no por requisito
- **Dónde apareció:** `specs/20-endpoints.json` · `tools/extraer_specs.py:201` ·
  `tools/gate_alcance.py` · al planificar RF-17, RF-23 y RF-25
- **Qué dice el documento:** la Tabla 27 marca la clasificación **por requisito** dentro de
  la celda, no por operación: la fila de `POST /api/v1/anuncios` dice «RF-17, RF-18 (Should),
  RF-21, RF-31». Y la Tabla 43, en CP-RNF-01, cuenta «las **37** operaciones Must have por
  los cuatro roles: 148 casos».
- **Qué no dice:** nada. No es un hueco del documento sino una divergencia de la extracción:
  el extractor decidía la marca con una búsqueda de subcadena sobre la celda entera
  (`'should': 'Should' in r[4]`), de modo que una operación quedaba marcada Should si
  **cualquiera** de sus requisitos lo era. `gate_alcance` agravaba el efecto indexando cada
  ruta Should por el **último** código de su lista.
- **Consecuencia de no corregirlo:** exponer `POST /anuncios` (RF-17, Must have, tarea
  crítica TC-11), `GET /anuncios/{id}/constancias` (RF-23, Must have, TC-13),
  `GET /cursos/{id}/conversaciones` y `GET /conversaciones` (RF-25, Must have, TC-14) dejaba
  la compuerta `alcance` en rojo, citando RF-31, RF-38, RF-27 y RF-47. Tres requisitos Must
  have quedaban inconstruibles.
- **Alternativas:**
  - **A.** Corregir el extractor para que la marca se lea por requisito, regenerar
    `specs/20-endpoints.json` y evaluar la compuerta por requisito.
  - **B.** Consignar la marca de adopción sobre RF-31, RF-38, RF-27 y RF-47 para
    desbloquear la compuerta.
  - **C.** Dejar la compuerta en rojo y documentar la excepción.
- **Consecuencia de cada una:** A restituye la lectura del documento y hace que la aritmética
  cierre. B falsea el Boundary 1: declararía cuatro Should have como alcance comprometido,
  cuando la Etapa 2 resolvió que ninguno lo integra. C convierte la compuerta en un aviso
  permanente, que es exactamente el modo en que una matriz de trazabilidad deja de ser un
  instrumento de control.
- **Estado: RESUELTA · se adopta A.**
- **Fundamento:** prevalece el documento (`CLAUDE.md` §0.1). La aritmética de la Tabla 43 lo
  confirma sin margen: 42 operaciones HTTP menos las 5 puramente Should —`POST /recuperaciones`
  (RF-08), `PATCH /anios-lectivos/{id}` (RF-16), `POST /conversaciones/{id}/adjuntos` (RF-30),
  `PUT /conversaciones/{id}/puntero-lectura` (RF-47) y `GET /supervision/conversaciones`
  (RF-46)— dan las 37 que CP-RNF-01 cuenta. Una operación queda marcada Should sólo si
  **todos** sus requisitos lo son. El campo nuevo `requisitos_should` conserva la marca por
  requisito, que es lo que permite contrastar contra la Tabla 27 fila por fila. El `.docx` no
  se modifica: ya dice 37.

## D-06 · Las compuertas no ven el árbol de la Figura 18
- **Dónde apareció:** `tools/_comun.py:19-26` y las siete compuertas · antes de crear el árbol
- **Qué dice el documento:** la Figura 18 fija la estructura del repositorio con la interfaz
  de programación bajo `api/` —con `identidad_acceso/`, `estructura_academica/`, `anuncios/`,
  `mensajeria/`, `notificaciones/`, `compartido/` y `spec/`— y el cliente bajo `cliente/`. El
  punto 4.3 lo reafirma: «la estructura del repositorio reproduce los siete módulos que la
  columna Módulo / componente de la Tabla 22 declara». El paso 1 de la Tabla 46 verifica que
  «el árbol de carpetas coincide con la Figura 18».
- **Qué no dice:** nada. Divergencia de las herramientas: las siete compuertas buscan `app/`,
  `lib/`, `config/`, `db/`, `spec/`, `tmp/rutas.txt` y `coverage/` **en la raíz**.
- **Consecuencia de no corregirlo:** con la interfaz en `api/`, `os.walk` no encuentra nada,
  ninguna compuerta falla y `bin/verificar` informa VERDE **sin verificar nada**. Es peor que
  el rojo: un instrumento de control que aprueba por ceguera.
- **Alternativas:**
  - **A.** Seguir la Figura 18 y adaptar las rutas que las compuertas exploran.
  - **B.** Poner la aplicación en la raíz, con los módulos como `app/identidad_acceso/`.
- **Consecuencia de cada una:** A conserva el árbol que el paso 1 de la Tabla 46 verifica y
  toca `tools/`, que no es artefacto del documento. B evita tocar las herramientas al costo
  de que el árbol deje de coincidir con la Figura 18 y el paso 1 falle.
- **Estado: RESUELTA · se adopta A.**
- **Fundamento:** la Figura 18 es del documento y las compuertas no lo son. El orden de
  precedencia de `CLAUDE.md` §0 no admite que una herramienta auxiliar redefina el árbol que
  el documento fija y que el procedimiento de despliegue verifica.

## D-07 · Valores admisibles de los tipos enumerados de la Tabla 38
- **Dónde apareció:** Tabla 38 · primera migración
- **Qué dice el documento:** la nota de la Tabla 38 exige que los tipos enumerados «se
  declaren en el motor y no como texto libre, de modo que el conjunto de valores admisibles
  quede en el esquema y no en el código». La Tabla 21 enuncia los valores de `rol`
  —«directivo, docente, tutor o alumno»—, de `estado_anuncio` —«borrador, programado,
  publicado, archivado o eliminado»— y de `tipo_conversacion` —«grupal de tutores, grupal de
  alumnos o privada»—; `causa` queda cerrada en cuatro valores por RF-37, CU-14 y la entrada
  D-04; `estado_suscripcion` por «el estado pasa a inválida ante credencial rechazada»;
  `canal` por RNF-11 y la resolución del canal de entrega del punto 4.2; y `estado_anio` por
  RN-31 y la Tabla 40 («estado igual a cerrado»).
- **Qué no dice:** los valores admisibles de `turno`, `estado_usuario`, `estado_curso` y
  `estado_conversacion`. La palabra «turno» aparece en CU-03 y en la Tabla 38, en ningún caso
  con sus valores.
- **Estado: RESUELTA.**
- **Resolución de `turno`** — decisión del autor, 10 de septiembre de 2026: **no se declara
  como tipo enumerado**; se declara `varchar(20)`. Fundamento del autor: «ningún requisito,
  regla ni caso de uso distingue sus valores ni depende de ellos, de modo que restringirlos
  en el esquema obligaría a inventar un conjunto que el documento no enuncia. Se declara como
  texto de longitud acotada, y si más adelante alguna regla llegara a distinguirlos, su
  conversión a tipo enumerado se registrará como decisión.»
  **Pendiente de reposición documental:** el `.docx` que hoy está en `documento/`
  —`TFG_entrega_5_Etapa4_v52.docx`— consigna todavía `turno turno_enum` en la fila `curso` de
  la Tabla 38 y no contiene esa nota. Conforme a la nota de la Tabla 36, la adopción exige
  actualizar primero el artefacto que la gobierna: hay que reponer el archivo por la versión
  que incluye la nota y volver a correr `tools/extraer_specs.py`; el `git diff` de `specs/`
  es el registro del cambio. No bloquea la migración porque `gate_esquema` contrasta nombres
  de columna y no tipos.
- **Resolución de los otros tres** — por derivación textual, no por invención:
  - `estado_usuario`: `pendiente`, `activo`, `dado_de_baja`. `activo` y `dado_de_baja` son
    literales de CU-02 («la cuenta queda activa») y de la Tabla 40 («recurso usuario con
    estado dado de baja»). **`pendiente` es el único valor inferido** y no citado: se
    desprende de la precondición de CU-01, «la cuenta existe y está activada», que exige un
    estado anterior a la activación. Se consigna como inferido para que quede auditable.
  - `estado_curso`: `vigente`, `archivado` — RN-26 y CU-03 flujo A, «los cursos y sus
    conversaciones quedan archivados en solo lectura».
  - `estado_conversacion`: `activa`, `solo_lectura` — misma fuente, y la Tabla 21, «estado de
    solo lectura al cerrar el año lectivo».

## D-08 · Las tablas de la cola de trabajos y del canal de tiempo real en el esquema
- **Dónde apareció:** Tabla 34 y Tabla 45 · `api/db/schema.rb` · compuerta `esquema`
- **Qué dice el documento:** la Tabla 34 asigna la cola de trabajos a «Solid Queue …
  **sobre la misma base de datos**» y el canal de tiempo real a «ActionCable con adaptador
  Solid Cable … respaldada por la misma base de datos, **sin almacén en memoria adicional**».
  La Tabla 45 llama a PostgreSQL «**único almacén**: datos de negocio, cola de trabajos en
  segundo plano y mecanismo de publicación y suscripción». La Tabla 38, por su parte,
  declara **19 entidades** y su nota dice que «el esquema no agrega ni suprime ninguna».
- **Qué no dice:** si las tablas de infraestructura que esos dos adaptadores necesitan
  —`solid_queue_*` y `solid_cable_*`, creadas por el framework, no por el dominio— cuentan
  como entidades a los efectos de la Tabla 38.
- **Alternativas:**
  - **A.** Una sola base de datos, como la Tabla 34 dice literalmente, y la compuerta
    `esquema` distingue las tablas de infraestructura del framework de las 19 entidades del
    dominio.
  - **B.** Bases lógicas separadas para la cola y el canal sobre el mismo motor, que es lo
    que el framework genera por omisión: `db/schema.rb` queda con las 19 entidades y ninguna
    herramienta se toca.
- **Consecuencia de cada una:** A conserva la letra de la Tabla 34 —«la misma base de
  datos»— y exige una excepción explícita y nominada en la compuerta. B conserva la
  compuerta intacta al costo de que «la misma base de datos» pase a leerse como «el mismo
  motor», y de introducir cadenas de conexión que la Tabla 41 no enumera, contra RNF-19.
- **Estado: RESUELTA · se adopta A.**
- **Fundamento:** la Tabla 38 gobierna el **modelo de datos del dominio**, que es lo que el
  Boundary 3 protege: «agregar, suprimir o renombrar entidades, atributos o restricciones
  del diccionario de la Tabla 21». Las tablas de Solid Queue y Solid Cable no son entidades
  del diccionario sino la realización física de dos componentes que la Tabla 34 sí consigna;
  tratarlas como entidades del dominio confundiría el modelo con su infraestructura. La
  excepción de la compuerta es nominada —sólo los prefijos `solid_queue_` y `solid_cable_`—
  de modo que cualquier otra tabla fuera del diccionario sigue dejando la rama en rojo. Se
  descarta además `solid_cache`: la nota de la Tabla 34 declara que «la caché de aplicación
  no figura en esta tabla porque el producto mínimo viable no compromete ninguna», y el
  Boundary 7 prohíbe incorporar dependencias que la tabla no consigne.

## D-09 · Restricciones de la Tabla 38 que no admiten expresión declarativa literal
- **Dónde apareció:** Tabla 38 · primera migración
- **Qué dice el documento:** la nota de la Tabla 38 ya reconoce el problema y fija el
  criterio: «tres restricciones no admiten expresión declarativa razonable y se resuelven en
  la capa de negocio conforme a RNF-21» —RN-29, RN-30 y RN-13—, cada una con su caso de
  prueba. Esta entrada aplica el mismo criterio a otras dos que la tabla enuncia y que el
  motor tampoco puede expresar tal como están escritas.
- **Qué no dice:** cómo se realizan, dado que su enunciado no es traducible a una
  restricción declarativa.
- **Los dos casos:**
  - **`codigo_activacion`** · «UNIQUE parcial (usuario_id) donde `usado_en` es nulo **y
    `vence_en` es futuro**». PostgreSQL no admite un predicado de índice no inmutable: la
    hora actual no puede figurar en él. Se crea la mitad expresable —único código no usado
    por usuario— y la vigencia se verifica en la capa de negocio. **Queda abierta** la
    pregunta de cómo RF-07 «invalida el previo» al regenerar: si marcando `usado_en`, si
    adelantando `vence_en`, o si con otro criterio. Se resuelve al construir RF-07 y no
    antes, porque el documento no lo enuncia.
  - **`entrega_anuncio`** · «CHECK de monotonía entre las cuatro marcas». Una comparación
    encadenada `enviada_en <= entregada_en <= vista_en <= leida_en` contradiría el flujo
    alternativo B de CU-10, que admite expresamente que «el evento de lectura llegue antes
    que el de entrega» y ordena registrar la marca «sin degradar el estado actual». La
    monotonía que RN-32 compromete es la del **estado**, no la del orden de las marcas entre
    sí: «los estados de una entrega no retroceden». Se realiza como que ninguna marca puede
    ser anterior al envío —`entregada_en`, `vista_en` y `leida_en` son nulas o posteriores o
    iguales a `enviada_en`— y la no regresión del estado se resuelve en la capa de negocio,
    con CP-RF-34 y CP-RF-36 como verificación.
- **Estado: RESUELTA.** La invalidación de RF-07 la decidió el autor el 11 de septiembre
  de 2026: al regenerar, el código anterior recibe `usado_en` con la hora del reemplazo.
  Conserva la fila y su `generado_por` como rastro, y satisface el índice parcial. El
  atributo `usado_en` pasa a leerse como «dejó de ser canjeable, por uso o por reemplazo».
- **Fundamento:** el criterio no es nuevo: lo fija la propia nota de la Tabla 38 para las
  tres restricciones que ya reconoce inexpresables. Ninguna de las dos se omite: ambas se
  verifican, y la diferencia está en dónde. Ninguna entidad, atributo ni restricción del
  diccionario se agrega, suprime ni renombra, de modo que el Boundary 3 queda intacto.

## D-10 · ¿La operación de alta devuelve el código de activación en claro?
- **Dónde apareció:** RF-05 · RF-03 · CU-02 · CU-04 · Tabla 40
- **Qué dice el documento:** cinco pasajes, que no concuerdan entre sí.
  - Prosa que introduce la Tabla 40: «excluidos los que el resguardo impide exponer —la
    contraseña derivada y el código de activación **se devuelven nunca**, conforme a
    RNF-03 y RN-06—».
  - Fila `POST /docentes`: «recurso usuario y codigo_activacion con vence_en, **sin el
    código en claro**».
  - Fila `POST /usuarios/{id}/codigos-activacion`: «codigo_activacion con vence_en y **el
    código en claro, devuelto una sola vez**».
  - Filas `POST /alumnos` y `POST /alumnos/{id}/tutores`: «codigo_activacion», sin
    precisar.
  - Nota de la Tabla 40: «El código de activación se devuelve en claro una sola vez, **en
    la respuesta de la operación que lo genera o regenera**».
  - CU-02, paso 1: «**quien realizó el alta entrega el código** por el canal que la
    institución ya utiliza».
- **El conflicto:** `POST /docentes` **genera** el código (CU-04 paso 2 · RF-05). La nota
  manda devolverlo en claro en esa respuesta; la fila manda no hacerlo. Si no se devuelve,
  quien hizo el alta nunca lo conoce y el paso 1 de CU-02 no puede ocurrir: la única forma
  de obtener un código entregable sería regenerarlo en el acto, y CU-04 paso 4 reserva la
  regeneración para «cuando el anterior venció o se perdió».
- **Alternativas:**
  - **A.** Prevalecen la nota y CU-02: las tres operaciones de alta y la de regeneración
    devuelven el código en claro una sola vez. «Sin el código en claro» de la fila
    `POST /docentes` se corrige en el documento, y la prosa introductoria se lee como
    referida al código almacenado —su derivación—, que en efecto no se devuelve nunca.
  - **B.** Prevalece la fila: el alta no devuelve el código y quien la hace lo obtiene
    regenerándolo. Exige corregir la nota y CU-04 paso 4, y convierte cada alta en dos
    peticiones.
- **Consecuencia de cada una:** A hace ejecutable CU-02 tal como está escrito y exige
  corregir una fila. B exige corregir la nota, un caso de uso y el flujo de cuatro tareas
  críticas (TC-03, TC-08, TC-09, TC-15, TC-21).
- **Estado: RESUELTA · se adopta A** — decisión del autor, 11 de septiembre de 2026.
- **Fundamento:** la nota de la Tabla 40 y el paso 1 de CU-02 concuerdan entre sí y con el
  flujo de las tareas críticas; la fila de `POST /docentes` es la que queda aislada. Las tres
  operaciones de alta y la de regeneración devuelven el código en claro una sola vez, en el
  miembro `codigo` de `codigo_activacion`. La prosa introductoria de la Tabla 40 se lee como
  referida a la derivación almacenada, que en efecto no se devuelve nunca.
  **Pendiente de reposición documental:** corregir en el `.docx` la fila `POST /docentes`
  de la Tabla 40 —«sin el código en claro»— conforme a la nota de la misma tabla.

## D-11 · Formato del código de activación y cómo se lo localiza al canjearlo
- **Dónde apareció:** RF-05 · RF-06 · CU-02 · Tabla 38 · Tabla 40
- **Qué dice el documento:** la entidad almacena `codigo_hash varchar(60)` y «su derivación
  y no el valor, **del mismo modo que la contraseña**» (nota de la Tabla 40), es decir con
  bcrypt, cuya salida mide exactamente 60 caracteres. `POST /activaciones` recibe
  **únicamente** `codigo` y `contrasena` (Tabla 40): ni correo ni identificador.
- **Qué no dice:** el formato del código —largo, alfabeto—, ni cómo se encuentra la fila
  que corresponde al código presentado. bcrypt usa sal aleatoria: dos derivaciones del
  mismo valor difieren, de modo que el código presentado no se puede buscar por igualdad
  contra `codigo_hash`.
- **Por qué importa además:** `POST /activaciones` es una operación sin autenticar. El
  documento no prevé limitación de intentos, e incorporarla exigiría una dependencia que
  la Tabla 34 no consigna (Boundary 7). La resistencia a la adivinación depende entonces
  enteramente de la entropía del código.
- **Alternativas:**
  - **A.** Código aleatorio corto, bcrypt, y búsqueda recorriendo los códigos vigentes
    uno por uno. Literal con la nota, pero cada canje cuesta una comparación bcrypt por
    código pendiente: con noventa altas simultáneas del curso piloto, del orden de veinte
    segundos por petición.
  - **B.** Código en dos partes, `localizador-secreto`: el localizador son los primeros
    caracteres del `id` de la fila de `codigo_activacion`, y el secreto se deriva con
    bcrypt en `codigo_hash`. Localización por el identificador, una sola comparación
    bcrypt, derivación «del mismo modo que la contraseña», sin columna nueva. Ejemplo:
    `3F9A1C2E-K7PX9M4Q` —dieciocho caracteres, alfabeto sin ambigüedades, unos cuarenta
    bits de secreto—.
  - **C.** Derivación determinista con clave (HMAC-SHA256, 44 caracteres en base64) y
    búsqueda por igualdad. Rápida y simple, pero no es la derivación de la contraseña y se
    aparta de la letra de la nota.
- **Consecuencia de cada una:** A es literal y lenta, y la lentitud crece con la
  cantidad de altas pendientes. B es literal en la derivación y rápida, al costo de un
  código más largo de dictar. C es rápida y corta, y se aparta de la nota.
- **Estado: RESUELTA · se adopta B** — decisión del autor, 11 de septiembre de 2026.
- **Realización:** el código tiene la forma `LLLLLLLL-SSSSSSSS`. El localizador son los
  ocho primeros caracteres hexadecimales del `id` de la fila de `codigo_activacion`, que
  genera el motor de manera aleatoria. El secreto son ocho caracteres del alfabeto de
  Crockford —dígitos y mayúsculas sin I, L, O ni U, pensado para transcribirse a mano—, y
  se deriva con bcrypt en `codigo_hash`, del mismo modo que la contraseña. Al canjear se
  normaliza la entrada —mayúsculas, sin espacios ni guion, O por 0 e I o L por 1— porque el
  código se entrega «por el canal que la institución ya utiliza» y se transcribe a mano.
  El localizador no es secreto: la resistencia a la adivinación la dan los cuarenta bits
  del secreto, que con el costo de bcrypt y el vencimiento de siete días hacen inviable la
  búsqueda exhaustiva sin necesidad de limitar intentos.

## D-12 · ¿Se regenera el código de una cuenta ya activa? El borde entre RF-07 y RF-08
- **Dónde apareció:** RF-07 · RF-06 · RF-08 · CU-02 flujo B
- **Qué dice el documento:**
  - RF-07 (Must have): «regenerar el código de un alumno o tutor de sus cursos, y el
    directivo el de un docente, **cuando el anterior venció o se perdió**, invalidando el
    previo».
  - RF-08 (**Should have**): «restablecer la contraseña **mediante un código regenerado
    según RF-07**, sin requerir servicio de correo saliente». Tiene su propia operación,
    `POST /recuperaciones`, que no se construye.
  - CU-02 flujo alternativo B: «la recuperación de acceso de quien olvidó su contraseña
    **recorre este mismo flujo** con un código regenerado conforme a CU-04 o CU-05».
- **Qué no dice:** si RF-07 alcanza a la persona cuya cuenta ya está activa, ni si
  `POST /activaciones` acepta el código de una cuenta activa.
- **Por qué importa:** si RF-07 regenera para cuentas activas y `POST /activaciones` las
  acepta, la recuperación de contraseña queda funcionando por dos operaciones Must have: es
  RF-08 construido sin decisión adoptada, contra el Boundary 1. RF-06, tal como está
  construido, aceptaría hoy ese código.
- **Alternativas:**
  - **A.** RF-07 regenera sólo para cuentas pendientes —«el anterior venció o se perdió»
    se refiere al código de activación— y `POST /activaciones` rechaza la cuenta ya
    activa. La recuperación queda fuera del MVP hasta que RF-08 se adopte; quien olvida su
    contraseña no la recupera en la sesión de validación.
  - **B.** RF-07 regenera para cualquier cuenta no dada de baja, pero `POST /activaciones`
    sólo activa cuentas pendientes. El código de una cuenta activa queda a la espera de
    `POST /recuperaciones`: se genera y no sirve para nada en el MVP.
  - **C.** Se adopta RF-08 por decisión registrada y se construye `POST /recuperaciones`.
    Exige la marca de adopción, actualizar la clasificación de la Tabla 17 y consume horas
    fuera del presupuesto comprometido.
- **Estado: ABIERTA.** Bloquea RF-07 y obliga a revisar RF-06.

---

## Pendiente de decisión del autor

- **Partida G-04 de la Tabla 28.** El documento en su versión 5.2 corrigió el conteo a
  cuarenta operaciones autenticadas por cuatro roles, 160 casos, y conservó las 24 horas
  presupuestadas, por tratarse de una suite parametrizada sobre la columna de roles de la
  Tabla 27. Si se prefiere ampliar la partida, hay que recalcular el total de la Tabla 28
  y la red de la Tabla 31.
