# Tabla 45 · Interfaz de programación: Ruby on Rails 8.1 en modo interfaz, con
# ActionCable en el mismo proceso. Contenedor propio.
FROM ruby:4.0-slim

ENV LANG=C.UTF-8 \
    BUNDLE_PATH=/usr/local/bundle

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential libpq-dev libyaml-dev git curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /api

# Las dependencias se resuelven desde el archivo de bloqueo versionado, de modo que la
# construcción sea reproducible sin edición manual de ningún archivo (RNF-19).
COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY . .

EXPOSE 3000
# RNF-19 · el entorno se levanta sin intervención manual: el archivo de PID que deja un
# apagado no limpio en el directorio montado no impide el arranque siguiente.
CMD ["sh", "-c", "rm -f tmp/pids/server.pid && exec bin/rails server -b 0.0.0.0 -p 3000"]
