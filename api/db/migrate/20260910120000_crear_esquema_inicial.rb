# Tabla 38 · Esquema físico: tipos, claves e índices · Boundary 3
# Las diecinueve entidades de la Tabla 21, sin agregar ni suprimir ninguna.
# Nombres en singular. turno como varchar(20).
# Las restricciones que no admiten expresión declarativa se verifican en la capa de negocio.
class CrearEsquemaInicial < ActiveRecord::Migration[8.1]
  def change
    enable_extension "citext"

    # Tabla 38, nota · los tipos enumerados se declaran en el motor y no como texto
    # libre, de modo que el conjunto de valores admisibles quede en el esquema.
    create_enum :rol_enum,                 %w[directivo docente tutor alumno]
    create_enum :estado_usuario_enum,      %w[pendiente activo dado_de_baja]
    create_enum :estado_anio_enum,         %w[vigente cerrado]
    create_enum :estado_curso_enum,        %w[vigente archivado]
    create_enum :estado_anuncio_enum,      %w[borrador programado publicado archivado eliminado]
    # Tabla 21 · «grupal de tutores, grupal de alumnos o privada»
    create_enum :tipo_conversacion_enum,   %w[grupal_de_tutores grupal_de_alumnos privada]
    create_enum :estado_conversacion_enum, %w[activa solo_lectura]
    create_enum :canal_enum,               %w[push aplicacion]
    # RF-37 · «indisponibilidad del servicio push, ausencia de acuse del cliente o falta de
    # soporte del navegador» · CU-14 E1 · «credencial inválida». Cerrado en esos cuatro.
    create_enum :causa_enum,               %w[indisponibilidad_del_servicio_push
                                              ausencia_de_acuse_del_cliente
                                              falta_de_soporte_del_navegador
                                              credencial_invalida]
    create_enum :estado_suscripcion_enum,  %w[vigente invalida]

    # --- usuario · RN-04 · RN-15 · RNF-03 ---
    create_table :usuario, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.string  :nombre,                 limit: 80,  null: false
      t.string  :apellido,               limit: 80,  null: false
      t.citext  :correo,                             null: false
      t.string  :contrasena_hash,        limit: 60,  null: false
      t.enum    :rol,                    enum_type: "rol_enum",            null: false
      t.enum    :estado,                 enum_type: "estado_usuario_enum", null: false
      t.boolean :credencial_provisional,             null: false
      t.datetime :creado_en,                         null: false
    end
    add_index :usuario, :correo, unique: true
    add_index :usuario, %i[rol estado]

    # --- codigo_activacion · RN-05 · RN-06 · RN-07 ---
    create_table :codigo_activacion, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid     :usuario_id,             null: false
      t.string   :codigo_hash, limit: 60, null: false
      t.datetime :vence_en,               null: false
      t.datetime :usado_en
      t.uuid     :generado_por,           null: false
    end
    add_foreign_key :codigo_activacion, :usuario, column: :usuario_id,   on_delete: :restrict
    add_foreign_key :codigo_activacion, :usuario, column: :generado_por, on_delete: :restrict
    # La parte expresable de «UNIQUE parcial (usuario_id) donde usado_en es nulo
    # y vence_en es futuro»: el predicado no admite la hora actual por no ser inmutable.
    add_index :codigo_activacion, :usuario_id, unique: true,
              where: "usado_en IS NULL", name: "idx_codigo_activacion_vigente_por_usuario"

    # --- preferencia · RF-33 · RN-24 ---
    create_table :preferencia, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid    :usuario_id,       null: false
      t.time    :hora_inicio,      null: false
      t.time    :hora_fin,         null: false
      t.boolean :recibir_mensajes, null: false
    end
    add_foreign_key :preferencia, :usuario, column: :usuario_id
    add_index :preferencia, :usuario_id, unique: true

    # --- anio_lectivo · RN-31 ---
    create_table :anio_lectivo, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.integer  :anio,       limit: 2, null: false
      t.enum     :estado,     enum_type: "estado_anio_enum", null: false
      t.datetime :abierto_en,           null: false
      t.datetime :cerrado_en
    end
    add_index :anio_lectivo, :anio, unique: true
    # RN-31 · existe un solo año lectivo en estado vigente
    add_index :anio_lectivo, :estado, unique: true,
              where: "estado = 'vigente'", name: "idx_anio_lectivo_unico_vigente"

    # --- curso · RN-26 ---
    create_table :curso, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid   :anio_lectivo_id,        null: false
      t.string :nombre, limit: 60,      null: false
      t.string :turno,  limit: 20,      null: false
      t.enum   :estado, enum_type: "estado_curso_enum", null: false
    end
    add_foreign_key :curso, :anio_lectivo, column: :anio_lectivo_id
    add_index :curso, %i[anio_lectivo_id nombre], unique: true

    # --- docente_curso · RN-13 · RF-15 ---
    create_table :docente_curso, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid    :usuario_id,    null: false
      t.uuid    :curso_id,      null: false
      t.boolean :es_titular,    null: false
      t.date    :vigente_desde, null: false
      t.date    :vigente_hasta
    end
    add_foreign_key :docente_curso, :usuario, column: :usuario_id
    add_foreign_key :docente_curso, :curso,   column: :curso_id
    add_index :docente_curso, :curso_id, unique: true,
              where: "es_titular AND vigente_hasta IS NULL",
              name: "idx_docente_curso_unico_titular_vigente"
    add_index :docente_curso, %i[usuario_id curso_id], unique: true,
              where: "vigente_hasta IS NULL",
              name: "idx_docente_curso_unico_vigente"

    # --- alumno_curso · RN-30 ---
    create_table :alumno_curso, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :usuario_id,    null: false
      t.uuid :curso_id,      null: false
      t.date :vigente_desde, null: false
      t.date :vigente_hasta
    end
    add_foreign_key :alumno_curso, :usuario, column: :usuario_id
    add_foreign_key :alumno_curso, :curso,   column: :curso_id
    # La unicidad por año lectivo derivado se resuelve en la capa de negocio conforme a
    # la nota de la Tabla 38, con CP-RF-13 como verificación.
    add_index :alumno_curso, %i[usuario_id curso_id], unique: true,
              where: "vigente_hasta IS NULL",
              name: "idx_alumno_curso_unico_vigente"

    # --- tutor_alumno · RN-29 · RN-12 ---
    create_table :tutor_alumno, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :tutor_id,      null: false
      t.uuid :alumno_id,     null: false
      t.date :vigente_desde, null: false
      t.date :vigente_hasta
    end
    add_foreign_key :tutor_alumno, :usuario, column: :tutor_id
    add_foreign_key :tutor_alumno, :usuario, column: :alumno_id
    # El límite de dos tutores vigentes por alumno se verifica en la capa de negocio
    # conforme a la nota de la Tabla 38, con CP-RF-14 como verificación.
    add_index :tutor_alumno, %i[tutor_id alumno_id], unique: true,
              where: "vigente_hasta IS NULL",
              name: "idx_tutor_alumno_unico_vigente"

    # --- anuncio · RN-16 · RN-20 · RF-18 ---
    create_table :anuncio, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid     :autor_id, null: false
      t.enum     :estado,   enum_type: "estado_anuncio_enum", null: false
      t.datetime :programado_para
      t.datetime :creado_en, null: false
      t.datetime :eliminado_en
      t.uuid     :eliminado_por
    end
    add_foreign_key :anuncio, :usuario, column: :autor_id
    add_foreign_key :anuncio, :usuario, column: :eliminado_por
    add_index :anuncio, %i[autor_id estado]
    add_index :anuncio, :programado_para,
              where: "estado = 'programado'", name: "idx_anuncio_programado"

    # --- anuncio_curso · RN-19 ---
    create_table :anuncio_curso, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :anuncio_id, null: false
      t.uuid :curso_id,   null: false
    end
    add_foreign_key :anuncio_curso, :anuncio, column: :anuncio_id
    add_foreign_key :anuncio_curso, :curso,   column: :curso_id
    add_index :anuncio_curso, %i[anuncio_id curso_id], unique: true

    # --- anuncio_version · RF-19 · RNF-04 ---
    create_table :anuncio_version, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid     :anuncio_id,         null: false
      t.integer  :numero_version, limit: 2, null: false
      t.string   :titulo, limit: 160, null: false
      t.text     :cuerpo,             null: false
      t.datetime :publicado_en,       null: false
    end
    add_foreign_key :anuncio_version, :anuncio, column: :anuncio_id, on_delete: :cascade
    add_index :anuncio_version, %i[anuncio_id numero_version], unique: true
    add_index :anuncio_version, :publicado_en

    # --- adjunto · RN-33 · RF-30 ---
    create_table :adjunto, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid    :anuncio_version_id
      t.uuid    :mensaje_id
      t.string  :nombre,    limit: 160, null: false
      t.string  :tipo_mime, limit: 80,  null: false
      t.integer :tamano,                null: false
      t.string  :ruta,      limit: 255, null: false
    end
    add_foreign_key :adjunto, :anuncio_version, column: :anuncio_version_id
    add_check_constraint :adjunto,
                         "(anuncio_version_id IS NULL) <> (mensaje_id IS NULL)",
                         name: "chk_adjunto_una_sola_pertenencia"
    add_check_constraint :adjunto, "tipo_mime = 'application/pdf'",
                         name: "chk_adjunto_solo_pdf"
    add_check_constraint :adjunto, "tamano <= 5242880",
                         name: "chk_adjunto_tamano_maximo"

    # --- entrega_anuncio · RN-32 · RF-34 · RF-36 ---
    create_table :entrega_anuncio, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid     :anuncio_version_id, null: false
      t.uuid     :destinatario_id,    null: false
      t.enum     :canal, enum_type: "canal_enum", null: false
      t.datetime :enviada_en,   null: false
      t.datetime :entregada_en
      t.datetime :vista_en
      t.datetime :leida_en
      t.enum     :causa_fallo, enum_type: "causa_enum"
    end
    add_foreign_key :entrega_anuncio, :anuncio_version, column: :anuncio_version_id
    add_foreign_key :entrega_anuncio, :usuario,         column: :destinatario_id
    add_index :entrega_anuncio, %i[anuncio_version_id destinatario_id], unique: true
    add_index :entrega_anuncio, %i[destinatario_id leida_en]
    # Ninguna marca es anterior al envío. La no regresión del estado que RN-32
    # compromete se verifica en la capa de negocio, con CP-RF-34 y CP-RF-36.
    add_check_constraint :entrega_anuncio,
                         "(entregada_en IS NULL OR entregada_en >= enviada_en) AND " \
                         "(vista_en IS NULL OR vista_en >= enviada_en) AND " \
                         "(leida_en IS NULL OR leida_en >= enviada_en)",
                         name: "chk_entrega_anuncio_monotonia"

    # --- conversacion · RF-25 · RN-26 ---
    create_table :conversacion, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid :curso_id, null: false
      t.enum :tipo,   enum_type: "tipo_conversacion_enum",   null: false
      t.enum :estado, enum_type: "estado_conversacion_enum", null: false
    end
    add_foreign_key :conversacion, :curso, column: :curso_id
    add_index :conversacion, %i[curso_id tipo], unique: true,
              where: "tipo IN ('grupal_de_tutores', 'grupal_de_alumnos')",
              name: "idx_conversacion_unica_grupal_por_curso"

    # --- participante · RN-23 · RF-29 ---
    create_table :participante, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid     :conversacion_id, null: false
      t.uuid     :usuario_id,      null: false
      t.datetime :incorporado_en,  null: false
    end
    add_foreign_key :participante, :conversacion, column: :conversacion_id
    add_foreign_key :participante, :usuario,      column: :usuario_id
    add_index :participante, %i[conversacion_id usuario_id], unique: true

    # --- mensaje · RF-28 · RN-23 ---
    create_table :mensaje, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid     :conversacion_id, null: false
      t.uuid     :autor_id,        null: false
      t.text     :cuerpo,          null: false
      t.datetime :enviado_en,      null: false
    end
    add_foreign_key :mensaje, :conversacion, column: :conversacion_id
    add_foreign_key :mensaje, :usuario,      column: :autor_id
    add_index :mensaje, [ :conversacion_id, :enviado_en ], order: { enviado_en: :desc }

    # --- puntero_lectura · RF-47 ---
    create_table :puntero_lectura, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid     :conversacion_id,  null: false
      t.uuid     :usuario_id,       null: false
      t.uuid     :ultimo_mensaje_id
      t.datetime :actualizado_en,   null: false
    end
    add_foreign_key :puntero_lectura, :conversacion, column: :conversacion_id
    add_foreign_key :puntero_lectura, :usuario,      column: :usuario_id
    add_foreign_key :puntero_lectura, :mensaje,      column: :ultimo_mensaje_id

    # Tabla 38 · adjunto: «FK a anuncio_version y a mensaje». La segunda se declara acá
    # porque la tabla mensaje se crea después que adjunto.
    add_foreign_key :adjunto, :mensaje, column: :mensaje_id
    add_index :puntero_lectura, %i[conversacion_id usuario_id], unique: true

    # --- suscripcion_push · RF-37 · RNF-11 ---
    create_table :suscripcion_push, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid     :usuario_id,        null: false
      t.string   :token,     limit: 255, null: false
      t.string   :navegador, limit: 80,  null: false
      t.enum     :estado, enum_type: "estado_suscripcion_enum", null: false
      t.datetime :creada_en,     null: false
      t.datetime :invalidada_en
    end
    add_foreign_key :suscripcion_push, :usuario, column: :usuario_id
    add_index :suscripcion_push, :token, unique: true
    add_index :suscripcion_push, :usuario_id,
              where: "estado = 'vigente'", name: "idx_suscripcion_push_vigente"

    # --- bitacora_envio · RNF-07 · RN-27 · RF-37 ---
    # No contiene el cuerpo del anuncio ni dato académico alguno.
    create_table :bitacora_envio, id: :uuid, default: -> { "gen_random_uuid()" } do |t|
      t.uuid     :entrega_anuncio_id
      t.uuid     :suscripcion_id
      t.enum     :causa, enum_type: "causa_enum", null: false
      t.string   :codigo_proveedor, limit: 80, null: false
      t.datetime :ocurrido_en, null: false
    end
    add_foreign_key :bitacora_envio, :entrega_anuncio,  column: :entrega_anuncio_id
    add_foreign_key :bitacora_envio, :suscripcion_push, column: :suscripcion_id
    # Índice para la purga a los doce meses que fija RNF-07
    add_index :bitacora_envio, :ocurrido_en
  end
end
