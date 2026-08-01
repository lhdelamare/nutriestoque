# ============================================================
# STAGE 1: Build Frontend (Vite App)
# ============================================================
FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ============================================================
# STAGE 2: Build Backend & Production Server
# ============================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install OpenSSL for Prisma ORM compatibility
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/

WORKDIR /app/server
RUN npm ci

# Copy server code & Prisma schema
COPY server/ ./
RUN npx prisma generate

# Copy frontend static build assets from Stage 1
COPY --from=client-builder /app/client/dist /app/client/dist

# Build TypeScript server
RUN npm run build

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["npm", "start"]
