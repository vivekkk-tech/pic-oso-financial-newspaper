const toggle = document.getElementById("themeToggle");
const saved = localStorage.getItem("picoso-theme");
if (saved === "dark") document.body.classList.add("dark");
toggle?.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("picoso-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

const esc = (s="") => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const impactClass = x => x === "POSITIVE" ? "positive" : x === "NEGATIVE" ? "negative" : "neutral";

async function loadEdition(){
  try{
    const res = await fetch(`data/news.json?ts=${Date.now()}`);
    if(!res.ok) throw new Error("News data unavailable");
    const d = await res.json();

    const vals = d.market_snapshot || {};
    const marketMap = [
      ["NIFTY 50", vals.nifty],["SENSEX", vals.sensex],["NIFTY IT", vals.nifty_it],
      ["USD / INR", vals.usd_inr],["BRENT", vals.brent],["GOLD", vals.gold]
    ];
    document.querySelectorAll(".ticker div").forEach((el,i)=>{
      if(marketMap[i]) el.innerHTML = `<span>${esc(marketMap[i][0])}</span><b>${esc(marketMap[i][1])}</b>`;
    });

    const heroBig=document.querySelector(".market-big strong");
    if(heroBig) heroBig.textContent=vals.nifty || "—";
    document.querySelectorAll(".market-grid b").forEach((el,i)=>{
      el.textContent=[vals.sensex,vals.usd_inr,vals.brent,vals.gold][i] || "—";
    });

    const stories=d.stories||[];
    const grid=document.querySelector(".story-grid");
    if(grid && stories.length){
      grid.innerHTML=stories.slice(0,7).map((s,i)=>`
        <article class="story ${i===0?'featured':''}">
          <div class="story-meta"><span class="tag">${esc(s.category)}</span><span>⏱ ${esc(s.reading_time)}</span></div>
          <h3>${esc(s.headline)}</h3>
          <p>${esc(s.what)}</p>
          <div class="so-what"><b>SO WHAT?</b><span>${esc(s.so_what)}</span></div>
          <div class="impact"><span>MARKET IMPACT</span><b class="${impactClass(s.impact)}">${esc(s.impact)}</b></div>
          <div class="source">Source: <a href="${esc(s.source_url)}" target="_blank" rel="noopener">${esc(s.source)}</a></div>
        </article>`).join("");
    }

    const paint=d.paint||[];
    const paintCards=document.querySelector(".focus-layout");
    if(paintCards && paint.length){
      const first=paint[0];
      const alert=document.querySelector(".model-alert");
      if(alert) alert.innerHTML=`<span class="alert-icon">⚠</span><div><small>MODEL ASSUMPTION ALERT</small><h3>${esc(first.model_variable)} ${esc(first.direction)}</h3><p>${esc(first.summary)} Confidence: ${esc(first.confidence)}. <a href="${esc(first.source_url)}" target="_blank" rel="noopener">Source</a></p></div>`;
      const fc=document.querySelector(".paint-card p");
      if(fc) fc.textContent=paint.map(x=>x.headline).join(" • ");
    }

    const it=d.it||[];
    const itMain=document.querySelector(".it-main p");
    if(itMain && it.length) itMain.textContent=it.map(x=>x.summary).join(" ");
    const watch=document.querySelector(".watchlist");
    if(watch && it.length){
      watch.innerHTML=`<div class="watch-head">LATEST IT MODEL FLAGS <span>→</span></div>`+
        it.map(x=>`<div>${esc(x.headline)} <span>${esc(x.model_variable)} ${esc(x.direction)}</span></div>`).join("");
    }

    const startupCards=document.querySelector(".cards-3");
    if(startupCards && (d.startups||[]).length){
      startupCards.innerHTML=d.startups.slice(0,3).map(x=>`<article class="mini-card"><span class="tag">${esc(x.tag)}</span><h3>${esc(x.headline)}</h3><p>${esc(x.summary)}</p><a href="${esc(x.source_url)}" target="_blank" rel="noopener">Read source →</a></article>`).join("");
    }

    const deal=d.deals?.[0];
    if(deal){
      const card=document.querySelector(".deal-card");
      if(card) card.innerHTML=`<div class="deal-side"><span>BUYER</span><strong>${esc(deal.buyer)}</strong></div><div class="deal-arrow">→</div><div class="deal-side"><span>TARGET</span><strong>${esc(deal.target)}</strong></div><div class="deal-info"><span>DEAL VALUE</span><strong>${esc(deal.value)}</strong><p><b>Why:</b> ${esc(deal.why_buy)} <b>Synergy:</b> ${esc(deal.synergy)} <b>Risk:</b> ${esc(deal.risk)}</p><a href="${esc(deal.source_url)}" target="_blank" rel="noopener">Source →</a></div>`;
    }

    if(d.cfa){
      const cfa=document.querySelector(".cfa-card>div:last-child");
      if(cfa) cfa.innerHTML=`<span class="tag">TODAY'S CONCEPT</span><h3>${esc(d.cfa.concept)}</h3><p><b>News:</b> ${esc(d.cfa.news)}</p><p>${esc(d.cfa.explanation)}</p><p><b>Professional use:</b> ${esc(d.cfa.application)}</p><strong>TAKEAWAY: ${esc(d.cfa.takeaway)}</strong>`;
    }

    if(d.tomorrow){
      const q=document.querySelector(".big-question"); if(q) q.textContent=d.tomorrow.question;
      const p=document.querySelector(".tomorrow-box p"); if(p) p.textContent=`Watch: ${d.tomorrow.watch}. ${d.tomorrow.why}`;
    }

    const date=document.querySelector(".date-row span");
    if(date && d.generated_at) date.textContent=new Date(d.generated_at).toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"}).toUpperCase();

  }catch(err){
    console.warn("PICOSO news feed not ready:",err);
  }
}
loadEdition();
