# 1. Install dependencies only when needed
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Se copia también el lock y se usa `npm ci`, no `npm install`: antes el lock
# ni siquiera entraba a la imagen, así que cada build volvía a resolver
# "react": "^18" y "typescript": "^5" y podía traer versiones distintas de las
# probadas. `npm ci` instala exactamente lo que dice package-lock.json y falla
# si el lock quedó desincronizado de package.json, en vez de arreglarlo solo.
COPY package.json package-lock.json ./
RUN npm ci

# 2. Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
