FROM node:22-alpine AS builder

WORKDIR /app

# Skip husky git hooks during container install
ENV HUSKY=0

RUN corepack enable

# Prisma schema + config must be present before install,
# since `postinstall` runs `prisma generate`.
COPY tsconfig.json nest-cli.json package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY ./prisma ./prisma
COPY ./src ./src

RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV HUSKY=0
ENV NODE_ENV=production
ENV PORT=5000

RUN corepack enable

# Fresh production-only install, then generate the Prisma client into it.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY ./prisma ./prisma
RUN pnpm install --frozen-lockfile --prod
RUN pnpm run db:generate

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/main"]
