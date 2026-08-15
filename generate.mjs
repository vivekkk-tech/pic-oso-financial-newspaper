import fs from "node:fs/promises";
import { URL } from "node:url";

const OUTPUT = "data/news.json";

const feeds = [
  {
    name: "Google News — India Markets",
    url: "https://news.google.com/rss/search?q=India%20stock%20market%20OR%20Nifty%20OR%20Sensex&hl=en-IN&gl=IN&ceid=IN:en",
    category: "market"
  },
  {
    name: "Google News — Indian Economy",
    url: "https://news.google.com/rss/search?q=India%20RBI%20OR%20inflation%20OR%20GDP%20OR%20rupee&hl=en-IN&gl=IN&ceid=IN:en",
    category: "macro"
  },
  {
    name: "Google News — Paint",
    url: "https://news.google.com/rss/search?q=Asian%20Paints%20OR%20Berger%20Paints%20OR%20Nerolac%20OR%20Indigo%20Paints%20OR%20Birla%20Opus%20OR%20JSW%20Paints&hl=en-IN&gl=IN&ceid=IN:en",
    category: "paint"
  },
  {
    name: "Google News — IT",
    url: "https://news.google.com/rss/search?q=TCS%20OR%20Infosys%20OR%20Wipro%20OR%20HCLTech%20OR%20Tech%20Mahindra%20OR%20LTIMindtree%20OR%20Persistent%20OR%20Coforge&hl=en-IN&gl=IN&ceid=IN:en",
    category: "it"
  },
  {
    name: "Google News — Indian Startups",
    url: "https://news.google.com/rss/search?q=India%20startup%20funding%20OR%20startup%20IPO%20OR%20Indian%20startup%20acquisition&hl=en-IN&gl=IN&ceid=IN:en",
    category: "startup"
  },
  {
    name: "Google News — M&A India",
    url: "https://news.google.com/rss/search?q=India%20merger%20OR%20acquisition%20OR%20M%26A%20deal&hl=en-IN&gl=IN&ceid=IN:en",
    category: "ma"
  }
];

const macroKeywords = [
  "rbi", "repo rate", "interest rate", "inflation", "cpi", "wpi", "gdp",
  "rupee", "inr", "fiscal", "government", "budget", "liquidity", "yield",
  "bond", "crude", "oil", "brent", "gold", "tariff", "trade"
];

const paintCompanies = [
  "asian paints", "berger paints", "kansai nerolac", "nerolac",
  "indigo paints", "birla opus", "jsw paints", "paint"
];

const itCompanies = [
  "tcs", "infosys", "wipro", "hcltech", "hcl tech", "tech mahindra",
  "ltimindtree", "persistent", "coforge", "mphasis", "it services"
];

const startupKeywords = [
  "startup", "start-up", "funding", "fundraise", "venture", "series a",
  "series b", "series c", "unicorn", "ipo", "fintech", "founder"
];

const maKeywords = [
  "acquisition", "acquires", "acquired", "merger", "merges", "m&a",
  "stake purchase", "buyout", "takeover", "strategic investment"
];

const positiveWords = [
  "profit", "growth", "wins", "award", "order", "contract", "raises",
  "funding", "upgrade", "expands", "strong", "record", "cut", "surge"
];

const negativeWords = [
  "loss", "decline", "falls", "drop", "weak", "layoff", "lawsuit",
  "downgrade", "delay", "fraud", "probe", "pressure", "cuts", "slump"
];

const modelRules = [
  {
    test: /crude|brent|oil/i,
    area: "Paint",
    variable: "COGS / EBITDA margin",
    direction: "UP",
    note: "Higher crude-linked input costs can pressure paint margins; review COGS and EBITDA assumptions."
  },
  {
    test: /forex|rupee|inr|usd\/inr|dollar/i,
    area: "IT",
    variable: "Revenue growth / EBITDA margin",
    direction: "MIXED",
    note: "A weaker rupee can support reported export revenue but can also change hedging and cost effects."
  },
  {
    test: /wage|salary|attrition|hiring/i,
    area: "IT",
    variable: "EBITDA margin",
    direction: "MIXED",
    note: "Employee-cost changes can affect IT-service margins; review the margin assumption."
  },
  {
    test: /interest rate|repo|yield|rbi/i,
    area: "Market",
    variable: "WACC",
    direction: "MIXED",
    note: "Rate changes can alter discount rates and financing conditions; review WACC rather than forcing a valuation change."
  },
  {
    test: /volume|demand|sales/i,
    area: "Paint",
    variable: "Revenue growth",
    direction: "MIXED",
    note: "Demand commentary can affect volume assumptions; review the revenue build."
  },
  {
    test: /margin|ebitda|operating profit/i,
    area: "IT",
    variable: "EBITDA margin",
    direction: "MIXED",
    note: "Margin commentary is directly relevant to an operating-margin assumption."
  }
];

function cleanText(value = "") {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function getTag(block, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  return cleanText(block.match(re)?.[1] || "");
}

function parseRSS(xml, feed) {
  const items = [];
  const matches = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) || [];

  for (const block of matches) {
    const title = getTag(block, "title");
    const link = getTag(block, "link");
    const description = getTag(block, "description");
    const pubDate = getTag(block, "pubDate");

    if (!title || !link) continue;

    items.push({
      title,
      link,
      description,
      pubDate,
      feed: feed.name,
      feedCategory: feed.category
    });
  }

  return items;
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: {
        "User-Agent": "PICOSO/1.0 (+https://github.com/)"
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const xml = await response.text();
    return parseRSS(xml, feed);
  } catch (error) {
    console.warn(`Feed failed: ${feed.name} — ${error.message}`);
    return [];
  }
}

function normaliseTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreStory(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();
  let score = 0;

  if (/\bindia\b|indian|mumbai|delhi|bengaluru|hyderabad/.test(text)) score += 4;
  if (macroKeywords.some(k => text.includes(k))) score += 4;
  if (paintCompanies.some(k => text.includes(k))) score += 6;
  if (itCompanies.some(k => text.includes(k))) score += 6;
  if (startupKeywords.some(k => text.includes(k))) score += 3;
  if (maKeywords.some(k => text.includes(k))) score += 5;
  if (positiveWords.some(k => text.includes(k))) score += 1;
  if (negativeWords.some(k => text.includes(k))) score += 1;

  return score;
}

function classify(item) {
  const text = `${item.title} ${item.description}`.toLowerCase();

  if (maKeywords.some(k => text.includes(k))) return "M&A";
  if (paintCompanies.some(k => text.includes(k))) return "PAINT";
  if (itCompanies.some(k => text.includes(k))) return "IT";
  if (startupKeywords.some(k => text.includes(k))) return "STARTUPS";
  if (macroKeywords.some(k => text.includes(k))) return "MACRO";
  return "MARKET";
}

function impact(text) {
  const lower = text.toLowerCase();
  const pos = positiveWords.filter(k => lower.includes(k)).length;
  const neg = negativeWords.filter(k => lower.includes(k)).length;

  if (pos > neg + 1) return "POSITIVE";
  if (neg > pos + 1) return "NEGATIVE";
  if (pos === 0 && neg === 0) return "LIMITED";
  return "MIXED";
}

function sentence(text, fallback) {
  const value = cleanText(text);
  if (!value) return fallback;
  const first = value.split(/(?<=[.!?])\s+/)[0];
  return first.length > 180 ? `${first.slice(0, 177)}...` : first;
}

function buildStory(item, category) {
  const text = `${item.title} ${item.description}`;
  const model = modelRules.find(rule => rule.test.test(text));

  const why = {
    "MACRO": "It can affect rates, liquidity, inflation, the rupee or broad market expectations.",
    "MARKET": "It matters if it changes earnings expectations, risk appetite or a key market variable.",
    "PAINT": "Paint earnings can be sensitive to demand, crude-linked inputs and competitive intensity.",
    "IT": "IT earnings can be sensitive to demand, pricing, currency, wages and margins.",
    "STARTUPS": "The development matters for funding, growth, competition or the path to profitability.",
    "M&A": "The key question is the strategic logic, price paid, funding and potential synergy."
  }[category];

  const soWhat = model
    ? model.note
    : category === "M&A"
      ? "Watch the deal value, funding, expected synergy and integration risk before drawing a valuation conclusion."
      : why;

  return {
    category,
    headline: item.title,
    what: sentence(item.description, "The source reports this development."),
    why,
    so_what: soWhat,
    impact: impact(text),
    reading_time: "20 sec",
    source: item.feed,
    source_url: item.link,
    published_at: item.pubDate || ""
  };
}

function buildRadar(items, wantedCategory, limit = 3) {
  return items
    .filter(x => classify(x) === wantedCategory)
    .slice(0, limit)
    .map(item => {
      const model = modelRules.find(rule => rule.test.test(`${item.title} ${item.description}`));
      return {
        headline: item.title,
        summary: sentence(item.description, "Relevant development identified from the source."),
        model_variable: model?.variable || "Review the relevant operating assumption",
        direction: model?.direction || "NEUTRAL",
        confidence: model ? "MEDIUM" : "LOW",
        source: item.feed,
        source_url: item.link
      };
    });
}

function buildCFA(topStory) {
  const text = `${topStory?.headline || ""} ${topStory?.what || ""}`.toLowerCase();

  if (/interest|repo|rbi|yield|bond/.test(text)) {
    return {
      concept: "WACC",
      news: topStory.headline,
      explanation: "A change in rates can influence the cost of debt and the discount rate used in valuation.",
      application: "Use the news as a reason to revisit WACC assumptions rather than mechanically changing value.",
      takeaway: "Discount-rate assumptions matter because small changes can materially affect DCF value.",
      source: topStory.source,
      source_url: topStory.source_url
    };
  }

  if (/acquisition|merger|stake|buyout/.test(text)) {
    return {
      concept: "M&A",
      news: topStory.headline,
      explanation: "An acquisition should be assessed through strategic rationale, price, financing and expected synergies.",
      application: "Compare the purchase price with the target's standalone value and test whether synergy assumptions are realistic.",
      takeaway: "A deal can create or destroy value depending on price and execution.",
      source: topStory.source,
      source_url: topStory.source_url
    };
  }

  if (/profit|margin|revenue|sales|growth/.test(text)) {
    return {
      concept: "DCF",
      news: topStory.headline,
      explanation: "Operating news can change the revenue, margin, reinvestment or cash-flow assumptions in a DCF.",
      application: "Identify which forecast assumption actually changed before changing the valuation.",
      takeaway: "Good valuation practice is to change the model because a driver changed, not because the headline feels positive.",
      source: topStory.source,
      source_url: topStory.source_url
    };
  }

  return {
    concept: "Business Cycles",
    news: topStory?.headline || "No dominant story identified.",
    explanation: "Market news often reflects a change in the economic or industry cycle.",
    application: "Ask whether the development changes a company's normalised earnings or only the next quarter.",
    takeaway: "Separate cyclical noise from changes in long-term earning power.",
    source: topStory?.source || "PICOSO",
    source_url: topStory?.source_url || ""
  };
}

function buildTomorrow(items) {
  const top = items[0];
  if (!top) {
    return {
      question: "What new development will change the market narrative next?",
      watch: "RBI, crude, INR, earnings, large corporate announcements and major M&A.",
      why: "These variables can change earnings expectations or discount rates."
    };
  }

  return {
    question: `Will the market treat "${top.headline}" as a lasting change or short-term noise?`,
    watch: "Follow-up company guidance, official data, price reaction and subsequent disclosures.",
    why: "The first headline matters less than whether the underlying financial driver persists."
  };
}

async function main() {
  const batches = await Promise.all(feeds.map(fetchFeed));
  const raw = batches.flat();

  const unique = [];
  const seen = new Set();

  for (const item of raw) {
    const key = normaliseTitle(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  unique.sort((a, b) => scoreStory(b) - scoreStory(a));

  const stories = unique
    .filter(item => scoreStory(item) >= 3)
    .slice(0, 12)
    .map(item => buildStory(item, classify(item)));

  const topStories = stories.slice(0, 7);

  const paint = buildRadar(stories, "PAINT", 3);
  const it = buildRadar(stories, "IT", 3);

  const startups = stories
    .filter(x => x.category === "STARTUPS")
    .slice(0, 3)
    .map(x => ({
      headline: x.headline,
      summary: x.what,
      tag: "STARTUP RADAR",
      source: x.source,
      source_url: x.source_url
    }));

  const deals = stories
    .filter(x => x.category === "M&A")
    .slice(0, 2)
    .map(x => ({
      buyer: "See source",
      target: "See source",
      value: "Not stated in headline",
      why_buy: x.what,
      synergy: "Not assumed",
      risk: "Check price, financing and integration risk.",
      source: x.source,
      source_url: x.source_url
    }));

  const edition = {
    generated_at: new Date().toISOString(),
    edition: "PICOSO — Zero-Cost Daily Edition",
    status: topStories.length ? "live" : "no_fresh_stories",
    market_snapshot: {
      nifty: "See current market source",
      sensex: "See current market source",
      nifty_it: "See current market source",
      usd_inr: "See current market source",
      brent: "See current market source",
      gold: "See current market source"
    },
    stories: topStories,
    paint,
    it,
    startups,
    deals,
    cfa: buildCFA(topStories[0]),
    tomorrow: buildTomorrow(topStories)
  };

  await fs.writeFile(OUTPUT, JSON.stringify(edition, null, 2) + "\n", "utf8");

  console.log(`PICOSO generated: ${topStories.length} top stories from ${unique.length} unique feed items.`);
}

main().catch(async error => {
  console.error(error);
  process.exitCode = 1;
});
