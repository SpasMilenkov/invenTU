# --- Dev stage (used by docker-compose.dev.yml with volume mounts) ---
FROM node:lts-alpine AS dev
WORKDIR /usr/src/app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
EXPOSE 4321

# --- Build stage ---
FROM dev AS build
COPY . .
RUN pnpm build

# --- Production stage (only the compiled dist output) ---
FROM node:lts-alpine AS production
WORKDIR /usr/src/app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /usr/src/app/dist ./dist
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
