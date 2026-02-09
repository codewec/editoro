FROM node:22-alpine AS deps
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache libc6-compat
RUN npm i -g pnpm@10.28.2

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS build
WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apk add --no-cache libc6-compat
RUN npm i -g pnpm@10.28.2

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

RUN apk add --no-cache libc6-compat

COPY --from=build /app/.output ./.output

RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
