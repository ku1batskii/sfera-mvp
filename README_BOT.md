Telegram bot (Sfera) — quick start

1) Create a bot and get `BOT_TOKEN` from @BotFather.

2) Configure environment variables (recommended in a `.env` file or your system env):

- `BOT_TOKEN` — the token from @BotFather
- `WEBAPP_URL` — full HTTPS URL to the Web App page (e.g. `https://<your-url>/pages/telegram-webapp.html`)
- `BOT_USERNAME` — optional bot username (used to build the link query param)

3) Install dependencies and run the bot locally:

```powershell
npm install
npm run bot
```

4) For local testing from a phone, expose the client dev server (Vite) over HTTPS with a tunnel and set `WEBAPP_URL` to that HTTPS address. Example using localtunnel:

```powershell
# in one terminal (start dev servers)
npm run dev:all

# in another terminal (expose vite dev server)
npx localtunnel --port 5173
# localtunnel prints a public HTTPS URL — set WEBAPP_URL to that URL + /pages/telegram-webapp.html
```

5) In Telegram, open your bot and send `/start`. The bot will reply with a button that opens the Web App inside Telegram.

Notes:
- The Web App must be served over HTTPS to work in Telegram.
- If you prefer webhooks instead of long polling, integrate webhook handling in your server and call `bot.telegram.setWebhook(...)`.