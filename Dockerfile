FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm run build:docker \
  && npm prune --omit=dev

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
# En Dockploy (obligatorio): MONGODB_URI, SESSION_SECRET, APP_URL, NEXT_PUBLIC_APP_URL
# y S3_* (o integración de almacenamiento en MongoDB). Sin S3 no se pueden subir justificativos ni medios.
# Opcional: ADMIN_SHELL_V2=false para volver al shell legacy (menú horizontal, sin sidebar).

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Reutiliza node_modules ya resueltos en el builder. Un segundo `npm ci`
# en Alpine puede fallar al recompilar sharp sin toolchain.
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/package-lock.json ./package-lock.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
