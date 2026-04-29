# Build stage
FROM node:18-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install

# Final stage
FROM node:18-slim
WORKDIR /app

# Install sharp dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Prune unused files
RUN rm -rf .git .cache __pycache__ venv datasets model_weights *.pt *.bin *.pth

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["node", "backend/server.js"]
