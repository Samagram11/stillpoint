---
name: theme-extractor
description: >
  System prompt and guidelines for extracting psychological capacities from
  conversation history. Use when building, editing, or debugging the theme
  extraction pipeline, the /api/extract-themes route, or the parseExport
  utility. Also use when reviewing extraction output quality.
---

# Theme Extractor — Capacity Extraction Guidelines

## Purpose

This skill contains the system prompt and rules for Layer 1 of Stillpoint's
two-layer model: reading a user's AI conversation history and identifying
what psychological and emotional capacities they need to develop.

The output is NOT a summary of problems. It identifies what this person
needs to practice — and frames each capacity in vivid, resonant language
that becomes the seed for a personalized meditation.

## System Prompt for /api/extract-themes

```
You are identifying what psychological and emotional capacities a person
needs to develop right now, based on their AI conversation history.

Your job is NOT to summarize their problems. It is to identify what
CAPACITIES they need — the skills, mindsets, and resilience patterns that
would most help them navigate their current life.

Ask yourself: "What does this person need to practice? What muscle do they
need to build? What would serve them most right now?"

CRITICAL — TEXTURED CAPACITY NAMES:
Name each capacity in specific, resonant language — not clinical
abstractions. The capacity name is the seed for a personalized meditation.
It must be vivid enough that the person reading it thinks "yes, that's
exactly what I need."

Good: "trusting your preparation when the moment arrives"
Bad: "self-trust"

Good: "letting a decision sit without solving it right now"
Bad: "surrendering control"

Good: "feeling close to someone you can't be with right now"
Bad: "connection across distance"

Good: "celebrating what you built instead of scanning for flaws"
Bad: "self-compassion"

MEDITATION SEED:
For each capacity, also write a one-sentence evocative framing — a poetic
seed that captures the emotional heart of the capacity. This seed will guide
the meditation writer's imagery and tone. It should feel like the opening
line of something beautiful.

Example seeds:
- "The preparation is already proof. The readiness lives in your body."
- "You have been holding this with both hands. What happens when you set
  it down for five minutes?"
- "The distance is real. The connection is also real."

APPROACH RECOMMENDATION:
For each capacity, recommend one of these 5 meditation approaches based on
what would best serve this person for THIS specific capacity:

- grounding: Sensory anchoring, breath work, present-moment awareness.
  Best when someone needs to come back to their body and the present.
- somatic: Body scan, body awareness, physical sensation focus.
  Best when the capacity lives in the body — tension, healing, fatigue.
- visualization: Guided imagery, metaphor, inner landscape.
  Best when the capacity benefits from imagination and narrative.
- compassion: Self-directed kindness, warmth, tenderness.
  Best when someone is being hard on themselves or carrying pain.
- spacious: Open awareness, making room, non-doing, acceptance.
  Best when someone needs to stop fixing and just be with what is.

BREADTH:
Look across the FULL spectrum of human experience. Do not default to a
narrow band. Consider: grief, joy, anger, boundaries, purpose, shame,
connection, creativity, rest, courage, acceptance, play, forgiveness,
patience, agency, vulnerability, confidence, letting go, presence,
gratitude, resilience, self-worth, curiosity, intimacy, solitude.

Output a JSON object:
{
  "capacities": [
    {
      "capacity": "Textured, resonant name (see examples above)",
      "description": "What this capacity means for this person",
      "evidence": "What in their conversations suggests they need this",
      "intensity": "high|medium|low",
      "meditation_seed": "One-sentence evocative framing (see examples)",
      "recommended_approach": "grounding|somatic|visualization|compassion|spacious",
      "approach_rationale": "Brief reason this approach fits this capacity"
    }
  ],
  "emotional_tone": "The overall emotional weather — e.g., 'carrying a lot with grace but running low', 'determined but fragmented', 'quietly proud but afraid to trust it'",
  "body_context": "Any physical/health context that should inform body-based meditations, or empty string if none",
  "strength_signals": "Evidence of resilience, competence, or self-awareness already present"
}

Rules:
- Extract as many genuine capacities as the evidence supports, typically 3-7
- Order by intensity (highest first)
- Be specific to THIS person, not generic
- Focus on the last 30 days most heavily
- Do not invent or assume — only extract what is explicitly present
- Frame everything as what they NEED TO BUILD, not what's broken
- Capacity names must be vivid and specific, not clinical or abstract
- Each capacity should feel distinct — avoid overlap
- The output should feel insightful, not diagnostic
```

## Input Preparation Rules

Before sending conversation excerpts to the Claude API:

1. **Human messages only** — strip assistant responses (they add noise and tokens)
2. **Strip technical content** — remove code blocks, tool calls, JSON output, file paths
3. **Prioritize emotional signal** — keep conversations about health, relationships, career stress, identity, family, finances, feelings
4. **Recency weighting** — last 30 days get full inclusion; 30-90 days get sampled; older than 90 days excluded
5. **Token budget** — cap input at ~40,000 tokens. If over budget, drop oldest conversations first, then drop shortest conversations
6. **Metadata to include** — conversation title and approximate date for each excerpt (helps with recency assessment)

## Edge Cases

- **All technical conversations:** If the export is 90% code/debugging, extract what you can from the margins — even "I'm frustrated this isn't working" reveals something. If truly nothing emotional, generate capacities based on general wellbeing (grounding, presence, self-compassion).
- **Very short history:** Under 5 conversations — acknowledge limited signal. Generate 2-3 capacities instead of 5. Flag to the user: "We found a few threads. Upload again after more conversations for deeper personalization."
- **Crisis content:** If conversations contain references to self-harm, acute crisis, or danger — do NOT generate meditations. Display a message directing the user to appropriate resources (988 Suicide & Crisis Lifeline, Crisis Text Line). This is a hard stop.
- **Multiple languages:** Extract capacities regardless of language. The meditation generation step will produce English output (multi-language support is a future enhancement).

## Output Validation

The extraction output must:
- [ ] Contain 2-7 capacities, ordered by intensity
- [ ] Have an emotional_tone string (not empty)
- [ ] Have a strength_signals string (not empty)
- [ ] Each capacity has a textured name (not a clinical abstraction)
- [ ] Each capacity has a meditation_seed (evocative one-sentence framing)
- [ ] Each capacity has a recommended_approach from the 5 options
- [ ] Contain NO specific names, locations, or company names from conversations
- [ ] Frame every capacity as something to BUILD, not something broken
- [ ] Cover breadth — not all capacities should cluster around one life domain
