# Stillpoint

Open source tool that transforms AI conversation history into personalized guided meditations with audio playback. Users export their Claude data, upload it, and receive meditations tailored to the emotional and psychological capacities they actually need right now.

## Getting Started

```
npm install
npm run dev     # http://localhost:3000
npm run build   # verify before committing
```

## Core Concept

Stillpoint does NOT recite your problems back to you. It identifies what capacities you need — then builds meditations that develop those capacities using universal language. Two-layer model:

1. **Capacity Extraction** — Read conversations, identify what the person needs to *practice*. Prompt in `.claude/skills/theme-extractor/SKILL.md`.
2. **Meditation Generation** — Build those capacities using universal language. NEVER mention specific life details. 6 meditation types defined in `src/lib/meditationTypes.ts`. Prompt in `.claude/skills/meditation-writer/SKILL.md`.

## Data Flow

```
Upload JSON → parseExport.ts (client, strips to human msgs only)
  → /api/extract-themes (server, Claude API)
  → assignMeditationTypes (client, keyword scoring)
  → /api/generate-meditation (server, Claude API, sequential)
  → Gallery → Player
```

Audio generates lazily per-meditation via `/api/generate-audio` (ElevenLabs) or Web Speech API fallback.

## Stack

Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 · Claude API (Sonnet) · ElevenLabs TTS (BYOK, optional) · localStorage only · Vercel deploy · MIT license

## Privacy Architecture (Non-Negotiable)

- Conversation JSON parsed **entirely client-side**
- Only extracted capacity needs (not raw conversations) sent to Claude API
- API calls routed through Next.js server routes (keys stay server-side)
- No user data stored on any server
- No accounts, tracking, or analytics
- One-click clear all cached data
- API routes check `process.env` first (personal deploy), then BYOK keys from request

## Design System

Users choose between themes via a pill selector (`ThemeSelector.tsx`). Themes work by overriding Tailwind's `--color-*` CSS variables on `<html>` via `.theme-{name}` classes. All defined in `src/styles/globals.css`.

- **[Minimalist](docs/themes/minimalist.md)** — Warm minimalism, cream/sage/charcoal. Default.
- **[Aura](docs/themes/aura.md)** — Iridescent gradient blobs, frosted glass, lavender/pink/mint.

To add a new theme: add entry to `THEMES` array in `ThemeSelector.tsx`, add `--color-*` overrides under `.theme-{name}` in `globals.css`, create `docs/themes/{name}.md`.

Typography: Cormorant Garamond (display) + DM Sans (body) via `next/font`.

## Git Workflow

- Never push directly to main — always use a branch + PR
- Never force push
- Always run `npm run build` before committing to catch type errors
- Use descriptive branch names (e.g., `phase-5-player-polish`, `fix-audio-fallback`)

## Coding Conventions

- TypeScript strict mode, no `any`
- Functional components with hooks
- Tailwind only, CSS variables for tokens
- `async/await` over `.then()`
- Error boundaries with user-friendly fallbacks
- Route Handlers in `src/app/api/`
- No `console.log` in production

## Forbidden Patterns

- No `any` type
- No raw conversation data stored after parsing
- No conversation content sent beyond /api/extract-themes
- No lotus flowers or stock meditation imagery
- No Inter, Roboto, or Arial
- No analytics, tracking, or telemetry
- No user accounts or auth in v1
- No word "journey" in meditations
- No specific life details in meditation scripts
- No .env.local committed to repo

## Build Phases

### Phase 1: Foundation
- [x] Init Next.js + Tailwind + TypeScript
- [x] Design system (colors, fonts, globals.css, Tailwind config)
- [x] Landing page with ApiKeySetup + UploadZone

### Phase 2: Data Pipeline
- [x] parseExport.ts — client-side Claude JSON parser
- [x] /api/extract-themes route (uses theme-extractor skill prompt)
- [x] ProcessingView with animated states

### Phase 3: Meditation Generation
- [x] meditationTypes.ts — 6 type templates
- [x] /api/generate-meditation route (uses meditation-writer skill prompt)
- [x] MeditationCard gallery
- [x] localStorage caching

### Phase 4: Audio
- [x] VoiceSelector (6 voices + custom)
- [x] /api/generate-audio route
- [x] AudioPlayer component (ElevenLabs + Web Speech API fallback)
- [x] SSML conversion
- [ ] Text-audio sync (word highlighting during playback)

### Phase 5: Player Polish
- [x] Full-screen MeditationPlayer
- [x] BreathGuide (4-4-4-4 box breathing)
- [x] Timer + bell
- [x] Theme system (Minimalist + Aura, replaces dark mode)
- [ ] Mobile optimization

### Phase 6: Ship
- [ ] README.md, LICENSE, contributing guidelines
- [ ] GitHub repo + good-first-issue labels
- [ ] Deploy to Vercel
