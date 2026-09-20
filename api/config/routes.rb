# Tabla 27 · Inventario de endpoints · RNF-17 · Boundary 4
# Ninguna ruta fuera de las 43 que la tabla declara. El prefijo es el de la Tabla 39.
# La compuerta `contrato` de bin/verificar contrasta este archivo contra el inventario
# y contra openapi/openapi.yaml, con diferencia nula en los tres sentidos.
Rails.application.routes.draw do
  scope "/api/v1", defaults: { format: :json } do
    # CU-01 · Autenticarse · RF-01
    post   "sesiones", to: "sesiones#crear"
    delete "sesiones", to: "sesiones#destruir"

    # CU-02 · Activar cuenta con código · RF-06, RF-43
    post  "activaciones",           to: "activaciones#crear"
    patch "usuarios/me/contrasena", to: "usuarios#cambiar_contrasena"

    # CU-04 · Administrar docentes y asignaciones · RF-03, RF-05, RF-15, RF-44
    post   "docentes",                       to: "docentes#crear"
    delete "docentes/:id",                   to: "docentes#destruir"
    post   "cursos/:id/docentes",            to: "vinculaciones_docentes#crear"
    delete "cursos/:id/docentes/:usuario_id", to: "vinculaciones_docentes#destruir"

    # CU-05 · Administrar alumnos y tutores · RF-04, RF-05, RF-09
    post   "alumnos",             to: "alumnos#crear"
    post   "alumnos/:id/tutores", to: "tutores_de_alumno#crear"
    delete "alumnos/:id",         to: "alumnos#destruir"
    delete "tutores/:id",         to: "tutores#destruir"

    # CU-04, CU-05 · Regeneración del código de activación · RF-07
    post "usuarios/:id/codigos-activacion", to: "codigos_activacion#crear"

    # CU-03 · Administrar año lectivo y cursos · RF-11, RF-12
    post  "anios-lectivos", to: "anios_lectivos#crear"
    get   "anios-lectivos", to: "anios_lectivos#index"
    post  "cursos",         to: "cursos#crear"
    get   "cursos",         to: "cursos#index"
    patch "cursos/:id",     to: "cursos#actualizar"

    # CU-06 · Publicar anuncio · RF-17 · CU-08 · Eliminar anuncio · RF-20
    # CU-09 · Consultar anuncios e historial · RF-22
    post   "anuncios",     to: "anuncios#crear"
    delete "anuncios/:id", to: "anuncios#destruir"
    get    "anuncios",     to: "anuncios#index"
    get    "anuncios/:id", to: "anuncios#mostrar"

    # CU-11 · Consultar constancias de lectura · RF-23
    get "anuncios/:id/constancias", to: "anuncios#constancias"

    # CU-15 · Supervisar estado de la comunicación · RF-45
    get "supervision/cursos", to: "supervision#cursos"

    # CU-12 · Participar en conversación · RF-25, RF-28
    get  "cursos/:id/conversaciones",  to: "conversaciones#del_curso"
    get  "conversaciones",             to: "conversaciones#index"
    get  "conversaciones/:id/mensajes", to: "mensajes#index"
    post "conversaciones/:id/mensajes", to: "mensajes#crear"

    # CU-13 · Configurar preferencias · RF-33
    get "usuarios/me/preferencias", to: "preferencias#mostrar"
    put "usuarios/me/preferencias", to: "preferencias#actualizar"

    # CU-14 · Entregar notificación · RF-34
    post "entregas/acuses", to: "entregas#acusar"

    # CU-10 · Registrar vista y lectura · RF-35, RF-36
    post "entregas/vistas",   to: "entregas#ver"
    post "entregas/lecturas", to: "entregas#leer"
  end
end
