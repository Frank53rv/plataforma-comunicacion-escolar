# Documentación de despliegue del entorno de demostración

Realiza el procedimiento de la **Tabla 35** y es el instrumento de verificación de
**RNF-19**: el entorno completo se levanta mediante contenedores a partir del
repositorio, **sin edición manual de archivos**. La única intervención admitida es la
carga de valores en el archivo de variables de entorno.

Los ocho pasos se completan sobre un repositorio recién clonado. Esa es la condición de
aceptación de **CP-RNF-19**.

## Requisitos previos

El equipo de desarrollo es el de la Tabla 32: Windows con el subsistema para Linux en su
versión 2. Conforme al punto 4.3, el motor de contenedores y la herramienta de
composición se instalan **dentro de la distribución del subsistema** y no mediante la
aplicación de escritorio, para evitar una capa adicional de virtualización sobre un
equipo que además debe sostener el entorno mientras se ejecutan las mediciones de
CP-RNF-08, CP-RNF-09 y CP-RNF-10.

```bash
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"    # cerrá y volvé a abrir la sesión
```

El código del proyecto reside en el sistema de archivos de la distribución Linux y **no**
en el de Windows montado a través de él: el acceso por el montaje degrada de manera
sensible el tiempo de construcción y de ejecución de las pruebas (punto 4.3).

---

## Paso 1 · Clonar el repositorio

```bash
git clone <url-del-repositorio> plataforma-comunicacion-escolar
cd plataforma-comunicacion-escolar
```

**Verificación:** el árbol de carpetas coincide con la **Figura 18**.

```
plataforma-comunicacion-escolar/
├── api/                        interfaz de programación
│   ├── app/
│   │   ├── identidad_acceso/       módulo A
│   │   ├── estructura_academica/   módulo B
│   │   ├── anuncios/               módulo C
│   │   ├── mensajeria/             módulo D
│   │   ├── notificaciones/         módulo E
│   │   └── compartido/             errores (Tabla 24), autorización
│   └── spec/                       pruebas CP-RF y CP-RNF
├── cliente/                    cliente web
│   ├── paneles/                    una carpeta por rol (RF-40)
│   ├── anuncios/                   bandeja y detalle (RF-39)
│   ├── conversacion/
│   ├── preferencias/
│   ├── comun/                      manifiesto y service worker
│   └── tests/
├── compose.yaml
├── .env.example                variables de la Tabla 30
├── openapi/                    contrato de la Tabla 18
├── specs/                      Context, Boundary y Quality Spec
└── docs/                       despliegue y manual
```

## Paso 2 · Completar las variables de entorno

```bash
cp .env.example .env
```

Se editan **únicamente** los valores de `.env`. Ningún archivo del proyecto se modifica.

**Verificación:** ninguna variable de la Tabla 30 queda sin valor. Son quince, en trece
filas de la tabla:

| Variable | Qué provee |
|---|---|
| `DATABASE_URL` | Cadena de conexión al motor, con credenciales propias de la instalación |
| `RAILS_MASTER_KEY` | Clave de descifrado de las credenciales cifradas del framework |
| `JWT_SECRET_KEY` | Clave de firma y verificación del token de sesión |
| `JWT_EXPIRACION_HORAS` | Vigencia del token, no superior a veinticuatro horas |
| `DIRECTIVO_CORREO` | Identificación de la cuenta directiva semilla |
| `DIRECTIVO_CREDENCIAL_PROVISIONAL` | Credencial provisional de la cuenta directiva |
| `FCM_PROJECT_ID` | Identificación del proyecto en el servicio de notificaciones push |
| `FCM_CREDENCIAL_JSON` | Credencial de servicio del proveedor de push |
| `VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` | Par de claves de identificación del emisor |
| `APP_HOST` | Nombre de dominio con el que el entorno se expone |
| `CORS_ORIGENES` | Orígenes autorizados a consumir la interfaz desde el navegador |
| `RETENCION_BITACORA_MESES` | Plazo de conservación de la bitácora técnica de fallos |
| `ADJUNTO_TAMANO_MAXIMO_MB` · `ADJUNTO_CANTIDAD_MAXIMA` | Límites del archivo adjunto |

`RAILS_MASTER_KEY` es el contenido de `api/config/master.key`, que **no se versiona**.
La separación entre el archivo de ejemplo y el de valores efectivos es el control de
segregación de credenciales que prescribe ISO/IEC 27001 (nota de la Tabla 30).

## Paso 3 · Levantar los tres servicios

```bash
docker compose up -d --build
docker compose ps
```

**Verificación:** los tres contenedores de la Tabla 34 alcanzan estado saludable sin
edición manual de ningún archivo.

| Servicio | Tecnología | Función |
|---|---|---|
| `db` | PostgreSQL 18 | Único almacén: datos de negocio, cola de trabajos y publicación-suscripción |
| `api` | Rails 8.1 en modo interfaz, con ActionCable en el mismo proceso | Persistencia, autenticación, control de acceso, reglas de negocio y motor de notificaciones |
| `cliente` | React 19 construido con Vite 8 y servido por nginx | Interfaz de operación para los cuatro roles |

## Paso 4 · Migraciones y datos de prueba

```bash
docker compose exec api bin/rails db:prepare
docker compose exec api bin/rails db:seed      # pendiente: ver la advertencia de abajo
```

> **Pendiente.** El archivo de datos de prueba con el volumen de RNF-09 todavía no
> existe: requiere los anuncios, las entregas, los mensajes y la bitácora de los
> módulos C, D y E, que se construyen en los incrementos 2 y 3. Hasta entonces este paso
> sólo aplica las migraciones.

**Verificación:** el esquema corresponde al diccionario de la Tabla 14 —diecinueve
entidades— y el volumen al declarado en RNF-09: un año lectivo cerrado y uno vigente,
184 cuentas, 400 anuncios, 36.000 filas de entrega, 16.000 mensajes en cuatro
conversaciones y 2.000 registros de bitácora de envío.

Los datos son **ficticios**. El punto 1.7 obliga al resguardo de la información y el 1.6
declara que el entorno opera con datos de prueba (Boundary 8).

Se contrasta con:

```bash
./bin/verificar          # la compuerta «esquema» compara contra la Tabla 27
```

## Paso 5 · Credencial provisional de la cuenta directiva

El sistema **no dispone de recuperación autónoma de la cuenta directiva** (RN-08): no
existe una instancia superior dentro del sistema que regenere su código. Se resuelve
reponiendo la credencial provisional por variable de entorno.

Se cargan `DIRECTIVO_CORREO` y `DIRECTIVO_CREDENCIAL_PROVISIONAL` en `.env` y se
reinicia el servicio.

**Verificación:** el primer acceso exige el cambio de credencial y **ninguna otra
operación se habilita** hasta que el cambio se complete, conforme a CP-RF-43 y RN-09.

## Paso 6 · Túnel y certificado

```bash
cloudflared tunnel --url http://localhost:8080
```

El túnel corre como proceso auxiliar junto a la composición (Tabla 34) y expone el
entorno sobre HTTPS con certificado válido, sin abrir puertos del equipo. El valor
asignado se carga en `APP_HOST` y en `CORS_ORIGENES`.

**Verificación:** la interfaz responde sobre HTTPS y rechaza la petición en texto plano,
conforme a CP-RNF-06.

La exposición con certificado válido es **condición** de dos cosas: de que RNF-06 sea
verificable y de que las notificaciones push web funcionen (RNF-19).

## Paso 7 · Registrar el cliente en el dispositivo de prueba

Se abre el dominio asignado en el dispositivo, se agrega a la pantalla de inicio y se
concede el permiso de notificaciones.

**Verificación:** la suscripción push queda registrada y el aviso llega al dispositivo.

Si el navegador no admite service workers, el aviso se presenta **dentro de la
aplicación** y ese renderizado registra el estado entregada (CU-14 flujo A). No
constituye un fallo del sistema (punto 1.6).

## Paso 8 · Colección de validación

```bash
docker compose exec api bin/rails routes > api/tmp/rutas.txt
./bin/verificar
```

**Verificación:** diferencia nula entre enrutador, archivo OpenAPI e inventario de la
Tabla 18, conforme a CP-RNF-17. La compuerta `contrato` contrasta los tres sentidos.

---

## Antes de integrar cualquier rama

No hay integración continua: el punto 4.5 lo declara de forma expresa. Las ocho
compuertas son la condición de integración que la reemplaza, conforme al Quality Spec de
la Tabla 26.

```bash
docker compose exec api bundle exec rspec              # genera api/coverage/.last_run.json
docker compose exec api bin/rails routes > api/tmp/rutas.txt
docker compose exec api bundle exec rubocop --format json --out tmp/rubocop.json
(cd cliente && npx eslint . -f json -o tmp/eslint.json)
./bin/verificar
```

Para que no dependa de la memoria, se instala el gancho:

```bash
git config core.hooksPath hooks
```

## Copias de seguridad

El volumen `datos_postgres` conserva la base entre reinicios. Para una copia:

```bash
docker compose exec db pg_dump -U plataforma plataforma_desarrollo > copia.sql
```

La retención que fijan RN-27 y RNF-07 es distinta según el dato: los de negocio se
conservan el año lectivo en curso más uno; la bitácora técnica de fallos de envío, doce
meses desde cada registro, con independencia del año lectivo, por contener datos
técnicos y ningún dato académico.
