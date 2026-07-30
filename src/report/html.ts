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
.export{position:relative}.export-menu{position:absolute;right:0;top:calc(100% + 7px);width:190px;padding:6px;background:var(--paper);border:1px solid var(--line);border-radius:8px;box-shadow:0 14px 40px rgba(20,22,26,.12)}.export-menu[hidden]{display:none}.export-menu button{display:block;width:100%;border:0;background:transparent;text-align:left;border-radius:5px;padding:8px 9px;font-size:12.5px;cursor:pointer}.export-menu button:hover{background:var(--surface)}

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

.analytics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px;margin-top:28px}
.panel{padding:24px;border:0;border-radius:10px;background:var(--surface)}
.panel.wide{grid-column:1/-1}
.panel-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:20px}
.panel h3{margin:0;font-size:13.5px}
.panel-note{color:var(--faint);font-size:11px}
.costs{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.cost{padding:16px;background:var(--paper);border-radius:6px}
.cost b{display:block;font:600 18px var(--mono)}
.cost span{display:block;margin-top:4px;color:var(--muted);font-size:11px}
.bar-list{display:grid;gap:10px}
.bar-label{display:flex;justify-content:space-between;gap:12px;margin-bottom:4px;font-size:12px}
.bar-label span:last-child{color:var(--faint);font:11px var(--mono)}
.bar-track{height:5px;background:var(--surface-2);border-radius:99px;overflow:hidden}
.bar-fill{height:100%;background:var(--accent);border-radius:inherit}
.routing{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.route{padding:16px;background:var(--paper);border-radius:6px}
.route span{display:block;color:var(--faint);font:10px var(--mono);text-transform:uppercase;letter-spacing:.05em}
.route b{display:block;margin-top:4px;font-size:12.5px}
.route small{display:block;margin-top:3px;color:var(--muted);font-size:11px}

.section{margin-top:60px;scroll-margin-top:96px}
.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:20px;padding-bottom:12px;border-bottom:1px solid var(--ink)}
.section-head h2{margin:0;font:600 17px var(--sans);letter-spacing:-.01em}
.count{color:var(--faint);font:12px var(--mono)}
.note{margin:12px 0 0;color:var(--muted);font-size:13.5px;max-width:680px;line-height:1.6}

.projects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}.project-card{border:1px solid var(--line);border-radius:10px;padding:17px;background:linear-gradient(145deg,var(--paper),#fafafb)}.project-top{display:flex;justify-content:space-between;align-items:start;gap:12px}.project-card h3{margin:0;font-size:14px}.project-meta{font:11px var(--mono);color:var(--faint)}.project-numbers{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:15px}.project-number{padding:10px;background:var(--surface);border-radius:6px}.project-number b{display:block;font:600 16px var(--mono)}.project-number span{font-size:10.5px;color:var(--muted)}.project-themes{margin:13px 0 0;color:var(--muted);font-size:12.5px}.project-link{margin-top:12px;border:0;background:transparent;color:var(--accent);padding:0;font-size:12px;cursor:pointer}

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
.row-expand p{margin:0 0 10px;color:var(--ink);line-height:1.55}.session-evidence{grid-column:1/-1;padding:10px 12px;background:var(--surface);border-radius:6px;color:var(--muted);font-size:12px}

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

/* Quiet, spacious report surface. */
.head{background:rgba(255,255,255,.92);border-bottom:1px solid rgba(21,22,26,.07);backdrop-filter:blur(14px)}
.head-row,.nav{max-width:1160px;padding-left:32px;padding-right:32px}
.head-row{padding-top:18px;padding-bottom:18px}
.nav{gap:16px}
.nav a{padding:11px 0;border-bottom-width:1px}
main{max-width:1160px;padding:64px 32px 140px}
.intro{max-width:760px;margin-bottom:76px}
.eyebrow{margin-bottom:16px;color:var(--faint);font:600 10px var(--mono);letter-spacing:.1em;text-transform:uppercase}
.intro h1{max-width:680px;margin:0;font-size:clamp(32px,5vw,54px);font-weight:600;line-height:1.08;letter-spacing:-.045em}
.intro .lede{max-width:650px;margin:24px 0 0;color:var(--muted);font-size:16px;line-height:1.75}
.section{margin-top:96px}
.section-head{padding:0;border:0}
.section-head h2{font-size:21px;letter-spacing:-.025em}
.note{margin-top:9px;line-height:1.7}
.stats{gap:12px;border:0;border-radius:0;overflow:visible}
.stat{min-height:128px;padding:22px 20px;border:0!important;border-radius:10px;background:var(--surface)}
.stat b{font-size:24px}
.stat span{margin-top:10px}
.stat small{margin-top:5px;line-height:1.5}
.explainer{margin-top:24px;padding:24px;border:0;border-radius:10px;line-height:1.8}
.bar-list{gap:14px}
.projects{gap:20px;margin-top:28px}
.project-card{padding:24px;border:0;border-radius:10px;background:var(--surface)}
.project-numbers{gap:12px;margin-top:20px}
.project-number{padding:14px;background:var(--paper)}
.project-themes{margin-top:18px;line-height:1.7}
.project-link{margin-top:16px}
.group{margin-top:40px}
.group-label{margin-bottom:16px}
.insight{margin-top:12px;border:0;border-radius:10px;background:var(--surface)}
.insight-row{gap:20px;padding:20px 22px}
.insight-obs{margin-top:7px;line-height:1.65}
.insight-body{padding:4px 22px 24px;border-top-color:rgba(21,22,26,.07);gap:20px 36px}
.evidence,.numbers{margin-top:14px;padding:16px;border-left:0;border-radius:7px;background:var(--paper)}
.profile{gap:20px;margin-top:28px}
.profile-card{padding:24px;border:0;border-radius:10px;background:var(--surface)}
.claim{padding:16px 0;border-color:rgba(21,22,26,.07)}
.toolbar{gap:12px;margin-top:24px}
.search,.select{padding:11px 13px;border-color:var(--line);border-radius:8px}
.table{margin-top:18px;border:0;border-radius:0}
.row{padding:18px 4px;border-color:var(--line)}
.row-open{border:0;background:var(--surface);padding:7px 10px}
.row-expand{padding-top:18px}
.session-evidence{padding:16px;border-radius:7px}
.limits{margin-top:28px;padding:22px;border:0;border-radius:10px}
footer{max-width:1160px;margin-top:96px;padding:24px 32px 40px}
@media(max-width:860px){
  .head-row,.nav{padding-left:20px;padding-right:20px}
  main{padding:48px 20px 100px}
  .intro{margin-bottom:56px}
  .stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .insight-row{grid-template-columns:1fr auto}
  .fp-conf{display:none}
  .insight-body,.profile,.recs,.projects,.analytics{grid-template-columns:1fr}
  .panel.wide{grid-column:auto}
  .routing{grid-template-columns:repeat(2,minmax(0,1fr))}
  .row{grid-template-columns:1fr auto}
  .row-agent,.row-type{display:none}
}@media print{
  .head,.nav,.toolbar,.row-open,.project-link{display:none}
  details.insight{break-inside:avoid}
  .row-expand{display:grid!important}
  .section{break-inside:avoid}
  main{padding:20px}
}
</style></head><body>
<header class="head"><div class="head-row"><div class="mark">FARPOINT<span>usage report</span></div><div class="head-meta"><span id="generated"></span><div class="export"><button class="btn" id="export-toggle" type="button" aria-expanded="false">Export ▾</button><div class="export-menu" id="export-menu" hidden><button type="button" data-export="pdf">Print or save as PDF</button><button type="button" data-export="markdown">Download Markdown</button><button type="button" data-export="json">Download source JSON</button></div></div></div></div><nav class="nav" id="nav"></nav></header><main id="report"></main>
<script id="report-data" type="application/json">${serialize(report)}</script><script>
const R=JSON.parse(document.getElementById("report-data").textContent),$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])),num=n=>new Intl.NumberFormat("en-US",{notation:Math.abs(n)>=10000?"compact":"standard",maximumFractionDigits:1}).format(n||0),title=s=>String(s||"").replace(/_/g," ").replace(/\\b\\w/g,c=>c.toUpperCase());
function human(s){if(!s)return s;const verbs={appears:"appear",asks:"ask",corrects:"correct",expects:"expect",gives:"give",has:"have",prefers:"prefer",provides:"provide",tends:"tend",wants:"want"};let t=String(s).replace(/^Session-specific(?: across \\d+ sessions?)?[,:]?\\s*/i,"").replace(/^Cross-project,?\\s*/i,"").replace(/\\s*\\(\\d+ (?:supporting )?sessions?:[^)]*\\)\\.?\\s*$/i,"").replace(/\\s*[,;—-]?\\s*(?:supported by|support(?:ed)?(?: across| in|:)?|seen in)\\s+\\d+\\s+(?:supporting\\s+)?sessions?\\s*:\\s*\\S[\\s\\S]*$/i,"").replace(/\\bthe user('s)?\\b/gi,(_,p)=>p?"your":"you").replace(/\\byou is\\b/gi,"you are").replace(/\\byou was\\b/gi,"you were").replace(/\\byou((?:\\s+(?:often|repeatedly|usually|sometimes|generally|also))*)\\s+([a-z]+)\\b/gi,(match,modifiers,verb)=>verbs[verb.toLowerCase()]?"you"+modifiers+" "+verbs[verb.toLowerCase()]:match).trim();return t.charAt(0).toUpperCase()+t.slice(1)}function excerpt(s){let t=String(s||""),m=t.match(/##\\s*My request for[^:]*:\\s*/i);if(m)t=t.slice(m.index+m[0].length);t=t.replace(/^#[^\\n]*\\n+/,"").replace(/\\s+/g," ").trim();return t.length>240?t.slice(0,237).trim()+"…":t}function project(s){const p=String(s||"unknown project").split(/[\\\\/]/).filter(Boolean).pop()||s;return String(p).replace(/[_-]+/g," ")}function tick(kind,count){return '<span class="tick"><span class="'+(kind==="aggregate"?"all":"")+'">'+(kind==="aggregate"?"computed from your whole history":"seen in "+count+" session"+(count===1?"":"s"))+'</span></span>'}
$("#generated").textContent="Generated "+new Date(R.generated_at).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});const sections=[["stats","Overview"],["usage","Usage"],["projects","Projects"],["insights","Insights"],["profile","Profile"],["sessions","Sessions"]];$("#nav").innerHTML=sections.map(([id,label])=>'<a href="#'+id+'">'+label+'</a>').join("");
const stats=R.agentsview_stats||{},cache=stats.cache_economics||{},saved=Number(cache.dollars_saved_vs_uncached||0),spent=Number(cache.dollars_spent||0),cacheHit=Number(cache.cache_hit_ratio?.overall||0),hasEconomics=spent>0||saved>0||cacheHit>0,hours=R.metrics.totals.duration_minutes/60,portfolio=stats.agent_portfolio||{},agentCounts=portfolio.by_sessions_human||portfolio.by_sessions||{},agentUsage=Object.entries(agentCounts).sort((a,b)=>b[1]-a[1]),agentTotal=agentUsage.reduce((sum,[,count])=>sum+count,0),topAgent=agentUsage[0]||['—',0],modelUsage=Object.entries(stats.model_mix?.by_tokens||{}).sort((a,b)=>b[1]-a[1]),modelTotal=modelUsage.reduce((sum,[,count])=>sum+count,0),toolUsage=Object.entries(stats.tool_mix?.by_category||{}).sort((a,b)=>b[1]-a[1]),toolTotal=Number(stats.tool_mix?.total_calls||0),money=n=>n?'$'+n.toFixed(2):'—',statData=[[num(R.coverage.eligible),'Sessions looked at',num(R.coverage.excluded_as_noise)+' quick/throwaway ones set aside'],[num(R.coverage.deeply_inspected),'Read in detail','source for behavioral and task-fit claims'],[num(R.metrics.totals.message_count),'Messages exchanged',num(R.metrics.averages.message_count)+' on average per session'],...(hasEconomics?[[money(spent),'Tracked API spend',cache.claude_only?'Claude-priced sessions only':'all priced sessions'],[money(saved),'Saved by prompt caching',saved&&spent?(saved/spent).toFixed(1)+'x tracked spend':'not available in this archive']]:[]),[topAgent[0],'Most-used agent',num(topAgent[1])+' human sessions'],[num(hours)+'h','Time recorded across sessions','includes idle time, not just active work'],[String(modelUsage.length),'Models used',modelUsage[0]?modelUsage[0][0]+' has the most tokens':'no token data'],...(hasEconomics?[[cacheHit?(cacheHit*100).toFixed(1)+'%':'—','Prompt cache hit rate',cache.claude_only?'Claude cache telemetry':'available cache telemetry']]:[])] ,statHtml=statData.map(([v,l,s])=>'<div class="stat"><b>'+esc(v)+'</b><span>'+esc(l)+'</span><small>'+esc(s)+'</small></div>').join('');
function bars(entries,total,unit){return '<div class="bar-list">'+entries.slice(0,6).map(([name,value])=>'<div><div class="bar-label"><span>'+esc(name)+'</span><span>'+num(value)+' '+unit+' · '+(total?Math.round(value/total*100):0)+'%</span></div><div class="bar-track"><div class="bar-fill" style="width:'+(total?value/total*100:0)+'%"></div></div></div>').join('')+'</div>'}
const taskTypes=[...new Set(R.session_findings.map(x=>x.task_type))].sort(),routeHtml=taskTypes.map(task=>{const counts={};R.session_findings.filter(x=>x.task_type===task).forEach(x=>counts[x.agent]=(counts[x.agent]||0)+1);const ranked=Object.entries(counts).sort((a,b)=>b[1]-a[1]),best=ranked[0]||['—',0],total=ranked.reduce((sum,[,count])=>sum+count,0);return '<div class="route"><span>'+esc(title(task))+'</span><b>'+esc(best[0])+'</b><small>'+best[1]+' of '+total+' inspected session'+(total===1?'':'s')+'</small></div>'}).join(''),economicsHtml=hasEconomics?'<div class="panel"><div class="panel-head"><h3>API economics</h3><span class="panel-note">'+esc(cache.claude_only?'Claude-priced sessions':'priced sessions')+'</span></div><div class="costs"><div class="cost"><b>'+money(spent)+'</b><span>spent</span></div><div class="cost"><b>'+money(saved)+'</b><span>cache savings</span></div><div class="cost"><b>'+money(spent+saved)+'</b><span>estimated uncached</span></div></div></div>':'',usageHtml='<div class="analytics">'+economicsHtml+'<div class="panel"><div class="panel-head"><h3>Most-used agents</h3><span class="panel-note">human sessions · full archive</span></div>'+bars(agentUsage,agentTotal,'sessions')+'</div><div class="panel wide"><div class="panel-head"><h3>Which agents you use for which jobs</h3><span class="panel-note">observed routing · inspected sessions, not a quality ranking</span></div><div class="routing">'+(routeHtml||'<p class="empty">No task mix available.</p>')+'</div></div><div class="panel"><div class="panel-head"><h3>Model mix</h3><span class="panel-note">tokens · full archive</span></div>'+bars(modelUsage,modelTotal,'tokens')+'</div><div class="panel"><div class="panel-head"><h3>Tool mix</h3><span class="panel-note">'+num(toolTotal)+' calls</span></div>'+bars(toolUsage,toolTotal,'calls')+'</div></div>';function insightCard(x){const aggregate=x.evidence_basis==="aggregate",count=(x.supporting_session_ids||[]).length,evid=(x.evidence||[]).slice(0,4).map(e=>'<div class="evidence"><p>"'+esc(excerpt(e.excerpt))+'"</p><cite>'+esc(e.title)+' · '+esc(project(e.project))+'</cite></div>').join(""),numbers=(x.metric_evidence||[]).length?'<div class="numbers">'+x.metric_evidence.map(esc).join("<br>")+'</div>':"";return '<details class="insight"><summary class="insight-row"><div><div class="insight-title">'+esc(human(x.title))+'</div><p class="insight-obs">'+esc(human(x.observation))+'</p></div>'+tick(aggregate?"aggregate":"session",count)+'<span class="caret">▾</span></summary><div class="insight-body"><div class="field"><h4>Why it matters</h4><p>'+esc(human(x.why_it_matters))+'</p></div><div class="field"><h4>Compared with</h4><p>'+esc(human(x.contrast))+'</p></div>'+evid+numbers+'</div></details>'}
const patterns=R.discovered_insights.filter(x=>x.evidence_basis!=="aggregate"),numbers=R.discovered_insights.filter(x=>x.evidence_basis==="aggregate");
const projectMetrics=Object.entries(R.metrics.by_project||{}).filter(([name])=>name!=="unknown").sort((a,b)=>b[1].sessions-a[1].sessions),projectCards=projectMetrics.map(([name,m])=>{const findings=R.session_findings.filter(x=>x.project===name),themes=[...new Set(findings.flatMap(x=>x.themes||[]))].slice(0,4),linked=R.discovered_insights.filter(x=>(x.evidence||[]).some(e=>e.project===name)||(x.metric_evidence||[]).some(v=>v.toLowerCase().includes(name.toLowerCase()))).length;return '<article class="project-card"><div class="project-top"><h3>'+esc(project(name))+'</h3><span class="project-meta">'+linked+' insight'+(linked===1?'':'s')+'</span></div><div class="project-numbers"><div class="project-number"><b>'+num(m.sessions)+'</b><span>sessions</span></div><div class="project-number"><b>'+num(m.messages)+'</b><span>messages</span></div><div class="project-number"><b>'+num(m.failures+m.retries)+'</b><span>friction signals</span></div></div><p class="project-themes">'+(themes.length?esc(themes.map(human).join(' · ')):findings.length+' sessions were read closely; no recurring theme cleared the evidence bar.')+'</p><button class="project-link" type="button" data-project="'+esc(name)+'">View '+findings.length+' inspected session'+(findings.length===1?'':'s')+' →</button></article>'}).join("");
const agents=[...new Set(R.session_findings.map(x=>x.agent))],sessionRows=R.session_findings.map((x,i)=>{const name=x.title&&!x.title.startsWith(x.agent+":")?x.title:"Untitled session",search=[name,x.project,x.agent,x.task_type,...(x.themes||[])].join(" ").toLowerCase(),evidence=(x.evidence||[])[0];return '<div class="row" data-search="'+esc(search)+'" data-project="'+esc(x.project)+'" data-agent="'+esc(x.agent)+'"><div class="row-title"><b>'+esc(name)+'</b><span>'+esc(project(x.project))+'</span></div><div class="row-agent">'+esc(x.agent)+'</div><div class="row-type">'+title(x.task_type)+'</div><button type="button" class="row-open" data-open="'+i+'">Details</button><div class="row-expand"><div><h4>Outcome</h4><p>'+esc(human(x.outcome_assessment))+'</p></div><div><h4>Signals</h4><p>'+esc([...(x.strengths||[]),...(x.friction||[])].map(human).join(" · ")||"No strong signal cleared the evidence bar")+'</p></div>'+(evidence?'<div class="session-evidence">Evidence: “'+esc(excerpt(evidence.excerpt))+'”</div>':'')+'</div></div>'}).join("");const profileNames={repeated_preferences:"What you tend to prefer",working_style:"How you tend to work",recurring_corrections:"What you correct most often",strengths:"What you're good at",failure_modes:"Where things tend to go wrong"},profileHtml=Object.entries(profileNames).map(([k,label])=>{const claims=R.user_profile[k]||[],body=claims.length?claims.map(c=>'<div class="claim"><p>'+esc(human(c.claim))+'</p>'+tick("session",c.supporting_session_ids?.length||0)+'</div>').join(""):'<p class="empty">Nothing here cleared the evidence bar yet.</p>';return '<div class="profile-card"><h3>'+label+'</h3>'+body+'</div>'}).join(""),recsHtml=(R.recommendations||[]).map(r=>'<article class="rec"><div class="rec-head"><h3>'+esc(human(r.title))+'</h3><span class="tag'+(r.provisional?' provisional':'')+'">'+esc((r.provisional?'Provisional ':'')+title(r.kind))+'</span></div><p>'+esc(human(r.action))+'</p>'+(r.rule?'<div class="rule">'+esc(r.rule)+'</div>':'')+tick("session",r.supporting_session_ids?.length||0)+'</article>').join(""),limits=R.limitations?.length?'<div class="limits"><h3>Worth keeping in mind</h3><ul>'+R.limitations.map(x=>'<li>'+esc(human(x))+'</li>').join("")+'</ul></div>':"";
$("#report").innerHTML='<div class="intro"><div class="eyebrow">Local agent intelligence</div><h1>Your work, seen across projects.</h1><p class="lede">A quieter view of your coding-agent history, grounded in <b>'+num(R.coverage.deeply_inspected)+' closely read sessions</b> and aggregate signals from '+num(R.coverage.eligible)+' substantive sessions.</p></div><section class="section" id="stats"><div class="section-head"><h2>Overview</h2><span class="count">'+R.metrics.sessions+' sessions in scope</span></div><div class="stats">'+statHtml+'</div><div class="explainer">Farpoint found <b>'+num(R.coverage.discovered)+'</b> sessions across your coding agents. It set aside <b>'+num(R.coverage.excluded_as_noise)+'</b> quick tests and one-offs, ranked the substantive work, and read <b>'+num(R.coverage.deeply_inspected)+'</b> sessions message by message. Project totals and aggregate findings use the full eligible set.</div></section><section class="section" id="usage"><div class="section-head"><h2>'+(hasEconomics?'Usage & cost':'Usage')+'</h2><span class="count">archive-wide unless noted</span></div><p class="note">'+(hasEconomics?'Spend, savings, agent share, model usage, tools, and the task mix observed in inspected sessions.':'Agent share, model usage, tools, and the task mix observed in inspected sessions.')+'</p>'+usageHtml+'</section><section class="section" id="projects"><div class="section-head"><h2>Projects</h2><span class="count">'+projectMetrics.length+' in scope</span></div><p class="note">Your work grouped by project, with volume, friction, inspected themes, and linked insights kept together.</p><div class="projects">'+(projectCards||'<p class="empty">No named projects were found.</p>')+'</div></section><section class="section" id="insights"><div class="section-head"><h2>Recommendations</h2><span class="count">'+(R.recommendations||[]).length+' actions</span></div><p class="note">Concrete changes derived from the repeated patterns below, placed first so the report leads with what to do next.</p><div class="recs">'+(recsHtml||'<p class="empty">No recommendation cleared the evidence bar.</p>')+'</div><div class="group"><div class="section-head"><h2>Supporting insights</h2><span class="count">'+R.discovered_insights.length+' findings</span></div><p class="note">Behavioral patterns come from exact session evidence. Numerical findings are computed across the archive. Expand a finding to inspect why it matters, the comparison, and its sources.</p></div><div class="group"><div class="group-label">Patterns across sessions and projects</div>'+(patterns.map(insightCard).join("")||'<p class="empty">No behavioral pattern cleared the evidence bar.</p>')+'</div><div class="group"><div class="group-label">Signals from the full archive</div>'+(numbers.map(insightCard).join("")||'<p class="empty">No aggregate anomaly cleared the usefulness bar.</p>')+'</div></section><section class="section" id="profile"><div class="section-head"><h2>Profile</h2><span class="count">patterns, not labels</span></div><p class="note">Repeated preferences and working tendencies, each bounded by the sessions that support it.</p><div class="profile">'+profileHtml+'</div>'+limits+'</section><section class="section" id="sessions"><div class="section-head"><h2>Supporting sessions</h2><span class="count">'+R.session_findings.length+' read in detail</span></div><p class="note">The source material behind the project summaries and insights. Search across title, project, agent, and theme.</p><div class="toolbar"><input class="search" id="search" placeholder="Search title, project, agent, theme…"><select class="select" id="agent-filter"><option value="">All agents</option>'+agents.map(a=>'<option>'+esc(a)+'</option>').join("")+'</select></div><div class="table">'+(sessionRows||'<p class="empty">No sessions available.</p>')+'</div></section><footer>Generated locally · source evidence stays on this machine</footer>';
const filter=()=>{const q=$("#search").value.toLowerCase(),a=$("#agent-filter").value;$$('.row').forEach(r=>r.hidden=!(r.dataset.search.includes(q)&&(!a||r.dataset.agent===a)))};
$("#search")?.addEventListener('input',filter);$("#agent-filter")?.addEventListener('change',filter);
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>{const r=b.closest('.row');r.classList.toggle('open');b.textContent=r.classList.contains('open')?'Close':'Details'}));
$$('[data-project]').forEach(b=>b.addEventListener('click',()=>{$("#search").value=b.dataset.project;filter();$("#sessions").scrollIntoView()}));
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function markdownReport(){const lines=['# Farpoint usage report','','Generated '+new Date(R.generated_at).toLocaleString(),'','## Overview','','- '+R.coverage.eligible+' substantive sessions in scope','- '+R.coverage.deeply_inspected+' sessions read in detail','- '+R.discovered_insights.length+' evidence-backed insights',...(hasEconomics?['- '+money(spent)+' tracked API spend ('+(cache.claude_only?'Claude-priced sessions only':'all priced sessions')+')','- '+money(saved)+' estimated cache savings']:[]),'- '+topAgent[0]+' is the most-used agent with '+topAgent[1]+' human sessions','- '+modelUsage.length+' models recorded','','## Projects',''];projectMetrics.forEach(([name,m])=>lines.push('### '+project(name),'','- '+m.sessions+' sessions · '+m.messages+' messages · '+(m.failures+m.retries)+' friction signals',''));lines.push('## Insights','');R.discovered_insights.forEach(x=>lines.push('### '+human(x.title),'',human(x.observation),'','Why it matters: '+human(x.why_it_matters),'',...(x.evidence||[]).slice(0,3).map(e=>'> '+excerpt(e.excerpt)+' — '+e.title+' ('+project(e.project)+')'),''));lines.push('## Profile','');Object.entries(profileNames).forEach(([key,label])=>{lines.push('### '+label,'');(R.user_profile[key]||[]).forEach(c=>lines.push('- '+human(c.claim)+' ('+c.supporting_session_ids.length+' sessions)'));lines.push('')});lines.push('## Supporting sessions','');R.session_findings.forEach(x=>lines.push('- **'+x.title+'** · '+project(x.project)+' · '+title(x.task_type)+' — '+human(x.outcome_assessment)));if(R.limitations?.length)lines.push('','## Limitations','',...R.limitations.map(x=>'- '+human(x)));return lines.join('\\n')}const exportToggle=$("#export-toggle"),exportMenu=$("#export-menu");exportToggle.addEventListener('click',()=>{const open=exportMenu.hidden;exportMenu.hidden=!open;exportToggle.setAttribute('aria-expanded',String(open))});document.addEventListener('click',e=>{if(!e.target.closest('.export')){exportMenu.hidden=true;exportToggle.setAttribute('aria-expanded','false')}});$$('[data-export]').forEach(b=>b.addEventListener('click',()=>{const stamp=R.generated_at.slice(0,10);exportMenu.hidden=true;if(b.dataset.export==='pdf'){window.print();return}if(b.dataset.export==='markdown')download('farpoint-report-'+stamp+'.md',markdownReport(),'text/markdown');if(b.dataset.export==='json')download('farpoint-report-'+stamp+'.json',JSON.stringify(R,null,2),'application/json')}));
let printState=[];window.addEventListener('beforeprint',()=>{printState=$$('details.insight').map(d=>d.open);$$('details.insight').forEach(d=>d.open=true);$$('.row').forEach(r=>r.classList.add('open'))});window.addEventListener('afterprint',()=>{$$('details.insight').forEach((d,i)=>d.open=printState[i]||false);$$('.row').forEach(r=>r.classList.remove('open'))});
const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)$$('.nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-20% 0 -70%'});$$('.section').forEach(s=>observer.observe(s));</script></body></html>`;
}
