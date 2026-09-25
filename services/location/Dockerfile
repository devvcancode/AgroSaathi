FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY services/location/server.js ./server.js
ENV NODE_ENV=production
ENV LOCATION_WS_PORT=8080
EXPOSE 8080
CMD ["node", "server.js"]
