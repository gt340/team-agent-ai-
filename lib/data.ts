export const agents = [
  {
    name: "Atlas Support",
    role: "Customer Support",
    color: "#3DD9EB",
    description:
      "Resolves tickets, drafts replies in your voice, and escalates the ones that actually need a human.",
    abilities: ["Ticket triage", "Macro-free replies", "Sentiment routing", "24/7 coverage"],
  },
  {
    name: "Atlas Docs",
    role: "Knowledge & Files",
    color: "#FA5D19",
    description:
      "Reads every doc, wiki, and PDF you have and answers questions with the source cited.",
    abilities: ["Full-text search", "Auto-summaries", "Version tracking", "Cited answers"],
  },
  {
    name: "Atlas Code",
    role: "Engineering",
    color: "#3DD9EB",
    description:
      "Reviews pull requests, writes tests, and ships small fixes straight to your repo.",
    abilities: ["PR review", "Test generation", "Bug triage", "Repo-aware context"],
  },
  {
    name: "Atlas Flow",
    role: "Workflow Automation",
    color: "#FF8A50",
    description:
      "Chains your tools together — a new lead in the CRM can trigger Slack, email, and a calendar hold.",
    abilities: ["No-code triggers", "Multi-step chains", "Error retries", "Audit log"],
  },
  {
    name: "Atlas Insight",
    role: "Data & Reporting",
    color: "#3DD9EB",
    description:
      "Pulls numbers from every connected source and turns them into a report before your standup.",
    abilities: ["Cross-source queries", "Scheduled reports", "Anomaly alerts", "Chart generation"],
  },
  {
    name: "Atlas Write",
    role: "Content Generation",
    color: "#FA5D19",
    description:
      "Drafts briefs, release notes, and internal updates that read like your team wrote them.",
    abilities: ["Brand voice tuning", "Multi-format drafts", "Fact-checked claims", "Fast revisions"],
  },
];

export const integrations = [
  "Slack",
  "Google Drive",
  "GitHub",
  "Notion",
  "Gmail",
  "Linear",
  "Salesforce",
  "Zendesk",
  "Postgres",
  "Snowflake",
  "Figma",
  "HubSpot",
  "Jira",
  "Confluence",
  "Stripe",
  "Asana",
];

export const capabilities = [
  {
    title: "Apps, unified",
    body: "One conversation reaches every tool you've connected — no tab-switching, no context lost between systems.",
  },
  {
    title: "Documents, understood",
    body: "Every file, wiki page, and spec becomes searchable knowledge the moment it's uploaded.",
  },
  {
    title: "Workflows, automated",
    body: "Describe the process once. Atlas runs it the same way every time, and tells you when something breaks.",
  },
  {
    title: "Data, analyzed",
    body: "Ask a question in plain language and get a real answer pulled from your actual systems, not a guess.",
  },
  {
    title: "Support, handled",
    body: "Customer questions get answered in your tone, with your policies, around the clock.",
  },
  {
    title: "Code, assisted",
    body: "From a first draft PR to a caught regression, an engineer that reads your whole codebase.",
  },
];

export const steps = [
  {
    n: "01",
    title: "Connect your stack",
    body: "Link the apps and data sources you already use. Atlas indexes them in minutes, not weeks.",
  },
  {
    n: "02",
    title: "Assign the team",
    body: "Choose which specialist agents handle which work — or let Atlas route automatically.",
  },
  {
    n: "03",
    title: "Set the guardrails",
    body: "Define what agents can do on their own and what needs sign-off. You stay in control.",
  },
  {
    n: "04",
    title: "Watch it run",
    body: "Every action is logged and explainable. Review, adjust, and let the team get faster over time.",
  },
];

export const testimonials = [
  {
    quote:
      "We connected six tools in an afternoon and Atlas was already resolving a third of our support queue by the next morning.",
    name: "Priya Nathan",
    role: "Head of Ops, Fernwell",
  },
  {
    quote:
      "The code agent catches things in review that our own linters miss. It reads context the way a senior engineer would.",
    name: "Marcus Oyelaran",
    role: "VP Engineering, Hollow & Co.",
  },
  {
    quote:
      "Reporting used to eat a full day every Monday. Now it's waiting in Slack before I've had coffee.",
    name: "Denise Wu",
    role: "COO, Bright Freight",
  },
];

export const pricing = [
  {
    name: "Starter",
    price: "$0",
    period: "for 14 days",
    blurb: "Try the full team on your real stack.",
    features: ["2 connected apps", "1,000 agent actions / mo", "Community support", "Standard guardrails"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Team",
    price: "$249",
    period: "/mo",
    blurb: "For growing teams running on Atlas daily.",
    features: [
      "Unlimited connected apps",
      "50,000 agent actions / mo",
      "Priority support",
      "Custom guardrails & approvals",
      "Audit log & analytics",
    ],
    cta: "Deploy your team",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    blurb: "Security, scale, and dedicated support.",
    features: [
      "SSO / SAML & SOC 2",
      "Dedicated deployment",
      "Custom agent training",
      "Uptime SLA",
      "Solutions engineer",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];
