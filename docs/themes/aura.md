# Theme: Aura

Iridescent gradients, frosted glass, soft ethereal glow. Inspired by abstract aura gradient art.

## Colors

```css
--color-cream:     #F8F4FF;    /* Background — soft lavender white */
--color-charcoal:  #2D2640;    /* Primary text — deep purple-grey */
--color-sage:      #9B8EC4;    /* Accent — soft purple */
--color-clay:      #D4A0C0;    /* Secondary accent — dusty rose */
--color-mist:      #E8E0F0;    /* Borders — lavender mist */
--color-deep:      #1C1528;    /* Hover states — deep violet */
```

## Background

Three floating gradient blobs with `filter: blur(80px)` and slow drift animation:
- **Blob 1:** Lavender/violet (`#C4B5FD → #A78BFA → #DDD6FE`), top-right
- **Blob 2:** Pink/peach (`#FBCFE8 → #F9A8D4 → #FDE68A`), bottom-left
- **Blob 3:** Mint/teal (`#A7F3D0 → #6EE7B7 → #A5F3FC`), center

Animation: 20s ease-in-out infinite, gentle translate + scale shifts.

## Component Styling

- **Cards:** Frosted glass — `rgba(255,255,255,0.4)` + `backdrop-filter: blur(20px)`, white/purple border. Class: `aura-glass`
- **Inputs:** Frosted — `rgba(255,255,255,0.5)` + blur, purple focus glow. Class: `aura-input`
- **Buttons:** Purple gradient `#7C3AED → #A78BFA`. Class: `aura-btn`
- **Breathing circle:** Rainbow gradient (`#C4B5FD → #F9A8D4 → #A5F3FC`) with glowing box-shadow animation
- **Badges:** `rgba(167,139,250,0.15)` with `#7C3AED` text

## CSS Class

Applied via `theme-aura` on `<html>`. Overrides `--color-*` variables and scopes component classes with `.theme-aura .aura-*` selectors in `globals.css`.

## Inspiration

Abstract aura gradient art — soft blurred forms, holographic color shifts, ethereal and calming.
