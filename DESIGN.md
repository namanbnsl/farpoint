---
name: Farpoint
description: Evidence-backed reports for understanding how you work with coding agents.
colors:
  ink: "#f0f1ed"
  muted: "#929692"
  line: "#292c2a"
  accent: "#84d7a0"
  accent-deep: "#2c4a37"
  paper: "#101211"
  sidebar: "#0b0d0c"
  panel: "#151816"
  card: "#141715"
  button-surface: "#191c1a"
  button-border: "#393d3a"
  button-text: "#ced0cc"
  primary-surface: "#e7e8e3"
  primary-text: "#121413"
  filter-active-text: "#e9fbef"
  chart-track: "#282b29"
  chart-fill: "#b8bbb6"
  terminal-accent: "#6ee7b7"
  terminal-accent-bright: "#d1fae5"
  terminal-accent-deep: "#134e4a"
  terminal-heading: "#f0fdf4"
  terminal-body: "#d8e3dd"
  terminal-code: "#fcd34d"
  terminal-code-background: "#17211d"
  terminal-border: "#3b4f46"
  terminal-border-subtle: "#26372f"
  terminal-muted: "#91a49a"
  terminal-faint: "#60736a"
  terminal-success: "#86efac"
  terminal-danger: "#fb7185"
  terminal-warning: "#fbbf24"
typography:
  display:
    fontFamily: "Instrument Sans, sans-serif"
    fontSize: "clamp(40px, 5vw, 66px)"
    fontWeight: 520
    lineHeight: 1.02
    letterSpacing: "-0.058em"
  headline:
    fontFamily: "Instrument Sans, sans-serif"
    fontSize: "clamp(32px, 4vw, 50px)"
    fontWeight: 520
    lineHeight: 1.02
    letterSpacing: "-0.058em"
  title:
    fontFamily: "Instrument Sans, sans-serif"
    fontSize: "clamp(28px, 4vw, 42px)"
    fontWeight: 560
    lineHeight: 1.05
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Instrument Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.72
  label:
    fontFamily: "Instrument Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.01em"
  mono:
    fontFamily: "DM Mono, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  nav: "6px"
  card: "7px"
  panel: "8px"
  dossier: "10px"
  pill: "20px"
spacing:
  xs: "2px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "52px"
components:
  button-primary:
    backgroundColor: "{colors.primary-surface}"
    textColor: "{colors.primary-text}"
    typography: "{typography.label}"
    rounded: "{rounded.card}"
    padding: "0 15px"
    height: "42px"
  button-secondary:
    backgroundColor: "{colors.button-surface}"
    textColor: "{colors.button-text}"
    typography: "{typography.label}"
    rounded: "{rounded.card}"
    padding: "0 15px"
    height: "42px"
  filter-chip-active:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.filter-active-text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  search-input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.card}"
    padding: "0 14px"
    height: "44px"
  nav-item:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.nav}"
    padding: "11px 14px"
    height: "44px"
  dossier-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "18px 20px"
  metric-group:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "0"
  evidence-row:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "15px 17px"
---

# Design System: Farpoint

## Overview

**Creative North Star: "The Evidence Ledger"**

Farpoint's visual system is a dark evidence ledger: quiet, exacting, and generous with the data. The local report stages conclusions as a guided sequence—recommendation first, then findings, activity, and evidence—so it feels like an instrument for review rather than a generic dashboard. Mint is a signal for direction, confidence, and interaction; it is deliberately rare against the dark field.

The surface is built from near-black tonal layers, hairline borders, restrained radii, and a compact sans/mono pairing. Instrument Sans gives conclusions an editorial, human voice; DM Mono is reserved for measurements, ordinals, and technical metadata. The terminal companion keeps the same green-led intent with an Ink-native palette and text-first controls.

**Key Characteristics:**

- Evidence before ornament: data and supporting excerpts remain the visual focus.
- Dark, layered, and local: surfaces distinguish context without relying on heavy shadows.
- Signal-led interaction: mint marks active navigation, links, selected states, and progress.
- Editorial data density: large, tightly set headings sit above compact labels and metrics.

## Colors

The report palette is a restrained field of charcoal neutrals with one cool mint signal and a deep fern state color. Use the terminal palette only in Ink surfaces; do not substitute it into the web report without a deliberate cross-surface change.

### Primary

- **Signal mint** (`{colors.accent}`): Directional accent for active navigation, links, focus rings, chart emphasis, and the Farpoint mark.
- **Deep fern** (`{colors.accent-deep}`): Quiet mint-toned fill for selected tabs and other active controls.

### Neutral

- **Ink** (`{colors.ink}`): Primary report text and high-contrast interface content.
- **Muted** (`{colors.muted}`): Supporting descriptions, metadata, and secondary labels.
- **Paper** (`{colors.paper}`): Main report canvas and footer background.
- **Sidebar** (`{colors.sidebar}`): Navigation rail background, slightly deeper than the canvas.
- **Panel** (`{colors.panel}`): Tonal container for metric groups, search, and navigation states.
- **Card** (`{colors.card}`): Evidence and finding rows, kept distinct from the larger panel layer.
- **Line** (`{colors.line}`): Hairline borders, separators, and the evidence-list frame.
- **Button surface** (`{colors.button-surface}`): Secondary action fill.
- **Primary surface** (`{colors.primary-surface}`): High-contrast primary action fill.
- **Chart track** (`{colors.chart-track}`) and **chart fill** (`{colors.chart-fill}`): Neutral data visualization states before mint emphasis.

### Terminal companion

The Ink UI uses **terminal accent** (`{colors.terminal-accent}`), **terminal accent bright** (`{colors.terminal-accent-bright}`), and **terminal accent deep** (`{colors.terminal-accent-deep}`) with lighter **terminal heading** (`{colors.terminal-heading}`), **terminal body** (`{colors.terminal-body}`), and **terminal muted/faint** (`{colors.terminal-muted}` / `{colors.terminal-faint}`). Status colors are semantic: **terminal success**, **terminal danger**, **terminal warning**, and **terminal code** are reserved for those roles.

### Named Rules

**The Signal Scarcity Rule.** Mint should identify what is active, actionable, or verified; it should not become a general-purpose background color.

**The Tonal Layer Rule.** Separate report surfaces with nearby dark values and hairlines before reaching for additional accent colors.

## Typography

**Display Font:** Instrument Sans (with `sans-serif` fallback)

**Body Font:** Instrument Sans (with `sans-serif` fallback)

**Label/Mono Font:** DM Mono (with `monospace` fallback)

**Character:** Instrument Sans is compact, slightly editorial, and confident at large sizes without becoming theatrical. DM Mono supplies a technical register for numbers and evidence metadata; it is a labeling instrument, not a second voice for prose.

### Hierarchy

- **Display** (weight 520, `clamp(40px, 5vw, 66px)`, line-height 1.02): Welcome and recommendation statements that establish the report's point of view.
- **Headline** (weight 520, `clamp(32px, 4vw, 50px)`, line-height 1.02): Section titles for findings, activity, and evidence.
- **Title** (weight 560, `clamp(28px, 4vw, 42px)`, line-height 1.05): The profile identity and dossier header.
- **Body** (weight 400, 16px, line-height 1.72): Explanations and focus copy. Keep long-form copy near 65–75 characters per line when the container allows.
- **Label** (weight 600, 12px, line-height 1.2, slight positive tracking): Eyebrows, card kickers, metric headings, and action labels.
- **Mono data** (weight 400–500, 10–11px, line-height 1.4): Counts, metric values, nav numerals, and short technical metadata.

### Named Rules

**The Two-Register Rule.** Use Instrument Sans for meaning and DM Mono for measurement. Do not set explanatory paragraphs in mono.

**The Tight Headline Rule.** Large headings use compressed tracking and short line-height; supporting prose restores generous line-height and muted contrast.

## Layout

The web report is a full-height two-column shell: a sticky 260px navigation rail and a single scrollable content stage. Content pages use `52px` top/bottom padding and responsive horizontal padding of `clamp(30px, 5vw, 78px)`. Most reading surfaces cap at 900–1080px so evidence, dossiers, and charts stay inspectable rather than spanning the viewport.

The report moves through five steps—Welcome, Next move, Findings, Activity, and Evidence—with a fixed footer for Previous/Next navigation. Findings and activity favor stacked, scan-friendly groups; the activity summary uses a two-column metric grid above 900px and one column below it. At 700px and below, the rail becomes a 72px numbered navigation strip, pages use `34px 20px` padding, focus-copy rows stack, and chart labels contract to preserve the value column.

The Ink UI is terminal-width aware: the shared shell caps at 96 columns, maintains a minimum working width of 32 columns, and reduces horizontal padding below 64 columns. Its layout is vertical and text-first rather than a browser-style grid.

## Elevation & Depth

Farpoint is flat-by-default. The report does not use a shadow vocabulary; depth comes from three nearby dark surface tones, 1px borders, a 3px mint dossier rail, and small state changes on hover. The only movement is functional: page entry, chart growth, and answer expansion. Reduced-motion preferences remove both animation and transition.

### Named Rules

**The Flat Ledger Rule.** A surface is flat at rest. Use tonal layering and borders to establish hierarchy; reserve movement and emphasis for interaction or evidence state.

## Shapes

The form language is gently squared and compact. Navigation and controls use `6–8px` corners; cards and buttons settle at `7px`; the dossier header is the largest rectangular container at `10px`. Filter tabs and chart selectors are the only pill silhouettes at `20px`. Borders are thin and quiet, with overflow clipped on cards and evidence lists so the system reads as assembled pages rather than floating tiles.

## Components

### Buttons

- **Character:** Low-chrome controls that feel like precise instruments.
- **Primary:** Light neutral fill with dark text, `42px` minimum height, `0 15px` horizontal padding, and `7px` corners. Used for the next-step action.
- **Secondary:** Dark panel fill with a quiet border and muted text. Hover lifts by `1px`, brightens the border, and raises text contrast.
- **Hover / Focus:** Keep the response small and legible. Focus-visible uses a `2px` mint outline with a `3px` offset; do not replace it with color alone.
- **Text link:** Borderless, mint, underlined, and reserved for contextual jumps such as supporting evidence.

### Chips

- **Style:** Transparent at rest with a hairline border, muted text, `20px` corners, and compact horizontal padding.
- **Selected:** Deep fern fill and border with pale mint text. Used for dossier filters, activity views, and chart metrics.

### Cards / Containers

- **Dossier header:** Panel fill, `10px` corners, quiet border, and a distinctive `3px` mint left rail. It introduces the synthesized profile.
- **Dossier/evidence card:** Card fill, `7px` corners, 1px line, and `18px 20px` internal padding. Expand in place to reveal the supporting explanation.
- **Metric group:** Panel fill, `8px` corners, clipped overflow, and a hairline divider between its heading and rows.
- **Shadow strategy:** No shadows. Refer to Elevation & Depth for the tonal layering rule.

### Inputs / Fields

- **Search field:** Panel fill, `44px` minimum height, `7px` corners, 1px border, and `0 14px` horizontal padding. Placeholder text is visibly quieter than entered text.
- **Focus:** Use the shared `2px` mint focus outline with a `3px` offset. Search results update in place and expose their count through an assertive live label.

### Navigation

- **Desktop:** A sticky 260px rail with a small Farpoint mark and 44px-high left-aligned items. The active item uses the panel fill, primary ink, and a mint left border.
- **Mobile:** A 72px rail showing two-digit step numbers in DM Mono; the active number becomes mint while the report remains the main visual field.

### Terminal Primitives

- **Shell:** A centered vertical Ink shell capped at 96 columns, with a gradient wordmark using the terminal accent and code colors.
- **Selector:** A `›` marker and bold heading identify the selected option; unselected options recede to body/faint text.
- **Input:** Rounded Ink border, one-character accent prompt, optional masked value, and an inverse cursor block.
- **Status:** Spinner and success use semantic terminal colors; errors and warnings must not be expressed through mint.

## Do's and Don'ts

### Do:

- **Do** lead report journeys with one concrete next move before exposing the full archive.
- **Do** keep recommendations, findings, metrics, and evidence visually related but distinguishable through tonal layers.
- **Do** use mint for active, actionable, or verified states and maintain a visible focus treatment.
- **Do** reserve DM Mono for values, ordinals, and compact technical metadata.
- **Do** preserve the 900–1080px reading widths for dense report content and stack the system at the documented breakpoints.
- **Do** keep the report local-first and evidence-forward in any new surface language.

### Don't:

- **Don't** turn the report into a colorful analytics dashboard with a new accent for every metric.
- **Don't** use shadows, glow, or decorative imagery to manufacture hierarchy that tonal layers already provide.
- **Don't** hide supporting evidence behind vague claims or replace evidence labels with raw session IDs.
- **Don't** use the terminal palette as if it were the web report palette; the surfaces have intentionally distinct values.
- **Don't** set body copy, recommendations, or explanatory findings in DM Mono.
- **Don't** remove keyboard focus, reduced-motion behavior, or the compact mobile navigation treatment.
