# Build context: repo root
#   docker build -f back-end/Dockerfile .
FROM node:22-alpine AS deps
WORKDIR /app
COPY back-end/package.json back-end/package-lock.json back-end/.npmrc ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY back-end/ ./
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY back-end/package.json back-end/package-lock.json back-end/.npmrc ./
RUN npm ci --omit=dev && npm install tsx@4.23.15 --no-save
COPY --from=build /app/dist ./dist
COPY back-end/scripts ./scripts
COPY database /database
COPY back-end/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
EXPOSE 3000
ENTRYPOINT ["/docker-entrypoint.sh"]
