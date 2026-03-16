# --- build stage ---
FROM node:22-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci

COPY backend/tsconfig.json ./
COPY backend/src/ ./src/

RUN npm run build

# --- production stage ---
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/src/schemas ./dist/schemas

EXPOSE 3000

CMD ["node", "dist/server.js"]
