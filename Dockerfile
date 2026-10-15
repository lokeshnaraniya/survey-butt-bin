# Multi-stage lightweight Node.js container for Code & Circuit SmartBin
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy application source code
COPY . .

# Build Vite frontend production assets into /dist
RUN npm run build

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port (Render/Railway/Cloud Run map dynamic $PORT automatically)
EXPOSE 3000

# Start Express + Vite production server via tsx
CMD ["npm", "start"]
