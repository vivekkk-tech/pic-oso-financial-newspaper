# PICOSO — Zero-Cost Edition

This version removes the OpenAI API completely.

## What it does

- Pulls fresh headlines from public RSS feeds using Node.js built-in `fetch`
- Uses multiple feeds and continues if one feed is unavailable
- Deduplicates stories
- Scores stories for Indian market relevance
- Separates Macro / Market / Paint / IT / Startups / M&A
- Generates short, rules-based "Why it matters" and "Model impact" notes
- Creates `data/news.json`
- GitHub Actions runs automatically every morning
- GitHub Pages serves the website
- No npm packages
- No API key
- No secret
- No OpenAI billing

## Important limitation

This is intentionally NOT an AI-generated newspaper. The free version uses transparent rules and source headlines.

It should never invent facts. It only summarizes what is present in the source headline and uses conservative model-impact rules.

The website links readers to the original source.

## GitHub setup

1. Upload the repository contents so `index.html` is in the repository root.
2. Make the repository Public.
3. Go to Settings → Pages.
4. Set Source to "Deploy from a branch".
5. Select `main` and `/ (root)`.
6. Save.
7. Go to Actions → PICOSO Zero-Cost Daily → Run workflow.

No API secret is required.

## Automatic schedule

The workflow runs at 03:30 UTC, which is 09:00 IST.

GitHub Actions is free for standard GitHub-hosted runners in public repositories. See GitHub's current billing documentation for details.

## News sources

The generator uses public RSS endpoints from established publishers and Google News RSS search feeds. Feed availability can change. The script is designed to fail soft: one broken feed does not stop the edition.

Do not republish full articles. PICOSO stores short original summaries and links back to the source.
