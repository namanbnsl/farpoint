import type { AnalysisReport } from "../intelligence/types.js";

function serialize(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function renderHtmlReport(report: AnalysisReport): string {
  return String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>Farpoint · report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap');
    :root { color-scheme:dark; --ink:#f0f1ed; --muted:#a7aea7; --faint:#8e978f; --line:#2a2e2c; --accent:#84d7a0; --accent-deep:#2c4a37; --paper:#101211; --sidebar:#0b0d0c; --panel:#151816; --card:#141715; --soft:#1b1f1c; --sans:'Instrument Sans',ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; --mono:'DM Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; }
    * { box-sizing:border-box; }
    html,body { margin:0; min-height:100%; background:var(--paper); color:var(--ink); }
    body { overflow-x:hidden; font-family:var(--sans); font-optical-sizing:auto; -webkit-font-smoothing:antialiased; }
    button,input { color:inherit; font:inherit; }
    button:focus-visible,input:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
    ::selection { background:var(--accent-deep); color:var(--ink); }
    .shell { min-height:100vh; display:grid; grid-template-columns:236px minmax(0,1fr); }
    .sidebar { position:sticky; top:0; height:100vh; display:flex; flex-direction:column; padding:28px 18px 20px; border-right:1px solid var(--line); background:var(--sidebar); }
    .mark { display:flex; align-items:center; gap:10px; padding:0 8px; font-size:18px; font-weight:650; letter-spacing:-.045em; }
    .mark i { color:var(--accent); font-style:normal; }
    .logo { width:24px; height:24px; overflow:visible; }
    .logo .frame { fill:none; stroke:#656965; stroke-width:1.5; stroke-linecap:round; }
    .logo .point { fill:var(--accent); }
    .logo .ray { fill:none; stroke:var(--accent); stroke-width:1.5; stroke-linecap:round; }
    .nav { display:grid; gap:3px; margin-top:56px; }
    .nav button { display:flex; align-items:center; gap:10px; width:100%; min-height:42px; padding:10px; border:1px solid transparent; border-radius:6px; background:transparent; color:var(--faint); cursor:pointer; text-align:left; font-size:14px; transition:background .16s ease,color .16s ease,border-color .16s ease; }
    .nav button:hover { color:#d5d8d3; background:var(--panel); }
    .nav button.active { color:var(--ink); border-color:var(--line); background:var(--panel); }
    .nav-num { color:#5f665f; font:500 10px var(--mono); }
    .nav button.active .nav-num { color:var(--accent); }
    .sidebar-note { margin:auto 8px 18px; padding-top:16px; border-top:1px solid var(--line); color:#6f766f; font-size:11px; line-height:1.55; }
    .sidebar-note strong { display:block; margin-bottom:4px; color:#adb2ac; font-weight:550; }
    .sidebar-actions { display:grid; gap:6px; margin:0 8px; }
    .sidebar-actions button { min-height:34px; border:1px solid var(--line); border-radius:5px; background:transparent; color:var(--muted); cursor:pointer; font-size:11px; }
    .sidebar-actions button:hover { border-color:#555c56; color:var(--ink); }
    .main { min-width:0; min-height:100vh; display:flex; flex-direction:column; }
    .topbar { min-height:64px; display:flex; align-items:center; justify-content:space-between; gap:20px; padding:0 clamp(24px,5vw,72px); border-bottom:1px solid var(--line); }
    .topbar-context { color:var(--muted); font-size:12px; }
    .topbar-context b { color:var(--ink); font-weight:550; }
    .topbar-meta { color:var(--faint); font:400 10px var(--mono); text-align:right; }
    .stage { flex:1; min-height:0; }
    .page { display:none; width:min(1120px,100%); min-height:calc(100vh - 134px); margin:0 auto; padding:58px clamp(24px,5vw,72px) 84px; }
    .page.active { display:block; animation:enter .26s cubic-bezier(.2,.75,.25,1) both; }
    .page h1 { max-width:820px; margin:0; font-size:clamp(36px,5vw,64px); line-height:1.02; letter-spacing:-.058em; font-weight:520; text-wrap:balance; }
    .lede { max-width:680px; margin:20px 0 0; color:#a9ada8; font-size:16px; line-height:1.68; }
    .page-intro { display:flex; align-items:end; justify-content:space-between; gap:30px; margin-bottom:34px; }
    .page-intro p { max-width:420px; margin:0; color:var(--muted); font-size:13px; line-height:1.65; }
    .eyebrow { display:block; margin-bottom:14px; color:var(--accent); font:500 10px var(--mono); letter-spacing:.08em; text-transform:uppercase; }
    .scope-line { display:flex; flex-wrap:wrap; gap:8px 20px; margin-top:22px; color:var(--muted); font:400 12px var(--sans); }
    .scope-line span::before { content:none; }
    .scope-line span:last-child { display:none; }
    .nav-secondary { display:grid; gap:3px; margin-top:22px; padding-top:18px; border-top:1px solid var(--line); }
    .nav-secondary-label { padding:0 10px 7px; color:#626a63; font:500 9px var(--mono); letter-spacing:.08em; text-transform:uppercase; }
    .nav-secondary button { display:flex; align-items:center; gap:12px; width:100%; min-height:36px; padding:8px 10px; border:1px solid transparent; border-radius:6px; background:transparent; color:#707970; cursor:pointer; text-align:left; font-size:12px; }
    .nav-secondary button:hover,.nav-secondary button.active { color:var(--ink); background:var(--panel); border-color:var(--line); }
    .report-path { display:none; }
    .path-step { display:grid; grid-template-columns:42px minmax(0,1fr); gap:20px; padding:20px 0; border-bottom:1px solid var(--line); }
    .path-number { color:var(--accent); font:500 11px var(--mono); }
    .path-step h2 { margin:0; color:#e3e6e0; font-size:18px; line-height:1.3; font-weight:560; }
    .path-step p { max-width:620px; margin:6px 0 0; color:var(--muted); font-size:13px; line-height:1.6; }
    .primary-link { display:inline-flex; align-items:center; gap:8px; margin-top:28px; padding:10px 0; border:0; background:transparent; color:var(--accent); cursor:pointer; font-size:13px; font-weight:600; text-decoration:underline; text-underline-offset:4px; }
    .profile-groups { display:grid; gap:34px; max-width:900px; }
    .profile-group { border-top:1px solid var(--line); }
    .profile-group h2 { margin:0; padding:15px 0 13px; color:#c9cec8; font-size:14px; font-weight:600; }
    .profile-claims { display:grid; gap:0; background:transparent; }
    .profile-claim { display:flex; justify-content:space-between; align-items:start; gap:22px; padding:14px 0; border-bottom:1px solid var(--line); background:transparent; }
    .profile-claim p { max-width:700px; margin:0; color:#e0e4de; font-size:14px; line-height:1.5; }
    .profile-claim span { flex:0 0 auto; color:var(--muted); font:400 11px var(--sans); white-space:nowrap; }
    .overview-lead { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(260px,.75fr); gap:18px; margin-top:42px; }
    .recommendation-lead { min-height:260px; padding:27px 30px 28px; border:1px solid #3b5544; border-radius:8px; background:var(--accent-deep); }
    .recommendation-lead .eyebrow { color:#b5f0c7; }
    .recommendation-lead h2 { max-width:650px; margin:0; font-size:clamp(25px,3vw,38px); line-height:1.08; letter-spacing:-.04em; font-weight:560; }
    .recommendation-lead p { max-width:650px; margin:16px 0 0; color:#cfe7d5; font-size:14px; line-height:1.65; }
    .recommendation-lead .lead-action { margin-top:22px; color:#f0fff3; font-weight:550; }
    .lead-link { display:inline-flex; align-items:center; gap:8px; margin-top:20px; padding:0; border:0; background:transparent; color:#effff2; cursor:pointer; font-size:13px; font-weight:600; text-decoration:underline; text-underline-offset:4px; }
    .glance { border:1px solid var(--line); border-radius:8px; background:var(--panel); overflow:hidden; }
    .glance h2 { margin:0; padding:18px 20px 15px; border-bottom:1px solid var(--line); color:#c8ccc7; font-size:13px; font-weight:600; }
    .glance-grid { display:grid; grid-template-columns:1fr 1fr; }
    .glance-stat { min-height:95px; padding:16px 18px; border-bottom:1px solid var(--line); }
    .glance-stat:nth-child(odd) { border-right:1px solid var(--line); }
    .glance-stat:nth-last-child(-n+2) { border-bottom:0; }
    .glance-stat b { display:block; color:var(--ink); font:500 24px var(--mono); letter-spacing:-.04em; }
    .glance-stat span { display:block; margin-top:7px; color:var(--muted); font-size:11px; line-height:1.35; }
    .signal-block { margin-top:48px; }
    .signal-block h2 { margin:0 0 13px; color:#c8ccc7; font-size:14px; font-weight:600; }
    .signal-list { border-top:1px solid var(--line); }
    .signal-row { display:grid; grid-template-columns:34px minmax(0,1fr) auto; gap:14px; align-items:start; padding:18px 0; border-bottom:1px solid var(--line); }
    .signal-index { color:var(--accent); font:500 11px var(--mono); }
    .signal-row strong { display:block; color:#e3e5e0; font-size:15px; line-height:1.35; font-weight:550; }
    .signal-row p { max-width:700px; margin:5px 0 0; color:var(--muted); font-size:13px; line-height:1.6; }
    .signal-row button { padding:4px 0; border:0; background:transparent; color:var(--accent); cursor:pointer; font-size:12px; white-space:nowrap; }
    .reading-note { display:grid; grid-template-columns:150px minmax(0,650px); gap:22px; margin-top:40px; padding-top:18px; border-top:1px solid var(--line); }
    .reading-note strong { color:var(--ink); font-size:13px; font-weight:600; }
    .reading-note p { margin:0; color:var(--muted); font-size:13px; line-height:1.65; }
    .recommendations { display:grid; gap:10px; max-width:960px; }
    .recommendation { display:grid; grid-template-columns:46px minmax(0,1fr) auto; gap:20px; align-items:start; padding:22px 0 23px; border:0; border-top:1px solid var(--line); border-radius:0; background:transparent; }
    .recommendation:hover { border-color:#465049; }
    .recommendation-rank { color:var(--accent); font:500 12px var(--mono); }
    .recommendation h2 { margin:0; color:#e7e9e4; font-size:18px; line-height:1.3; font-weight:560; letter-spacing:-.02em; }
    .recommendation p { max-width:720px; margin:8px 0 0; color:var(--muted); font-size:13px; line-height:1.65; }
    .recommendation-rule { margin-top:13px; color:#c3c8c1; font-size:12px; line-height:1.55; }
    .recommendation-rule b { color:var(--accent); font-weight:550; }
    .recommendation button { padding:4px 0; border:0; background:transparent; color:var(--accent); cursor:pointer; font-size:12px; white-space:nowrap; }
    .empty { padding:18px; border:1px solid var(--line); color:var(--muted); font-size:13px; }
    .dossier-header { margin-bottom:25px; padding-bottom:21px; border-bottom:1px solid var(--line); }
    .dossier-header h2 { max-width:760px; margin:0; font-size:clamp(22px,3vw,32px); line-height:1.08; letter-spacing:-.035em; font-weight:560; }
    .dossier-header p { max-width:700px; margin:10px 0 0; color:var(--muted); font-size:13px; line-height:1.6; }
    .tabs { display:flex; flex-wrap:wrap; gap:18px; margin-bottom:18px; padding:0; border:0; background:transparent; width:max-content; max-width:100%; }
    .tabs button { padding:7px 0 8px; border:0; border-bottom:2px solid transparent; border-radius:0; background:transparent; color:var(--muted); cursor:pointer; font-size:12px; }
    .tabs button:hover { color:var(--ink); }
    .tabs button.active { background:transparent; color:var(--accent); box-shadow:none; border-bottom-color:var(--accent); }
    .dossier-grid { display:grid; gap:0; max-width:1000px; }
    .dossier-card { border:0; border-top:1px solid var(--line); border-radius:0; background:transparent; overflow:hidden; }
    .dossier-card:hover { border-color:var(--line); }
    .dossier-toggle { display:grid; grid-template-columns:minmax(0,1fr) 28px; gap:18px; width:100%; padding:19px 0; text-align:left; border:0; background:transparent; color:inherit; cursor:pointer; }
    .dossier-kicker-row { display:block; margin-bottom:7px; color:var(--faint); font:500 10px var(--mono); letter-spacing:.03em; text-transform:uppercase; }
    .dossier-card h3 { margin:0; color:#e1e4df; font-size:16px; line-height:1.38; font-weight:540; overflow-wrap:anywhere; }
    .dossier-meta { display:block; margin-top:9px; color:var(--muted); font:400 11px var(--sans); }
    .dossier-icon { display:grid; place-items:center; width:24px; height:24px; color:var(--faint); border:1px solid var(--line); border-radius:50%; font:400 16px var(--mono); }
    .dossier-card.open .dossier-icon { color:var(--accent); transform:rotate(45deg); }
    .dossier-answer { display:grid; grid-template-rows:0fr; transition:grid-template-rows .24s ease; }
    .dossier-answer > div { overflow:hidden; }
    .dossier-card.open .dossier-answer { grid-template-rows:1fr; }
    .dossier-copy { max-width:800px; padding:0 0 21px; }
    .dossier-copy p { margin:7px 0 0; color:var(--muted); font-size:13px; line-height:1.65; }
    .dossier-label { display:block; margin:15px 0 0; color:#d0d4ce; font-size:11px; font-weight:600; }
    .dossier-label:first-child { margin-top:0; }
    .text-link { margin-top:15px; padding:0; border:0; background:transparent; color:var(--accent); cursor:pointer; font-size:12px; font-weight:600; text-decoration:underline; text-underline-offset:3px; }
    .activity-tabs { margin-bottom:24px; }
    .activity-view { display:none; max-width:1040px; }
    .activity-view.active { display:block; animation:enter .2s ease both; }
    .metric-groups { display:grid; grid-template-columns:repeat(2,minmax(240px,1fr)); gap:12px; }
    .metric-group { border:1px solid var(--line); border-radius:7px; background:var(--panel); overflow:hidden; }
    .metric-group h2 { margin:0; padding:14px 16px; border-bottom:1px solid var(--line); color:#b9beb8; font-size:12px; font-weight:600; }
    .metric-row { display:flex; justify-content:space-between; gap:24px; padding:10px 16px; border-bottom:1px solid #242825; font-size:12px; }
    .metric-row:last-child { border-bottom:0; }
    .metric-row span { min-width:0; color:var(--muted); overflow-wrap:anywhere; }
    .metric-row b { color:#dfe3dd; font:500 11px var(--mono); text-align:right; }
    .chart { max-width:900px; }
    .chart-metrics { display:flex; flex-wrap:wrap; gap:2px; margin-bottom:22px; padding:3px; border:1px solid var(--line); border-radius:6px; background:var(--panel); width:max-content; max-width:100%; }
    .chart-metrics button { padding:7px 12px; border:0; border-radius:4px; background:transparent; color:var(--muted); cursor:pointer; font-size:12px; }
    .chart-metrics button.active { background:var(--soft); color:var(--ink); box-shadow:0 0 0 1px #39403a; }
    .chart-rows { display:grid; gap:5px; }
    .chart-row { display:grid; grid-template-columns:minmax(120px,190px) 1fr 72px; gap:16px; align-items:center; width:100%; padding:8px 0; border:0; background:transparent; color:var(--muted); cursor:pointer; text-align:left; }
    .chart-row > span:first-child { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .chart-row:hover { color:var(--ink); }
    .track { height:5px; background:#292d2a; overflow:hidden; }
    .fill { display:block; height:100%; background:#aeb5ae; transform-origin:left; animation:grow .4s cubic-bezier(.2,.75,.25,1) both; transition:background .15s ease; }
    .chart-row:hover .fill,.chart-row.active .fill { background:var(--accent); }
    .chart-row b { color:var(--muted); font:400 11px var(--sans); text-align:right; }
    .chart-detail { min-height:36px; margin-top:17px; padding-top:12px; border-top:1px solid var(--line); color:var(--muted); font-size:12px; }
    .search-wrap { display:flex; align-items:center; gap:14px; max-width:900px; margin:8px 0 15px; }
    .search { width:100%; min-height:44px; padding:0 14px; border:1px solid #353a36; border-radius:6px; background:var(--panel); color:var(--ink); font-size:13px; }
    .search::placeholder { color:#687069; }
    .result-count { flex:0 0 auto; color:var(--muted); font-size:12px; }
    .evidence-list { display:grid; gap:1px; max-width:900px; border:1px solid var(--line); border-radius:7px; background:var(--line); overflow:hidden; }
    .evidence-row { padding:16px 18px; border:0; background:var(--card); text-align:left; cursor:pointer; }
    .evidence-row:hover { background:var(--soft); }
    .evidence-row strong { display:block; margin-bottom:5px; color:#e0e3de; font-size:14px; line-height:1.35; font-weight:540; overflow-wrap:anywhere; }
    .evidence-meta { display:block; color:var(--muted); font:400 11px var(--sans); }
    .evidence-detail { display:none; max-width:820px; margin-top:13px; padding-top:12px; border-top:1px solid var(--line); color:#aab0a9; font-size:12px; line-height:1.7; white-space:pre-wrap; overflow-wrap:anywhere; }
    .evidence-row.open .evidence-detail { display:block; animation:enter .18s ease both; }
    .footer { display:flex; justify-content:flex-end; padding:16px clamp(24px,5vw,72px) 25px; border-top:1px solid var(--line); }
    .footer p { margin:0; color:#697169; font-size:11px; }
    @keyframes enter { from { opacity:0; transform:translateY(7px); } to { opacity:1; transform:none; } }
    @keyframes grow { from { transform:scaleX(0); } }
    @media (max-width:900px) { .page-intro { display:block; } .page-intro p { margin-top:12px; } .overview-lead { grid-template-columns:1fr; } .metric-groups { grid-template-columns:1fr; } }
    @media (max-width:700px) { .shell { grid-template-columns:64px minmax(0,1fr); } .sidebar { padding:23px 7px 15px; align-items:center; } .mark { padding:0; } .mark span,.nav-text,.sidebar-note,.sidebar-actions { display:none; } .nav { width:100%; margin-top:48px; } .nav button { justify-content:center; padding:9px 4px; } .nav-num { font-size:10px; } .topbar { min-height:56px; padding:0 18px; } .topbar-context { font-size:11px; } .topbar-meta { display:none; } .page { min-height:calc(100vh - 112px); padding:36px 18px 64px; } .page h1 { font-size:38px; } .lede { font-size:15px; } .recommendation-lead { padding:22px 20px 23px; } .recommendation-lead h2 { font-size:28px; } .signal-row { grid-template-columns:26px minmax(0,1fr); gap:10px; } .signal-row button { grid-column:2; justify-self:start; } .reading-note { grid-template-columns:1fr; gap:7px; } .recommendation { grid-template-columns:30px minmax(0,1fr); gap:12px; padding:18px; } .recommendation button { grid-column:2; justify-self:start; } .dossier-toggle { padding:17px 15px; } .dossier-copy { padding:0 15px 18px; } .chart-row { grid-template-columns:100px 1fr 54px; gap:9px; } }
    @media (max-width:700px) { .path-step { grid-template-columns:28px minmax(0,1fr); gap:12px; } .profile-claim { display:block; } .profile-claim span { display:block; margin-top:8px; } }
    .eyebrow { display:none; }
    .page h1 { max-width:760px; font-size:clamp(34px,4.6vw,56px); line-height:1.06; letter-spacing:-.045em; }
    .lede { max-width:620px; margin-top:18px; font-size:17px; line-height:1.65; }
    .primary-link { margin-top:30px; padding:11px 15px; border:1px solid var(--accent); border-radius:7px; background:var(--accent); color:#102016; text-decoration:none; }
    .recommendation { grid-template-columns:minmax(0,1fr) auto auto; gap:24px; }
    .recommendation > div { min-width:0; }
    .dossier-card:last-child { border-bottom:1px solid var(--line); }
    .dossier-card.dossier-collapsed { display:none; }
    .dossier-more { display:block; margin-top:22px; padding:0; border:0; background:transparent; color:var(--accent); cursor:pointer; font:600 13px var(--sans); }
    .dossier-more:hover { color:var(--ink); }
    .topbar-context { display:none; }
    .topbar { display:none; }
    .page { min-height:calc(100vh - 70px); }
    .page-intro > p { display:none; }
    .nav-secondary { margin-top:42px; padding-top:0; border-top:0; gap:2px; }
    .nav-secondary-label { display:none; }
    .nav-secondary button { min-height:32px; padding:7px 10px; border:0; border-radius:4px; color:#8c958d; font-size:13px; }
    .nav-secondary .nav-num { display:none; }
    .nav-secondary button:first-of-type { color:var(--ink); background:transparent; }
    .nav-secondary button:last-of-type { color:var(--faint); }
    .nav-secondary button:hover,.nav-secondary button.active { color:var(--ink); background:var(--panel); border-color:transparent; }
    .nav-icon { width:16px; height:16px; flex:0 0 16px; color:var(--faint); }
    .nav-icon circle,.nav-icon path,.nav-icon rect,.nav-icon polyline { fill:none; stroke:currentColor; stroke-width:1.4; stroke-linecap:round; stroke-linejoin:round; }
    .nav button.active .nav-icon,.nav button:hover .nav-icon,.nav-secondary .nav-icon { color:var(--accent); }
    .sidebar-actions { display:flex; gap:14px; margin:18px 10px 0; padding-top:14px; border-top:1px solid var(--line); }
    .sidebar-actions button { display:inline-flex; align-items:center; gap:10px; min-height:24px; padding:0; border:0; border-radius:0; font-size:12px; text-align:left; }
    .sidebar-actions button:hover { border-color:transparent; }
    .action-icon { width:14px; height:14px; flex:0 0 14px; color:var(--accent); }
    .action-icon path,.action-icon rect { fill:none; stroke:currentColor; stroke-width:1.4; stroke-linecap:round; stroke-linejoin:round; }
    @media (max-width:700px) { .sidebar-actions { display:none; } }
    .recommendation .recommendation-evidence { margin-top:0; }
    @media (max-width:700px) { .recommendation { grid-template-columns:1fr; } .recommendation button { grid-column:1; justify-self:start; } }
    @media print { .sidebar,.topbar,.footer { display:none; } .main { display:block; } .stage { display:block; } .page,.page.active { display:block; width:auto; min-height:0; padding:28px 20px; break-inside:avoid; } body,.page,.profile-claim,.dossier-card,.metric-group,.evidence-row { background:white!important; color:#111!important; } .page h1,.page h2,.page h3,.profile-claim p,.dossier-card h3,.metric-row b,.evidence-row strong { color:#111!important; } .page p,.profile-claim span,.dossier-meta,.metric-row span,.evidence-meta { color:#555!important; } }
    @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none!important; transition:none!important; } }
  </style>
</head>
<body>
  <!-- THESIS: Make the report a guided profile, not a dashboard. OWN-WORLD: A dark evidence ledger with mint signal, hairline structure, and measurement in mono. STORY: You understand how you work, then why Farpoint thinks so, then what to try. FIRST VIEWPORT: A quiet introduction names the three layers of the report and keeps all conclusions for later pages. FORM: Profile reading, ordered Intro, Your profile, Findings + insights, Recommendations; activity and source evidence are optional detail; seed key evidence-ledger-report-v3. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md -->
  <main id="report"></main>
  <script id="report-data" type="application/json">${serialize(report)}</script>
  <script>
    const R=JSON.parse(document.getElementById('report-data').textContent);
    const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const clean=value=>String(value??'').replace(/\s*\[[\w.-]+:[\w-]+:[\d,\-]+\]/g,'').replace(/\[\d+:\s*([^\]]*)\]/g,'$1').replace(/\s+Support:.*$/i,'').replace(/\bthe user's\b/gi,'your').replace(/\bthe user’s\b/gi,'your').replace(/\bthe user\b/gi,'you').replace(/\busers'\b/g,'your').replace(/\buser's\b/gi,'your').replace(/\bUsers\b/g,'You').replace(/\busers\b/g,'you').replace(/\buser\b/gi,'you').replace(/:\s+they\b/gi,': you').replace(/\s{2,}/g,' ').trim();
    const short=(value,max=260)=>{const text=clean(value);if(text.length<=max)return text;const cut=text.slice(0,max);return cut.slice(0,Math.max(cut.lastIndexOf('.'),cut.lastIndexOf(' ')))+'…'};
    const project=value=>String(value||'Coding session').split(/[\\/]/).filter(Boolean).pop()?.replace(/[_-]+/g,' ')||'Coding session';
    const label=value=>String(value||'').replace(/_/g,' ').replace(/\b\w/g,char=>char.toUpperCase());
    const number=value=>Number(value||0).toLocaleString(undefined,{maximumFractionDigits:2});
    const compact=value=>Intl.NumberFormat(undefined,{notation:'compact',maximumFractionDigits:1}).format(Number(value||0));
    const percent=value=>(Number(value||0)*100).toLocaleString(undefined,{maximumFractionDigits:1})+'%';
    const money=value=>Number(value||0).toLocaleString(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2});
    const insights=[...(R.discovered_insights||[])].sort((a,b)=>(b.score||b.support_count||0)-(a.score||a.support_count||0));
    const findings=R.session_findings||[];
    const recommendations=R.recommendations||[];
    const primary=insights[0]||{title:'Your work has a shape worth seeing.',observation:'Farpoint found patterns across your recent agent sessions.',action:'Choose one small practice to try next.'};
    const next=recommendations[0]||{title:'Start with one small change',action:primary.action};
    const recommendationHeadlines={'storyboard-first visual teaching skill':'Storyboard visual work before you build it.','artifact-specific acceptance gate':'Verify the result, not just the process.','environment preflight skill':'Check the environment before you start.','scope acceptance matrix':'Decide what is in and out before coding.','add a simplicity gate before visual implementation':'Plan the simple version before you build it.','validate integrations before implementation':'Check tools and access before you rely on them.','confirm optional features before setup':'Ask before adding extra features.'};
    const recommendationHeadline=recommendationHeadlines[clean(next.title).toLowerCase()]||clean(next.title)||'Start with one small change';
    const isRawSessionTitle=value=>{const text=clean(value);return !text||/^(?:[a-z0-9._-]+:)?(?:ses_[a-z0-9]+|[a-f0-9]{8,}(?:-[a-f0-9]+){1,})$/i.test(text)};
    const sessionTitle=(value,projectName='')=>{const text=clean(value);if(!isRawSessionTitle(text))return text;const place=project(projectName);return place==='Coding session'?'Session evidence':'Session in '+place};
    const profileGroups=R.user_profile||{};
    const profileQuestions={repeated_preferences:'What do you ask for most?',working_style:'How do you like to work?',recurring_corrections:'When do you change course?',strengths:'What are you unusually good at?',failure_modes:'Where does work go sideways?'};
    const profileEntries=Object.entries(profileQuestions).map(([key,question])=>{const claims=(profileGroups[key]||[]).map(item=>clean(item.claim)).filter(Boolean);return{kind:'Profile',question,title:claims[0]||'Still taking shape',sections:[['Also observed',claims.slice(1).join(' ')],['Support',claims.length+' recurring signal'+(claims.length===1?'':'s')]],evidence:[],query:'',score:claims.length>1?1:.5}});
    const sessionById=new Map(findings.filter(item=>item.session_id).map(item=>[item.session_id,item]));
    const evidenceSearchQuery=item=>{const first=item.evidence?.[0],finding=sessionById.get(first?.session_id);return sessionTitle(first?.title||finding?.title||first?.project||item.title,first?.project||finding?.project)};
    const questionItems=[...insights.map(item=>({kind:'Insight',question:clean(item.title),title:clean(item.observation),sections:[['Why it matters',item.why_it_matters],['Try this',item.action],['Expected impact',item.expected_impact],['Another explanation',item.competing_explanation],['Metric evidence',(item.metric_evidence||[]).join(' · ')]],evidence:item.evidence||[],query:evidenceSearchQuery(item),score:item.confidence_score||0})),...findings.map(item=>({kind:'Session finding',question:sessionTitle(item.title,item.project),title:sessionTitle(item.title,item.project),sections:[['Outcome',item.outcome_assessment],['Friction',(item.friction||[]).join(' ')],['What worked',(item.strengths||[]).join(' ')],['Recurring mistakes',(item.recurring_mistakes||[]).join(' ')],['Preferences',(item.user_preferences||[]).join(' ')],['Advice',(item.advice||[]).join(' ')]],evidence:item.evidence||[],query:evidenceSearchQuery(item),score:item.confidence_score||0}))];
    const dossierCards=[...questionItems];
    const profileGroupsHtml=Object.entries(profileQuestions).map(([key,question])=>{const claims=(profileGroups[key]||[]).filter(item=>clean(item.claim));return '<section class="profile-group"><h2>'+esc(question)+'</h2><div class="profile-claims">'+(claims.length?claims.map(item=>'<div class="profile-claim"><p>'+esc(clean(item.claim))+'</p><span>'+esc(number(item.supporting_session_ids?.length))+' session'+(item.supporting_session_ids?.length===1?'':'s')+'</span></div>').join(''):'<div class="profile-claim"><p>Still taking shape.</p><span>not enough signal</span></div>')+'</div></section>'}).join('');
    const evidenceMap=new Map();
    const addEvidence=item=>{if(!item)return;const key=[item.session_id,item.ordinal_start,item.ordinal_end,item.excerpt].join('|');if(!evidenceMap.has(key))evidenceMap.set(key,item)};
    (R.evidence||[]).forEach(addEvidence);insights.forEach(item=>(item.evidence||[]).forEach(addEvidence));findings.forEach(item=>(item.evidence||[]).forEach(addEvidence));
    const evidenceRecords=[...evidenceMap.values()];
    const evidenceTitle=item=>{const finding=sessionById.get(item.session_id);return sessionTitle(item.title||finding?.title,item.project||finding?.project)};
    const evidenceProject=item=>project(item.project||sessionById.get(item.session_id)?.project);
    const evidenceAgent=item=>item.agent||sessionById.get(item.session_id)?.agent||'';
    const evidenceOrdinal=item=>item.ordinal_start==null?'':item.ordinal_end!=null&&item.ordinal_end!==item.ordinal_start?'turns '+item.ordinal_start+'–'+item.ordinal_end:'turn '+item.ordinal_start;
    const projectMap=new Map();
    for(const [name,values] of Object.entries(R.metrics?.by_project||{})){const display=project(name),key=display.toLowerCase(),current=projectMap.get(key)||{name:display,sessions:0,messages:0,failures:0,retries:0,friction:0};current.sessions+=Number(values.sessions||0);current.messages+=Number(values.messages||0);current.failures+=Number(values.failures||0);current.retries+=Number(values.retries||0);current.friction=current.failures+current.retries;projectMap.set(key,current)}
    const projectStats=[...projectMap.values()];
    const agentStats=Object.entries(R.metrics?.by_agent||{}).map(([name,values])=>({name,...values,friction:Number(values.failures||0)+Number(values.retries||0)}));
    const stats=R.agentsview_stats||{};
    const modelStats=Object.entries(stats.model_mix?.by_tokens||{}).map(([name,value])=>({name,tokens:Number(value||0)}));
    const toolStats=Object.entries(stats.tool_mix?.by_category||{}).map(([name,value])=>({name,calls:Number(value||0)}));
    const economics=stats.cache_economics||{};
    const hasEconomics=Number(economics.dollars_spent||0)>0||Number(economics.dollars_saved_vs_uncached||0)>0||Number(economics.cache_hit_ratio?.overall||0)>0;
    const steps=[['intro','Intro'],['profile','Your profile'],['findings','Findings'],['recommendations','Recommendations']];
    const secondarySteps=[['evidence','Search evidence']];
    const caseWindow=stats.window||{};
    const fmtDate=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?'':date.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})};
    const identityName=clean((profileGroups.working_style||profileGroups.repeated_preferences||[])[0]?.claim)?'Your working pattern':'Your agent workflow';
    const logo='<div class="mark"><svg class="logo" viewBox="0 0 25 25" role="img" aria-label="Farpoint"><path class="frame" d="M8 3.5H3.5V8M17 3.5h4.5V8M21.5 17v4.5H17M8 21.5H3.5V17"/><circle class="point" cx="12.5" cy="12.5" r="2.7"/><path class="ray" d="M12.5 6.5v2M18.5 12.5h-2"/></svg><span>farpoint<i>.</i></span></div>';
    const dossierHeader='';
    const dossierKinds=[['insight','Insights'],['session','Session findings'],['all','All']];
    const kindSlug=kind=>kind==='Insight'?'insight':'session';
    const dossierTabs='<nav class="tabs dossier-tabs" aria-label="Finding type">'+dossierKinds.map((tab,index)=>'<button type="button" data-dossier-kind="'+tab[0]+'" class="'+(index===0?'active':'')+'" aria-pressed="'+(index===0?'true':'false')+'">'+tab[1]+'</button>').join('')+'</nav>';
    const dossierGrid='<div class="dossier-grid" id="dossier-grid">'+dossierCards.map((item,index)=>'<article class="dossier-card" data-kind="'+kindSlug(item.kind)+'"><button type="button" class="dossier-toggle" data-dossier="'+index+'" aria-expanded="false"><span><span class="dossier-kicker-row">'+esc(item.kind)+' · '+esc(item.question)+'</span><h3>'+esc(short(item.title,150))+'</h3></span><span class="dossier-icon" aria-hidden="true">+</span></button><div class="dossier-answer"><div><div class="dossier-copy">'+item.sections.filter(section=>clean(section[1])).map(section=>'<span class="dossier-label">'+esc(section[0])+'</span><p>'+esc(clean(section[1]))+'</p>').join('')+(item.evidence.length?'<button class="text-link" type="button" data-evidence-query="'+esc(item.query)+'">Search supporting evidence →</button>':'')+'</div></div></div></article>').join('')+'</div>';
    const overlapCount=(a,b)=>(a||[]).filter(id=>(b||[]).includes(id)).length;
    const groundingInsight=[...insights].sort((a,b)=>overlapCount(b.supporting_session_ids,next.supporting_session_ids)-overlapCount(a.supporting_session_ids,next.supporting_session_ids))[0]||primary;
    const groundingIndex=insights.includes(groundingInsight)?insights.indexOf(groundingInsight):0;
    const recommendationFindingIndex=item=>{const match=insights.findIndex(insight=>overlapCount(insight.supporting_session_ids,item.supporting_session_ids)>0);return match<0?0:match};
    const evidenceRows=evidenceRecords.map((item,index)=>'<button class="evidence-row" type="button" data-evidence="'+index+'" aria-expanded="false"><strong>'+esc(evidenceTitle(item))+'</strong><span class="evidence-meta">'+esc([evidenceProject(item),evidenceAgent(item),label(item.signal_type),evidenceOrdinal(item)].filter(Boolean).join(' · '))+'</span><span class="evidence-detail">'+esc(item.excerpt||'No excerpt available.')+'</span></button>').join('');
    const evidence=evidenceRows?'<div class="evidence-list" id="evidence-list">'+evidenceRows+'<div class="empty" id="evidence-empty" hidden>No evidence matches your search.</div></div>':'<div class="evidence-list" id="evidence-list"><div class="empty">No evidence excerpts are available.</div></div>';
    const metricRows=(record,formatter=number)=>Object.entries(record||{}).map(([key,value])=>'<div class="metric-row"><span>'+esc(label(key))+'</span><b>'+esc(formatter(value))+'</b></div>').join('')||'<div class="metric-row"><span>No data available</span></div>';
    const formatAdoption=value=>typeof value==='boolean'?(value?'Yes':'No'):Number(value)>=0&&Number(value)<=1?percent(value):number(value);
    const percentileRows=Object.entries(R.metrics?.percentiles||{}).flatMap(([metric,values])=>Object.entries(values).map(([point,value])=>[label(metric)+' · '+point,value]));
    const summary='<div class="metric-groups"><section class="metric-group"><h2>Totals</h2>'+metricRows({sessions:R.metrics?.sessions,...R.metrics?.totals})+'</section><section class="metric-group"><h2>Per session</h2>'+metricRows(R.metrics?.averages)+'</section><section class="metric-group"><h2>Percentiles</h2>'+percentileRows.map(([key,value])=>'<div class="metric-row"><span>'+esc(key)+'</span><b>'+esc(number(value))+'</b></div>').join('')+'</section><section class="metric-group"><h2>Outcomes</h2>'+metricRows(R.metrics?.outcomes)+'</section><section class="metric-group"><h2>Archive</h2>'+metricRows(stats.totals)+'</section><section class="metric-group"><h2>Session shapes</h2>'+metricRows(stats.archetypes)+'</section></div>';
    const timing='<div class="metric-groups"><section class="metric-group"><h2>Turn cycle · seconds</h2>'+metricRows(stats.velocity?.turn_cycle_seconds)+'</section><section class="metric-group"><h2>First response · seconds</h2>'+metricRows(stats.velocity?.first_response_seconds)+'</section><section class="metric-group"><h2>Adoption</h2>'+metricRows(stats.adoption,formatAdoption)+'</section><section class="metric-group"><h2>Distributions</h2>'+Object.entries(stats.distributions||{}).flatMap(([name,scopes])=>Object.entries(scopes||{}).flatMap(([scope,values])=>Object.entries(values||{}).map(([point,value])=>'<div class="metric-row"><span>'+esc(label(name)+' · '+label(scope)+' · '+point)+'</span><b>'+esc(number(value))+'</b></div>'))).join('')+'</section></div>';
    const costs='<div class="metric-groups"><section class="metric-group"><h2>LLM economics</h2><div class="metric-row"><span>Estimated spend</span><b>'+money(economics.dollars_spent)+'</b></div><div class="metric-row"><span>Saved by cache</span><b>'+money(economics.dollars_saved_vs_uncached)+'</b></div><div class="metric-row"><span>Cache hit ratio</span><b>'+percent(economics.cache_hit_ratio?.overall)+'</b></div></section></div>';
    const activityTabs=[['summary','Summary'],['projects','Projects'],['agents','Agents'],['models','Models'],['tools','Tools'],['timing','Timing'],...(hasEconomics?[['costs','Costs']]:[])];
    const recRows=recommendations.map((item,index)=>'<article class="recommendation"><span class="recommendation-rank">'+String(index+1).padStart(2,'0')+'</span><div><h2>'+esc(recommendationHeadlines[clean(item.title).toLowerCase()]||clean(item.title)||'One thing to try next')+'</h2><p>'+esc(short(item.action||item.description,330))+'</p>'+(item.rule?'<div class="recommendation-rule"><b>Working rule</b> · '+esc(clean(item.rule))+'</div>':'')+'</div><button type="button" data-recommendation-index="'+recommendationFindingIndex(item)+'">Open related finding →</button></article>').join('');
    const reportIntro='This report turns your local coding-agent history into a short list of changes worth trying, then shows the patterns and original excerpts that support them.';
    /* Legacy render path disabled during cleanup.
    document.getElementById('report').innerHTML='<div class="shell"><aside class="sidebar">'+logo+'<nav class="nav" aria-label="Report sections">'+steps.map((step,index)=>'<button type="button" data-page="'+step[0]+'" class="'+(index===0?'active':'')+'" aria-current="'+(index===0?'page':'false')+'"><span class="nav-num">'+String(index+1).padStart(2,'0')+'</span><span class="nav-text">'+step[1]+'</span></button>').join('')+'</nav><div class="sidebar-note"><strong>Local report</strong>Source excerpts stay on this machine.</div><div class="sidebar-actions"><button type="button" id="print-report">Print / PDF</button><button type="button" id="download-json">Download JSON</button></div></aside><section class="main"><header class="topbar"><div class="topbar-context"><b>Farpoint report</b> · evidence ledger</div><div class="topbar-meta">'+esc(fmtDate(R.generated_at)||'Local analysis')+'</div></header><div class="stage"><article class="page active" id="overview"><span class="eyebrow">A decision record for your agent workflow</span><h1>See the pattern. Change the practice.</h1><p class="lede">'+esc(reportIntro)+'</p><div class="scope-line"><span>'+esc(number(R.metrics?.sessions))+' sessions in scope</span><span>'+esc(number(R.coverage?.deeply_inspected))+' read closely</span><span>generated locally</span></div><div class="overview-lead"><section class="recommendation-lead"><span class="eyebrow">Start here · recommendation 01</span><h2>'+esc(recommendationHeadline)+'</h2><p>'+esc(short(groundingInsight.observation||groundingInsight.title,260))+'</p><p class="lead-action">'+esc(short(next.action,330))+'</p><button class="lead-link" type="button" id="open-recommendation">See why this is recommended →</button></section><section class="glance"><h2>At a glance</h2><div class="glance-grid">'+glance.map(item=>'<div class="glance-stat"><b>'+esc(number(item[2]))+'</b><span>'+esc(item[1])+'</span></div>').join('')+'</div></section></div><section class="signal-block"><h2>Signals worth knowing</h2><div class="signal-list">'+(signalRows||'<div class="empty">No cross-session insights cleared the evidence bar.</div>')+'</div></section><div class="reading-note"><strong>How to read this</strong><p>Recommendations are the short list. Findings explain the patterns. Activity gives you the archive context. Evidence lets you inspect the source material yourself.</p></div></article><article class="page" id="recommendations"><div class="page-intro"><div><span class="eyebrow">What to try next</span><h1>Make one change with a reason.</h1></div><p>These actions are ordered by the patterns Farpoint found, not by generic productivity advice. Start with the first one, then measure whether it helps.</p></div><div class="recommendations">'+(recRows||'<div class="empty">No recommendation cleared the evidence bar.</div>')+'</div></article><article class="page" id="findings"><div class="page-intro"><div><span class="eyebrow">What supports the advice</span><h1>Patterns behind the recommendation.</h1></div><p>Open a finding to see why it matters, what to try, and the alternative explanation Farpoint kept in view.</p></div>'+dossierHeader+dossierTabs+dossierGrid+'</article><article class="page" id="activity"><div class="page-intro"><div><span class="eyebrow">The archive, measured</span><h1>Your activity in context.</h1></div><p>Use these views to understand volume, distribution, timing, and cost without confusing raw activity for a conclusion.</p></div><nav class="tabs activity-tabs" aria-label="Activity view">'+activityTabs.map((tab,index)=>'<button type="button" data-activity="'+tab[0]+'" class="'+(index===0?'active':'')+'" aria-pressed="'+(index===0?'true':'false')+'">'+tab[1]+'</button>').join('')+'</nav><section class="activity-view active" data-view="summary">'+summary+'</section><section class="activity-view" data-view="projects"><div class="chart" id="projects-chart"></div></section><section class="activity-view" data-view="agents"><div class="chart" id="agents-chart"></div></section><section class="activity-view" data-view="models"><div class="chart" id="models-chart"></div></section><section class="activity-view" data-view="tools"><div class="chart" id="tools-chart"></div></section><section class="activity-view" data-view="timing">'+timing+'</section>'+(hasEconomics?'<section class="activity-view" data-view="costs">'+costs+'</section>':'')+'</article><article class="page" id="evidence"><div class="page-intro"><div><span class="eyebrow">Inspect the source</span><h1>Evidence you can open.</h1></div><p>Search the original excerpts used across the synthesized insights and close-read sessions.</p></div><div class="search-wrap"><input class="search" id="evidence-search" type="search" aria-label="Search evidence, sessions, or projects" placeholder="Search evidence, sessions, projects…" autocomplete="off"><span class="result-count" id="result-count" aria-live="polite"></span></div>'+evidence+'</article></div><footer class="footer"><p>Generated locally · source evidence stays on this machine</p></footer></section></div></div>';
    */
    const pageMarkup='<div class="shell"><aside class="sidebar">'+logo+'<nav class="nav" aria-label="Report sections">'+steps.map((step,index)=>'<button type="button" data-page="'+step[0]+'" class="'+(index===0?'active':'')+'" aria-current="'+(index===0?'page':'false')+'"><span class="nav-num">'+String(index+1).padStart(2,'0')+'</span><span class="nav-text">'+step[1]+'</span></button>').join('')+'</nav><nav class="nav-secondary" aria-label="Optional report detail"><span class="nav-secondary-label">Inspect</span>'+secondarySteps.map(step=>'<button type="button" data-page="'+step[0]+'"><span class="nav-num">·</span><span class="nav-text">'+step[1]+'</span></button>').join('')+'</nav><div class="sidebar-actions"><button type="button" id="print-report">Print / PDF</button><button type="button" id="download-json">Download JSON</button></div></aside><section class="main"><header class="topbar"><div class="topbar-context"><b>Farpoint report</b> · local profile</div><div class="topbar-meta">'+esc(fmtDate(R.generated_at)||'Local analysis')+'</div></header><div class="stage"><article class="page active" id="intro"><span class="eyebrow">A guided read of your agent history</span><h1>What Farpoint will give you.</h1><p class="lede">Farpoint reads your coding-agent sessions and turns them into a profile of how you work, the patterns behind it, and a few changes worth trying.</p><div class="scope-line"><span>'+esc(number(R.metrics?.sessions))+' sessions in scope</span><span>'+esc(number(R.coverage?.deeply_inspected))+' read closely</span><span>generated locally</span></div><div class="report-path"><section class="path-step"><span class="path-number">01</span><div><h2>Your profile</h2><p>A grouped portrait of your preferences, working style, strengths, and recurring corrections.</p></div></section><section class="path-step"><span class="path-number">02</span><div><h2>Findings + insights</h2><p>The repeated patterns Farpoint observed, with an explanation of why each one matters.</p></div></section><section class="path-step"><span class="path-number">03</span><div><h2>Recommendations</h2><p>Specific changes to try after you understand the pattern—not generic productivity advice.</p></div></section></div><button class="primary-link" type="button" id="start-profile">Start with your profile →</button></article><article class="page" id="profile"><div class="page-intro"><div><span class="eyebrow">How you work with agents</span><h1>Your profile.</h1></div><p>These sections summarize recurring signals in your sessions. They are a portrait of your working patterns, not a personality label.</p></div><div class="profile-groups">'+profileGroupsHtml+'</div></article><article class="page" id="findings"><div class="page-intro"><div><span class="eyebrow">What the profile is based on</span><h1>Findings + insights.</h1></div><p>Read the observed pattern first, then open it for the interpretation. Supporting excerpts stay one click away.</p></div>'+dossierHeader+dossierTabs+dossierGrid+'</article><article class="page" id="recommendations"><div class="page-intro"><div><span class="eyebrow">What to try next</span><h1>Recommendations.</h1></div><p>These actions come after the profile and findings. Start with the first one and use the linked finding to understand its basis.</p></div><div class="recommendations">'+(recRows||'<div class="empty">No recommendation cleared the evidence bar.</div>')+'</div></article><article class="page" id="activity"><div class="page-intro"><div><span class="eyebrow">Optional detail</span><h1>Activity.</h1></div><p>Raw volume, distributions, timing, and economics for when you want to inspect the archive behind the interpretation.</p></div><nav class="tabs activity-tabs" aria-label="Activity view">'+activityTabs.map((tab,index)=>'<button type="button" data-activity="'+tab[0]+'" class="'+(index===0?'active':'')+'" aria-pressed="'+(index===0?'true':'false')+'">'+tab[1]+'</button>').join('')+'</nav><section class="activity-view active" data-view="summary">'+summary+'</section><section class="activity-view" data-view="projects"><div class="chart" id="projects-chart"></div></section><section class="activity-view" data-view="agents"><div class="chart" id="agents-chart"></div></section><section class="activity-view" data-view="models"><div class="chart" id="models-chart"></div></section><section class="activity-view" data-view="tools"><div class="chart" id="tools-chart"></div></section><section class="activity-view" data-view="timing">'+timing+'</section>'+(hasEconomics?'<section class="activity-view" data-view="costs">'+costs+'</section>':'')+'</article><article class="page" id="evidence"><div class="page-intro"><div><span class="eyebrow">Optional detail</span><h1>Source evidence.</h1></div><p>Search the original excerpts used across the findings and close-read sessions.</p></div><div class="search-wrap"><input class="search" id="evidence-search" type="search" aria-label="Search evidence, sessions, or projects" placeholder="Search evidence, sessions, projects…" autocomplete="off"><span class="result-count" id="result-count" aria-live="polite"></span></div>'+evidence+'</article></div><footer class="footer"><p>Generated locally · source evidence stays on this machine</p></footer></section></div>';
    document.getElementById('report').innerHTML=pageMarkup;
    document.getElementById('download-json')?.remove();
    document.querySelectorAll('.nav-num,.recommendation-rank,.signal-index,.footer').forEach(element=>element.remove());
    document.querySelectorAll('.dossier-kicker-row').forEach(element=>element.remove());
    const navIconPaths={intro:'<circle cx="8" cy="8" r="5.2"></circle><path d="M8 4.8v3.5l2.3 1.4"></path>',profile:'<circle cx="8" cy="5.2" r="2.3"></circle><path d="M3.5 13c.8-2.1 2.3-3.1 4.5-3.1s3.7 1 4.5 3.1"></path>',findings:'<rect x="3" y="3" width="10" height="10" rx="1.5"></rect><path d="M5.5 6h5M5.5 8.5h5M5.5 11h3"></path>',recommendations:'<path d="M3 8h8.5M8.5 4.5 12 8l-3.5 3.5"></path>'};document.querySelectorAll('.nav > [data-page]').forEach(button=>{const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 16 16');icon.setAttribute('class','nav-icon');icon.setAttribute('aria-hidden','true');icon.innerHTML=navIconPaths[button.dataset.page]||'';button.prepend(icon)});
    const evidenceNav=document.querySelector('.nav-secondary [data-page="evidence"]');if(evidenceNav){const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 16 16');icon.setAttribute('class','nav-icon');icon.setAttribute('aria-hidden','true');icon.innerHTML='<circle cx="6.8" cy="6.8" r="4.1"></circle><path d="m10 10 3.1 3.1"></path>';evidenceNav.prepend(icon)}
    const printButton=document.getElementById('print-report');if(printButton){const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');icon.setAttribute('viewBox','0 0 16 16');icon.setAttribute('class','action-icon');icon.setAttribute('aria-hidden','true');icon.innerHTML='<path d="M4.5 6V2.8h7V6"></path><path d="M4 11H2.8V6.4h10.4V11H12"></path><rect x="4.5" y="9" width="7" height="4.2"></rect>';printButton.prepend(icon)}
    document.querySelectorAll('.tabs').forEach(tablist=>tablist.setAttribute('role','tablist'));
    document.querySelectorAll('[data-activity]').forEach(button=>{const key=button.dataset.activity;button.id='activity-tab-'+key;button.setAttribute('role','tab');button.setAttribute('aria-controls','activity-panel-'+key);button.setAttribute('aria-selected',String(button.classList.contains('active')))})
    document.querySelectorAll('[data-view]').forEach(view=>{const key=view.dataset.view;view.id='activity-panel-'+key;view.setAttribute('role','tabpanel');view.setAttribute('aria-labelledby','activity-tab-'+key);view.setAttribute('aria-hidden',String(!view.classList.contains('active')))})
    let stepIndex=0;
    function showPage(name,{updateHistory=true}={}){const page=document.getElementById(name);if(!page)return;stepIndex=Math.max(0,steps.findIndex(step=>step[0]===name));document.querySelectorAll('.page').forEach(item=>item.classList.toggle('active',item===page));document.querySelectorAll('[data-page]').forEach(button=>{const active=button.dataset.page===name;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'page':'false')});if(updateHistory&&location.hash!=='#'+name)history.pushState({page:name},'', '#'+name);window.scrollTo?.({top:0,behavior:'smooth'});const heading=page.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}if(name==='evidence')document.getElementById('evidence-search')?.focus({preventScroll:true})}
    function openFinding(index){showPage('findings');const tab=[...document.querySelectorAll('[data-dossier-kind]')].find(item=>item.dataset.dossierKind==='insight');if(tab)tab.click();const button=document.querySelector('[data-dossier="'+index+'"]');if(button){button.click();button.closest('.dossier-card')?.scrollIntoView?.({behavior:'smooth',block:'center'})}}
    document.querySelectorAll('[data-page]').forEach(button=>button.addEventListener('click',()=>showPage(button.dataset.page)));
    const initialPage=steps.some(step=>step[0]===location.hash.slice(1))||secondarySteps.some(step=>step[0]===location.hash.slice(1))?location.hash.slice(1):'intro';
    showPage(initialPage,{updateHistory:false});
    window.addEventListener('popstate',()=>showPage(location.hash.slice(1)||'intro',{updateHistory:false}));
    document.getElementById('start-profile').addEventListener('click',()=>showPage('profile'));
    document.querySelectorAll('[data-recommendation-index]').forEach(button=>{const index=Number(button.dataset.recommendationIndex),insight=insights[index]||insights[0];button.textContent='Open related finding →';if(insight){const evidenceButton=document.createElement('button');evidenceButton.type='button';evidenceButton.className='text-link recommendation-evidence';evidenceButton.dataset.evidenceQuery=evidenceSearchQuery(insight);evidenceButton.textContent='Inspect excerpts →';button.insertAdjacentElement('afterend',evidenceButton)}button.addEventListener('click',()=>openFinding(index))});
    document.querySelectorAll('[data-dossier]').forEach((button,index)=>{const panel=button.closest('.dossier-card')?.querySelector('.dossier-answer'),item=questionItems[index];if(panel){panel.id='dossier-panel-'+index;panel.hidden=true;panel.setAttribute('aria-hidden','true');button.setAttribute('aria-controls',panel.id)}if(item?.kind==='Insight'&&item.evidence.length){const meta=document.createElement('span');const confidence=Number(item.score||0)>=.75?'high':Number(item.score||0)>=.45?'medium':'limited';meta.className='dossier-meta';meta.textContent=item.evidence.length+' excerpt'+(item.evidence.length===1?'':'s')+' · '+confidence+' confidence';button.querySelector('h3')?.after(meta)}button.addEventListener('click',()=>{const card=button.closest('.dossier-card'),wasOpen=card.classList.contains('open');document.querySelectorAll('.dossier-card').forEach(other=>{other.classList.remove('open');other.querySelector('.dossier-toggle')?.setAttribute('aria-expanded','false');const otherPanel=other.querySelector('.dossier-answer');if(otherPanel){otherPanel.hidden=true;otherPanel.setAttribute('aria-hidden','true')}});if(!wasOpen){card.classList.add('open');button.setAttribute('aria-expanded','true');if(panel){panel.hidden=false;panel.setAttribute('aria-hidden','false')}}})});
    let dossierKind='insight';let showAllDossiers=false;const moreDossiers=document.createElement('button');moreDossiers.type='button';moreDossiers.className='dossier-more';document.querySelector('#findings .dossier-grid')?.after(moreDossiers);function renderDossierVisibility(){const cards=[...document.querySelectorAll('.dossier-card')],matches=cards.filter(card=>dossierKind==='all'||card.dataset.kind===dossierKind);cards.forEach(card=>{const index=matches.indexOf(card);card.hidden=index<0;card.classList.toggle('dossier-collapsed',index>=3&&!showAllDossiers)});moreDossiers.hidden=matches.length<=3;moreDossiers.textContent=showAllDossiers?'Show fewer findings ↑':'Show '+Math.max(0,matches.length-3)+' more findings →'}moreDossiers.addEventListener('click',()=>{showAllDossiers=!showAllDossiers;renderDossierVisibility()});
    document.querySelectorAll('[data-dossier-kind]').forEach(button=>{button.setAttribute('role','tab');button.setAttribute('aria-selected',String(button.classList.contains('active')));button.addEventListener('click',()=>{document.querySelectorAll('[data-dossier-kind]').forEach(tab=>{const active=tab===button;tab.classList.toggle('active',active);tab.setAttribute('aria-pressed',String(active));tab.setAttribute('aria-selected',String(active))});dossierKind=button.dataset.dossierKind;showAllDossiers=false;document.querySelectorAll('.dossier-card').forEach(card=>{card.classList.remove('open');card.querySelector('.dossier-toggle')?.setAttribute('aria-expanded','false');const panel=card.querySelector('.dossier-answer');if(panel){panel.hidden=true;panel.setAttribute('aria-hidden','true')}});renderDossierVisibility()})});
    renderDossierVisibility();
    function chartMarkup(metrics){return '<nav class="chart-metrics">'+metrics.map((metric,index)=>'<button type="button" data-chart-metric="'+metric.key+'" class="'+(index===0?'active':'')+'">'+metric.label+'</button>').join('')+'</nav><div class="chart-rows"></div><div class="chart-detail"></div>'}
    function mountChart(id,rows,metrics){const root=document.getElementById(id);root.innerHTML=chartMarkup(metrics);const render=key=>{const metric=metrics.find(item=>item.key===key)||metrics[0],sorted=[...rows].sort((a,b)=>Number(b[key]||0)-Number(a[key]||0)),max=Math.max(1,...sorted.map(item=>Number(item[key]||0)));root.querySelector('.chart-rows').innerHTML=sorted.map((item,index)=>'<button class="chart-row" data-chart-row="'+index+'" type="button"><span>'+esc(item.name)+'</span><span class="track"><span class="fill" style="width:'+Math.max(item[key]?3:0,Number(item[key]||0)/max*100)+'%"></span></span><b>'+esc(metric.format(item[key]))+'</b></button>').join('')||'<div class="empty">No data available.</div>';root.querySelectorAll('[data-chart-metric]').forEach(button=>button.classList.toggle('active',button.dataset.chartMetric===key));root.querySelector('.chart-detail').textContent='';root.querySelectorAll('[data-chart-row]').forEach(button=>button.addEventListener('click',()=>{const item=sorted[Number(button.dataset.chartRow)];root.querySelectorAll('[data-chart-row]').forEach(row=>row.classList.toggle('active',row===button));root.querySelector('.chart-detail').textContent=metrics.map(value=>value.label+': '+value.format(item[value.key])).join(' · ')}))};root.querySelectorAll('[data-chart-metric]').forEach(button=>button.addEventListener('click',()=>render(button.dataset.chartMetric)));render(metrics[0].key)}
    const standardMetrics=[{key:'sessions',label:'Sessions',format:number},{key:'messages',label:'Messages',format:compact},{key:'friction',label:'Friction',format:number}];
    mountChart('projects-chart',projectStats,standardMetrics);mountChart('agents-chart',agentStats,standardMetrics);mountChart('models-chart',modelStats,[{key:'tokens',label:'Tokens',format:compact}]);mountChart('tools-chart',toolStats,[{key:'calls',label:'Calls',format:compact}]);
    function activateActivityTab(button){document.querySelectorAll('[data-activity]').forEach(tab=>{const active=tab===button;tab.classList.toggle('active',active);tab.setAttribute('aria-pressed',String(active));tab.setAttribute('aria-selected',String(active))});document.querySelectorAll('[data-view]').forEach(view=>{const active=view.dataset.view===button.dataset.activity;view.classList.toggle('active',active);view.setAttribute('aria-hidden',String(!active))})}
    document.querySelectorAll('[data-activity]').forEach(button=>button.addEventListener('click',()=>activateActivityTab(button)));
    document.querySelectorAll('[data-evidence]').forEach(button=>button.addEventListener('click',()=>{const open=!button.classList.contains('open');button.classList.toggle('open',open);button.setAttribute('aria-expanded',String(open))}));
    function filterEvidence(query=''){const needle=String(query).trim().toLowerCase();let visible=0;document.querySelectorAll('[data-evidence]').forEach(row=>{const match=!needle||row.textContent.toLowerCase().includes(needle);row.hidden=!match;if(match)visible++});document.getElementById('result-count').textContent=visible+' / '+evidenceRecords.length;const empty=document.getElementById('evidence-empty');if(empty)empty.hidden=visible>0}
    document.getElementById('evidence-search').addEventListener('input',event=>filterEvidence(event.target.value));
    document.querySelectorAll('[data-evidence-query]').forEach(button=>button.addEventListener('click',()=>{showPage('evidence');const input=document.getElementById('evidence-search');input.value=button.dataset.evidenceQuery;filterEvidence(input.value);input.focus()}));
    document.getElementById('print-report').addEventListener('click',()=>window.print());
    document.getElementById('download-json')?.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(R,null,2)],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download='farpoint-analysis.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
    filterEvidence();
  </script>
</body>
</html>`;
}
