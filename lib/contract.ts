import { z } from "zod";

/**
 * FsCopilot JSON contract — the single source of truth shared by the agent
 * endpoint (`app/api/review`) and the UI. The `.describe()` calls double as
 * inline guidance for the model when used as a `generateObject` schema.
 *
 * Keep the enum strings below EXACTLY in sync with the UI — it renders status
 * chips and confidence badges off these literal values.
 */

export const STATUS_VALUES = [
  "Found",
  "Potentially Missing",
  "Needs Clarification",
  "Potentially Weak",
] as const;

export const CONFIDENCE_VALUES = ["High", "Medium", "Low"] as const;

/** Canonical agent timeline steps the UI animates, in order. */
export const TIMELINE_STEPS = [
  "Reading financial statement notes",
  "Detecting company profile",
  "Mapping applicable accounting topics",
  "Checking for disclosure gaps",
  "Generating management questions",
  "Drafting client email",
] as const;

export const statusSchema = z.enum(STATUS_VALUES);
export const confidenceSchema = z.enum(CONFIDENCE_VALUES);

export const companyProfileSchema = z.object({
  summary: z
    .string()
    .describe("1–2 sentence plain-English description of the company."),
  attributes: z
    .array(z.string())
    .describe(
      'Short attribute tags, e.g. ["Private company", "Manufacturing / packaging", "Debt financing"].',
    ),
});

export const applicableTopicSchema = z.object({
  code: z.string().describe('ASC topic code, e.g. "ASC 606".'),
  title: z.string().describe('Topic title, e.g. "Revenue Recognition".'),
  rationale: z.string().describe("One line on why it applies, tied to the notes."),
});

export const findingSchema = z.object({
  id: z
    .string()
    .describe("Stable kebab-case id, e.g. \"variable-lease-payments\"."),
  title: z.string().describe('Short finding title, e.g. "Variable Lease Payments".'),
  status: statusSchema,
  confidence: confidenceSchema,
  whyItMatters: z
    .string()
    .describe("Why a partner would flag this, specific to THIS company's notes."),
  suggestedQuestion: z
    .string()
    .describe("One management question that would resolve the gap."),
});

export const clientEmailSchema = z.object({
  subject: z.string().describe("Email subject line."),
  body: z
    .string()
    .describe(
      "Full plain-text email with greeting, numbered asks, and sign-off. No markdown.",
    ),
});

export const contractSchema = z.object({
  companyProfile: companyProfileSchema,
  applicableTopics: z.array(applicableTopicSchema),
  findings: z.array(findingSchema),
  managementQuestions: z
    .array(z.string())
    .describe("Plain-text questions answerable by management."),
  clientEmail: clientEmailSchema,
});

export type FsReview = z.infer<typeof contractSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type ApplicableTopic = z.infer<typeof applicableTopicSchema>;
export type CompanyProfile = z.infer<typeof companyProfileSchema>;
export type DisclosureStatus = (typeof STATUS_VALUES)[number];
export type Confidence = (typeof CONFIDENCE_VALUES)[number];
