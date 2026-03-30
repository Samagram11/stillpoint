# Contributing to Stillpoint

Thanks for your interest in contributing! Stillpoint is an open source project and we welcome contributions of all kinds.

## Getting started

```bash
git clone https://github.com/Samagram11/stillpoint.git
cd stillpoint
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

## Development workflow

1. Create a branch from `main` with a descriptive name
2. Make your changes
3. Run `npm run build` to verify — no type errors allowed
4. Open a pull request against `main`

**Do not** push directly to `main` or force push.

## Code conventions

- TypeScript strict mode — no `any`
- Functional components with hooks
- Tailwind CSS only — use CSS variables for design tokens
- `async/await` over `.then()`
- No `console.log` in production code

## Design tokens

All colors use semantic CSS variables defined in `src/styles/globals.css`:

- `--color-surface` — Background
- `--color-ink` — Text
- `--color-accent` — Interactive elements
- `--color-warm` — Warm highlights
- `--color-edge` — Borders
- `--color-emphasis` — Strong text

Themes override these variables via `.theme-{name}` classes on `<html>`.

## Adding a theme

1. Add an entry to the `THEMES` array in `src/components/ThemeSelector.tsx`
2. Add `--color-*` variable overrides in `src/styles/globals.css` (outside `@layer` blocks)
3. Create a docs file at `docs/themes/{name}.md`
4. Optionally add a background component in `src/components/`

Or use the **Theme Designer** skill with [Claude Code](https://claude.com/claude-code) to generate everything automatically.

## Privacy rules (non-negotiable)

- Conversation data is parsed **client-side only**
- Raw conversation text must **never** be sent beyond `/api/extract-themes`
- No analytics, tracking, or telemetry
- No user accounts or auth
- No server-side data storage

## Areas for contribution

Check the [issues](https://github.com/Samagram11/stillpoint/issues) page, especially anything tagged `good first issue`. Some areas that could use help:

- **Mobile polish** — responsive layout improvements
- **New themes** — visual themes with animations and custom backgrounds
- **Accessibility** — screen reader support, keyboard navigation, reduced motion
- **Internationalization** — meditation generation in other languages
- **Audio improvements** — better SSML handling, voice preview

## Questions?

Open an issue or start a discussion. We're happy to help you find a good first contribution.
