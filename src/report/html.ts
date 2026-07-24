import type { AnalysisReport } from "../intelligence/types";

function serialize(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function renderHtmlReport(report: AnalysisReport): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Farpoint · usage report</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{
  --paper:#ffffff; --surface:#f6f6f7; --surface-2:#eef0f2;
  --ink:#15161a; --muted:#6b6f76; --faint:#9a9ea5; --line:#e6e7ea;
  --accent:#2454e6; --accent-soft:#eaf0fe;
  --good:#1f7a52; --warn:#a5620a;
  --sans:'Inter',ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}*{transition:none!important;animation:none!important}}
body{margin:0;background:var(--paper);color:var(--ink);font:14.5px/1.65 var(--sans);-webkit-font-smoothing:antialiased}
a{color:var(--accent)}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
button,input,select{font:inherit;color:inherit}

.head{position:sticky;top:0;z-index:5;background:var(--paper);border-bottom:1px solid var(--line)}
.head-row{max-width:1080px;margin:auto;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.mark{font:600 13px/1 var(--mono);letter-spacing:.02em}
.mark span{color:var(--faint);font-weight:400;margin-left:8px}
.head-meta{display:flex;align-items:center;gap:14px;color:var(--faint);font:12px var(--mono)}
.btn{border:1px solid var(--line);background:var(--paper);border-radius:6px;padding:6px 11px;font:12px var(--sans);font-weight:500;cursor:pointer}
.btn:hover{border-color:var(--ink)}

.nav{max-width:1080px;margin:auto;padding:0 24px;display:flex;gap:4px;overflow-x:auto}
.nav a{white-space:nowrap;text-decoration:none;color:var(--muted);font-size:12px;font-weight:500;padding:9px 10px;border-bottom:2px solid transparent}
.nav a.active,.nav a:hover{color:var(--ink);border-color:var(--ink)}

main{max-width:1080px;margin:auto;padding:36px 24px 100px}

.lede{font-size:16px;line-height:1.65;color:var(--ink);max-width:760px;margin:0 0 28px}
.lede b{font-weight:600}

.stats{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.stat{padding:16px 18px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);background:var(--paper)}
.stat:nth-child(3n){border-right:0}
.stat:nth-last-child(-n+3){border-bottom:0}
.stat b{display:block;font:600 22px/1.1 var(--mono);letter-spacing:-.01em}
.stat span{display:block;margin-top:6px;color:var(--muted);font-size:12px;font-weight:600}
.stat small{display:block;margin-top:3px;color:var(--faint);font-size:11.5px}
.stat.flag b{color:var(--warn)}

.explainer{margin-top:20px;padding:16px 18px;border:1px solid var(--line);border-radius:8px;background:var(--surface);font-size:13.5px;color:var(--muted);line-height:1.7}
.explainer b{color:var(--ink)}

.section{margin-top:60px;scroll-margin-top:96px}
.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:20px;padding-bottom:12px;border-bottom:1px solid var(--ink)}
.section-head h2{margin:0;font:600 17px var(--sans);letter-spacing:-.01em}
.count{color:var(--faint);font:12px var(--mono)}
.note{margin:12px 0 0;color:var(--muted);font-size:13.5px;max-width:680px;line-height:1.6}

.group{margin-top:28px}
.group:first-child{margin-top:20px}
.group-label{font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.06em;color:var(--faint);margin-bottom:10px}

.tick{display:inline-flex;align-items:center;gap:6px;font:12px var(--sans);white-space:nowrap;color:var(--muted)}
.tick span{background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:2px 8px;font-size:11px;color:var(--muted);font-weight:500}
.tick span.all{color:var(--good);background:#eaf6ef;border-color:#cfe9da}

.insight{border:1px solid var(--line);border-radius:8px;margin-top:10px;background:var(--paper)}
.insight-row{display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:16px;padding:15px 16px;cursor:pointer;list-style:none}
.insight-row::-webkit-details-marker{display:none}
.insight-title{font-weight:600;font-size:14px}
.insight-obs{margin:4px 0 0;color:var(--muted);font-size:13px;max-width:600px;line-height:1.55}
.fp-conf{font:12px var(--sans);font-weight:500;color:var(--muted);white-space:nowrap}
.caret{color:var(--faint);font-size:11px}
details[open] .caret{transform:rotate(180deg)}
.insight-body{padding:2px 16px 18px;border-top:1px solid var(--line);display:grid;grid-template-columns:1fr 1fr;gap:16px 28px}
.field h4{margin:14px 0 4px;font:600 10px var(--mono);text-transform:uppercase;letter-spacing:.05em;color:var(--faint)}
.field p{margin:0;font-size:13px;line-height:1.55;color:var(--ink)}
.evidence{grid-column:1/-1;margin-top:10px;padding:11px 12px;background:var(--surface);border-left:2px solid var(--accent);border-radius:0 4px 4px 0}
.evidence p{margin:0;font:13px/1.6 var(--mono);color:var(--ink)}
.evidence cite{display:block;margin-top:5px;color:var(--faint);font:11px var(--sans);font-style:normal}
.evidence-list{grid-column:1/-1}
.numbers{grid-column:1/-1;margin-top:10px;padding:11px 12px;background:var(--surface);border-left:2px solid var(--good);border-radius:0 4px 4px 0;font-size:12.5px;color:var(--ink)}
.numbers b{font:600 13px var(--mono)}

.toolbar{display:flex;gap:8px;margin-top:16px}
.search{flex:1;max-width:380px;border:1px solid var(--line);border-radius:6px;padding:8px 11px;font-size:13px}
.select{border:1px solid var(--line);border-radius:6px;padding:8px 11px;font-size:13px;background:var(--paper)}

.table{margin-top:14px;border:1px solid var(--line);border-radius:8px;overflow:hidden}
.row{display:grid;grid-template-columns:minmax(0,1.4fr) 110px 1fr 90px;gap:16px;align-items:center;padding:12px 14px;border-bottom:1px solid var(--line);background:var(--paper)}
.row:last-child{border-bottom:0}
.row[hidden]{display:none}
.row-title b{display:block;font-size:13px;font-weight:600}
.row-title span{color:var(--faint);font-size:11.5px}
.row-agent{font-size:12px;color:var(--muted)}
.row-type{color:var(--muted);font-size:12.5px}
.row-open{border:1px solid var(--line);background:var(--paper);border-radius:5px;padding:5px 8px;font-size:11px;cursor:pointer;justify-self:end}
.row-expand{grid-column:1/-1;display:none;padding-top:10px;font-size:13px}
.row.open .row-expand{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.row-expand h4{margin:0 0 4px;font:600 10px var(--mono);text-transform:uppercase;letter-spacing:.05em;color:var(--faint)}
.row-expand p{margin:0 0 10px;color:var(--ink);line-height:1.55}

.profile{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px}
.profile-card{border:1px solid var(--line);border-radius:8px;padding:16px}
.profile-card h3{margin:0 0 10px;font-size:13px;font-weight:600}
.claim{padding:10px 0;border-top:1px solid var(--line)}
.claim:first-of-type{border-top:0;padding-top:0}
.claim p{margin:0 0 6px;font-size:13px;line-height:1.55}
.empty{color:var(--faint);font-style:italic;font-size:12.5px}

.recs{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}
.rec{border:1px solid var(--line);border-radius:8px;padding:16px}
.rec-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.rec h3{margin:0;font-size:13.5px;font-weight:600}
.tag{font:10px var(--mono);text-transform:uppercase;letter-spacing:.04em;color:var(--muted);background:var(--surface);border:1px solid var(--line);border-radius:4px;padding:2px 6px}
.tag.provisional{color:var(--warn);border-color:#eccf9b;background:#fbf3e4}
.rec p{margin:10px 0 0;font-size:13px;color:var(--muted);line-height:1.55}
.rec .rule{margin-top:10px;padding:9px 10px;background:var(--surface);border-left:2px solid var(--ink);font:12.5px/1.55 var(--mono);color:var(--ink)}
.rec .tick{margin-top:10px}

.limits{margin-top:26px;padding:14px 16px;border:1px solid var(--line);border-radius:8px;background:var(--surface)}
.limits h3{margin:0 0 8px;font-size:12px;font-weight:600;color:var(--ink)}
.limits ul{margin:0;padding-left:18px;color:var(--muted);font-size:13px;line-height:1.7}

footer{max-width:1080px;margin:60px auto 0;padding:16px 24px;border-top:1px solid var(--line);color:var(--faint);font:12px var(--sans)}

@media(max-width:860px){
  .stats{grid-template-columns:repeat(2,1fr)}
  .stat:nth-child(3n){border-right:1px solid var(--line)}
  .stat:nth-child(2n){border-right:0}
  .insight-row{grid-template-columns:1fr auto}
  .fp-conf{display:none}
  .insight-body,.profile,.recs{grid-template-columns:1fr}
  .row{grid-template-columns:1fr auto}
  .row-agent,.row-type{display:none}
}
@media print{
  .head,.nav,.toolbar,.row-open{display:none}
  .section{break-inside:avoid}
  main{padding:20px}
}
</style></head><body>
<header class="head"><div class="head-row"><div class="mark">FARPOINT<span>usage report</span></div><div class="head-meta"><span id="generated"></span><button class="btn" onclick="print()">Export PDF</button></div></div><nav class="nav" id="nav"></nav></header><main id="report"></main>
<script id="report-data" type="application/json">${serialize(report)}</script><script>
const R=JSON.parse(document.getElementById("report-data").textContent),$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])),num=n=>new Intl.NumberFormat("en-US",{notation:Math.abs(n)>=10000?"compact":"standard",maximumFractionDigits:1}).format(n||0),title=s=>String(s||"").replace(/_/g," ").replace(/\\b\\w/g,c=>c.toUpperCase());
function human(s){if(!s)return s;let t=String(s).replace(/^Session-specific(?: across \\d+ sessions?)?[,:]?\\s*/i,"").replace(/^Cross-project,?\\s*/i,"").replace(/\\s*\\(\\d+ (?:supporting )?sessions?:[^)]*\\)\\.?\\s*$/i,"").replace(/\\bthe user('s)?\\b/gi,(_,p)=>p?"your":"you").replace(/\\byou is\\b/gi,"you are").replace(/\\byou was\\b/gi,"you were").replace(/\\byou has\\b/gi,"you have");return t.charAt(0).toUpperCase()+t.slice(1)}function excerpt(s){let t=String(s||""),m=t.match(/##\\s*My request for[^:]*:\\s*/i);if(m)t=t.slice(m.index+m[0].length);t=t.replace(/^#[^\\n]*\\n+/,"").replace(/\\s+/g," ").trim();return t.length>240?t.slice(0,237).trim()+"…":t}function project(s){const p=String(s||"unknown project").split(/[\\\\/]/).filter(Boolean).pop()||s;return String(p).replace(/[_-]+/g," ")}function tick(kind,count){return '<span class="tick"><span class="'+(kind==="aggregate"?"all":"")+'">'+(kind==="aggregate"?"computed from your whole history":"seen in "+count+" session"+(count===1?"":"s"))+'</span></span>'}
$("#generated").textContent="Generated "+new Date(R.generated_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});const sections=[["stats","Overview"],["insights","Insights"],["sessions","Sessions"],["profile","Profile"],["actions","Actions"]];$("#nav").innerHTML=sections.map(([id,label])=>'<a href="#'+id+'">'+label+'</a>').join("");
const stats=R.agentsview_stats||{},cache=stats.cache_economics||{},saved=Number(cache.dollars_saved_vs_uncached||0),spent=Number(cache.dollars_spent||0),skills=Number(stats.adoption?.distinct_skills||0),hours=R.metrics.totals.duration_minutes/60,statData=[[num(R.coverage.eligible),"Sessions looked at",num(R.coverage.excluded_as_noise)+" quick/throwaway ones set aside"],[num(R.coverage.deeply_inspected),"Read in detail","the rest were skimmed for patterns"],[num(R.metrics.totals.message_count),"Messages exchanged",num(R.metrics.averages.message_count)+" on average per session"],[num(hours)+"h","Time recorded across sessions","includes idle time, not just active work"],[saved?"$"+saved.toFixed(0):"—","Saved by prompt caching",saved&&spent?(saved/spent).toFixed(1)+"x what you actually spent":"not available in this archive"],[String(skills),"Skills your agent has learned",skills?"tracked automatically":"none yet — see Actions below"]],statHtml=statData.map(([v,l,s],i)=>'<div class="stat '+(i===5&&!skills?"flag":"")+'"><b>'+esc(v)+'</b><span>'+esc(l)+'</span><small>'+esc(s)+'</small></div>').join("");
function insightCard(x){const aggregate=x.evidence_basis==="aggregate",count=(x.supporting_session_ids||[]).length,evid=(x.evidence||[]).slice(0,4).map(e=>'<div class="evidence"><p>"'+esc(excerpt(e.excerpt))+'"</p><cite>'+esc(e.title)+' · '+esc(project(e.project))+'</cite></div>').join(""),numbers=(x.metric_evidence||[]).length?'<div class="numbers">'+x.metric_evidence.map(esc).join("<br>")+'</div>':"";return '<details class="insight"><summary class="insight-row"><div><div class="insight-title">'+esc(human(x.title))+'</div><p class="insight-obs">'+esc(human(x.observation))+'</p></div>'+tick(aggregate?"aggregate":"session",count)+'<span class="caret">▾</span></summary><div class="insight-body"><div class="field" style="grid-column:1/-1"><h4>What to do</h4><p>'+esc(human(x.action))+'</p></div>'+evid+numbers+'</div></details>'}const patterns=R.discovered_insights.filter(x=>x.evidence_basis!=="aggregate"),numbers=R.discovered_insights.filter(x=>x.evidence_basis==="aggregate");
const agents=[...new Set(R.session_findings.map(x=>x.agent))],sessionRows=R.session_findings.map((x,i)=>{const name=x.title&&!x.title.startsWith(x.agent+":")?x.title:"Untitled session",search=[name,x.project,x.agent,x.task_type,...(x.themes||[])].join(" ").toLowerCase();return '<div class="row" data-search="'+esc(search)+'" data-agent="'+esc(x.agent)+'"><div class="row-title"><b>'+esc(name)+'</b><span>'+esc(project(x.project))+'</span></div><div class="row-agent">'+esc(x.agent)+'</div><div class="row-type">'+title(x.task_type)+'</div><button type="button" class="row-open" data-open="'+i+'">Details</button><div class="row-expand"><div><h4>What happened</h4><p>'+esc(human(x.outcome_assessment))+'</p><h4>What was frustrating</h4><p>'+esc((x.friction||[]).map(human).join(" · ")||"Nothing notable")+'</p></div><div><h4>What worked well</h4><p>'+esc((x.strengths||[]).map(human).join(" · ")||"Nothing notable")+'</p><h4>What to try next time</h4><p>'+esc((x.advice||[]).map(human).join(" · ")||"No specific suggestion")+'</p></div></div></div>'}).join("");
const profileNames={repeated_preferences:"What you tend to prefer",working_style:"How you tend to work",recurring_corrections:"What you correct most often",strengths:"What you're good at",failure_modes:"Where things tend to go wrong"},profileHtml=Object.entries(profileNames).map(([k,label])=>{const claims=R.user_profile[k]||[],body=claims.length?claims.map(c=>'<div class="claim"><p>'+esc(human(c.claim))+'</p>'+tick("session",c.supporting_session_ids?.length||0)+'</div>').join(""):'<p class="empty">Nothing here cleared the evidence bar yet.</p>';return '<div class="profile-card"><h3>'+label+'</h3>'+body+'</div>'}).join(""),kindLabel={skill:"Teach your agent this",workflow:"Change how you work",instruction:"Say this up front",prompting:"Phrase requests like this",tooling:"Improve the tooling"},recs=R.recommendations.map(x=>'<div class="rec"><div class="rec-head"><h3>'+esc(human(x.title))+'</h3><span class="tag '+(x.provisional?"provisional":"")+'">'+esc(kindLabel[x.kind]||title(x.kind))+(x.provisional?" · early idea":"")+'</span></div><p>'+esc(human(x.action))+'</p>'+(x.rule?'<p class="rule">'+esc(human(x.rule))+'</p>':"")+tick("session",x.supporting_session_ids?.length||0)+'</div>').join(""),limits=R.limitations?.length?'<div class="limits"><h3>Worth keeping in mind</h3><ul>'+R.limitations.map(x=>'<li>'+esc(human(x))+'</li>').join("")+'</ul></div>':"";
$("#report").innerHTML='<p class="lede">This is what Farpoint found by reading through your coding sessions. <b>'+num(R.coverage.deeply_inspected)+' sessions</b> were read closely to find real patterns; everything else is computed straight from the numbers. Skip to whatever you care about below.</p><section class="section" id="stats"><div class="section-head"><h2>Overview</h2><span class="count">'+R.metrics.sessions+' sessions in scope</span></div><div class="stats">'+statHtml+'</div><div class="explainer">Farpoint found <b>'+num(R.coverage.discovered)+'</b> sessions on disk across your coding agents. After setting aside quick tests and one-offs, <b>'+num(R.coverage.eligible)+'</b> were substantive enough to analyze. Of those, <b>'+num(R.coverage.deeply_inspected)+'</b> got read closely, message by message — that\\'s what the patterns below are grounded in. Everything else is computed straight from the full set of '+num(R.coverage.eligible)+' sessions.</div></section><section class="section" id="insights"><div class="section-head"><h2>Insights</h2><span class="count">'+R.discovered_insights.length+' findings</span></div><p class="note">Split into two kinds: real patterns confirmed by reading actual conversations, and hard numbers computed across your whole session history. Expand any one for the reasoning and the real evidence behind it.</p><div class="group"><div class="group-label">Patterns in how you work</div>'+(patterns.map(insightCard).join("")||'<p class="empty">No behavioral pattern cleared the evidence bar.</p>')+'</div><div class="group"><div class="group-label">Numbers worth knowing</div>'+(numbers.map(insightCard).join("")||'<p class="empty">No aggregate anomaly cleared the usefulness bar.</p>')+'</div></section><section class="section" id="sessions"><div class="section-head"><h2>Sessions</h2><span class="count">'+R.session_findings.length+' read in detail</span></div><p class="note">The individual sessions behind the insights. Search by project or agent, or open one to see what happened.</p><div class="toolbar"><input class="search" id="search" placeholder="Search title, project, agent, theme…"><select class="select" id="agent-filter"><option value="">All agents</option>'+agents.map(a=>'<option>'+esc(a)+'</option>').join("")+'</select></div><div class="table">'+(sessionRows||'<p class="empty">No sessions available.</p>')+'</div></section><section class="section" id="profile"><div class="section-head"><h2>Profile</h2><span class="count">patterns, not labels</span></div><p class="note">Tendencies that showed up more than once — not a personality test. The more sessions something was seen in, the more you should trust it.</p><div class="profile">'+profileHtml+'</div></section><section class="section" id="actions"><div class="section-head"><h2>Actions</h2><span class="count">'+R.recommendations.length+' worth trying</span></div><p class="note">Concrete things to change, each tied back to something that actually happened rather than generic advice.</p><div class="recs">'+(recs||'<p class="empty">Nothing cleared the bar yet.</p>')+'</div>'+limits+'</section><footer>Generated locally · nothing left this machine</footer>';
const filter=()=>{const q=$("#search").value.toLowerCase(),a=$("#agent-filter").value;$$(".row").forEach(r=>r.hidden=!(r.dataset.search.includes(q)&&(!a||r.dataset.agent===a)))};$("#search")?.addEventListener("input",filter);$("#agent-filter")?.addEventListener("change",filter);$$("[data-open]").forEach(b=>b.addEventListener("click",()=>{const r=b.closest(".row");r.classList.toggle("open");b.textContent=r.classList.contains("open")?"Close":"Details"}));const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)$$(".nav a").forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+e.target.id))}),{rootMargin:"-20% 0 -70%"});$$(".section").forEach(s=>observer.observe(s));
</script></body></html>`;
}
