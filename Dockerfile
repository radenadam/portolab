# Decision 0010 builds this image on the server from the repository, and docs/deploy.md runs it with Docker Compose.

# The full image has the compilers that better-sqlite3 needs, because its package ships no binary for this version of Node.
FROM node:26.13.0-trixie@sha256:438603bbb5cda404b9416f0b5c8026f61501ab911760d861ec28c36b5d675725 AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# package.json names the version of pnpm, so the image installs that one.
RUN npm install --global "$(node --print "require('./package.json').packageManager")"

FROM base AS dependencies
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
# The prepare script of package.json installs git hooks, which need a repository that the image does not hold, and the build needs no compiled module.
RUN pnpm install --frozen-lockfile --ignore-scripts
COPY . .
RUN pnpm build

FROM node:26.13.0-trixie-slim@sha256:5adad64f9a1fca2d51972caa65983634c8a774eb300d72b20f7f2a0f60368072
# docs/deploy.md backs up the database and deletes the records of a person with the command line of SQLite.
RUN apt-get update \
  && apt-get install --yes --no-install-recommends sqlite3 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
COPY migrations migrations
COPY server server
# The server and the account command load modules of app/ at runtime, and the build generated the messages among them.
COPY --from=build /app/app app
COPY --from=build /app/build build
COPY --from=dependencies /app/node_modules node_modules
# Docker fills a new volume with this folder, so the database belongs to the user that runs the server.
RUN install --directory --owner node --group node data
USER node
CMD ["node", "server/main.ts"]
