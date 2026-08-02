# AGENTS.md

## Project overview

Farpoint is an interactive TypeScript CLI that analyzes local coding-agent history and produces an evidence-backed HTML report. It uses React with Ink for the terminal UI, AgentsView to prepare and normalize session data, and a user-selected model provider for analysis.

Key areas:

- `src/onboarding*` and `src/session/`: interactive CLI flows and screens
- `src/intelligence/`: corpus preparation, coordination, and insight generation
- `src/ai/`: model providers, prompts, and client integration
- `src/report/`: standalone report generation
- `src/auth/`: local credential storage

Treat credentials, session excerpts, and generated reports as sensitive user data. Do not log or expose them unnecessarily, and preserve the existing permission and consent boundaries.

## Development cycle

The project requires Node.js 22 or newer, uses pnpm for package management, and uses Vite+ (`vp`) as its unified development toolchain. The package scripts wrap `vp`, so prefer the pnpm commands below instead of invoking `vp` directly:

```bash
pnpm install
pnpm dev       # runs `vp pack --watch`
pnpm check     # runs `vp check` for linting and type-checking
pnpm build     # runs `vp pack` and produces dist/cli.mjs
pnpm start     # run the built CLI
pnpm pack:dry  # inspect the npm package contents
```

Vite+ configuration lives in `vite.config.ts`. Keep build, lint, and type-checking behavior there where possible, and avoid adding overlapping standalone tooling without a clear need.

## Report development

Use the standalone renderer to iterate on the HTML report without running the CLI, indexing sessions, or calling a model. Put a schema-version-1 report payload at `analysis.json` in the repository root, then run:

```bash
./scripts/render-report.mjs
```

The script reads `analysis.json` and writes `report.html` in the repository root. Both files are gitignored and may contain sensitive session data; keep them local and do not commit or share them.

You can also provide explicit input and output paths:

```bash
./scripts/render-report.mjs path/to/analysis.json path/to/report.html
```

After changing `src/report/html.ts`, rerun the script and inspect the generated HTML in a browser. This workflow exercises only the report renderer and must not be wired into or used to modify the CLI flow.

For each change:

1. Understand the affected user flow and keep the change narrowly scoped.
2. Implement the smallest complete solution, following nearby patterns.
3. Run `pnpm check` and `pnpm build` before handing off.
4. Exercise the relevant CLI path when behavior or UI changes.
5. Update documentation when commands, behavior, privacy boundaries, or user-facing output changes.

## Code practices

- Write maintainable, self-explanatory code. Prefer clear names and straightforward control flow over comments that restate the implementation.
- Keep functions and modules focused on one responsibility. Extract shared logic only when it makes intent clearer or removes meaningful duplication.
- Use comments to explain constraints, tradeoffs, or non-obvious decisions—not what the code already says.
- Preserve strict TypeScript guarantees. Avoid `any`, unsafe casts, ignored errors, and non-null assertions unless the invariant is explicit and justified.
- Validate external, model-generated, filesystem, and user-provided data at boundaries. Return errors with enough context to act on them.
- Keep UI components declarative; move orchestration, data access, and transformation logic into the appropriate domain modules.
- Prefer immutable data and explicit inputs and outputs. Avoid hidden global state and surprising side effects.
- Match the existing formatting, naming, import, and file-organization conventions.
- Do not introduce dependencies without a clear benefit. Prefer the platform and existing libraries when they solve the problem cleanly.
- Preserve backward compatibility for CLI behavior, stored data, and generated report formats unless a breaking change is intentional and documented.
- Keep user-facing language concise, specific, and actionable.

When adding tests, focus on observable behavior, important edge cases, and failure paths rather than implementation details. A change is complete when it is understandable to the next maintainer, handles errors deliberately, and passes the project checks.
