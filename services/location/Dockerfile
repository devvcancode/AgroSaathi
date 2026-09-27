FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
ENV NODE_ENV=production
ENV LOCATION_WS_PORT=8787
EXPOSE 8787
CMD ["npm", "start"]
