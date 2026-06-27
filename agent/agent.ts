import { defineAgent } from "eve";

export default defineAgent({
  // Default to claude-haiku-4.5 (works on free AI Gateway credits).
  // Set FSCOPILOT_MODEL=anthropic/claude-sonnet-4.6 once paid credits are added.
  model: process.env.FSCOPILOT_MODEL ?? "anthropic/claude-haiku-4.5",
});
