# Theme: Minimalist

Default theme. Warm minimalism — Kinfolk magazine meets high-end therapy office.

## Colors

```css
--color-surface:   #F5F0EB;    /* Background */
--color-ink:       #2C2C2C;    /* Primary text */
--color-accent:    #8B9D83;    /* Accent, interactive */
--color-warm:      #C4A882;    /* Secondary accent */
--color-edge:      #D4D0CB;    /* Borders, subtle UI */
--color-emphasis:  #1A1A1A;    /* Hover states */
```

## Typography

- **Display/Titles:** Cormorant Garamond (Google Fonts, loaded via next/font)
- **Body/UI:** DM Sans (Google Fonts, loaded via next/font)

## Aesthetic Principles

- Generous whitespace — the app should feel like exhaling
- Subtle fade-in animations, no aggressive motion
- No clutter, badges, gamification, or streaks
- Mobile-first

## Component Styling

- **Cards:** `bg-white/40 border border-edge`, subtle hover lift
- **Inputs:** `bg-white/50 border border-edge`, accent focus ring
- **Buttons:** `bg-ink text-surface`, darkens on hover
- **Breathing circle:** Solid accent with scale/opacity animation
- **Badges:** `bg-accent/10 text-accent`

## CSS Class

Applied via `theme-minimalist` on `<html>`. This is the default — no variable overrides needed, uses the `@theme` values directly. Tokens: `surface`, `ink`, `accent`, `warm`, `edge`, `emphasis`.
