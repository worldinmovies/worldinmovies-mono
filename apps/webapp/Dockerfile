FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS build
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace manifests
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy webapp-specific manifests
COPY apps/webapp/package.json apps/webapp/tsconfig.json apps/webapp/vite.config.ts apps/webapp/.env ./apps/webapp/

# Install dependencies (only webapp workspace)
RUN pnpm install --frozen-lockfile --filter @worldinmovies/webapp

# Copy webapp source
COPY apps/webapp/ ./apps/webapp/

# Build
RUN pnpm --filter @worldinmovies/webapp run build

# production environment
FROM nginx:stable-alpine@sha256:0d3b80406a13a767339fbe2f41406d6c7da727ab89cf8fae399e81f780f814d1
ENV TZ=Europe/Stockholm
COPY --from=build /app/apps/webapp/dist /usr/share/nginx/html
RUN apk add --no-cache gettext openssl libcap && \
    adduser -D -u 1000 appuser && \
    setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx

ENV TMDB_UPSTREAM=tmdb:8020
COPY apps/webapp/nginx/sites-enabled/app.conf.template /etc/nginx/conf.d/default.conf.template

# Create writable runtime directory for config generated at startup
RUN mkdir -p /opt/webapp/run && chown appuser:appuser /opt/webapp/run && \
    envsubst '$TMDB_UPSTREAM' < /etc/nginx/conf.d/default.conf.template > /opt/webapp/run/default.conf && \
    P=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 16) && \
    printf 'admin:%s\n' "$(openssl passwd -apr1 "$P")" > /opt/webapp/run/.htpasswd && \
    echo "Build-time admin password: $P" && \
    ln -sf /opt/webapp/run/default.conf /etc/nginx/conf.d/default.conf && \
    ln -sf /opt/webapp/run/.htpasswd /etc/nginx/.htpasswd

USER appuser
EXPOSE 80

ENV ADMIN_PASSWORD=""

ENTRYPOINT ["sh", "-c", "if [ -n \"$ADMIN_PASSWORD\" ]; then printf 'admin:%s\\n' \"$(openssl passwd -apr1 \"$ADMIN_PASSWORD\")\" > /opt/webapp/run/.htpasswd; fi && envsubst '$TMDB_UPSTREAM' < /etc/nginx/conf.d/default.conf.template > /opt/webapp/run/default.conf && exec nginx -g 'daemon off;'"]
