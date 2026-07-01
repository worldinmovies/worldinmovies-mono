FROM node:22-alpine AS build
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
FROM nginx:stable-alpine
ENV TZ=Europe/Stockholm
COPY --from=build /app/apps/webapp/dist /usr/share/nginx/html
# new
RUN apk add --no-cache gettext openssl

COPY apps/webapp/nginx/sites-enabled/app.conf.template /etc/nginx/conf.d/default.conf.template

EXPOSE 80

#CMD ["nginx", "-g", "daemon off;"]
ENTRYPOINT ["sh", "-c", "if [ ! -f /etc/nginx/.htpasswd ]; then P=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 16); printf 'admin:%s\\n' \"$(openssl passwd -apr1 \"$P\")\" > /etc/nginx/.htpasswd; echo \"Admin password: $P\"; fi && envsubst '$TMDB_UPSTREAM' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && exec nginx -g 'daemon off;'"]
