# syntax=docker/dockerfile:1
#
# Schulz Döner Control — web (SPA) image.
# Build context MUST be the `web/` directory. Build from the repo root with:
#   docker build -f web/Dockerfile web
#
# ── build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# VITE_API_BASE is baked at build time. Leave EMPTY for the default same-origin
# deployment (the SPA calls relative /api/... which nginx proxies). Set to an
# absolute API origin only for a separate-origin deployment.
ARG VITE_API_BASE=""
ENV VITE_API_BASE=$VITE_API_BASE

# pnpm via corepack, pinned by the package.json "packageManager" field.
RUN corepack enable

# Install with the lockfile only first, so the dependency layer caches across
# source-only changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# ── runtime stage ────────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

# Only substitute ${API_UPSTREAM} in the template; leave nginx's own $-variables alone.
ENV API_UPSTREAM="http://api:8080" \
    NGINX_ENVSUBST_FILTER="^API_UPSTREAM$"

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
