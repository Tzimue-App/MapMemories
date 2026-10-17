# Stage 1: Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Install exact locked dependencies first so this layer is cached across source changes
COPY package*.json ./
RUN npm ci

# Copy source code and build production assets
COPY . .
RUN npm run build

# Stage 2: Serve stage with Nginx
FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/remembermap-frontend-angular/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
