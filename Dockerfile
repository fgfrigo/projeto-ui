# Dockerfile (produção) - Node + Fastify + Vite build
# (sem "#syntax=..." pra não puxar docker/dockerfile:1)

FROM node:22-bookworm-slim AS build

WORKDIR /app

# Dependências p/ compilar addons nativos (sodium-native) se necessário
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ libsodium-dev \
  && rm -rf /var/lib/apt/lists/*

# Instala deps (inclui dev deps, pois precisamos do vite no build)
COPY package*.json ./
RUN npm ci

# Copia o projeto e gera o build do Vite
COPY . .
RUN npm run build

# Remove devDependencies para runtime ficar enxuto
RUN npm prune --omit=dev


FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

# app runtime
COPY --from=build /app/package*.json ./
COPY --from=build /app/start.js ./start.js
COPY --from=build /app/server ./server
COPY --from=build /app/client ./client
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "run", "start"]
