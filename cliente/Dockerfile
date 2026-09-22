# Tabla 45 · Cliente web: React 19 construido con Vite 8 y servido por nginx.
# Archivos estáticos, sin renderizado en el servidor.
FROM node:22-slim AS construccion
WORKDIR /cliente
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Tabla 30 · valores de construcción del cliente: es estático, no lee el entorno al ejecutarse.
ARG VITE_FCM_API_KEY
ARG VITE_FCM_PROJECT_ID
ARG VITE_FCM_SENDER_ID
ARG VITE_FCM_APP_ID
ARG VITE_VAPID_PUBLIC_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=construccion /cliente/dist /usr/share/nginx/html
EXPOSE 80
