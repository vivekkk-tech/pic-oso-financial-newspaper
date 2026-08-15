const $ = (s) => document.querySelector(s);

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function sourceLink(source, url) {
  if (!url) return `<span>${esc(source || "PICOSO")}</span>`;
  return `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(source || "Source")}</a>`;
}

function storyCard(s, i) {
  return `
    <article class="story ${i === 0 ? "featured" : ""}">
      <div class="story-top">
        <span class="tag">${esc(s.category)}</span>
        <span class="time">${esc(s.reading_time || "20 sec")}</span>
      </div>
      <h3>${esc(s.headline)}</h3>
      <p><strong>WHAT:</strong> ${esc(s.what)}</p>
      <p><strong>WHY:</strong> ${esc(s.why)}</p>
      <p><strong>SO WHAT:</strong> ${esc(s.so_what)}</p>
      <span class="impact">${esc(s.impact)}</span>
      <div class="source">${sourceLink(s.source, s.source_url)}</div>
    </article>`;
}

function radarCard(x) {
  return `
    <div class="radar">
      <h4>${esc(x.headline)}</h4>
      <p>${esc(x.summary)}</p>
      <div class="model">MODEL: ${esc(x.model_variable)} · ${esc(x.direction)} · ${esc(x.confidence)}</div>
      <div class="source">${sourceLink(x.source, x.source_url)}</div>
    </div>`;
}

async function loadEdition() {
  try {
    const response = await fetch(`data/news.json?ts=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const date = data.generated_at ? new Date(data.generated_at) : null;
    $("#editionDate").textContent = date ? date.toLocaleDateString("en-IN", {day:"2-digit", month:"short", year:"numeric"}) : "Waiting for first run";
    $("#generatedAt").textContent = date ? date.toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit"}) : "—";

    const stories = data.stories || [];
    $("#stories").innerHTML = stories.length
      ? stories.map(storyCard).join("")
      : `<div class="story featured"><h3>No fresh stories yet.</h3><p>Run the GitHub Action once. The zero-cost engine will populate this page from public RSS feeds.</p></div>`;

    $("#paintList").innerHTML = (data.paint || []).map(radarCard).join("") || `<p class="muted">No material paint signal in the latest feeds.</p>`;
    $("#itList").innerHTML = (data.it || []).map(radarCard).join("") || `<p class="muted">No material IT signal in the latest feeds.</p>`;

    $("#startupList").innerHTML = (data.startups || []).map(x => `
      <div class="radar"><h4>${esc(x.headline)}</h4><p>${esc(x.summary)}</p><div class="source">${sourceLink(x.source, x.source_url)}</div></div>
    `).join("") || `<p class="muted">No high-priority startup item in this edition.</p>`;

    $("#dealList").innerHTML = (data.deals || []).map(x => `
      <div class="radar"><h4>${esc(x.buyer)} → ${esc(x.target)}</h4><p>${esc(x.why_buy)}</p><p><strong>Risk:</strong> ${esc(x.risk)}</p><div class="source">${sourceLink(x.source, x.source_url)}</div></div>
    `).join("") || `<p class="muted">No high-priority M&A item in this edition.</p>`;

    const c = data.cfa || {};
    $("#cfa").innerHTML = `
      <div class="cfa-card">
        <h3>${esc(c.concept || "DCF")}</h3>
        <p><strong>News:</strong> ${esc(c.news || "")}</p>
        <p>${esc(c.explanation || "")}</p>
        <p><strong>Use it:</strong> ${esc(c.application || "")}</p>
        <p><strong>Takeaway:</strong> ${esc(c.takeaway || "")}</p>
        <div class="source">${sourceLink(c.source, c.source_url)}</div>
      </div>`;

    const t = data.tomorrow || {};
    $("#tomorrow").innerHTML = `
      <h3>${esc(t.question || "What matters next?")}</h3>
      <p><strong>WATCH:</strong> ${esc(t.watch || "")}</p>
      <p>${esc(t.why || "")}</p>`;
  } catch (error) {
    $("#stories").innerHTML = `<div class="story featured"><h3>Edition unavailable.</h3><p>The website could not read data/news.json. Check that GitHub Pages is publishing from the repository root.</p></div>`;
    console.error(error);
  }
}

$("#themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("pic-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("pic-theme") === "dark") document.body.classList.add("dark");

loadEdition();
