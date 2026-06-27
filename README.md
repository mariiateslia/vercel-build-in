# FsCopilot — Financial Statements Copilot

> An AI audit senior performing a **disclosure review before partner review**.

FsCopilot takes draft financial-statement notes, infers the company profile, maps the
applicable US GAAP / ASC topics, flags likely disclosure gaps, and returns a structured
review — company profile, findings, management questions, and a draft client email.

Built on Vercel's [**eve**](https://eve.dev) agent framework (model via AI Gateway) with a
Next.js app that exposes a strict-contract HTTP endpoint. The UI is built separately in
**v0** and talks to this endpoint.

## Architecture

- `agent/instructions.md` — the **conversational** FS Copilot agent (greet → analyze PDF →
  confirm understanding → ≤10 follow-ups → final deliverable). Drives the eve REPL + chat UI.
- `agent/skills/disclosure-review.md` — the disclosure-review playbook (loaded on demand).
- `agent/agent.ts` — model config (`anthropic/claude-sonnet-4.6` via AI Gateway).
- `agent/channels/eve.ts` — eve's native HTTP channel (`POST /eve/v1/session`).
- `lib/contract.ts` — the **JSON contract** as a Zod schema + `FsReview` type (source of truth).
- `lib/mock.ts`, `lib/sample-notes.ts` — mock-first demo data.
- `app/api/review/route.ts` — the structured `{ notes } → FsReview` endpoint the v0 UI calls.
  Single-shot strict JSON; uses its own contract prompt (not the conversational instructions).
- `docs/v0-prompt.md` — the v0 UI handoff kit (prompt + types + wiring).

## The contract

`POST /api/review` with `{ "notes": "<raw text>" }` returns:

```ts
type FsReview = {
  companyProfile: { summary: string; attributes: string[] };
  applicableTopics: { code: string; title: string; rationale: string }[];
  findings: {
    id: string; title: string;
    status: "Found" | "Potentially Missing" | "Needs Clarification" | "Potentially Weak";
    confidence: "High" | "Medium" | "Low";
    whyItMatters: string; suggestedQuestion: string;
  }[];
  managementQuestions: string[];
  clientEmail: { subject: string; body: string };
};
```

The response carries an `x-fscopilot-mode: mock | live` header.

## Run it

```bash
npm install            # already installed by `eve init`
npm run dev            # Next.js + eve dev server on http://localhost:3000
```

Test the endpoint (mock path works with no key):

```bash
curl -s -X POST http://localhost:3000/api/review \
  -H 'content-type: application/json' \
  -d '{"notes":"...draft notes..."}' | jq
```

### Mock-first → live

The endpoint returns the built-in mock (`lib/mock.ts`) whenever there is **no**
`AI_GATEWAY_API_KEY` set, when you pass `?mock=1`, or if a live call fails — so a demo
always works. To go live:

1. Copy `.env.example` → `.env.local` and set `AI_GATEWAY_API_KEY` (get one at
   <https://vercel.com/ai-gateway>, or run `eve link` to pull credentials from a linked
   Vercel project).
2. Restart `npm run dev`. `/api/review` now returns model output (`x-fscopilot-mode: live`).

The eve agent REPL (for interactive testing of the same agent) runs with:

```bash
npm exec -- eve dev
```

## UI (v0)

The UI is generated separately in v0. Import this repo into v0 (it gets the `FsReview` type
and mock), then follow [`docs/v0-prompt.md`](docs/v0-prompt.md). The v0 app POSTs `{ notes }`
to `/api/review` and renders the returned `FsReview` (6-step timeline → result cards).
