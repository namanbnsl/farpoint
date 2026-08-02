# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers who use coding agents and want to understand their agent sessions so they can adapt their coding agents to work better for them.

## Product Purpose

Farpoint analyzes local coding-agent history and turns it into actionable, evidence-backed insights about how the developer works with agents. It helps developers identify what is working, where sessions stall, and what they can change next. Farpoint is a CLI that also produces a beautiful local web report.

## Positioning

Farpoint combines analysis of a developer's own local coding-agent sessions with concrete recommendations for adapting their agent workflow. Its report is generated from selected evidence rather than generic productivity assumptions, and remains local after generation.

## Operating Context

Developers run Farpoint from a terminal. The CLI guides them through provider setup and model selection, prepares and analyzes their local coding-agent archive, and writes a standalone HTML report and source JSON that they can open in a browser. The report is intended for reviewing patterns in agent use and deciding on practical workflow changes.

## Capabilities and Constraints

- Uses AgentsView to find and normalize coding-agent sessions stored on the developer's machine.
- Calculates archive-level statistics, filters low-signal sessions, selects representative evidence, and sends relevant excerpts and metrics to the developer's chosen model provider.
- Produces a local web report with usage and cost statistics when available, evidence-backed insights, a working-style profile, agent and task patterns, notable sessions, and actionable recommendations.
- The complete local archive is not uploaded as one file.
- Provider credentials are stored locally with user-only permissions, and generated reports use user-only permissions.
- Farpoint asks for consent before installing or preparing AgentsView when it is unavailable.

## Brand Commitments

The product name is Farpoint. Farpoint should be evidence-backed, actionable, local-first, and clear about how its conclusions are formed. The local web report is a deliberate product experience, not only a technical export.

## Evidence on Hand

- `README.md` documents the current product workflow, privacy boundaries, report contents, and local report paths.
- `src/cli.tsx`, `src/app.tsx`, `src/onboarding*`, and `src/session/` implement the interactive CLI flow.
- `src/intelligence/` contains corpus preparation, coordination, and insight generation.
- `src/report/html.ts` contains the standalone web report renderer.
- `src/auth/credential-store.ts` contains local credential storage.
- `src/ui/theme.ts` and `src/ui/` contain the incumbent terminal UI implementation.
- The repository does not provide customer testimonials, external benchmarks, or other proof assets; future work must not fabricate them.

## Product Principles

- Ground conclusions in the developer's own session evidence.
- Turn observations into specific, useful changes to the developer's agent workflow.
- Keep sensitive session data and credentials within explicit consent and local-permission boundaries.
- Make the analysis understandable through a polished, readable report.

