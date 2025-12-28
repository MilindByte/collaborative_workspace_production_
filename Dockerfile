FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install dependencies
RUN npm install --no-audit

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Install only production dependencies
RUN npm install --only=production --no-audit

# Copy built application and Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
