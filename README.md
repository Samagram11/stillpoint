# Stillpoint

Stillpoint creates 100% personalized meditations based on themes from your Claude conversations.

Upload your Claude data export, and Stillpoint identifies the emotional and psychological capacities you need to practice right now — then builds guided meditations that develop exactly those capacities. Your conversations never leave your device.

## How it works

1. **Export your data** from [claude.ai/settings](https://claude.ai/settings) (Privacy > Export Data)
2. **Upload the ZIP** to Stillpoint
3. **Receive meditations** tailored to what you actually need right now
4. **Listen or read** with ElevenLabs voices, browser voices, or a guided teleprompter

Stillpoint does NOT recite your problems back to you. It identifies what you need to *practice* — then builds meditations using universal language that develops those capacities.

## Privacy

- Conversations are parsed **entirely in your browser**
- Only extracted themes (never raw text) are sent to the Claude API
- API calls route through Next.js server routes — keys stay server-side
- No accounts, no tracking, no data stored on any server
- One-click clear all cached data

## Deploy your own

### Quick deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSamagram11%2Fstillpoint&env=ANTHROPIC_API_KEY&envDescription=Your%20Anthropic%20API%20key%20for%20meditation%20generation&envLink=https%3A%2F%2Fconsole.anthropic.com)

Set these environment variables in Vercel:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com) |
| `ELEVENLABS_API_KEY` | No | For audio generation. Without this, text-only and browser voices still work. |

### Run locally

```bash
git clone https://github.com/Samagram11/stillpoint.git
cd stillpoint
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

If you don't set environment variables, Stillpoint runs in BYOK (bring your own key) mode — you'll enter API keys in the browser and they stay in localStorage.

## Themes

Four visual themes, switchable from the pill selector:

- **Minimalist** — Warm minimalism (default)
- **Aura** — Iridescent gradient blobs, frosted glass
- **Cosmic** — Bright space aesthetic with animated stars and planets
- **Sunny** — Blue sky, drifting clouds, warm sun

Want to create your own? Run locally with [Claude Code](https://claude.com/claude-code) and use the built-in Theme Designer skill.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router)
- TypeScript (strict mode)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Claude API](https://docs.anthropic.com) (Sonnet) for capacity extraction and meditation generation
- [ElevenLabs](https://elevenlabs.io) TTS (optional, BYOK)
- Web Speech API fallback
- localStorage only — no database

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
