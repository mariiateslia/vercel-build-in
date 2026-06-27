# FsCopilot — v0 UI prompt

This is the handoff kit for building the FsCopilot UI in **v0**. The agent + contract
endpoint already exist in this repo. Import this repo into v0 so it picks up the shared
types and mock, then paste the prompt below.

- Contract type: `lib/contract.ts` → `FsReview` (import it; don't redefine the shape).
- Mock-first fixture: `lib/mock.ts` → `MOCK_REVIEW` (render this before wiring live).
- Sample notes: `lib/sample-notes.ts` → `SAMPLE_NOTES` (the "Use sample notes" button content).
- Endpoint: `POST /api/review` with `{ "notes": string }` → returns `FsReview`.

---

## Paste this into v0

Build a one-page **FsCopilot** app — "Financial Statements Copilot". Next.js (App Router),
TypeScript, Tailwind. Premium / minimal aesthetic in the style of Linear / Vercel / Notion:
neutral off-white background, dark text, subtle 1px borders, soft rounded cards, generous
spacing, restrained typography. NOT corporate-blue SaaS. No gradients-as-decoration.

**Header**
- Wordmark **FsCopilot** on the left.
- Tagline: "Disclosure review before partner review."
- A small pill/badge on the right: "Built for CPAs".

**Layout — two columns, stack vertically on mobile.**

**Left column — input**
- A large textarea for draft financial-statement notes (monospace-ish, ~14 rows).
- A subtle "Use sample notes" text button that fills the textarea with `SAMPLE_NOTES`.
- A primary "Run disclosure review" button (disabled while running / when empty).

**Right column — progress + results**
- An agent progress timeline of these 6 steps, animated in order, each with a state of
  pending → running → complete (checkmark). Steps:
  1. Reading financial statement notes
  2. Detecting company profile
  3. Mapping applicable accounting topics
  4. Checking for disclosure gaps
  5. Generating management questions
  6. Drafting client email
- After completion, render the result cards below the timeline.

**Result cards** (each a soft bordered card with a clear section title):
1. **Company Profile** — `companyProfile.summary` as a sentence, with
   `companyProfile.attributes[]` shown as small chips/tags.
2. **Applicable Topics** — list of `applicableTopics[]`: show `code` as a mono badge,
   `title` bold, `rationale` muted below.
3. **Potentially Missing Disclosures** — list of `findings[]`, each row **expandable**
   (collapsed shows `title` + a colored status chip + a confidence badge; expanded reveals
   `whyItMatters` and `suggestedQuestion`). Status chip colors:
   - "Found" → green, "Potentially Missing" → amber, "Needs Clarification" → blue,
     "Potentially Weak" → orange/red. Confidence badge: High / Medium / Low.
4. **Questions for Management** — numbered list of `managementQuestions[]`, with a
   "Copy all" button.
5. **Draft Client Email** — show `clientEmail.subject` (bold) and `clientEmail.body`
   (preserve line breaks, plain text), with a "Copy email" button.

**Data wiring**
- Define the data source behind a single function so it can flip between mock and live
  without changing UI code (kickoff fallback requirement — a demo must always work):

  ```ts
  import type { FsReview } from "@/lib/contract";
  import { MOCK_REVIEW } from "@/lib/mock";

  const API_BASE = process.env.NEXT_PUBLIC_FSCOPILOT_API ?? ""; // same-origin if proxied

  async function runReview(notes: string): Promise<FsReview> {
    // Mock-first: swap to the live call once the endpoint is reachable.
    // return MOCK_REVIEW;
    const res = await fetch(`${API_BASE}/api/review`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) throw new Error(`Review failed: ${res.status}`);
    return (await res.json()) as FsReview;
  }
  ```

- On "Run disclosure review": start the timeline animation, call `runReview(notes)`,
  then mark steps complete and render the cards from the returned `FsReview`.
- The endpoint returns an `x-fscopilot-mode` header (`mock` | `live`) — optionally surface
  a tiny "demo data" indicator when it's `mock`.

The `FsReview` shape (from `lib/contract.ts`) is the source of truth:

```ts
type FsReview = {
  companyProfile: { summary: string; attributes: string[] };
  applicableTopics: { code: string; title: string; rationale: string }[];
  findings: {
    id: string;
    title: string;
    status: "Found" | "Potentially Missing" | "Needs Clarification" | "Potentially Weak";
    confidence: "High" | "Medium" | "Low";
    whyItMatters: string;
    suggestedQuestion: string;
  }[];
  managementQuestions: string[];
  clientEmail: { subject: string; body: string };
};
```
