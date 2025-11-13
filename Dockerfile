# Multi-stage: All deps for build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci  # All (prod + dev) for TS build
COPY . .
RUN npm run build  # Generates .next for App Router

# Prod runtime: Copy full .next
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production --ignore-scripts  # Prod deps only
COPY --from=builder /app/.next ./.next  # Full .next for App Router
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["npm", "start"]  # Standard for App Router
