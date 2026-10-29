FROM node:24-alpine

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages
RUN npm ci

ARG APP_PACKAGE
ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1 \
    APP_PACKAGE=${APP_PACKAGE}
EXPOSE 3000
CMD ["sh", "-c", "npm run dev --workspace=\"$APP_PACKAGE\" -- --hostname 0.0.0.0"]
