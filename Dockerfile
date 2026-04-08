FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies only when needed
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
# Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public and static assets into the standalone directory
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Create .next directory and grant permissions for image optimization cache
RUN mkdir -p .next && chown nextjs:nodejs .next

COPY --from=builder /app/.next/standalone ./

# Also copy them with correct permissions just in case
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.js ./prisma.config.js
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Ensure uploads directory is writeable by nextjs user
RUN mkdir -p public/uploads && chown -R nextjs:nodejs public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application - ensure DB push completes before server starts
CMD ["/bin/sh", "-c", "DATABASE_URL=$DATABASE_URL npx prisma db push --accept-data-loss && (node scripts/reminder-cron.js &) && node server.js"]
