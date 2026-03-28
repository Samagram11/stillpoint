# Learning Claude Code with Stillpoint

This guide teaches you Claude Code's most powerful features by using them to build Stillpoint. Each section maps a Claude Code capability to a real part of the project.

Read this file when you're learning. Don't put it in CLAUDE.md — that file loads every session and should stay lean.

---

## The Big Picture

Claude Code has six extension points that turn it from "a chatbot in your terminal" into a full development system:

| Feature | What It Does | Analogy |
|---|---|---|
| **CLAUDE.md** | Project memory that loads every session | A README that your AI pair programmer actually reads |
| **Skills** | Reusable instruction packs that auto-activate | Recipes Claude pulls off the shelf when relevant |
| **Subagents** | Specialized workers with focused jobs | Junior devs you delegate specific tasks to |
| **MCP Servers** | Connections to external tools (GitHub, etc.) | USB ports for your AI |
| **Hooks** | Automated scripts at lifecycle events | Git hooks, but for Claude Code |
| **Plan Mode** | Think-then-act workflow | Architect reviews before any code is written |

You'll set up and use all six while building Stillpoint.

---

## 1. CLAUDE.md — Project Memory

### What It Is
A markdown file at your project root that Claude Code reads automatically at the start of every session. No setup required — just create the file and Claude Code finds it.

### Why It Matters
Without CLAUDE.md, you re-explain your project every session: "We're using Next.js with Tailwind, the design uses Cormorant Garamond, the colors are..." With it, Claude Code starts every session already knowing your stack, conventions, design system, and rules.

### What Goes In It
- Stack and framework choices
- Design system (colors, fonts, spacing)
- File structure
- API patterns and prompt templates
- Coding conventions
- Forbidden patterns (what NOT to do)
- Current build phase and priorities

### What Stays Out
- Tutorials (put them here, in LEARNING.md)
- Documentation for contributors (put it in README.md)
- Lengthy explanations of why decisions were made

### How to Test It
Open Claude Code in the Stillpoint directory and ask: "What do you know about this project?" It should recite the design system, stack, and conventions without you explaining anything.

### Three Levels of CLAUDE.md
```
~/.claude/CLAUDE.md          → Personal preferences (all projects)
./CLAUDE.md                  → This project's memory
./.claude/rules/*.md         → Path-scoped rules (e.g., different rules for /api vs /components)
```

For Stillpoint, you only need the project-level CLAUDE.md to start.

---

## 2. Skills — Auto-Invoked Knowledge Packs

### What They Are
Markdown files in `.claude/skills/` that Claude Code loads when relevant to your conversation, or that you trigger manually with `/skill-name`.

### How They Differ from CLAUDE.md
CLAUDE.md loads **every session**. Skills load **only when needed**. This keeps your context window efficient — Claude Code isn't burning tokens on meditation-writing rules when you're working on the upload component.

### Creating Your First Skill

```bash
mkdir -p .claude/skills/meditation-writer
```

Create `.claude/skills/meditation-writer/SKILL.md`:
```yaml
---
name: meditation-writer
description: >
  Guidelines for writing and editing meditation scripts.
  Use when generating meditation content, editing meditation
  prompts, or reviewing meditation output quality.
---

# Meditation Writing Guidelines

## Core Rule
Meditations build CAPACITIES. They never mention specific life details.
The personalization is in selecting the RIGHT capacity — the script
itself uses universal language.

## Pacing
- Target: ~700 words for 5 minutes
- [pause 3s], [pause 5s], [pause 8s], [pause 10s] for silence
- [breathe] for breath cues
- [bell] at the very end

## Structure
1. Arrival (grounding in body and breath)
2. Invitation (introducing the capacity)
3. Practice (core meditation work)
4. Integration (weaving into felt experience)
5. Return (coming back with quiet intention)

## Tone
- Warm, grounded, unhurried
- Like a trusted friend who is also very wise
- Never clinical, never saccharine
- Never use: "journey," names, tech references, specific life details

## The 6 Types
[Reference meditationTypes.ts for full templates]
```

### Skills to Build for Stillpoint

**meditation-writer** — Loads when generating or editing meditation content.

**theme-extractor** — Loads when working on the parsing/extraction pipeline. Contains the capacity extraction JSON schema and edge cases.

**privacy-checker** — Manual only (`/privacy-checker`). Audits the codebase for data leakage: does raw conversation data ever flow to the server? Console.logs leaking content? Set `disable-model-invocation: true` so Claude doesn't auto-trigger this.

**ux-reviewer** — Manual only (`/ux-reviewer`). Checks components against the design system. Correct colors? Right fonts? Dark mode support? Whitespace generous enough?

### Testing Skills
After creating meditation-writer, try these:
1. Ask Claude Code: "Write a test meditation about releasing control" — does it automatically load the skill?
2. If not, type `/meditation-writer` to invoke it directly
3. Compare output with and without the skill loaded

### Pro Tips
- Keep SKILL.md under 500 lines. Put reference material in sibling files.
- Use `disable-model-invocation: true` for skills with side effects (like deploying or auditing)
- Use `user-invocable: false` for background knowledge that isn't a command

---

## 3. Subagents — Delegated Specialists

### What They Are
Independent Claude instances with their own system prompt and restricted tool access. They work in isolation and report back. Think of them as focused contractors.

### Why Use Them
Separation of concerns. Your meditation writer doesn't need access to deployment config. Your test writer shouldn't edit production code. Subagents keep each job focused.

### Creating the Meditation Agent

Create `.claude/agents/meditation-agent.md`:
```yaml
---
name: meditation-agent
description: >
  Generates personalized meditation scripts from capacity data.
  Handles creative content generation for all 6 meditation types.
tools: Read, Grep, Glob, Write, Bash
---

You are the meditation content generator for Stillpoint.

Given a capacity extraction JSON, generate all 6 meditation types.
Follow the guidelines in .claude/skills/meditation-writer/SKILL.md.

For each meditation:
1. Read the capacity data
2. Match primary capacities to the most relevant meditation type
3. Write the script (~700 words)
4. Validate: word count, [pause] markers, [breathe] markers, [bell] at end
5. Confirm: NO specific life details, NO names, NO tech references
6. Save to the specified output location

Output: JSON array of meditation objects with fields:
  type, title, description, script, wordCount
```

### Creating the Test Agent

Create `.claude/agents/test-agent.md`:
```yaml
---
name: test-agent
description: Writes and runs tests for Stillpoint components and utilities.
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
---

You write and run tests for Stillpoint. You cannot modify source code —
only read it and create test files.

Use Jest for unit tests. Focus on:
- parseExport.ts: handles malformed JSON, missing fields, various export formats
- extractCapacities: validates JSON schema output
- meditationTypes.ts: each type template produces valid structure
- SSML conversion: [pause] and [breathe] markers map correctly
```

Note: The test agent has `disallowedTools: Write, Edit` — it can create new test files via Bash but can't modify your source code. This is intentional safety.

### How to Use Subagents
- Type `@meditation-agent generate from capacities.json` in Claude Code
- Or Claude will spawn it automatically when the task matches the description
- Results appear in your main session after the subagent completes

### Learning Experiment
Generate a meditation two ways:
1. Ask Claude Code directly: "Write a grounding meditation for someone who needs to practice stability"
2. Delegate to `@meditation-agent` with the same input
Compare consistency and quality. The subagent, with its focused prompt, usually wins.

---

## 4. MCP Servers — External Tool Connections

### What They Are
Model Context Protocol servers let Claude Code interact with GitHub, databases, APIs, and other external services directly from your terminal.

### Setting Up GitHub MCP (Essential for Open Source)

Option A — CLI:
```bash
claude mcp add github -- npx -y @anthropic-ai/mcp-github
```

Option B — Config file at `.claude/.mcp.json`:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-github"]
    }
  }
}
```

### What You Can Do With It
Once connected, try these in Claude Code:
- "Create a GitHub issue titled 'Add dark mode toggle' with label 'good first issue'"
- "Open a PR for the current branch with a description of what changed"
- "List open issues on this repo"
- "Create 5 'good first issue' items for new contributors"

### Why It Matters for Stillpoint
You're shipping open source. Managing issues, PRs, and contributor flow from inside Claude Code — without switching to a browser — is a real workflow improvement. Set this up in Phase 6 when you're ready to ship.

### Important Context Limit Note
Each MCP server adds tools to your context window. Keep it under 10 active MCP servers / 80 tools total. For Stillpoint, you only need GitHub.

---

## 5. Hooks — Automated Guardrails

### What They Are
Deterministic scripts that fire at lifecycle events. Not AI — just automation. Like Git hooks but for Claude Code.

### When They Fire
- `PreToolUse` — Before Claude runs a tool (block dangerous actions)
- `PostToolUse` — After Claude runs a tool (lint, validate, notify)
- `SessionStart` — When you open Claude Code
- `SessionEnd` — When you close it

### Hooks for Stillpoint

Add to `.claude/settings.json`:

**Auto-lint after every file write:**
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "npx eslint --fix $CLAUDE_FILE_PATH 2>/dev/null || true"
      }]
    }]
  }
}
```

**Block .env.local from being committed or exposed:**
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -qE '\\.env\\.local|ANTHROPIC_API_KEY|ELEVENLABS_API_KEY'; then echo 'BLOCKED: Potential credential exposure'; exit 1; fi"
      }]
    }]
  }
}
```

### Why the .env Hook Matters
You're building an open source project. Your API keys are in `.env.local`. One careless `cat .env.local` or accidental commit pushes your keys to a public repo. The hook prevents this by blocking any Bash command that references credential files or key values.

Set this up in Phase 4 — before you do anything near deployment.

---

## 6. Plan Mode — Spec First, Then Build

### What It Is
Instead of Claude Code immediately writing code, you ask it to plan. It researches your codebase, proposes an approach, and waits for approval.

### How to Use It
Prefix any request with "Plan" or use the `/plan` command:
```
> Plan how to build the UploadZone component. It should:
  - Accept ZIP or JSON files via drag-and-drop
  - Parse the Claude export format client-side
  - Extract human messages, strip tool calls and code blocks
  - Show a preview: "Found X conversations from Y date range"
  - Handle errors gracefully (wrong file type, corrupted JSON)
```

Claude Code will:
1. Research the Claude export format
2. Propose parsing logic
3. Suggest component structure
4. Identify edge cases
5. Wait for your approval before writing any code

### When to Use It
Every non-trivial feature in Stillpoint. Specifically:
- Phase 1: UploadZone component architecture
- Phase 2: Export parser logic (the format is fragile)
- Phase 3: Meditation generation pipeline (multiple API calls in sequence)
- Phase 4: Audio generation and text-audio sync
- Phase 5: Full-screen player with all the interactive elements

### The Principle
Plan Mode is where *you* make architectural decisions. Claude proposes, you approve. This produces measurably better code than letting Claude Code run unsupervised on complex features.

---

## Putting It All Together

Here's how the features compose during a typical Stillpoint development session:

```
You open Claude Code in the stillpoint/ directory
    ↓
CLAUDE.md loads automatically (Claude knows your stack, design system, conventions)
    ↓
You say: "Build the VoiceSelector component"
    ↓
Claude Code enters Plan Mode (you've trained it to plan first via CLAUDE.md conventions)
    ↓
Plan references voices.ts for the 6 voice options
    ↓
You approve the plan
    ↓
Claude Code builds the component
    ↓
PostToolUse hook auto-lints the written file
    ↓
You invoke /ux-reviewer to check against the design system
    ↓
You say: "Create a GitHub issue for adding a voice preview feature"
    ↓
GitHub MCP handles it without you leaving the terminal
    ↓
Done. One component, quality-checked, with a follow-up issue created.
```

That's the full loop: Memory → Plan → Build → Lint → Review → Track.

---

## Recommended Learning Path

| Phase | Features to Set Up | What You'll Learn |
|---|---|---|
| Phase 1 | CLAUDE.md, Plan Mode | How project memory eliminates re-explaining; spec-first workflow |
| Phase 2 | theme-extractor skill, privacy-checker skill | Auto-invoked vs manual skills; context efficiency |
| Phase 3 | meditation-writer skill, meditation-agent subagent | Delegating creative work; tool restrictions; comparing direct vs delegated output |
| Phase 4 | Hooks (lint, credential protection) | Automated guardrails; preventing mistakes before they happen |
| Phase 5 | ux-reviewer skill | Quality review workflows |
| Phase 6 | GitHub MCP | External tool integration; managing open source from terminal |

Build in this order. Each phase adds one or two Claude Code features so you learn them in context, not in theory.