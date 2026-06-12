FROM node:20-alpine
ARG API_GATEWAY=http://localhost
ENV API_GATEWAY=$API_GATEWAY
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
