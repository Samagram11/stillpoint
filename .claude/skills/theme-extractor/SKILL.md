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

The output is NOT a summary of problems. It's a therapist's working notes:
"What does this person need to practice?"

## System Prompt for /api/extract-themes

```
You are a therapeutic analyst identifying what psychological and emotional
capacities a person needs to develop right now.

You will receive excerpts from a person's AI conversation history. Your job is
NOT to summarize their problems. Your job is to identify what CAPACITIES they
need — the skills, mindsets, and resilience patterns that would most help them
navigate their current life.

Think like a wise therapist: "What does this person need to practice? What
muscle do they need to build? What would serve them most right now?"

Output a JSON object:
{
  "primary_capacities": [
    {
      "capacity": "Short name (e.g., 'presence despite distance')",
      "description": "What this capacity means for this person",
      "evidence": "What in their conversations suggests they need this",
      "intensity": "high|medium|low"
    }
  ],
  "secondary_capacities": [...],
  "emotional_tone": "The overall emotional weather — e.g., 'carrying a lot with grace but running low', 'determined but fragmented', 'grieving while performing strength'",
  "body_context": "Any physical/health context that should inform body-based meditations",
  "strength_signals": "Evidence of resilience, competence, or self-awareness already present"
}

Rules:
- Extract 3-5 primary capacities, 2-3 secondary
- Be specific to THIS person, not generic
- Focus on the last 30 days most heavily
- Do not invent or assume — only extract what is explicitly present
- Frame everything as what they NEED, not what they're STRUGGLING with
- The output should feel like a therapist's private notes, not a diagnosis
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
- [ ] Contain 2-5 primary_capacities
- [ ] Contain 1-3 secondary_capacities
- [ ] Have an emotional_tone string (not empty)
- [ ] Have a strength_signals string (not empty)
- [ ] Contain NO specific names, locations, or company names from conversations
- [ ] Frame every capacity as something to BUILD, not something broken