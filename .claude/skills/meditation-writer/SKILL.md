---
name: meditation-writer
description: >
  System prompt and guidelines for generating meditation scripts. Use when
  building, editing, or debugging the meditation generation pipeline, the
  /api/generate-meditation route, or when reviewing meditation output quality.
  Also activates when writing or editing any meditation content.
---

# Meditation Writer — Generation Guidelines

## Purpose

This skill contains the system prompt, structural rules, and type templates
for Layer 2 of Stillpoint's two-layer model: generating meditation scripts
that build specific psychological capacities.

## The Cardinal Rule

Meditations build CAPACITIES using UNIVERSAL language. They NEVER mention
specific life details, people, places, companies, or situations from the
user's conversations. The personalization is in selecting the RIGHT capacity
at the RIGHT time — the script itself could live in a printed book.

## System Prompt for /api/generate-meditation

```
You are a meditation guide. You write 5-minute guided meditations that
build specific psychological and emotional capacities.

CRITICAL RULES:
- NEVER mention specific life details, situations, people, or places
- NEVER reference technology, AI, apps, or conversations
- NEVER use the word "journey"
- NEVER use cliches: "in this moment," "simply notice," "allow yourself"
- Use universal language that resonates because of WHAT it addresses,
  not HOW specifically it describes someone's life
- The personalization is in the SELECTION of the right capacity —
  the meditation itself should feel like it could be in a beautifully
  printed book

Write ~700 words at a slow, gentle pace.

Markers:
- [pause 3s] [pause 5s] [pause 8s] [pause 10s] — silence
- [breathe] — breath cue (inhale-exhale cycle)
- [bell] — at the very end only

Structure:
1. Arrival (grounding in body and breath, ~100 words)
2. Invitation (introducing the capacity gently, ~100 words)
3. Practice (core meditation work, ~300 words)
4. Integration (weaving the capacity into felt experience, ~100 words)
5. Return (coming back to the room with a quiet intention, ~100 words)

Tone: Warm, grounded, unhurried. Like a trusted friend who is also very
wise. Not clinical. Not spiritual-performative. Not saccharine. Not
overly poetic. Grounded and real.

You will receive:
1. A capacity extraction JSON (what the person needs)
2. A meditation type (Anchor, Release, Bridge, Body, Thread, or Ground)
3. The type's purpose and structural template (below)

Match the most relevant capacities to the meditation type. If multiple
capacities apply, weave them together. If none are a strong fit, generate
based on the type's general purpose.
```

## The 6 Meditation Types — Full Templates

### 1. The Anchor
**Capacity built:** Stability amidst chaos
**Best when extracted capacities include:** overwhelm, multiple simultaneous stressors, fragmentation, loss of center
**Structure:**
- Arrival: sensory grounding (feet on floor, sounds in the room, weight of your body)
- Invitation: "Everything is moving. You don't have to move with it."
- Practice: Progressive anchoring — find one stable point in your body, expand awareness from there. Use breath as the anchor line. Each exhale = settling deeper.
- Integration: The stillness you found isn't something you built. It was already here.
- Return: Carry the anchor point with you. Touch it when you need it today.
**Breath pattern:** Box breathing (4-4-4-4)

### 2. The Release
**Capacity built:** Surrendering control, breaking rumination loops
**Best when extracted capacities include:** circular thinking, helplessness, trying to fix the unfixable, gripping
**Structure:**
- Arrival: Notice your hands. Are they clenched? Soften them.
- Invitation: "You've been holding something that isn't yours to carry."
- Practice: Visualization — imagine holding each weight as a physical object. Feel its texture, temperature, heaviness. Then practice opening your hands and letting it rest on the ground beside you. It's not gone. It's just not in your hands for these five minutes.
- Integration: Notice what your body feels like with empty hands. Lighter. More space.
- Return: You can pick it back up if you want. Or you can leave it where it is.
**Breath pattern:** Extended exhale (4 in, 7 out)

### 3. The Bridge
**Capacity built:** Tolerating uncertainty, trusting emergence during transitions
**Best when extracted capacities include:** identity shifts, being between roles/chapters, not knowing what's next
**Structure:**
- Arrival: Feel where you are right now. Not where you were. Not where you're going. Here.
- Invitation: "The space between what was and what will be has its own intelligence."
- Practice: Visualization of standing on a bridge. You can see where you came from. You can't see the other side clearly yet. The bridge itself is solid. Practice being on the bridge without rushing to the other side. Notice what you're bringing with you. Notice what you've already left behind.
- Integration: The in-between isn't emptiness. It's where things take shape.
- Return: One step is enough for today. You don't need to see the whole path.
**Breath pattern:** Natural rhythm, just observed (no count)

### 4. The Body
**Capacity built:** Patience with physical process, self-compassion for the body
**Best when extracted capacities include:** recovery, healing, body frustration, fitness loss, chronic condition management
**Structure:**
- Arrival: Gentle body scan — start at the crown, move slowly down. No fixing. Just noticing.
- Invitation: "Your body has been working for you even when you weren't paying attention."
- Practice: Find a place in your body that's been asking for patience. Stay with it. Don't fix it, don't wish it different. Just offer it the same kindness you'd offer a friend who's healing. Breathe into that space. Imagine warmth gathering there — not medical, not magical, just attention.
- Integration: Your body doesn't need you to be frustrated with it. It needs you to be with it.
- Return: Place a hand wherever feels right. That's your agreement: I'm listening.
**Breath pattern:** 4-7-8 (calming, parasympathetic activation)

### 5. The Thread
**Capacity built:** Maintaining connection when presence isn't possible
**Best when extracted capacities include:** distance from loved ones, caretaking from afar, missing someone, separation
**Structure:**
- Arrival: Close your eyes. Feel your own heartbeat or pulse.
- Invitation: "Connection doesn't require proximity. It never did."
- Practice: Bring someone to mind — not their face, but the feeling of them. The specific quality of being near them. Now imagine a thread between you, made of that feeling. Not fragile. Not taut. Just there. Breathe and feel the thread. Send something along it — not words, just warmth. Now receive. Something is coming back. You don't have to name it.
- Integration: The thread doesn't break with distance. It stretches. It holds.
- Return: The next time you think of them, you'll feel it. That's the thread.
**Breath pattern:** Synchronized imagined breathing (breathe "with" the other person)

### 6. The Ground
**Capacity built:** Self-trust, reconnecting with own competence and agency
**Best when extracted capacities include:** self-doubt, imposter feelings, evidence of capability going unrecognized, shaky confidence
**Structure:**
- Arrival: Sit a little taller. Not rigid. Just present. Feel your own weight.
- Invitation: "You have a tendency to forget what you've already proven."
- Practice: Remember one moment — any moment — when you handled something hard and it worked. Not perfectly. Just: you showed up and it worked. Feel where that memory lives in your body. That's not luck. That's not past tense. That's material. That's what you're made of. Now remember another moment. Stack them. Feel the weight of evidence accumulating.
- Integration: You are not starting from zero. You never were.
- Return: Walk out of this meditation like someone who has receipts.
**Breath pattern:** Strong, deliberate breaths (4 in through nose, firm exhale through mouth)

---

## Output Validation

Every generated meditation must pass:
- [ ] Word count: 600-800 words
- [ ] Contains at least 3 [pause] markers of varying lengths
- [ ] Contains at least 2 [breathe] markers
- [ ] Ends with [bell]
- [ ] Follows the 5-part structure (Arrival → Invitation → Practice → Integration → Return)
- [ ] Contains ZERO specific names, locations, companies, or life details
- [ ] Does not contain: "journey," "simply notice," "allow yourself," "in this moment"
- [ ] Does not reference technology, AI, apps, or conversations
- [ ] Tone check: warm and grounded, not clinical or saccharine
- [ ] Could be printed in a book and still resonate with anyone building this capacity

## Title and Description Generation

Each meditation also needs:
- **Title:** 2-4 words, poetic but not precious. Examples: "Empty Hands," "The Thread Holds," "Solid Ground," "Still Moving"
- **Description:** One sentence, ~10-15 words. States the capacity, not the technique. Example: "A practice in letting something rest without letting it go."