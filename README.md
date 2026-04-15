# Pteryx

A Discord bot for managing your [Pterodactyl](https://pterodactyl.io) panel — power control, server status, console commands, admin tools, and a live node overview embed.

## Features

- `/status <server>` — CPU, RAM, disk, network I/O and uptime with autocomplete
- `/power <server> <action>` — Start, stop, restart or kill a server
- `/console <server> <command>` — Send a console command directly from Discord
- `/suspend <action> <server>` — Admin-only suspend and unsuspend
- **Live node embed** — Auto-updating message showing memory, disk and server count per node

## Requirements

- Node.js 18+
- A Pterodactyl panel with API access
- A Discord application and bot token

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Poof-Labs/pteryx.git
cd pteryx
npm install -D
```

### 2. Configure environment

```bash
cp .env.example .env
```

| Variable | Where to find it |
|---|---|
| `DISCORD_TOKEN` | Discord Developer Portal → Bot → Token |
| `DISCORD_CLIENT_ID` | Discord Developer Portal → General Information → Application ID |
| `DISCORD_GUILD_ID` | Right-click your server → Copy Server ID (optional — remove for global commands) |
| `PANEL_URL` | Your Pterodactyl panel URL |
| `PTERODACTYL_CLIENT_KEY` | Panel → Account → API Credentials (`ptlc_…`) |
| `PTERODACTYL_APP_KEY` | Panel → Admin → Application API (`ptla_…`) |
| `NODE_STATUS_CHANNEL_ID` | Right-click the status channel → Copy Channel ID |
| `NODE_STATUS_MESSAGE_ID` | Leave blank on first run — the bot logs it for you |

### 3. Pterodactyl API permissions

When creating your **Application API key**, you only need:

| Permission | Level |
|---|---|
| Nodes | Read |
| Servers | Read & Write |

### 4. Register slash commands

```bash
npm run deploy-commands
```

### 5. Run

```bash
# Development
npm run dev

# Production (recommended)
npm run build
pm2 start dist/index.js --name pteryx
pm2 save
pm2 startup
```

## Node Status Embed

On first run the bot posts a new message in `NODE_STATUS_CHANNEL_ID` and logs its ID. Copy that into `NODE_STATUS_MESSAGE_ID` in your `.env` so the bot edits the same message on restart rather than creating a new one. The embed updates every 60 seconds.

## Contributing

PRs are welcome. Open an issue first for anything significant so we can discuss it before you build it.

## AI Generated Content Disclosure

GitHub Copilot has co-authored **one** commit in this project and it will be the **only** commit it co-authors. AI will no longer be involved in the project.

## License

[MIT](LICENSE)
