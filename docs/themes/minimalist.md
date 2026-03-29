# Theme: Minimalist

Default theme. Warm minimalism — Kinfolk magazine meets high-end therapy office.

## Colors

```css
--color-cream:     #F5F0EB;    /* Background */
--color-charcoal:  #2C2C2C;    /* Primary text */
--color-sage:      #8B9D83;    /* Accent, interactive */
--color-clay:      #C4A882;    /* Secondary accent */
--color-mist:      #D4D0CB;    /* Borders, subtle UI */
--color-deep:      #1A1A1A;    /* Hover states */
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

- **Cards:** `bg-white/40 border border-mist`, subtle hover lift
- **Inputs:** `bg-white/50 border border-mist`, sage focus ring
- **Buttons:** `bg-charcoal text-cream`, darkens on hover
- **Breathing circle:** Solid sage with scale/opacity animation
- **Badges:** `bg-sage/10 text-sage`

## CSS Class

Applied via `theme-minimalist` on `<html>`. This is the default — no variable overrides needed, uses the `@theme` values directly.
