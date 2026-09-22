# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# VITE_* values are baked into the bundle at build time (see .env.example).
# Leave VITE_API_URL empty so the app calls /api on its own origin and nginx
# forwards it to the Go API (no CORS needed).
ARG VITE_API_URL=
ARG VITE_USE_MOCK=false
ENV VITE_API_URL=$VITE_API_URL \
    VITE_USE_MOCK=$VITE_USE_MOCK
RUN npm run build

# ---- run ----
FROM nginx:1.27-alpine
# Where nginx forwards /api/* at runtime. Override with -e API_UPSTREAM=...
# (scheme + host + port, no trailing slash).
ENV API_UPSTREAM=http://api:8080
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
