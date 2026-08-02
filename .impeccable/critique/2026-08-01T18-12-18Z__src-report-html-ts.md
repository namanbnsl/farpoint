---
timestamp: 2026-08-01T18-12-18Z
slug: src-report-html-ts
---
Method: dual-agent (A: Mencius · B: Gibbs)

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 2 | Primary navigation changes visually, but secondary-page state and focus are not managed consistently. |
| 2 | Match System / Real World | 3 | Profile, findings, recommendations, and evidence are understandable; activity terms need definitions. |
| 3 | User Control and Freedom | 2 | Direct navigation, print, download, and search exist, but there is no URL state or browser-history model. |
| 4 | Consistency and Standards | 2 | “See evidence” opens Findings first; tab and navigation semantics are incomplete. |
| 5 | Error Prevention | 3 | Mostly read-only and safe, but misleading action labels create avoidable wrong turns. |
| 6 | Recognition Rather Than Recall | 3 | The intro explains the reading path; mobile navigation becomes numbers-only and secondary state is easy to lose. |
| 7 | Flexibility and Efficiency | 2 | Search and keyboard navigation help, but there are no deep links, persistent filters, or unified search. |
| 8 | Aesthetic and Minimalist Design | 3 | The visual language is disciplined; Activity and Evidence still become dense detail surfaces. |
| 9 | Error Recovery | 2 | Empty states exist, but invalid/ambiguous reports and failed navigation have little recovery guidance. |
| 10 | Help and Documentation | 2 | Locality is explained, but methodology, confidence, sample size, and metric definitions are under-explained. |
| **Total** |  | **24/40** | Strong visual foundation; trust and interaction semantics need another pass. |

## Design Specificity Verdict

The report feels product-specific visually and moderately product-specific behaviorally.

The dark evidence-ledger language, mint signal, grouped profile, findings, and recommendation arc belong to Farpoint. The interaction model still relies on generic dashboard patterns: sidebar buttons, tabs, expandable cards, charts, and metric groups. The next step is making evidence provenance govern every interaction, not just the colors and copy.

The deterministic scan found 37 findings: 1 warning and 36 advisories. The warning is the generic overused-font rule for Instrument Sans, which is explicitly part of the documented Farpoint design system. The advisories are mostly literal font, radius, and tonal-color values that the detector cannot distinguish from intentional report tokens. Treat them as design-system drift signals, not user-facing defects. One important cleanup remains: the renderer contains stale pre-override markup from the previous report structure, which made the design review less reliable and should be removed.

## Overall Impression

The report now has the right broad order, but it is not yet a fully trustworthy reading instrument. The main opportunity is to make every claim easy to verify and every section behave like the document it presents itself as.

## What's Working

1. The grouped profile direction is much stronger than a metric dashboard. It gives the report a human question-and-answer rhythm.

2. The visual system is coherent: dark tonal layers, hairline structure, mint as signal, and mono metadata all reinforce “evidence ledger.”

3. The copy is generally direct and memorable. “What Farpoint will give you,” “Findings + insights,” and “Recommendations” create a clear conceptual arc.

## Priority Issues

### [P1] Recommendation links do not match their destination

Recommendation rows say “See evidence,” but activate the Findings page. The user must then open a finding and choose another evidence link.

Why it matters: evidence is Farpoint’s differentiator. A link that promises excerpts but delivers an intermediate interpretation weakens trust.

Fix: rename the current action “Open related finding,” then add a second direct “Inspect excerpts” action with the relevant evidence query. Add visible support count and inspection scope beside each recommendation.

Suggested command: $impeccable clarify, then $impeccable harden.

### [P1] The report mixes document and application models

The UI uses pages, tabs, active navigation, and keyboard controls like an application, but navigation does not update the URL, browser history, or focus. Secondary Activity/Evidence navigation also does not retain active styling through the current state updater.

Why it matters: users cannot bookmark or return to a precise finding, and assistive-technology users may not know that the content changed.

Fix: choose the document model for the report. Use hash-based deep links for intro, profile, findings, recommendations, activity, and evidence; update history on navigation; move focus to the new page heading; and make all navigation groups share one active-state model.

Suggested command: $impeccable harden.

### [P1] Evidence provenance is still too hidden

Findings show interpretations and then link to evidence, but the user does not see how much material supports a claim before deciding to open it. Confidence, support count, close-reading coverage, and alternative explanations are mostly behind expansion.

Why it matters: a personal profile can feel overconfident if its evidentiary limits are not visible at the moment of judgment.

Fix: every insight row should expose compact metadata such as “supported by 4 sessions · confidence high” and a direct “Inspect excerpts” link. Keep the excerpts on the separate Evidence page as requested.

Suggested command: $impeccable clarify.

### [P1] The local-first promise has an external font dependency

The standalone report imports Instrument Sans and DM Mono from Google Fonts. The report payload remains local, but typography depends on an external request and changes offline.

Why it matters: “generated locally” and “source excerpts stay on this machine” create a stronger locality expectation than the implementation currently delivers.

Fix: bundle the fonts, or make the system-font fallback the intentional offline design. If fonts remain remote, state that explicitly in the report’s privacy note.

Suggested command: $impeccable harden.

### [P2] Detail surfaces still lack prioritization

Activity exposes Summary, Projects, Agents, Models, Tools, Timing, and optional Costs. Evidence can become a long list of expandable excerpts. The report says these are optional, but the user still has to understand multiple taxonomies and raw metrics to audit the work.

Why it matters: the interpretation is clear until the user enters the detail layer, where cognitive load rises sharply.

Fix: keep Summary as a small “audit this conclusion” view, move the remaining metric groups behind an “All activity” disclosure, and add evidence filters for project, agent, signal type, and linked finding.

Suggested command: $impeccable distill.

### [P2] The renderer contains stale previous-layout markup

The source currently builds the prior report markup and then immediately replaces it with pageMarkup. The visible artifact uses the replacement, but the dead source contains obsolete recommendation-first copy and old IDs such as open-recommendation.

Why it matters: it already caused a stale critique finding, increases maintenance risk, and makes future changes easy to apply to the wrong render path.

Fix: delete the obsolete first innerHTML assignment and remove variables used only by that dead path. Keep one render tree.

Suggested command: $impeccable distill.

## Persona Red Flags

### Alex — Power User

- Cannot bookmark or share a finding, evidence search, or filtered activity view.
- Must navigate through an intermediate finding to reach source excerpts.
- Has no unified search across profile claims, findings, recommendations, projects, and evidence.
- Arrow-key navigation is undiscoverable and can conflict with normal page scrolling.
- Secondary Activity/Evidence navigation does not reliably communicate the current location.

### Jordan — First-Timer

- The profile claims can feel more certain than the visible evidence warrants.
- “Friction,” “adoption,” “LLM economics,” and signal labels are not defined where encountered.
- Mobile navigation reduces the main sections to numbers, which forces recall.
- The distinction between profile, finding, insight, recommendation, and excerpt is explained conceptually but not reinforced at each transition.
- Evidence verification requires multiple clicks and a new search state.

## Minor Observations

- The source embeds the full report JSON and excerpts in the standalone HTML by design; the shared browser was therefore correctly not used for visual inspection.
- Collapsed finding/evidence content uses aria-expanded, but hidden panels should also use hidden or aria-hidden consistently.
- Activity tab markup needs complete tablist semantics and keyboard behavior.
- Chart metric selection needs equivalent semantic selected state.
- Print mode reveals all pages but may produce an ink-heavy PDF from the dark surfaces.
- The report should state what was inspected, excluded as noise, and how much of the eligible archive was read closely near the profile.

## Questions to Consider

- What is the minimum provenance a user must see before trusting a profile claim?
- Should every finding have one primary “Inspect excerpts” path, with all other detail subordinate?
- Is Activity really a second destination, or should it become an audit drawer attached to each finding?
- Which three metrics are genuinely useful for understanding a recommendation, and which are merely available?
- Can the report be a document with deep links instead of an app shell with hidden page state?
