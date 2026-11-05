cd "$(dirname "$0")/../.."
docker compose exec -T api bin/rails runner '
ids = Usuario.where("correo LIKE ?", "%@e2e.test").pluck(:id)
CodigoActivacion.where(usuario_id: ids).delete_all
cursos = Curso.where("nombre LIKE ?", "E2E%"); cids = cursos.pluck(:id)
convs = Conversacion.where(curso_id: cids).pluck(:id)
Mensaje.where(conversacion_id: convs).delete_all; Participante.where(conversacion_id: convs).delete_all; Conversacion.where(id: convs).delete_all
an = Anuncio.where("id IN (SELECT anuncio_id FROM anuncio_version WHERE titulo LIKE ?)", "Aviso E2E%").pluck(:id)
vs = AnuncioVersion.where(anuncio_id: an).pluck(:id); BitacoraEnvio.where(entrega_anuncio_id: EntregaAnuncio.where(anuncio_version_id: vs).select(:id)).delete_all
EntregaAnuncio.where(anuncio_version_id: vs).delete_all; AnuncioCurso.where(anuncio_id: an).delete_all; AnuncioVersion.where(id: vs).delete_all; Anuncio.where(id: an).delete_all
EntregaAnuncio.where(destinatario_id: ids).delete_all
Mensaje.where(autor_id: ids).delete_all; Participante.where(usuario_id: ids).delete_all
TutorAlumno.where(alumno_id: ids).or(TutorAlumno.where(tutor_id: ids)).delete_all
AlumnoCurso.where(usuario_id: ids).delete_all; DocenteCurso.where(usuario_id: ids).or(DocenteCurso.where(curso_id: cids)).delete_all
Preferencia.where(usuario_id: ids).delete_all; SuscripcionPush.where(usuario_id: ids).delete_all
Curso.where(id: cids).delete_all; Usuario.where(id: ids).delete_all
Preferencia.where(usuario_id: Usuario.where("correo LIKE ?", "%@datos-de-prueba.test").select(:id)).delete_all
puts "limpio: usuarios e2e=#{Usuario.where("correo LIKE ?", "%@e2e.test").count} cursos e2e=#{Curso.where("nombre LIKE ?", "E2E%").count}"; puts DatosDePrueba.cargar.inspect' 2>&1 | tail -2
