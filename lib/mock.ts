import type { FsReview } from "@/lib/contract";

/**
 * Mock disclosure review built from the kickoff §7 expected output.
 *
 * Powers the mock-first demo: the `/api/review` endpoint returns this whenever
 * no AI Gateway key is configured (or the live call fails), so a demo always
 * exists. It is also the fixture the v0 UI renders against before wiring live.
 *
 * Must satisfy `contractSchema.parse()` — keep enum values legal.
 */
export const MOCK_REVIEW: FsReview = {
  companyProfile: {
    summary:
      "A privately held US manufacturer of specialty food and beverage packaging that sells to several large retail and wholesale customers and is financed with bank debt.",
    attributes: [
      "Private company",
      "Manufacturing / packaging",
      "Debt financing",
      "Operating leases",
      "Income taxes",
      "Revenue recognition",
      "Related-party transactions",
      "Customer credit exposure",
    ],
  },
  applicableTopics: [
    {
      code: "ASC 606",
      title: "Revenue Recognition",
      rationale:
        "Notes describe recognizing revenue when control transfers on shipment with net 30–60 terms.",
    },
    {
      code: "ASC 842",
      title: "Leases",
      rationale:
        "Office and warehouse held under noncancelable operating leases expensed straight-line.",
    },
    {
      code: "ASC 740",
      title: "Income Taxes",
      rationale:
        "Asset-and-liability method with deferred tax assets and liabilities for temporary differences.",
    },
    {
      code: "ASC 850",
      title: "Related Party Disclosures",
      rationale:
        "Company leases equipment from an entity controlled by a member of management.",
    },
    {
      code: "ASC 855",
      title: "Subsequent Events",
      rationale:
        "Notes state subsequent events were evaluated through the date the statements were available to be issued.",
    },
    {
      code: "ASC 450",
      title: "Contingencies",
      rationale:
        "Commitments and contingencies are not addressed in the draft notes and should be confirmed.",
    },
    {
      code: "ASC 820",
      title: "Fair Value Measurement",
      rationale:
        "Bank debt may require fair value or interest-rate disclosures depending on terms.",
    },
    {
      code: "Concentration Risk",
      title: "Concentration of Credit Risk",
      rationale:
        "Sales to several large customers suggest potential customer/credit concentration to disclose.",
    },
  ],
  findings: [
    {
      id: "variable-lease-payments",
      title: "Variable Lease Payments",
      status: "Potentially Missing",
      confidence: "Medium",
      whyItMatters:
        "The lease note mentions operating leases but does not clarify whether variable lease costs (CAM, usage-based rent, or CPI adjustments) exist, which ASC 842 requires disclosing.",
      suggestedQuestion:
        "Do you incur variable lease payments such as CAM, usage-based rent, or CPI adjustments?",
    },
    {
      id: "lease-maturity-table",
      title: "Lease Maturity Table",
      status: "Potentially Missing",
      confidence: "High",
      whyItMatters:
        "ASC 842 requires a maturity analysis of lease liabilities; the draft notes describe operating leases but include no maturity schedule.",
      suggestedQuestion:
        "Can you provide the future minimum lease payment schedule by year for the next five years and thereafter?",
    },
    {
      id: "concentration-of-credit-risk",
      title: "Concentration of Credit Risk",
      status: "Needs Clarification",
      confidence: "Medium",
      whyItMatters:
        "Sales to several large customers may create concentration of credit risk, but the notes do not quantify any single customer's share of revenue or receivables.",
      suggestedQuestion:
        "Does any single customer represent 10% or more of revenue or accounts receivable at year-end?",
    },
    {
      id: "debt-covenant-details",
      title: "Debt Covenant Details",
      status: "Needs Clarification",
      confidence: "Medium",
      whyItMatters:
        "The debt note states covenants exist and management believes it was in compliance, but does not describe the covenants, any waivers, or unused borrowing capacity.",
      suggestedQuestion:
        "What are the specific financial covenants, were there any violations or waivers, and how much of the revolving line remains unused?",
    },
    {
      id: "related-party-lease-terms",
      title: "Related-Party Lease Terms",
      status: "Potentially Weak",
      confidence: "Low",
      whyItMatters:
        "ASC 850 requires the nature, terms, and amounts of related-party arrangements; the note discloses the relationship but not the dollar amounts or duration.",
      suggestedQuestion:
        "What are the annual amounts, term length, and pricing basis of the equipment lease with the related party?",
    },
  ],
  managementQuestions: [
    "Does any single customer represent 10% or more of revenue or accounts receivable at year-end?",
    "Do you incur variable lease payments such as CAM, usage-based rent, or CPI adjustments?",
    "Can you provide the future minimum lease payment maturity schedule for the operating leases?",
    "Were there any debt covenant violations or waivers during the year?",
    "How much of the revolving line of credit remained unused at year-end?",
    "Are there significant accounting estimates that should be described in the notes?",
    "Were there any subsequent events beyond the routine evaluation that require disclosure?",
    "Were any new related-party arrangements entered into during the year?",
    "Are there unrecorded commitments or contingencies (purchase commitments, litigation, guarantees)?",
  ],
  clientEmail: {
    subject: "Disclosure review — follow-up items",
    body: `Hello,

Thank you for sharing the draft notes to the financial statements. Before partner review, we have a few follow-up items to confirm the disclosures are complete under US GAAP:

1. Variable lease payments — please confirm whether any leases include CAM, usage-based, or CPI-based payments.
2. Customer concentration — let us know if any single customer is 10% or more of revenue or accounts receivable.
3. Debt covenants — please share the specific covenants, any violations or waivers, and the unused balance on the revolving line.
4. Lease maturity schedule — please provide the future minimum lease payments by year.
5. Related-party lease — please confirm the annual amount, term, and pricing basis of the equipment lease with the related party.

Once we have these, we can finalize the disclosures. Please let us know if any item needs clarification.

Best regards,
FsCopilot Review Team`,
  },
};
