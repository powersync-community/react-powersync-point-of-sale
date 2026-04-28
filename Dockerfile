# check=skip=SecretsUsedInArgOrEnv

# BuildKit's lint rule flags any ARG/ENV whose name contains "KEY".
# VITE_SUPABASE_PUBLISHABLE_KEY is the Supabase publishable (public) key —
# it ships in the browser bundle by design and is not a secret.

# Use the Node alpine official image
# https://hub.docker.com/_/node
FROM node:lts-alpine AS build

# Set config
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

# Enable pnpm via corepack (version is pinned in package.json#packageManager)
RUN corepack enable

# Create and change to the app directory.
WORKDIR /app

# Copy lockfile + manifest first so dependency layer caches well
COPY package.json pnpm-lock.yaml ./

# Install packages
RUN pnpm install --frozen-lockfile

# Copy local code to the container image.
COPY . ./

# Vite inlines `import.meta.env.VITE_*` at build time, so these must be
# present during `pnpm run build` — not just at container runtime. On
# Railway, set these as service variables; Railway forwards them as
# build args when the Dockerfile declares ARG with the same name.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_POWERSYNC_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_POWERSYNC_URL=$VITE_POWERSYNC_URL

# Build the app.
RUN pnpm run build

# Use the Caddy image
FROM caddy

# Create and change to the app directory.
WORKDIR /app

# Copy Caddyfile to the container image.
COPY Caddyfile ./

# Copy local code to the container image.
RUN caddy fmt Caddyfile --overwrite

# Copy files to the container image.
COPY --from=build /app/dist ./dist

# Use Caddy to run/serve the app
CMD ["caddy", "run", "--config", "Caddyfile", "--adapter", "caddyfile"]
