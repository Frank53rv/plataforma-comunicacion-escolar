# Be sure to restart your server when you modify this file.

# Configure parameters to be partially matched (e.g. passw matches password) and filtered from the log file.
# Use this to limit dissemination of sensitive information.
# See the ActiveSupport::ParameterFilter documentation for supported notations and behaviors.
Rails.application.config.filter_parameters += [
  :passw, :email, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn, :cvv, :cvc,
  # Los nombres de campo son los del diccionario de la Tabla 21, en castellano, y los
  # filtros por omisión del framework no los reconocen. RNF-03 y el punto 1.7: ninguna
  # contraseña, código de activación ni dato personal —correo, nombre, apellido, muchos
  # de ellos de menores— queda en claro en la bitácora.
  :contrasena, :codigo, :correo, :nombre, :apellido
]
