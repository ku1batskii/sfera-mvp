<!-- Auto-generated guidance for AI coding agents working on sfera-mvp -->
# Copilot instructions for sfera-mvp

Purpose: quickly bring an AI coding assistant up to speed so edits are correct, safe, and idiomatic for this repo.

- Project entry points:
  - Server: `src/server.js` (starts HTTP server and initializes WebSocket service)
  - App/router: `src/app.js` (Express routes, API surface, auth flows)
  - Bot: `src/bot.js` (Telegram bot using Telegraf; small CLI process)
  - DB: `src/db.js` (single SQLite access layer; canonical place for queries)
  - Client: `src/client/` (React webapp; built into `src/client/dist` when present)

- High-level architecture and data flow:
  - The Express app (`src/app.js`) serves both static pages (repo `pages/` and built client) and a JSON API under `/api/*`.
  - Events are stored in a SQLite database under `data/db.sqlite`. Migrations live in `migrations/`.
  - New events can be created via POST `/api/events`. Auth there is via JWT (`JWT_SECRET`) created by Telegram verification endpoint (`/api/auth/telegram`).
  - When events are accepted they are broadcast to connected web clients using the WebSocket server initialized in `src/ws.js` and exposed on `app.locals.wss`.
  - The Telegram bot (`src/bot.js`) simply opens the WebApp link; authentication into the webapp relies on Telegram Widget payload verification in `/api/auth/telegram`.

- Important environment variables (verify before making changes):
  - `JWT_SECRET` — required for issuing and validating tokens.
  - `TELEGRAM_BOT_TOKEN` — required for `/api/auth/telegram` verification.
  - `BOT_TOKEN`, `BOT_USERNAME`, `WEBAPP_URL` — used by `src/bot.js` when running the bot process.
  - `ADMIN_TOKEN` — protects admin endpoints (`/api/admin/*`).
  - `PORT` — HTTP port (default 3000).

- Developer workflows / key commands (from `package.json`):
  - `npm run dev` — start server with `nodemon` watching `src/` (fast iterative server dev).
  - `npm run dev:all` — concurrently run server and client dev server (`src/client`), useful for full-stack local dev.
  - `npm run bot` — run the Telegram bot process.
  - `npm run migrate` — apply SQLite migration: runs `sqlite3 data/db.sqlite < migrations/001_create_events.sql` (idempotent via `|| true`).
  - `npm run start:prod` — builds client then runs server (for simple production testing).

- Project-specific patterns & conventions:
  - Single-process Node backend with in-repo SQLite: prefer small, sync-friendly `better-sqlite3` usage in `src/db.js`.
  - JWTs encode `telegram_id` and are validated in `POST /api/events` — any change to token format must be coordinated between `src/app.js` and any client auth flows.
  - Websocket broadcast uses `app.locals.wss` — prefer using that to notify connected clients after DB writes.
  - Server supports serving a built React client at `src/client/dist` if present; otherwise static files under repo root are served (the `pages/` folder).
  - Server-side aggregation endpoint: `/api/hex-aggregate` uses `@turf/turf` and caches results for 30s in-memory — be mindful of TTL and memory use.

- Integration touchpoints to verify when changing behavior:
  - `pages/telegram-webapp.html` and any `src/client` Telegram-login components (e.g., `TelegramLogin.jsx`) — changes to Telegram verify flow require updates here.
  - `migrations/001_create_events.sql` and `src/db.js` — keep schema and queries in sync.
  - WebSocket message shapes (`{ type: 'new_event', data: ... }`) — client code expects this; update both server and client if message schema changes.

- Safe change checklist for PRs by AI agents:
  1. Run `npm run migrate` locally (or inspect `migrations/`) before making DB-dependent edits.
 2. Confirm required env vars exist for the feature path you modify (see list above).
 3. When editing endpoints used by the client or bot, update both sides (server route and client consumption) in the same PR.
 4. Preserve websocket payload types; add versioning comments if changing format.

- Examples (copyable):
  - Start server in dev: `npm run dev`
  - Start bot: `npm run bot`
  - Apply migrations: `npm run migrate`
  - Build client for prod: `npm run build:client`

If anything above is unclear or you want more examples (client code snippets, DB query locations, or websocket message handlers), tell me which area to expand and I will iterate.
