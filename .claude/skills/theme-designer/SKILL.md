---
name: theme-designer
description: >
  Guidelines for creating and editing visual themes. Use when adding a new
  theme, editing ThemeSelector.tsx, modifying CSS custom properties in
  globals.css, creating theme documentation in docs/themes/, or debugging
  theme-related styling issues.
---

# Theme Designer — Creating Visual Themes for Stillpoint

## How Themes Work

Themes override Tailwind's CSS custom properties on `<html>` via
`.theme-{name}` classes. All components use shared color tokens, so
changing the variables reskins the entire app. The active theme class is
toggled by `ThemeSelector.tsx` and persisted in `localStorage`.

Key files:
- `src/styles/globals.css` — `@theme` block (defaults) + `.theme-{name}` overrides
- `src/components/ThemeSelector.tsx` — `Theme` type, `THEMES` array, `DARK_THEMES` set, toggle UI
- `src/app/layout.tsx` — inline anti-flash script (applies theme before React hydrates)
- `docs/themes/{name}.md` — design rationale doc per theme

## Tailwind CSS 4 & Layer Specificity

This project uses Tailwind CSS 4 with `@theme` (no `tailwind.config.js`).
Understanding the CSS cascade is critical for theme work.

**Layer order** (lowest → highest priority):
`@layer theme` → `@layer base` → `@layer components` → `@layer utilities`

- Color variables in `@theme {}` compile to `@layer theme` on `:root`
- Theme overrides in `.theme-{name}` live in `@layer base` — they beat
  `@layer theme` because classes (0,1,0) match `:root` specificity but
  the layer is higher priority
- **Problem:** Tailwind 4 generates opacity utilities (`bg-white/40`,
  `text-ink/50`) in `@layer utilities` wrapped in
  `@supports (color: color-mix())`. These CANNOT be beaten by
  `@layer base` or `@layer components` — utilities always win.
- **Solution:** Place overrides OUTSIDE any `@layer` (unlayered CSS beats
  all layers) and use `!important` to beat `@supports` wrappers.

This is the correct pattern for Tailwind 4, not a hack. See the
`DARK THEME SHARED UTILITY OVERRIDES` section in `globals.css`.

## Step-by-Step: Adding a New Theme

### 1. Define color overrides in `globals.css`

Add a new `.theme-{name}` block inside `@layer base`. Every theme MUST
define all 6 color variables:

```css
.theme-{name} {
  --color-surface:   /* Background */
  --color-ink:       /* Primary text */
  --color-accent:    /* Accent, interactive elements */
  --color-warm:      /* Secondary accent */
  --color-edge:      /* Borders, subtle UI */
  --color-emphasis:  /* Hover states, emphasis */
}
```

These are the only variables the component layer reads. If you skip one,
that token falls through to the `@theme` defaults (minimalist), which
may produce an inconsistent result.

**If building a dark theme,** also define the 3 dark-theme tokens:

```css
.theme-{name} {
  /* ... standard 6 ... */
  --dark-card-bg:       /* Translucent dark card background, e.g. rgba(15, 5, 35, 0.85) */
  --dark-card-hover:    /* Slightly lighter on hover, e.g. rgba(20, 10, 45, 0.9) */
  --dark-accent-bright: /* Brightened accent for readability, e.g. #FF91CF */
}
```

These are consumed by the shared `.theme-dark` utility overrides in
`globals.css` — you get card, text, and badge contrast fixes for free.

### 2. Register the theme in `ThemeSelector.tsx`

Add to the `Theme` union type:

```ts
export type Theme = "minimalist" | "aura" | "cosmic" | "{name}";
```

Add an entry to the `THEMES` array:

```ts
{ id: "{name}", label: "Display Name", icon: "X" }
```

**If dark theme,** add to the `DARK_THEMES` set:

```ts
const DARK_THEMES: ReadonlySet<Theme> = new Set(["cosmic", "{name}"]);
```

Also update the `darkThemes` array in the inline script in
`src/app/layout.tsx` to prevent a light flash on page load:

```js
var darkThemes = ['cosmic', '{name}'];
```

### 3. Create `docs/themes/{name}.md`

Document the theme's color palette, aesthetic principles, and any
custom component styles. Follow the format of `docs/themes/cosmic.md`.
This doc helps contributors understand the design intent.

### 4. Add custom component styles

Themes that go beyond color overrides need scoped component classes for
glass cards, gradient backgrounds, custom animations, etc.

#### 4a. Component classes (all themes)

Scope custom classes under `.theme-{name} .{name}-*` inside
`@layer components` in `globals.css`:

```css
.theme-ocean .ocean-glass {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(16px);
}
```

Standard component classes to consider:
- `.{name}-glass` — card styling (background, blur, border)
- `.{name}-input` — input fields
- `.{name}-btn` — buttons
- `.breathing-circle` override (scoped under `.theme-{name}`)

#### 4b. Animated background (optional)

If the theme has a background effect (like Aura's blobs or Cosmic's
stars), create a `{Name}Background.tsx` component and render it in
**two places**:

1. `page.tsx` — at the top of the return, conditionally:
   ```tsx
   {theme === "{name}" && <OceanBackground />}
   ```

2. `MeditationPlayer.tsx` — inside the fixed overlay, also conditionally.
   The player uses `fixed inset-0 z-50 bg-surface` which creates a new
   stacking context that covers page-level backgrounds. It already tracks
   theme state via `getStoredTheme()` and the `theme-change` event.

#### 4c. Component-scoped overrides (dark themes)

Some components use Tailwind utilities (`bg-ink`, `text-surface`,
`bg-white/50`) that need different values in dark themes but should NOT
be overridden globally — doing so would break unrelated elements.

**The scoping pattern:** Add a wrapper class to the component's root
element and target it in CSS:

```css
/* DO NOT do this — affects ALL bg-ink elements */
.theme-cosmic .bg-ink { background-color: #FF69B4; }

/* DO this — only affects the toggle */
.theme-cosmic .cosmic-toggle .bg-ink { background-color: #FF69B4; }
```

Convention: `{theme}-{component}` (e.g. `cosmic-toggle`,
`cosmic-voice-input`). These classes are inert when the theme is
inactive — safe to add unconditionally in JSX.

**Components that currently need scoped overrides for dark themes:**

| Component | Wrapper class | Why |
|-----------|--------------|-----|
| `ThemeSelector.tsx` | `cosmic-toggle` | Active pill uses `bg-ink text-surface` — needs accent color swap |
| `VoiceSelector.tsx` | `cosmic-voice-input` | Input uses `bg-white/50`, button uses `bg-ink` — need dark glass |

## Design Constraints

- **Contrast:** Background (`--color-surface`) and text (`--color-ink`)
  must meet WCAG AA contrast ratio (4.5:1 minimum). The player view is
  full-screen — the theme must remain readable at that scale.
- **Accent visibility:** `--color-accent` is used on interactive elements
  (buttons, focus rings, badges). It must be clearly visible against
  both `--color-surface` and card backgrounds.
- **Transition:** The app applies `transition: background-color 0.5s ease`
  on body. Avoid colors that flash harshly during theme switches.
- **No hard-coded colors in components.** Components use Tailwind classes
  like `bg-surface`, `text-ink`, `border-edge`. If a component has a
  raw hex value, it won't respond to theme changes.

## Dark Theme Considerations

Light themes work naturally with Tailwind's opacity utilities:
`bg-white/40` produces translucent white (clean on light backgrounds),
`text-ink/50` produces semi-transparent dark text (readable on light
surfaces). **On dark themes, these produce unreadable results.**

### The opacity rule of thumb

Reduce the opacity fade on dark themes. The eye needs more contrast on
dark backgrounds:

| Light theme utility | Dark theme equivalent |
|--------------------|----------------------|
| `text-ink/50` | Full `var(--color-ink)` (no opacity) |
| `text-ink/40` | 90% opacity |
| `text-ink/30` | 80% opacity |
| `bg-white/40` | Replace with `--dark-card-bg` |
| `bg-white/60` (hover) | Replace with `--dark-card-hover` |
| `text-accent` | Brighten via `--dark-accent-bright` |

### How dark themes get these overrides

The shared `.theme-dark` block in `globals.css` handles ALL of these
automatically. Dark themes only need to:

1. Define `--dark-card-bg`, `--dark-card-hover`, `--dark-accent-bright`
2. Be listed in `DARK_THEMES` in `ThemeSelector.tsx`
3. Be listed in the `darkThemes` array in `layout.tsx`

### Utilities that need dark-theme overrides (reference)

| Utility | Components using it | Problem on dark |
|---------|-------------------|-----------------|
| `bg-white/40` | MeditationCard | Washed-out grey card |
| `hover:bg-white/60` | MeditationCard | Same on hover |
| `bg-white/50` | ThemeSelector, VoiceSelector | Washed-out pill/input |
| `text-ink/50` | MeditationCard, labels | Too faint |
| `text-ink/40` | ThemeSelector, VoiceSelector | Nearly invisible |
| `text-ink/30` | MeditationCard, VoiceSelector | Invisible |
| `bg-accent/10` | MeditationCard badge | Too subtle |
| `text-accent` | MeditationCard badge | May need brightening |
| `bg-ink` | ThemeSelector, VoiceSelector | Wrong color for active state |
| `text-surface` | ThemeSelector, VoiceSelector | Wrong color for button text |

Items in the top group are handled by `.theme-dark` shared overrides.
Items in the bottom group (`bg-ink`, `text-surface`, `bg-white/50`)
require component-scoped overrides (see §4c above).

## Existing Themes

- **Minimalist** (default) — Warm neutrals. No background effects.
  Cards are `bg-white/40`. See `docs/themes/minimalist.md`.
- **Aura** — Lavender/pink/mint with floating gradient blobs and frosted
  glass cards. Uses `AuraBackground.tsx` + `.theme-aura .aura-*` classes.
  See `docs/themes/aura.md`.
- **Cosmic** — Dark space aesthetic, hot pink/purple with animated stars,
  planets, and rockets. Uses `CosmicBackground.tsx` +
  `.theme-cosmic .cosmic-*` classes. Dark theme requiring `.theme-dark`
  utility overrides. See `docs/themes/cosmic.md`.

## Common Mistakes

- Forgetting to add the theme to the `Theme` type union (TypeScript will
  catch this, but only at build time)
- Defining only some color variables — the rest inherit from minimalist,
  creating a visual mismatch
- Using raw hex colors in component JSX instead of Tailwind token classes
- Adding theme-specific component classes without scoping under
  `.theme-{name}`
- **Putting utility overrides inside `@layer base` or `@layer components`**
  — they will lose to Tailwind's `@layer utilities`
- **Forgetting `!important`** on dark-theme utility overrides — Tailwind's
  `@supports (color: color-mix())` wrappers will win
- **Using unscoped overrides** like `.theme-x .bg-ink` — this breaks every
  element that uses `bg-ink`, not just the intended one. Scope with a
  wrapper class: `.theme-x .x-toggle .bg-ink`
- **Not rendering the background inside MeditationPlayer** — the player's
  `fixed z-50` overlay covers page-level backgrounds
- **Not testing with all opacity utilities** — dark themes must be tested
  with `bg-white/40`, `text-ink/50`, `text-ink/30` etc. to catch contrast
  issues
- **Not adding the theme to `darkThemes` in `layout.tsx`** — causes a
  light flash before hydration on dark themes

## globals.css Structure Reference

```
@import "tailwindcss"
@theme { ... }                             ← Default color variables
@layer base { .theme-{name} { ... } }     ← Theme variable overrides
@layer components { ... }                  ← Scoped component classes
/* DARK THEME SHARED OVERRIDES */          ← Unlayered, !important
/* PER-THEME COMPONENT OVERRIDES */        ← Scoped wrapper overrides
```
