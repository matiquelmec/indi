# Backend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm install -g typescript nodemon ts-node

# Copy source code
COPY . .

# Build TypeScript (for production)
RUN npm run build || echo "Build step skipped in development"

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Default command (overridden by docker-compose in dev)
CMD ["node", "dist/server.js"]