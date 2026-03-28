# Stillpoint

Open source tool that transforms AI conversation history into personalized guided meditations with audio playback. Users export their Claude data, upload it, and receive meditations tailored to the emotional and psychological capacities they actually need right now.

## Core Concept

Stillpoint does NOT recite your problems back to you. It identifies what capacities you need — then builds meditations that develop those capacities using universal language.

### The Two-Layer Model

**Layer 1 — Capacity Extraction:** Read conversations, identify what the person needs to *practice*. Think like a therapist: "What muscle does this person need to build?"

| What conversations reveal | Capacity needed | Meditation approach |
|---|---|---|
| Managing aging parent from distance | Presence despite distance, releasing control | Being fully here while trusting what you can't see |
| Hostile team after involuntary reorg | Holding ground without absorbing hostility | Boundary visualization, centering in own authority |
| Post-surgical recovery while life demands continue | Patience with healing | Body appreciation, radical acceptance of current limits |
| Financial anxiety about family planning | Separating fear from planning | Distinguishing real from imagined, grounding in what you have |
| Job search while employed, identity uncertainty | Trusting own trajectory | Reconnecting with evidence of capability, releasing attachment to titles |
| Circular thinking, going in loops | Breaking rumination | Thought-watching, choosing one thing to release |

**Layer 2 — Meditation Generation:** Build those capacities using universal language. NEVER mention specific life details. The personalization is in *selecting the right capacity at the right time* — the script itself could be in a printed book.

### The 6 Meditation Types

1. **The Anchor** — Stability amidst chaos. Sensory grounding → breath stabilization → finding the still point.
2. **The Release** — Surrendering control. Noticing what you're gripping → cost of holding → practicing release → discovering what remains.
3. **The Bridge** — Tolerating transition. Honoring what was → sitting with not-knowing → sensing what's forming.
4. **The Body** — Patience with healing. Gentle body awareness → gratitude for function → honoring limits → trusting the timeline.
5. **The Thread** — Connection across distance. Feeling connection as energy → sending intention → trusting the thread.
6. **The Ground** — Self-trust. Settling into your body → remembering a time you surprised yourself → carrying it as fact.

Detailed prompts for extraction and generation live in their respective skills: `.claude/skills/theme-extractor/SKILL.md` and `.claude/skills/meditation-writer/SKILL.md`.

---

## Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **AI:** Anthropic Claude API (`claude-sonnet-4-20250514`)
- **Audio:** ElevenLabs TTS API (BYOK)
- **Data Processing:** Client-side JSON parsing
- **Storage:** localStorage only. No database.
- **Deployment:** Vercel
- **License:** MIT

---

## Privacy Architecture (Non-Negotiable)

- Conversation JSON parsed **entirely client-side**
- Only extracted capacity needs (not raw conversations) sent to Claude API
- API calls routed through Next.js server routes (keys stay server-side)
- No user data stored on any server
- No accounts, tracking, or analytics
- One-click clear all cached data
- Users self-host with their own API keys

---

## File Structure

```
stillpoint/
├── CLAUDE.md
├── LEARNING.md
├── .claude/
│   ├── settings.json
│   ├── skills/
│   │   ├── meditation-writer/SKILL.md
│   │   ├── theme-extractor/SKILL.md
│   │   ├── privacy-checker/SKILL.md
│   │   └── ux-reviewer/SKILL.md
│   ├── agents/
│   │   ├── meditation-agent.md
│   │   └── test-agent.md
│   └── .mcp.json
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── processing/page.tsx
│   │   ├── meditations/page.tsx
│   │   └── play/[id]/page.tsx
│   ├── app/api/
│   │   ├── extract-themes/route.ts
│   │   ├── generate-meditation/route.ts
│   │   └── generate-audio/route.ts
│   ├── components/
│   │   ├── UploadZone.tsx
│   │   ├── ApiKeySetup.tsx
│   │   ├── ProcessingView.tsx
│   │   ├── MeditationCard.tsx
│   │   ├── MeditationPlayer.tsx
│   │   ├── VoiceSelector.tsx
│   │   ├── AudioPlayer.tsx
│   │   ├── BreathGuide.tsx
│   │   └── Timer.tsx
│   ├── lib/
│   │   ├── parseExport.ts
│   │   ├── extractCapacities.ts
│   │   ├── generateMeditation.ts
│   │   ├── generateAudio.ts
│   │   ├── meditationTypes.ts
│   │   ├── voices.ts
│   │   └── types.ts
│   └── styles/globals.css
├── public/sounds/bell.mp3
├── .env.example
├── .env.local
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── next.config.js
├── LICENSE
└── README.md
```

---

## Design System

### Aesthetic: Warm Minimalism
Kinfolk magazine meets high-end therapy office. NOT purple gradients, lotus flowers, or stock mountain photos.

### Colors
```css
--cream:     #F5F0EB;
--charcoal:  #2C2C2C;
--sage:      #8B9D83;
--clay:      #C4A882;
--mist:      #D4D0CB;
--deep:      #1A1A1A;
```

### Typography
- **Display/Titles:** Cormorant Garamond (Google Fonts)
- **Body/UI:** DM Sans (Google Fonts)

### Principles
- Generous whitespace — the app should feel like exhaling
- Subtle fade-in animations, no aggressive motion
- No clutter, badges, gamification, or streaks
- Dark mode for evening meditations (auto-detect + toggle)
- Mobile-first

### Key UI States
1. **Setup:** API key entry + upload zone. Clean, non-intimidating.
2. **Processing:** Breathing circle. "Reading your story..." → "Understanding what you need..." → "Writing your meditations..."
3. **Gallery:** 5-6 cards with poetic titles. Voice selector at top.
4. **Player:** Full-screen. Large serif text with word highlighting during audio. Breathing guide. Timer. Bell.

---

## ElevenLabs Audio

- BYOK — user provides ElevenLabs API key (optional; text-only works without it)
- 6 curated voices + custom Voice ID option
- `[pause Xs]` → `<break time="Xs"/>` SSML conversion
- `[breathe]` → `<break time="4s"/>`
- `[bell]` → local bell.mp3 playback
- Audio cached in localStorage as base64
- Progressive loading: text appears first, audio generates in background
- Player: play/pause, scrubber, 0.75x/1x/1.25x speed, text highlight sync

Voice config lives in `src/lib/voices.ts`. Verify ElevenLabs voice IDs before shipping.

---

## BYOK Setup

### .env.example
```
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=              # Optional — text-only mode works without this
```

### In-App Flow
1. Anthropic key: required, link to console.anthropic.com
2. ElevenLabs key: optional, "Skip — I'll read them myself"
3. Keys in localStorage, sent only to respective APIs via server routes

---

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
- No purple gradients, lotus flowers, stock meditation imagery
- No Inter, Roboto, or Arial
- No analytics, tracking, or telemetry
- No user accounts or auth in v1
- No word "journey" in meditations
- No specific life details in meditation scripts
- No .env.local committed to repo

---

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
- [x] AudioPlayer component
- [x] SSML conversion
- [ ] Text-audio sync (deferred to Phase 5 — needs MeditationPlayer)

### Phase 5: Player Polish
- [ ] Full-screen MeditationPlayer
- [ ] BreathGuide (4-7-8)
- [ ] Timer + bell
- [ ] Dark mode
- [ ] Mobile optimization

### Phase 6: Ship
- [ ] README.md, LICENSE, contributing guidelines
- [ ] GitHub repo + good-first-issue labels
- [ ] Deploy to Vercel