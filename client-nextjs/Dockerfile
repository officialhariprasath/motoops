FROM node:22-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts

FROM node:22-alpine AS build

WORKDIR /app

ARG BACKEND_SERVER_URL=http://server:3001
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000

ENV BACKEND_SERVER_URL=$BACKEND_SERVER_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm exec next build
RUN npm prune --omit=dev --ignore-scripts

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start"]
