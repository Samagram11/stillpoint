# Theme: Sunny

Warm, cheerful daytime aesthetic with a light blue sky, drifting translucent clouds, a pulsing golden sun, and grass-textured cards. Bright and optimistic.

## Colors

```css
--color-surface:   #D4EEFF;    /* Background — soft sky blue */
--color-ink:       #1B3A2A;    /* Primary text — deep forest green */
--color-accent:    #E8860C;    /* Accent — warm orange */
--color-warm:      #F5C842;    /* Secondary accent — golden yellow */
--color-edge:      #A8D4F0;    /* Borders — pale sky */
--color-emphasis:  #0F2A1A;    /* Hover states — dark green */
```

## Background

Animated daytime sky with three layers:

- **Sun (1):** Golden radial gradient circle in the top-right with a pulsing glow animation (4s cycle). Warm orange-to-yellow gradient with soft box-shadow.
- **Clouds (4):** Translucent white ellipses with blur, drifting slowly left-to-right across the viewport (40-60s cycle, staggered). Varied sizes and vertical positions.

Subtle linear gradient overlay adds warmth to the bottom of the sky.

## Component Styling

- **Cards:** Grass-textured — green gradient (`#7AB648 → #5A9A32`) with subtle inner shadow for depth. Class: `sunny-glass`
- **Inputs:** Frosted sky — `rgba(255, 255, 255, 0.6)` + blur, orange focus glow. Class: `sunny-input`
- **Buttons:** Orange-to-yellow gradient `#E8860C → #F5C842`. Class: `sunny-btn`
- **Breathing circle:** Golden gradient (`#F5C842 → #E8860C`) with warm glowing box-shadow animation

## CSS Class

Applied via `theme-sunny` on `<html>`. Light theme — no `.theme-dark` needed. Overrides `--color-*` variables and scopes component classes with `.theme-sunny .sunny-*` selectors in `globals.css`.

## Inspiration

A perfect summer day — warm sun, blue skies, fluffy clouds, and green grass. Grounding and cheerful.
