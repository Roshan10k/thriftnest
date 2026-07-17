# --- Build stage: compile TypeScript to JavaScript -------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage: production dependencies + compiled output only ---------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
RUN mkdir -p uploads/listings uploads/avatars

# Runs as the non-root "node" user baked into the official image, not root.
RUN chown -R node:node /app
USER node

EXPOSE 8000
CMD ["node", "dist/index.js"]
