# RF-01 Autenticación de usuarios · RF-06 Activación de cuenta · CU-01, CU-02
# Prueba: CP-RF-01 · CP-RF-06
#
# Tabla 40 · POST /sesiones y POST /activaciones responden con la misma forma:
# «token, vence_en, usuario con id, nombre, apellido, rol y credencial_provisional».
# La derivación de la contraseña no figura (RNF-03).
class RespuestaDeSesion
  def self.para(usuario)
    emitido = TokenDeSesion.emitir(usuario)

    {
      token: emitido[:token],
      vence_en: emitido[:vence_en],
      usuario: usuario.slice(:id, :nombre, :apellido, :rol, :credencial_provisional)
    }
  end
end
