# Stage 1: Build stage
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and build production assets
COPY . .
RUN npm run build

# Stage 2: Serve stage with Nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
