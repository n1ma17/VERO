# Build context: repo root
#   docker build -f front-end/Dockerfile .
FROM node:22-alpine AS build
WORKDIR /app
COPY front-end/package.json front-end/package-lock.json ./
RUN npm ci
COPY front-end/ ./
# Browser talks same-origin /api (nginx proxies to Nest). Leave VITE_API_URL unset.
RUN npm run build

FROM nginx:1.27-alpine
COPY front-end/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
