import fs from "node:fs/promises";
import OpenAI from "openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY GitHub Actions secret.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    edition: { type: "string" },

    market_snapshot: {
      type: "object",
      additionalProperties: false,
      properties: {
        nifty: { type: "string" },
        sensex: { type: "string" },
        nifty_it: { type: "string" },
        usd_inr: { type: "string" },
        brent: { type: "string" },
        gold: { type: "string" }
      },
      required: [
        "nifty",
        "sensex",
        "nifty_it",
        "usd_inr",
        "brent",
        "gold"
      ]
    },

    stories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: { type: "string" },
          headline: { type: "string" },
          what: { type: "string" },
          why: { type: "string" },
          so_what: { type: "string" },
          impact: { type: "string" },
          reading_time: { type: "string" },
          source: { type: "string" },
          source_url: { type: "string" }
        },
        required: [
          "category",
          "headline",
          "what",
          "why",
          "so_what",
          "impact",
          "reading_time",
          "source",
          "source_url"
        ]
      }
    },

    paint: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          summary: { type: "string" },
          model_variable: { type: "string" },
          direction: { type: "string" },
          confidence: { type: "string" },
          source: { type: "string" },
          source_url: { type: "string" }
        },
        required: [
          "headline",
          "summary",
          "model_variable",
          "direction",
          "confidence",
          "source",
          "source_url"
        ]
      }
    },

    it: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          summary: { type: "string" },
          model_variable: { type: "string" },
          direction: { type: "string" },
          confidence: { type: "string" },
          source: { type: "string" },
          source_url: { type: "string" }
        },
        required: [
          "headline",
          "summary",
          "model_variable",
          "direction",
          "confidence",
          "source",
          "source_url"
        ]
      }
    },

    startups: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          headline: { type: "string" },
          summary: { type: "string" },
          tag: { type: "string" },
          source: { type: "string" },
          source_url: { type: "string" }
        },
        required: [
          "headline",
          "summary",
          "tag",
          "source",
          "source_url"
        ]
      }
    },

    deals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          buyer: { type: "string" },
          target: { type: "string" },
          value: { type: "string" },
          why_buy: { type: "string" },
          synergy: { type: "string" },
          risk: { type: "string" },
          source: { type: "string" },
          source_url: { type: "string" }
        },
        required: [
          "buyer",
          "target",
          "value",
          "why_buy",
          "synergy",
          "risk",
          "source",
          "source_url"
        ]
      }
    },

    cfa: {
      type: "object",
      additionalProperties: false,
      properties: {
        concept: { type: "string" },
        news: { type: "string" },
        explanation: { type: "string" },
        application: { type: "string" },
        takeaway: { type: "string" },
        source: { type: "string" },
        source_url: { type: "string" }
      },
      required: [
        "concept",
        "news",
        "explanation",
        "application",
        "takeaway",
        "source",
        "source_url"
      ]
    },

    tomorrow: {
      type: "object",
      additionalProperties: false,
      properties: {
        question: { type: "string" },
        watch: { type: "string" },
        why: { type: "string" }
      },
      required: [
        "question",
        "watch",
        "why"
      ]
    }
  },

  required: [
    "edition",
    "market_snapshot",
    "stories",
    "paint",
    "it",
    "startups",
    "deals",
    "cfa",
    "tomorrow"
  ]
};

const instructions = `
You are PICOSO, a highly selective Indian financial intelligence newspaper.

Your mission is to create one daily financial newspaper containing only material,
current and verifiable information.

The reader wants:
- Indian markets
- Indian macroeconomics
- Company analysis
- Valuation
- M&A
- Indian startups
- CFA learning
- Paint companies
- IT companies

EDITORIAL RULES:

1. Search current web sources before answering.
2. Prefer primary sources and high-quality financial journalism.
3. Never invent numbers, events, quotes, sources or URLs.
4. If a fact cannot be verified, exclude it.
5. Remove duplicate stories.
6. Exclude clickbait and irrelevant stories.
7. Every article must be readable in less than 30 seconds.
8. Keep individual fields short.
9. Separate facts from interpretation.
10. Never give buy or sell recommendations.

IMPACT:

The "impact" field must be exactly one of:

POSITIVE
NEGATIVE
MIXED
LIMITED

READING TIME:

Use only:

15 sec
20 sec
25 sec

MARKET DATA:

If live market values cannot be confidently verified,
use "—" rather than guessing.

INDIA FIRST:

Prioritize Indian developments.

Include global news only when it has a meaningful connection
to Indian markets, companies or the Indian economy.

PRIORITY:

1. RBI, inflation, interest rates, INR, GDP, government policy,
   crude oil, liquidity and other Indian macro developments.

2. Indian equity markets and major corporate developments.

3. PAINT:

Asian Paints
Berger Paints
Kansai Nerolac
Indigo Paints
Birla Opus
JSW Paints
Relevant coating and input-cost developments.

4. IT:

TCS
Infosys
HCLTech
Wipro
Tech Mahindra
LTIMindtree
Persistent
Coforge
Mphasis

5. INDIAN STARTUPS:

Important funding rounds
IPOs
Acquisitions
Profitability
Regulation
Major layoffs only when financially significant.

6. M&A:

Important mergers
Acquisitions
PE deals
Strategic investments

7. CFA:

Exactly one CFA concept connected to a real current news event.

PAINT AND IT VALUATION TRANSLATION:

For relevant stories identify the valuation-model variable
that deserves attention.

Possible variables:

Revenue Growth
Volume Growth
Realisation
COGS
EBITDA Margin
Working Capital
Capex
Tax Rate
FCFF
WACC
Terminal Growth
Valuation Multiple

Do NOT change a valuation model.

Only flag which assumption deserves review.

Direction must be:

UP
DOWN
NEUTRAL

Confidence must be:

LOW
MEDIUM
HIGH

CFA:

Choose one concept that genuinely connects to today's news.

Examples:

DCF
WACC
FCFF
FCFE
CAPM
Beta
Duration
Yield Curve
Credit Spread
ROIC
Capital Structure
M&A
Working Capital
Business Cycles
Inflation
FX

M&A:

Only include important deals.

Explain:
- strategic logic
- potential synergy
- key risk

Never assume synergies will definitely occur.

FINAL OUTPUT:

Return only the requested JSON structure.
`;

const response = await client.responses.create({
  model: "gpt-5",

  tools: [
    {
      type: "web_search"
    }
  ],

  instructions,

  input: `
Produce today's PICOSO edition.

Search current web sources and cross-check important claims.

Focus on India.

Include:
- no more than 7 top stories
- no more than 3 paint items
- no more than 3 IT items
- no more than 3 startup items
- no more than 2 M&A deals
- exactly 1 CFA concept
- exactly 1 tomorrow question

Prefer fewer stories if there is not enough important news.

Every story must contain the source name and exact source URL.
`,

  text: {
    format: {
      type: "json_schema",
      name: "picoso_daily_edition",
      strict: true,
      schema
    }
  },

  store: false
});

const raw = response.output_text;

if (!raw) {
  throw new Error("OpenAI returned no structured output.");
}

const data = JSON.parse(raw);

data.generated_at = new Date().toISOString();

await fs.writeFile(
  "data/news.json",
  JSON.stringify(data, null, 2) + "\n"
);

console.log(
  "PICOSO edition generated:",
  data.generated_at
);
