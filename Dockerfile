# --- Build stage: compile the Vite/React app --------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Baked into the static bundle at build time — Vite only exposes env vars
# prefixed VITE_ to client code, and neither of these is a secret (the API URL
# is public, and Stripe's publishable key is designed to be exposed to the browser).
ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_STRIPE_PUBLISHABLE_KEY=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
RUN npm run build

# --- Runtime stage: serve the static build with nginx -----------------------
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
