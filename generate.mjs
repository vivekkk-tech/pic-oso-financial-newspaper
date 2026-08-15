import fs from "node:fs/promises";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY GitHub Actions secret.");
}

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    edition: { type: "string" },
    market_snapshot: {
      type: "object", additionalProperties: false,
      properties: {
        nifty: { type: "string" }, sensex: { type: "string" },
        nifty_it: { type: "string" }, usd_inr: { type: "string" },
        brent: { type: "string" }, gold: { type: "string" }
      },
      required: ["nifty","sensex","nifty_it","usd_inr","brent","gold"]
    },
    stories: {
      type: "array",
      items: {
        type: "object", additionalProperties: false,
        properties: {
          category:{type:"string"}, headline:{type:"string"}, what:{type:"string"},
          why:{type:"string"}, so_what:{type:"string"}, impact:{type:"string"},
          reading_time:{type:"string"}, source:{type:"string"}, source_url:{type:"string"}
        },
        required:["category","headline","what","why","so_what","impact","reading_time","source","source_url"]
      }
    },
    paint: {
      type:"array", items:{
        type:"object",additionalProperties:false,
        properties:{
          headline:{type:"string"},summary:{type:"string"},model_variable:{type:"string"},
          direction:{type:"string"},confidence:{type:"string"},source:{type:"string"},source_url:{type:"string"}
        },
        required:["headline","summary","model_variable","direction","confidence","source","source_url"]
      }
    },
    it: {
      type:"array", items:{
        type:"object",additionalProperties:false,
        properties:{
          headline:{type:"string"},summary:{type:"string"},model_variable:{type:"string"},
          direction:{type:"string"},confidence:{type:"string"},source:{type:"string"},source_url:{type:"string"}
        },
        required:["headline","summary","model_variable","direction","confidence","source","source_url"]
      }
    },
    startups: {
      type:"array", items:{
        type:"object",additionalProperties:false,
        properties:{
          headline:{type:"string"},summary:{type:"string"},tag:{type:"string"},
          source:{type:"string"},source_url:{type:"string"}
        },
        required:["headline","summary","tag","source","source_url"]
      }
    },
    deals: {
      type:"array", items:{
        type:"object",additionalProperties:false,
        properties:{
          buyer:{type:"string"},target:{type:"string"},value:{type:"string"},
          why_buy:{type:"string"},synergy:{type:"string"},risk:{type:"string"},
          source:{type:"string"},source_url:{type:"string"}
        },
        required:["buyer","target","value","why_buy","synergy","risk","source","source_url"]
      }
    },
    cfa: {
      type:"object",additionalProperties:false,
      properties:{
        concept:{type:"string"},news:{type:"string"},explanation:{type:"string"},
        application:{type:"string"},takeaway:{type:"string"},source:{type:"string"},source_url:{type:"string"}
      },
      required:["concept","news","explanation","application","takeaway","source","source_url"]
    },
    tomorrow: {
      type:"object",additionalProperties:false,
      properties:{
        question:{type:"string"},watch:{type:"string"},why:{type:"string"}
      },
      required:["question","watch","why"]
    }
  },
  required:["edition","market_snapshot","stories","paint","it","startups","deals","cfa","tomorrow"]
};

const instructions = `
You are PICOSO, a highly selective Indian financial intelligence newspaper.
Today is the current date. Use web search extensively before answering.

MISSION:
Create ONE daily edition containing only material, current, verifiable financial/economic news.
The reader wants Indian markets, company analysis, valuation, M&A, Indian startups, CFA learning,
and especially paint and IT companies.

EDITORIAL RULES:
- Prefer primary sources and high-quality financial journalism.
- Do not invent numbers, events, quotes, sources or URLs.
- If a fact cannot be verified, exclude the story.
- Avoid duplicate versions of the same story.
- Exclude celebrity, politics without market/economic relevance, generic business fluff and clickbait.
- Every article must be readable in under 30 seconds; keep fields short.
- Separate facts from interpretation.
- Never give buy/sell recommendations.
- "impact" must be one of: "POSITIVE", "NEGATIVE", "MIXED", "LIMITED".
- Reading time should be "15 sec", "20 sec", or "25 sec".
- For market snapshot, if live values are not confidently verified, use "—" rather than guessing.
- Use Indian context first. Include global news only when it has a meaningful India/market connection.

PRIORITY:
1. Indian macro: RBI, inflation, rates, INR, GDP, government policy, crude, liquidity.
2. Indian equity markets and material corporate earnings/events.
3. PAINT: Asian Paints, Berger Paints, Kansai Nerolac, Indigo Paints, Birla Opus/JSW Paints and relevant coating/input-cost developments.
4. IT: TCS, Infosys, HCLTech, Wipro, Tech Mahindra, LTIMindtree, Persistent, Coforge, Mphasis.
5. Indian startups: meaningful funding, IPO, acquisitions, profitability, regulation, layoffs only when financially significant.
6. M&A / PE / strategic investments.
7. One CFA concept connected to a real current story.

PAINT/IT MODEL TRANSLATION:
For relevant stories, identify the most likely valuation-model variable affected:
Revenue Growth, Volume Growth, Realisation, COGS, EBITDA Margin, Working Capital,
Capex, Tax Rate, FCFF, WACC, Terminal Growth, or Valuation Multiple.
Do NOT change a valuation model; only flag the assumption that deserves review.
Direction must be "UP", "DOWN", or "NEUTRAL".
Confidence must be "LOW", "MEDIUM", or "HIGH".

CFA:
Pick one CFA-style concept that genuinely maps to today's news: DCF, WACC, FCFF, FCFE,
CAPM, beta, duration, yield curve, credit spread, ROIC, capital structure, M&A, working capital,
business cycles, inflation, FX, etc.

M&A:
Only include important deals. Explain strategic logic, potential synergy and the key risk.
Do not assume synergies will be achieved.

OUTPUT:
Return only the requested JSON schema.
`;

const response = await client.responses.create({
  model: "gpt-5",
  tools: [{ type: "web_search" }],
  instructions,
  input: `Produce today's PICOSO edition. Search current web sources and cross-check important claims.
Focus on India. Include no more than 7 top stories, 3 paint items, 3 IT items, 3 startup items,
2 M&A deals, exactly 1 CFA concept, and 1 tomorrow question. Prefer fewer items if there is not enough
material news. Include source names and the exact source URLs you used for each item.`,
  text: {
    format: {
      type: "json_schema",
      name: "pic﻿oso_daily_edition",
      strict: true,
      schema
    }
  },
  store: false
});

const raw = response.output_text;
if (!raw) throw new Error("OpenAI returned no structured output.");

const data = JSON.parse(raw);
data.generated_at = new Date().toISOString();

await fs.writeFile("data/news.json", JSON.stringify(data, null, 2) + "\n");
console.log("PICOSO edition generated:", data.generated_at);
