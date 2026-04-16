FROM node:25.8.0 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:25.8.0

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=9999

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/server.js ./server.js

EXPOSE 9999

CMD ["npm", "run", "start"]
