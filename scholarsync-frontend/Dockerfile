# ── Stage 1: Build ──
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: Serve with NGINX ──
FROM nginx:alpine

# Remove default NGINX static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom NGINX config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

ENTRYPOINT ["nginx", "-g", "daemon off;"]
