# Build from the repository root: docker build -t remotebridge-client ./client
FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.js ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

FROM nginx:stable-alpine

ENV API_UPSTREAM=http://api:3001
ENV NGINX_ENVSUBST_FILTER=^API_UPSTREAM$

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
