FROM node:22-alpine AS builder

WORKDIR /app

ENV HUSKY=0

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY ./prisma ./prisma
RUN pnpm install --frozen-lockfile

COPY tsconfig.json nest-cli.json ./
COPY ./src ./src
RUN pnpm run build

FROM builder AS migrate

CMD ["pnpm", "run", "db:deploy"]

FROM node:22-alpine AS runner

WORKDIR /app

ENV HUSKY=0
ENV NODE_ENV=production
ENV PORT=5000

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder --chown=node:node /app/dist ./dist

USER node

EXPOSE 5000

CMD ["node", "dist/main"]
