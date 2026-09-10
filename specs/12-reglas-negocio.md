<!-- GENERADO desde TFG_entrega_5_Etapa4_v52.docx. NO EDITAR A MANO.
     La fuente de verdad es el documento de grado. Si este archivo y el
     documento discrepan, prevalece el documento (Context Spec, punto 4.2). -->

# Tabla 19 · Matriz de reglas de negocio

| Código | Regla de negocio | Descripción | Prioridad |
|---|---|---|---|
| RN-01 | Alta administrada | Nadie se auto-registra. El alta la realiza siempre otra persona con rol habilitado. | Alta |
| RN-02 | Atribuciones del directivo | El directivo crea el año lectivo y los cursos, da de alta a los docentes y les asigna cursos. | Alta |
| RN-03 | Atribuciones del docente | El docente da de alta a los alumnos y tutores de sus cursos. | Alta |
| RN-04 | Rol único por persona | Una persona tiene exactamente un rol. Quien cumple dos funciones en la institución opera con dos cuentas separadas. | Alta |
| RN-05 | Código de activación | El alta genera un código de un solo uso con vencimiento de siete días, entregado por el canal que la institución ya utiliza. | Alta |
| RN-06 | Canje del código | La persona activa su cuenta con el código y define su propia contraseña; el código se invalida al usarse. | Alta |
| RN-07 | Cadena de regeneración | El docente regenera los códigos de los alumnos y tutores de sus cursos; el directivo, los de los docentes. | Alta |
| RN-08 | Recuperación de la cuenta directiva | El sistema no dispone de recuperación autónoma de la cuenta directiva. Se resuelve reponiendo la credencial provisional por variable de entorno. | Media |
| RN-09 | Cambio de credencial provisional | Toda credencial provisional debe cambiarse en el primer acceso; hasta entonces ninguna otra operación se habilita. | Alta |
| RN-10 | Potestad de baja | La baja de un alumno o un tutor la ejecuta el directivo o el docente titular del curso. Los demás docentes no tienen esa atribución. | Alta |
| RN-11 | Baja lógica | Toda baja es lógica: revoca el acceso y conserva la totalidad del historial asociado. | Alta |
| RN-12 | Restricción de baja de tutor | No se puede dar de baja a un tutor que mantenga al menos un alumno activo en cualquier curso. | Media |
| RN-13 | Desvinculación de docente | El directivo desvincula y da de baja a los docentes. Si el docente era titular, la desvinculación exige designar otro titular en el mismo acto. | Alta |
| RN-14 | Conservación de la autoría | Los anuncios y mensajes de una persona dada de baja se conservan con su autoría histórica, junto con sus constancias asociadas. | Alta |
| RN-15 | Acceso mediado | El acceso a datos académicos exige autenticación y rol autorizado, sobre los cuatro roles definidos. | Alta |
| RN-16 | Emisor de los anuncios | Los anuncios los publica el docente, dirigidos a los tutores y alumnos de sus cursos. | Alta |
| RN-17 | Momento de envío | Los anuncios se envían al publicarse, o en la hora programada por el docente. | Media |
| RN-18 | Carácter no configurable del anuncio | Los anuncios ignoran el horario de disponibilidad y las preferencias del destinatario: son comunicación institucional. La interfaz debe declararlo de forma visible. | Alta |
| RN-19 | Momento de resolución de destinatarios | Los destinatarios se resuelven en cada publicación efectiva, no en la redacción. Quien ingresa al curso después no recibe publicaciones anteriores. | Alta |
| RN-20 | Borrado lógico del anuncio | El borrado de un anuncio es lógico, con registro de autor y fecha, y conserva las filas de entrega. | Alta |
| RN-21 | Visibilidad de las constancias | El docente ve, por anuncio, cuántos leyeron sobre el total y la nómina de quiénes no. Tutores y alumnos no ven la constancia de nadie más. | Alta |
| RN-22 | Supervisión directiva de anuncios | El directivo accede a los anuncios de todos los cursos del año lectivo vigente y a su estado agregado de entrega y lectura. | Media |
| RN-23 | Restricción de participación | Un usuario solo participa en conversaciones de cursos a los que está vinculado. | Alta |
| RN-24 | Diferimiento, no descarte | Los mensajes de conversación respetan el horario de disponibilidad y las preferencias del destinatario; fuera de la franja se difieren, no se descartan. Nada se silencia. | Alta |
| RN-25 | Declaración de la supervisión | La supervisión directiva de conversaciones, cuando se habilite, debe declararse de forma visible y permanente a todos los participantes. | Media |
| RN-26 | Cierre del año lectivo | Al cerrar el año lectivo, los cursos y sus conversaciones quedan archivados en solo lectura; el alumno conserva su cuenta y cambia de vinculación. | Media |
| RN-27 | Retención | Anuncios, mensajes y sus filas de entrega se conservan el año lectivo en curso más uno. La bitácora técnica de fallos de envío, doce meses. | Alta |
| RN-28 | Fuente de verdad única | La base de datos es la única fuente de verdad. El cliente no persiste historial en el navegador. | Alta |
| RN-29 | Límite de tutores por alumno | Un alumno admite hasta dos tutores vinculados de manera simultánea. La vinculación de un tercero se rechaza mientras los dos anteriores permanezcan vigentes. | Alta |
| RN-30 | Pertenencia única a curso | Un alumno pertenece a un solo curso vigente dentro de un mismo año lectivo. | Alta |
| RN-31 | Año lectivo único vigente | Existe un solo año lectivo en estado vigente. La apertura del siguiente exige el cierre del anterior. | Alta |
| RN-32 | Registro monótono, idempotente e inmutable de la constancia | Los estados de una entrega no retroceden; la reemisión de un evento ya registrado no altera su marca de tiempo original; y la constancia, una vez registrada, no se modifica con posterioridad. | Alta |
| RN-33 | Formato y tamaño del archivo adjunto | El intercambio de archivos se limita al formato PDF, con un tamaño máximo de 5 MB por archivo y hasta tres archivos por anuncio o mensaje. Todo otro formato, todo archivo que supere ese tamaño y toda publicación que exceda esa cantidad se rechazan. | Media |

> Nota. La autorregulación del horario de envío por parte del docente constituye una práctica operativa de la institución y no una restricción verificable del sistema; por esa razón no se consigna como regla de negocio. La prioridad expresa la criticidad de la regla para la integridad del dominio, y no coincide necesariamente con la prioridad MoSCoW del requisito que la implementa.
