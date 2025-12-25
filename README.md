# Sfera — Prototype

Lightweight prototype that demonstrates realtime activity map driven by user-submitted events.

Quick start (local):

1. Install dependencies

```bash
npm install
```

2. Run migrations (creates SQLite file)

```bash
npm run migrate
```

3. Start server

```bash
npm run dev
```

4. Open the map in your browser:

- http://localhost:3000/pages/map.html

Notes:

- This PoC uses SQLite for simplicity. For production use Postgres + PostGIS.
- Telegram auth is a placeholder: add Telegram Login widget and server-side verification when ready.

Authentication details
 - Server issues JWT tokens (signed with `JWT_SECRET`) on successful Telegram Login verification.
 - Copy `.env.example` to `.env` and set `TELEGRAM_BOT_TOKEN` and a strong `JWT_SECRET`.
 - Client stores token in `localStorage` under `sfera_token` and sends it as `Authorization: Bearer <token>` when posting events.


Client (React) setup:

```bash
cd src/client
npm install
npm run dev
```

Telegram Login setup (quick):
- Create a bot with @BotFather and get the bot token.
- Add `TELEGRAM_BOT_TOKEN` to `.env` (copy from `.env.example`).
- The client includes a placeholder for the Telegram widget; edit `src/client/index.html` and set the `data-telegram-login` attribute with your bot username.

Production build and serve

```bash
# build client and start production server
npm run build:client
npm run start:prod
```

This builds the React app into `src/client/dist` and serves it from Express at `http://localhost:3000/`.
