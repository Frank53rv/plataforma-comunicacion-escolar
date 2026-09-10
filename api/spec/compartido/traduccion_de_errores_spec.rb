# Quality Spec, Tabla 37 · «Un único manejador central que traduce toda excepción al
# formato de la Tabla 35. Ningún controlador emite un cuerpo de error propio.»
# Tabla 39 · respuesta de error conforme a RFC 9457 con los miembros de la norma más
# «codigo» y «regla».
#
# El controlador es anónimo: no incorpora ninguna ruta al enrutador, de modo que el
# inventario de la Tabla 27 permanece intacto (Boundary 4).
#
# Prueba: CP-RNF-17
require "rails_helper"

RSpec.describe ApplicationController, type: :controller do
  controller do
    # La autorización deniega por omisión: acá se declara para que lo que se ejercite
    # sea la traducción del error y no el control de acceso, que verifica CP-RF-02.
    autoriza :no_habilitado, :conflicto, :registro_ausente, :parametro_faltante,
             :falla_no_prevista, roles: Autorizacion::SIN_AUTENTICAR

    def no_habilitado    = raise(ErrorDeDominio::NoHabilitado)
    def conflicto        = raise(ErrorDeDominio::ConflictoDeRegla.new(regla: "RN-31", detalle: "Ya existe un año lectivo vigente."))
    def registro_ausente = raise(ActiveRecord::RecordNotFound)
    def parametro_faltante = raise(ActionController::ParameterMissing.new(:correo))
    def falla_no_prevista  = raise(RuntimeError, "detalle interno que no debe salir")
  end

  before do
    routes.draw do
      get "no_habilitado"      => "anonymous#no_habilitado"
      get "conflicto"          => "anonymous#conflicto"
      get "registro_ausente"   => "anonymous#registro_ausente"
      get "parametro_faltante" => "anonymous#parametro_faltante"
      get "falla_no_prevista"  => "anonymous#falla_no_prevista"
    end
  end

  def cuerpo = JSON.parse(response.body)

  it "traduce el rechazo por rol o vinculación al 403 de la Tabla 35" do
    get :no_habilitado

    expect(response).to have_http_status(403)
    expect(response.media_type).to eq("application/problem+json")
    expect(cuerpo).to include("title" => "No habilitado", "status" => 403, "codigo" => "no_habilitado")
    expect(cuerpo).to have_key("detail")
    expect(cuerpo).to have_key("instance")
  end

  it "consigna el código de la regla en el 409, como la Tabla 35 exige" do
    get :conflicto

    expect(response).to have_http_status(409)
    expect(cuerpo["regla"]).to eq("RN-31")
    expect(cuerpo["codigo"]).to eq("conflicto_de_regla")
  end

  it "traduce el registro ausente al 404 de recurso ajeno a las vinculaciones" do
    get :registro_ausente

    expect(response).to have_http_status(404)
    expect(cuerpo["codigo"]).to eq("no_encontrado")
  end

  it "traduce la petición mal formada al 422 de datos inaceptables" do
    get :parametro_faltante

    expect(response).to have_http_status(422)
    expect(cuerpo["codigo"]).to eq("datos_inaceptables")
  end

  it "responde 500 sin revelar detalle interno, conforme al Boundary 6" do
    get :falla_no_prevista

    expect(response).to have_http_status(500)
    expect(cuerpo["detail"]).to eq("No fue posible completar la operación.")
    expect(response.body).not_to include("detalle interno que no debe salir")
    expect(response.body).not_to include("RuntimeError")
  end

  it "omite el miembro «regla» cuando el rechazo no proviene de una regla del dominio" do
    get :no_habilitado

    expect(cuerpo).not_to have_key("regla")
  end
end
