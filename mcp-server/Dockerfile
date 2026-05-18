# 1. Build TypeScript and install devDependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

# 2. Production stage installing only runtime dependencies
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist

# Run server
CMD ["node", "dist/index.js"]
