FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app

RUN mkdir -p /tmp/exports

COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

CMD ["node", "src/index.js"]