# blockdev-week-1

An intentionally vulnerable LLM security demo for a DevRel session on prompt injection, guardrails, and tool safety.

## What is in this repo

- `web/`: a one-page Next.js demo app with a vulnerable chatbot, attack presets, and observability logs
- `api/`: a Python API scaffold for the guardrail phase we will wire in next

## First milestone

This first cut is deliberately insecure so you can record the "break it first" part of the talk:

- the chatbot leaks a fake system prompt
- indirect injection presets can exfiltrate a fake canary token
- suspicious prompts are logged but still allowed

## Run the frontend

```bash
pnpm install
pnpm dev
```

Then open the local Next.js URL and try the preset attacks in the right-hand panel.

## Backend scaffold

The Python backend is included as a scaffold for the next phase where we add `InputGuard` and `OutputGuard`.
