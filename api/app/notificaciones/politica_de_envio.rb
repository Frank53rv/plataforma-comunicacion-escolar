# RF-37 Degradación ante fallo de entrega · CU-14 · RNF-11, RNF-12
# Prueba: CP-RF-37
#
# RF-37 pide degradar ante «ausencia de acuse del cliente», y RNF-12 reintentar desde la
# cola los envíos fallidos por causa transitoria. El documento no fija cuánto se espera el
# acuse ni cuántos reintentos se admiten: son los valores de esta política.
module PoliticaDeEnvio
  # Tiempo que se espera el acuse del cliente antes de degradar a aviso en la aplicación.
  ESPERA_DE_ACUSE = 15.minutes

  # Espera antes de cada reintento por causa transitoria. Agotados, se degrada.
  REINTENTOS = [ 1.minute, 5.minutes, 15.minutes ].freeze
end
