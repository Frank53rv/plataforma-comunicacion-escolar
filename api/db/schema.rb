# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_10_120000) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "citext"
  enable_extension "pg_catalog.plpgsql"

  # Custom types defined in this database.
  # Note that some types may not work with other database engines. Be careful if changing database.
  create_enum "canal_enum", ["push", "aplicacion"]
  create_enum "causa_enum", ["servicio_no_disponible", "sin_acuse_del_cliente", "navegador_sin_soporte", "credencial_invalida"]
  create_enum "estado_anio_enum", ["vigente", "cerrado"]
  create_enum "estado_anuncio_enum", ["borrador", "programado", "publicado", "archivado", "eliminado"]
  create_enum "estado_conversacion_enum", ["activa", "solo_lectura"]
  create_enum "estado_curso_enum", ["vigente", "archivado"]
  create_enum "estado_suscripcion_enum", ["vigente", "invalida"]
  create_enum "estado_usuario_enum", ["pendiente", "activo", "dado_de_baja"]
  create_enum "rol_enum", ["directivo", "docente", "tutor", "alumno"]
  create_enum "tipo_conversacion_enum", ["grupal_tutores", "grupal_alumnos", "privada"]

  create_table "adjunto", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "anuncio_version_id"
    t.uuid "mensaje_id"
    t.string "nombre", limit: 160, null: false
    t.string "ruta", limit: 255, null: false
    t.integer "tamano", null: false
    t.string "tipo_mime", limit: 80, null: false
    t.check_constraint "(anuncio_version_id IS NULL) <> (mensaje_id IS NULL)", name: "chk_adjunto_una_sola_pertenencia"
    t.check_constraint "tamano > 0 AND tamano <= 5242880", name: "chk_adjunto_tamano_maximo"
    t.check_constraint "tipo_mime::text = 'application/pdf'::text", name: "chk_adjunto_solo_pdf"
  end

  create_table "alumno_curso", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "curso_id", null: false
    t.uuid "usuario_id", null: false
    t.date "vigente_desde", null: false
    t.date "vigente_hasta"
    t.index ["usuario_id", "curso_id"], name: "idx_alumno_curso_unico_vigente", unique: true, where: "(vigente_hasta IS NULL)"
  end

  create_table "anio_lectivo", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "abierto_en", null: false
    t.integer "anio", limit: 2, null: false
    t.datetime "cerrado_en"
    t.enum "estado", null: false, enum_type: "estado_anio_enum"
    t.index ["anio"], name: "index_anio_lectivo_on_anio", unique: true
    t.index ["estado"], name: "idx_anio_lectivo_unico_vigente", unique: true, where: "(estado = 'vigente'::estado_anio_enum)"
  end

  create_table "anuncio", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "autor_id", null: false
    t.datetime "creado_en", null: false
    t.datetime "eliminado_en"
    t.uuid "eliminado_por"
    t.enum "estado", null: false, enum_type: "estado_anuncio_enum"
    t.datetime "programado_para"
    t.index ["autor_id", "estado"], name: "index_anuncio_on_autor_id_and_estado"
    t.index ["programado_para"], name: "idx_anuncio_programado", where: "(estado = 'programado'::estado_anuncio_enum)"
  end

  create_table "anuncio_curso", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "anuncio_id", null: false
    t.uuid "curso_id", null: false
    t.index ["anuncio_id", "curso_id"], name: "index_anuncio_curso_on_anuncio_id_and_curso_id", unique: true
  end

  create_table "anuncio_version", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "anuncio_id", null: false
    t.text "cuerpo", null: false
    t.integer "numero_version", limit: 2, null: false
    t.datetime "publicado_en"
    t.string "titulo", limit: 160, null: false
    t.index ["anuncio_id", "numero_version"], name: "index_anuncio_version_on_anuncio_id_and_numero_version", unique: true
    t.index ["publicado_en"], name: "index_anuncio_version_on_publicado_en"
  end

  create_table "bitacora_envio", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.enum "causa", null: false, enum_type: "causa_enum"
    t.string "codigo_proveedor", limit: 80
    t.uuid "entrega_anuncio_id"
    t.datetime "ocurrido_en", null: false
    t.uuid "suscripcion_id"
    t.index ["ocurrido_en"], name: "index_bitacora_envio_on_ocurrido_en"
  end

  create_table "codigo_activacion", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "codigo_hash", limit: 60, null: false
    t.uuid "generado_por", null: false
    t.datetime "usado_en"
    t.uuid "usuario_id", null: false
    t.datetime "vence_en", null: false
    t.index ["usuario_id"], name: "idx_codigo_activacion_vigente_por_usuario", unique: true, where: "(usado_en IS NULL)"
  end

  create_table "conversacion", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "curso_id", null: false
    t.enum "estado", null: false, enum_type: "estado_conversacion_enum"
    t.enum "tipo", null: false, enum_type: "tipo_conversacion_enum"
    t.index ["curso_id", "tipo"], name: "idx_conversacion_unica_grupal_por_curso", unique: true, where: "(tipo = ANY (ARRAY['grupal_tutores'::tipo_conversacion_enum, 'grupal_alumnos'::tipo_conversacion_enum]))"
  end

  create_table "curso", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "anio_lectivo_id", null: false
    t.enum "estado", null: false, enum_type: "estado_curso_enum"
    t.string "nombre", limit: 60, null: false
    t.string "turno", limit: 20, null: false
    t.index ["anio_lectivo_id", "nombre"], name: "index_curso_on_anio_lectivo_id_and_nombre", unique: true
  end

  create_table "docente_curso", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "curso_id", null: false
    t.boolean "es_titular", default: false, null: false
    t.uuid "usuario_id", null: false
    t.date "vigente_desde", null: false
    t.date "vigente_hasta"
    t.index ["curso_id"], name: "idx_docente_curso_unico_titular_vigente", unique: true, where: "(es_titular AND (vigente_hasta IS NULL))"
    t.index ["usuario_id", "curso_id"], name: "idx_docente_curso_unico_vigente", unique: true, where: "(vigente_hasta IS NULL)"
  end

  create_table "entrega_anuncio", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "anuncio_version_id", null: false
    t.enum "canal", null: false, enum_type: "canal_enum"
    t.enum "causa_fallo", enum_type: "causa_enum"
    t.uuid "destinatario_id", null: false
    t.datetime "entregada_en"
    t.datetime "enviada_en", null: false
    t.datetime "leida_en"
    t.datetime "vista_en"
    t.index ["anuncio_version_id", "destinatario_id"], name: "idx_on_anuncio_version_id_destinatario_id_b32194f5e2", unique: true
    t.index ["destinatario_id", "leida_en"], name: "index_entrega_anuncio_on_destinatario_id_and_leida_en"
    t.check_constraint "(entregada_en IS NULL OR entregada_en >= enviada_en) AND (vista_en IS NULL OR vista_en >= enviada_en) AND (leida_en IS NULL OR leida_en >= enviada_en)", name: "chk_entrega_anuncio_monotonia"
  end

  create_table "mensaje", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "autor_id", null: false
    t.uuid "conversacion_id", null: false
    t.text "cuerpo", null: false
    t.datetime "enviado_en", null: false
    t.index ["conversacion_id", "enviado_en"], name: "index_mensaje_on_conversacion_id_and_enviado_en", order: { enviado_en: :desc }
  end

  create_table "participante", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "conversacion_id", null: false
    t.datetime "incorporado_en", null: false
    t.uuid "usuario_id", null: false
    t.index ["conversacion_id", "usuario_id"], name: "index_participante_on_conversacion_id_and_usuario_id", unique: true
  end

  create_table "preferencia", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.time "hora_fin", null: false
    t.time "hora_inicio", null: false
    t.boolean "recibir_mensajes", default: true, null: false
    t.uuid "usuario_id", null: false
    t.index ["usuario_id"], name: "index_preferencia_on_usuario_id", unique: true
  end

  create_table "puntero_lectura", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "actualizado_en", null: false
    t.uuid "conversacion_id", null: false
    t.uuid "ultimo_mensaje_id"
    t.uuid "usuario_id", null: false
    t.index ["conversacion_id", "usuario_id"], name: "index_puntero_lectura_on_conversacion_id_and_usuario_id", unique: true
  end

  create_table "suscripcion_push", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.datetime "creada_en", null: false
    t.enum "estado", null: false, enum_type: "estado_suscripcion_enum"
    t.datetime "invalidada_en"
    t.string "navegador", limit: 80, null: false
    t.string "token", limit: 255, null: false
    t.uuid "usuario_id", null: false
    t.index ["token"], name: "index_suscripcion_push_on_token", unique: true
    t.index ["usuario_id"], name: "idx_suscripcion_push_vigente", where: "(estado = 'vigente'::estado_suscripcion_enum)"
  end

  create_table "tutor_alumno", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "alumno_id", null: false
    t.uuid "tutor_id", null: false
    t.date "vigente_desde", null: false
    t.date "vigente_hasta"
    t.index ["tutor_id", "alumno_id"], name: "idx_tutor_alumno_unico_vigente", unique: true, where: "(vigente_hasta IS NULL)"
  end

  create_table "usuario", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "apellido", limit: 80, null: false
    t.string "contrasena_hash", limit: 60
    t.citext "correo", null: false
    t.datetime "creado_en", null: false
    t.boolean "credencial_provisional", default: false, null: false
    t.enum "estado", null: false, enum_type: "estado_usuario_enum"
    t.string "nombre", limit: 80, null: false
    t.enum "rol", null: false, enum_type: "rol_enum"
    t.index ["correo"], name: "index_usuario_on_correo", unique: true
    t.index ["rol", "estado"], name: "index_usuario_on_rol_and_estado"
  end

  add_foreign_key "adjunto", "anuncio_version"
  add_foreign_key "alumno_curso", "curso"
  add_foreign_key "alumno_curso", "usuario"
  add_foreign_key "anuncio", "usuario", column: "autor_id"
  add_foreign_key "anuncio", "usuario", column: "eliminado_por"
  add_foreign_key "anuncio_curso", "anuncio"
  add_foreign_key "anuncio_curso", "curso"
  add_foreign_key "anuncio_version", "anuncio", on_delete: :cascade
  add_foreign_key "bitacora_envio", "entrega_anuncio"
  add_foreign_key "bitacora_envio", "suscripcion_push", column: "suscripcion_id"
  add_foreign_key "codigo_activacion", "usuario"
  add_foreign_key "codigo_activacion", "usuario", column: "generado_por"
  add_foreign_key "conversacion", "curso"
  add_foreign_key "curso", "anio_lectivo"
  add_foreign_key "docente_curso", "curso"
  add_foreign_key "docente_curso", "usuario"
  add_foreign_key "entrega_anuncio", "anuncio_version"
  add_foreign_key "entrega_anuncio", "usuario", column: "destinatario_id"
  add_foreign_key "mensaje", "conversacion"
  add_foreign_key "mensaje", "usuario", column: "autor_id"
  add_foreign_key "participante", "conversacion"
  add_foreign_key "participante", "usuario"
  add_foreign_key "preferencia", "usuario"
  add_foreign_key "puntero_lectura", "conversacion"
  add_foreign_key "puntero_lectura", "mensaje", column: "ultimo_mensaje_id"
  add_foreign_key "puntero_lectura", "usuario"
  add_foreign_key "suscripcion_push", "usuario"
  add_foreign_key "tutor_alumno", "usuario", column: "alumno_id"
  add_foreign_key "tutor_alumno", "usuario", column: "tutor_id"
end
