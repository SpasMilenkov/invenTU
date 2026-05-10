# --- Dev stage ---
FROM node:lts-alpine AS dev
WORKDIR /usr/src/app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
EXPOSE 4321

# --- Build stage ---
FROM dev AS build

ARG PUBLIC_API_BASE_URL
ARG PUBLIC_HUB_URL
ARG PUBLIC_ALERTS_HUB_URL
COPY . .
RUN pnpm build

# --- Production stage ---
FROM node:lts-alpine AS prod
WORKDIR /usr/src/app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=build /usr/src/app/dist ./dist
ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
