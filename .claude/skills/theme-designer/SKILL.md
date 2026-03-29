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
`.theme-{name}` classes. All components use these shared color tokens, so
changing the variables reskins the entire app. The active theme class is
toggled by `ThemeSelector.tsx` and persisted in `localStorage`.

Key files:
- `src/styles/globals.css` — `@theme` block (defaults) + `.theme-{name}` overrides
- `src/components/ThemeSelector.tsx` — `Theme` type, `THEMES` array, toggle UI
- `docs/themes/{name}.md` — design rationale doc per theme

## Step-by-Step: Adding a New Theme

### 1. Define color overrides in `globals.css`

Add a new `.theme-{name}` block inside `@layer base`. Every theme MUST
define all 6 color variables:

```css
.theme-{name} {
  --color-cream:     /* Background */
  --color-charcoal:  /* Primary text */
  --color-sage:      /* Accent, interactive elements */
  --color-clay:      /* Secondary accent */
  --color-mist:      /* Borders, subtle UI */
  --color-deep:      /* Hover states, emphasis */
}
```

These are the only variables the component layer reads. If you skip one,
that token falls through to the `@theme` defaults (minimalist), which
may produce an inconsistent result.

### 2. Register the theme in `ThemeSelector.tsx`

Add to the `Theme` union type:

```ts
export type Theme = "minimalist" | "aura" | "{name}";
```

Add an entry to the `THEMES` array:

```ts
{ id: "{name}", label: "Display Name", icon: "X" }
```

The icon is a single character or symbol shown in the pill selector.

### 3. Create `docs/themes/{name}.md`

Document the theme's color palette, aesthetic principles, and any
custom component styles. Follow the format of `docs/themes/aura.md`.
This doc helps contributors understand the design intent.

### 4. (Optional) Add custom component styles

If the theme needs more than color overrides — e.g., frosted glass cards,
gradient backgrounds, custom animations — scope them under
`.theme-{name} .{name}-*` in `globals.css`:

```css
.theme-ocean .ocean-glass {
  background: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(16px);
}
```

If the theme has a background effect (like Aura's floating blobs), create
a `{Name}Background.tsx` component and conditionally render it in
`page.tsx` based on the active theme:

```tsx
{theme === "{name}" && <OceanBackground />}
```

## Design Constraints

- **Contrast:** Background (`--color-cream`) and text (`--color-charcoal`)
  must meet WCAG AA contrast ratio (4.5:1 minimum). The player view is
  full-screen — the theme must remain readable at that scale.
- **Accent visibility:** `--color-sage` is used on interactive elements
  (buttons, focus rings, badges). It must be clearly visible against
  both `--color-cream` and white/transparent card backgrounds.
- **Transition:** The app applies `transition: background-color 0.5s ease`
  on body. Avoid colors that flash harshly during theme switches.
- **No hard-coded colors in components.** Components use Tailwind classes
  like `bg-cream`, `text-charcoal`, `border-mist`. If a component has a
  raw hex value, it won't respond to theme changes.

## Existing Themes

- **Minimalist** (default) — Warm cream/sage/charcoal. No background
  effects. Cards are `bg-white/40`. See `docs/themes/minimalist.md`.
- **Aura** — Lavender/pink/mint with floating gradient blobs and frosted
  glass cards. Uses `AuraBackground.tsx` + `.theme-aura .aura-*` classes.
  See `docs/themes/aura.md`.

## Common Mistakes

- Forgetting to add the theme to the `Theme` type union (TypeScript will
  catch this, but only at build time)
- Defining only some color variables — the rest inherit from minimalist,
  creating a visual mismatch
- Using raw hex colors in component JSX instead of Tailwind token classes
- Adding theme-specific component classes without scoping under
  `.theme-{name}`
