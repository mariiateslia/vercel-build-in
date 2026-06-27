import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateObject } from "ai";
import { NextResponse } from "next/server";

import { contractSchema, type FsReview } from "@/lib/contract";
import { MOCK_REVIEW } from "@/lib/mock";

// This endpoint is the single-shot, strict-JSON path for the v0 UI. It does NOT
// use agent/instructions.md — those drive the conversational eve agent (greet,
// ask for a PDF, multi-turn interview) and would corrupt structured output.
// Instead it uses its own contract-focused prompt plus the disclosure-review
// skill. Needs the Node runtime for fs.
export const runtime = "nodejs";

// Strict system prompt for one-shot contract generation (kept separate from the
// conversational agent instructions).
const CONTRACT_SYSTEM_PROMPT = `You are FS Copilot, an AI audit senior performing a disclosure review of draft financial-statement notes before partner review.

You are not a chatbot here: you receive the full draft notes in one message and return a single structured review. Do NOT greet the user, ask for a PDF, or ask follow-up questions.

Always (1) infer the company profile from the notes, then (2) evaluate the draft disclosures in that context. Be specific to THIS company — cite what the notes do and do not say. Frame findings against US GAAP / ASC topics. Findings should be the disclosures a partner is most likely to flag. Management questions must be answerable by management. The client email must be short and professional.

Use professional, cautious language ("potentially missing", "consider adding", "may require disclosure", "based on the information provided"). Never claim the statements are definitively wrong or GAAP compliant. Never invent facts or fabricate disclosures.`;

// Gateway model id (routes through Vercel AI Gateway). Mirrors agent/agent.ts.
// Default is claude-haiku-4.5 (accessible on free AI Gateway credits). Override
// with FSCOPILOT_MODEL=anthropic/claude-sonnet-4.6 once paid credits are added.
const MODEL = process.env.FSCOPILOT_MODEL ?? "anthropic/claude-haiku-4.5";

// The v0 UI lives on a different origin, so allow cross-origin calls. Set
// FSCOPILOT_ALLOWED_ORIGIN to lock this down to the deployed UI origin.
const ALLOW_ORIGIN = process.env.FSCOPILOT_ALLOWED_ORIGIN ?? "*";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
};

function json(body: unknown, init: { status?: number; mode?: string; fallback?: string } = {}) {
  const headers: Record<string, string> = { ...CORS_HEADERS };
  if (init.mode) headers["x-fscopilot-mode"] = init.mode;
  if (init.fallback) headers["x-fscopilot-fallback"] = init.fallback;
  return NextResponse.json(body, { status: init.status ?? 200, headers });
}

let cachedSystemPrompt: string | null = null;

function buildSystemPrompt(): string {
  if (cachedSystemPrompt) return cachedSystemPrompt;
  // Strict contract prompt + the disclosure-review playbook (the skill is a
  // non-conversational checklist, so it stays useful for one-shot output).
  let skill = "";
  try {
    skill = readFileSync(join(process.cwd(), "agent/skills/disclosure-review.md"), "utf8");
  } catch {
    // Tolerate a missing skill file — the contract prompt alone still guides output.
  }
  cachedSystemPrompt = skill
    ? `${CONTRACT_SYSTEM_PROMPT}\n\n---\n\n${skill}`
    : CONTRACT_SYSTEM_PROMPT;
  return cachedSystemPrompt;
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: Request) {
  // 1. Parse and validate input.
  let notes: unknown;
  try {
    notes = (await req.json())?.notes;
  } catch {
    return json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (typeof notes !== "string" || notes.trim().length === 0) {
    return json({ error: "Body must include a non-empty `notes` string." }, { status: 400 });
  }

  // 2. Mock-first: no key (or ?mock=1) → return the mock so a demo always works.
  const url = new URL(req.url);
  const forceMock = url.searchParams.get("mock") === "1";
  if (forceMock || !process.env.AI_GATEWAY_API_KEY) {
    return json(MOCK_REVIEW, { mode: "mock" });
  }

  // 3. Live path: structured generation guarantees valid contract JSON.
  try {
    const { object } = await generateObject({
      model: MODEL,
      schema: contractSchema,
      system: buildSystemPrompt(),
      prompt: `Review these draft financial-statement notes and return the FsCopilot contract:\n\n${notes}`,
    });
    return json(object satisfies FsReview, { mode: "live" });
  } catch (err) {
    // Never break the demo — fall back to the mock and surface the reason.
    console.error("[/api/review] live generation failed, falling back to mock:", err);
    return json(MOCK_REVIEW, { mode: "mock", fallback: "error" });
  }
}
