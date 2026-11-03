# Build from the repository root: docker build -f src/Dockerfile -t remotebridge-api .
FROM node:24-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src/ ./src/

USER node

EXPOSE 3001

CMD ["node", "src/server.js"]
