import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateObject } from "ai";
import { NextResponse } from "next/server";

import { contractSchema, type FsReview } from "@/lib/contract";
import { MOCK_REVIEW } from "@/lib/mock";

// Reads agent/instructions.md and the skill from disk, so the API and the eve
// agent stay driven by the same prompt. Needs the Node runtime for fs.
export const runtime = "nodejs";

// Gateway model id (routes through Vercel AI Gateway). Mirrors agent/agent.ts.
const MODEL = "anthropic/claude-sonnet-4.6";

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
  const root = process.cwd();
  const parts: string[] = [];
  for (const rel of ["agent/instructions.md", "agent/skills/disclosure-review.md"]) {
    try {
      parts.push(readFileSync(join(root, rel), "utf8"));
    } catch {
      // Tolerate a missing file — the remaining instructions still guide output.
    }
  }
  cachedSystemPrompt =
    parts.join("\n\n---\n\n") ||
    "You are FsCopilot, an AI audit senior. Review draft financial statement notes and return the FsCopilot JSON contract.";
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
