# Farpoint

Farpoint is an interactive CLI that turns your coding-agent history into a practical, evidence-backed report. It shows how you use agents, where sessions tend to stall, which approaches work well, and what you can change next.

## Run it

```bash
npx farpoint-cli
```

Farpoint will guide you through connecting a model provider with browser sign-in or an API key, then let you choose the model used for the analysis.

## What happens

1. **Farpoint prepares the local archive.** It uses [AgentsView](https://agentsview.io/) to find and normalize coding sessions stored on your machine. If AgentsView is unavailable, Farpoint asks before installing or preparing it.
2. **The archive is indexed and filtered.** Aggregate statistics are calculated across the archive, while automated and one-message sessions are generally set aside so they do not distort behavioral findings.
3. **Representative sessions are selected.** Farpoint ranks sessions using signals such as failures, retries, context pressure, edit churn, recency, and successful outcomes. It triages up to 50 candidates and closely inspects up to 18.
4. **Your chosen model analyzes the evidence.** Relevant session metadata, excerpts, tool activity, and computed metrics are sent to the selected model provider. The model compares sessions, identifies recurring patterns, and produces specific recommendations; the complete archive is not uploaded as one file.
5. **A local report is written.** Farpoint saves a standalone HTML report and its source JSON under `~/.farpoint/reports/<timestamp>/`. Press `o` when the run finishes to open the report.

The report includes archive-level usage and cost statistics when available, evidence-backed insights, a working-style profile, agent/task patterns, notable sessions, and actionable recommendations. It can also export Markdown, JSON, or a print-ready PDF from the browser.

## Data and credentials

Provider credentials are stored locally in `~/.farpoint/auth.json` with user-only file permissions. Generated reports also use user-only permissions. Analysis still calls the model provider you select, so session excerpts included in analysis are handled according to that provider's terms and privacy policy.

## Development

This project uses pnpm and the Vite+ toolchain:

```bash
pnpm install
pnpm check
pnpm build
```

Farpoint is available under the [MIT License](LICENSE).
