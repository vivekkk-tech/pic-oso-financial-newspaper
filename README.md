# PICOSO — The Market, Decoded.

A visual-first financial newspaper prototype.

## Current version
This is the **frontend prototype**. It is intentionally populated with placeholders so the design can be reviewed before connecting live data.

### Included
- Responsive multi-section newspaper layout
- Dark/light mode
- Market dashboard shell
- Paint Intelligence section
- IT Intelligence section
- Startup Radar
- M&A Deal Room
- News → Model valuation translator
- CFA in the Real World
- Analyst-thinking section
- Tomorrow's Question

## Upload to GitHub
Upload:
- `index.html`
- `style.css`
- `script.js`

Then enable **GitHub Pages**:
Repository → Settings → Pages → Deploy from branch → `main` → `/ (root)` → Save.

## Next build phase
Connect a backend/news pipeline that:
1. Collects current news.
2. Verifies important facts.
3. Filters to only material stories.
4. Generates <30-second articles.
5. Calculates market/sector implications.
6. Maps relevant stories to valuation-model assumptions.
7. Generates the CFA concept of the day.
8. Publishes structured JSON for this frontend.

Never put API keys directly in `index.html` or `script.js`.
