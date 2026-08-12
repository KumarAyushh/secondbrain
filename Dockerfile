FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable

# Workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# API package configuration
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# API source
COPY apps/api/src ./apps/api/src

# Build API
RUN pnpm --dir apps/api build


FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable

ENV NODE_ENV=production

# Workspace configuration
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# API package configuration
COPY apps/api/package.json ./apps/api/package.json

# Production dependencies
RUN pnpm install --prod --frozen-lockfile

# Compiled API
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]