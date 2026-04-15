# blockdev-week-1

An OpenAI-backed LLM security demo for a DevRel session on prompt injection, guardrails, and tool safety.

## What is in this repo

- `web/`: a one-page Next.js demo app with mode switching, attack scenarios, and observability logs
- `api/`: a FastAPI backend that compares base provider behavior, vulnerable app glue code, and guarded app behavior

## Demo flow

The live demo is designed for three passes with the same OpenAI model:

1. `Base OpenAI`: show that the provider often refuses the naive direct jailbreak.
2. `Vulnerable App`: show how unsafe prompt construction can still leak app-sensitive identifiers or follow untrusted tool hints.
3. `Guarded App`: replay the same scenario with input isolation and output checks turned on.

## TODO for Session 3

These are the next demo pieces to build so the app matches the full 30-minute runsheet:

- Cold open:
  Keep the live terminal reveal tight. The current app is stronger for provider-vs-app comparison than for a guaranteed system-prompt leak moment, so decide whether to script the first 10 seconds or add a deterministic legacy vulnerable route.
- Injection deep-dive:
  Add more preset attacks, including a DAN-style override, a fake PDF/document injection, and a clearer tool-output hijack variant.
- Input validation:
  Replace the current simple pattern check with a real `InputGuard` class that includes regex matching, token anomaly scoring, semantic similarity, and a weighted `score_and_gate()` result.
- Input validation teaching moment:
  Add Unicode homoglyph attack samples such as `Іgnоrе аll іnstruсtіоns` so you can show regex failure and defense-in-depth.
- Output validation:
  Move guarded mode from free-text checks to structured outputs plus Pydantic parsing, then reject malformed or policy-violating responses.
- Output validation teaching moment:
  Surface the canary token path more clearly in the UI so a blocked canary leak is visually obvious on stage.
- Guardrail architecture:
  Add a visible 5-layer stack diagram for L1 input guard, L2 prompt construction, L3 LLM/tool layer, L4 output guard, and L5 observability.
- Observability:
  Expand the current latest-run log panel into a small history view or anomaly dashboard so the audience can see repeated risk trends.
- Tool safety:
  Add an explicit tool allow-list and a `request_human_review` action path instead of only describing unauthorized actions in text.
- Test assets:
  Create a small bank of 10 attack vectors plus one or two clean prompts so you can rehearse the full flow reliably before recording.

## Run the demo

The frontend calls the live Python API by default, and the API uses a real
OpenAI model for all three modes.

## Run the API

Create `/Users/theo/Documents/blockdev-week-1/api/.env` with:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-5-mini
```

Then start the API:

```bash
cd api
source .venv/bin/activate
pip install -r requirements.txt
python3 main.py
```

Useful URLs:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/docs`

Create `/Users/theo/Documents/blockdev-week-1/web/.env.local` with:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Then start the frontend:

```bash
cd /Users/theo/Documents/blockdev-week-1
pnpm install
pnpm dev
```

Then open the local Next.js URL and try the preset attacks in the right-hand panel.

Recommended recording order:

1. `Base OpenAI` + `Direct Prompt Injection`
2. `Vulnerable App` + `Injected Internal Note`
3. `Guarded App` + replay the same injected note
