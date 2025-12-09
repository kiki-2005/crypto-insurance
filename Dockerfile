# Multi-stage Dockerfile for the full-stack application

# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./

# Stage 3: Smart contracts
FROM node:18-alpine AS contracts-builder
WORKDIR /app
COPY package*.json ./
COPY hardhat.config.js ./
RUN npm ci
COPY contracts/ ./contracts/
COPY scripts/ ./scripts/
RUN npm run compile

# Stage 4: Production image
FROM node:18-alpine AS production
WORKDIR /app

# Install global dependencies
RUN npm install -g concurrently

# Copy backend
COPY --from=backend-builder /app/backend ./backend
WORKDIR /app/backend
RUN npm ci --only=production

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./public

# Copy contracts artifacts
COPY --from=contracts-builder /app/artifacts ./artifacts
COPY --from=contracts-builder /app/deployments ./deployments

# Create uploads directory
RUN mkdir -p uploads/kyc

# Expose ports
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["npm", "start"]