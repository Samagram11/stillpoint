# Theme: Cosmic

Bright, girly space aesthetic with vibrant purple stars, hot pink planets, and drifting rocket ships. Playful and feminine with a dark cosmic backdrop.

## Colors

```css
--color-surface:       #1A0A2E;    /* Background — deep space violet */
--color-ink:           #F5E6FF;    /* Primary text — soft lavender white */
--color-accent:        #FF69B4;    /* Accent — hot pink */
--color-warm:          #C77DFF;    /* Secondary accent — vibrant purple */
--color-edge:          #3D1A6E;    /* Borders — dark purple */
--color-emphasis:      #FFB6E1;    /* Hover states — light pink */
/* Dark theme tokens (consumed by .theme-dark shared overrides) */
--dark-card-bg:        rgba(15, 5, 35, 0.85);   /* Translucent dark card */
--dark-card-hover:     rgba(20, 10, 45, 0.9);   /* Card hover state */
--dark-accent-bright:  #FF91CF;                  /* Brightened accent for readability */
```

## Background

Animated space scene with three layers:

- **Stars (24):** 12 pink/purple/gold circles + 12 small pale yellow (#FFFACD, #FFF8DC) circles scattered across the viewport with twinkling animation (scale + opacity pulse, 2s cycle, staggered delays)
- **Planets (3):** Radial gradient spheres with inner shadow for 3D look and soft glow. Hot pink (#FF1493), violet (#9B30FF), and pink (#FF69B4). Gentle floating animation (25s cycle)
- **Rockets (2):** Emoji rocket ships (🚀) that drift upward across the screen over 30s, looping continuously at staggered intervals

Subtle radial gradient overlays add depth to the dark background.

## Component Styling

- **Cards:** Dark glass — `rgba(30, 15, 60, 0.6)` + `backdrop-filter: blur(20px)`, purple border. Class: `cosmic-glass`
- **Inputs:** Dark frosted — `rgba(30, 15, 60, 0.5)` + blur, pink focus glow. Class: `cosmic-input`
- **Buttons:** Pink-to-purple gradient `#FF1493 → #9B30FF`. Class: `cosmic-btn`
- **Breathing circle:** Hot pink → purple gradient (`#FF69B4 → #C77DFF → #9B30FF`) with glowing box-shadow animation

## CSS Class

Applied via `theme-cosmic` + `theme-dark` on `<html>`. The `theme-dark` class activates shared utility overrides (card backgrounds, text contrast, badge colors) that any dark theme gets for free. Theme-specific component styles are scoped with `.theme-cosmic .cosmic-*` selectors in `globals.css`.

Scoped component wrappers: `cosmic-toggle` (ThemeSelector), `cosmic-voice-input` (VoiceSelector).

## Inspiration

Cute, girly space art — vibrant neon planets, twinkling stars, and playful rocket ships against a deep cosmic purple sky. Think Lisa Frank meets NASA.
