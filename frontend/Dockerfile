# --- Dev stage (used by docker-compose.dev.yml with volume mounts) ---
FROM node:lts-alpine AS dev
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
EXPOSE 4321

# --- Build stage ---
FROM dev AS build
COPY . .
RUN npm run build

# --- Production stage (only the compiled dist output) ---
FROM node:lts-alpine AS production
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /usr/src/app/dist ./dist
EXPOSE 4321
CMD ["npx", "astro", "preview", "--host", "0.0.0.0"]