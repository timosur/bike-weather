# Build stage
FROM node:24-alpine AS build

ARG APP_VERSION=0.0.0
ENV VITE_APP_VERSION=${APP_VERSION}

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage — serve static files via nginx
FROM nginx:alpine

RUN adduser -D -H -s /sbin/nologin nginx-user

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
