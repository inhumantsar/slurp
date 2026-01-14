# AGENTS.md

Guidance for agentic coding assistants working in this repo.

## Repository Overview
- Slurp is an Obsidian plugin that fetches URLs and saves cleaned Markdown.
- Entry point: `main.ts` at the repo root.
- Core logic lives under `src/`; UI bits live in `src/components/` and `src/modals/`.
- Tests are in `test/` and run with Jest + ts-jest.
- Build uses `esbuild.config.mjs` with TypeScript type-checking.

## Setup
- Node.js + npm are expected.
- Optional: `direnv` + Nix flake workflow (see README).
- Install dependencies: `npm install`.

## Commands (Build / Dev / Test / Lint)
- Dev (watch build): `npm run dev`.
- Build (type-check + bundle): `npm run build`.
- Test (CI): `npm run test`.
- Lint (no script provided): `npx eslint .`.
- Lint focused on TS: `npx eslint src test --ext .ts`.

### Run a Single Test
- By file: `npm test -- test/parse.test.ts`.
- By pattern: `npm test -- -t "parse metadata"`.
- Direct Jest: `npx jest test/parse.test.ts`.

## CI Expectations
- GitHub Actions runs `npm run build` and `npm run test`.
- Keep lint passing locally even though it is not in CI.

## Code Style (Project-Specific)
- Follow the README guidance (Zen of Python spirit).
- Prefer explicit, readable code over clever tricks.
- Keep functions small (aim for <=10-15 lines).
- Avoid nesting >2 levels when possible.
- Do not use Prettier.
- Max line length is 140 characters (ESLint).

### TypeScript + Types
- Prefer `interface` over `type` for object shapes.
- Prefix interfaces with `I` and types with `T`.
- Use `import type` for type-only imports.
- Avoid `@ts-ignore` unless absolutely necessary.
- Avoid `any` except in tightly scoped helpers.
- Keep `strictNullChecks` in mind (tsconfig).

### Imports
- Use relative imports for local modules.
- Group imports by origin: external → internal → types.
- Keep import lists concise and remove unused symbols.
- Use type-only imports to avoid runtime bundles.

### Naming
- Use descriptive names for functions and variables.
- Short names (1-3 chars) are OK in tight scopes.
- Use `camelCase` for variables/functions.
- Use `PascalCase` for classes and interfaces.
- Constants use `UPPER_SNAKE_CASE` when global.

### Formatting
- Project uses tabs in some config files and spaces in TS.
- Follow the existing file’s indentation style.
- Prefer single quotes in TS unless existing file uses double.
- Keep chained logic readable with line breaks.

### Error Handling
- Errors should not pass silently.
- Use `try/catch` around IO or parsing boundaries.
- Log failures via `Logger` when available.
- Surface user-facing issues with `Notice` where appropriate.

### Data Structures
- Maps/Sets are used in settings and frontmatter defaults.
- Preserve Map/Set usage rather than converting to objects.
- Use helpers in `src/lib/util.ts` when available.

### Svelte Components
- Svelte components live under `src/components/`.
- Keep component logic minimal and pass data via props.
- Follow existing Svelte conventions in the file.

## Tests
- Jest config is `jest.config.ts` (ts-jest preset).
- Tests live in `test/` and are written in TypeScript.
- Use `describe`/`it` patterns already present.
- Keep tests small and deterministic.

## File/Folder Conventions
- `main.ts` wires Obsidian plugin lifecycle.
- `src/` holds feature logic, `src/lib/` for shared utilities.
- `src/components/` and `src/modals/` are UI-only.
- `test-resources/vault/` is an Obsidian test vault.

## Build Notes
- `npm run build` runs `tsc -noEmit -skipLibCheck`.
- Bundling is via `esbuild.config.mjs`.
- `npm run dev` is the hot-reload build loop.

## Release Workflow
- Use `npm run release-major`, `npm run release-minor`, `npm run release-patch`, `npm run release-beta`, or `npm run release-stable`.
- Use `release-stable` to strip the beta suffix (e.g. `0.2.0b2` → `0.2.0`).
- These scripts run `version-bump.mjs` and update the version for release.
- Confirm the release commit message format is `release: X.Y.Z` and the body lists recent commit messages (the script should add it, but sometimes misses).
- Ensure the `X.Y.Z` tag points at the release commit.
- After bumping, build and test before publishing: `npm run build` and `npm run test`.
- Create the GitHub release via `gh release create X.Y.Z` with the release notes.

## Logging
- Use `Logger` in `src/lib/logger.ts` for structured logs.
- Prefer `logger().debug/warn/error` over raw `console.*`.

## Documentation Hints
- README includes dev setup and usage notes.
- No Cursor or Copilot instruction files are present.

## Practical Defaults
- Favor minimal, focused diffs.
- Avoid refactors unless required for the change.
- Do not rename files or symbols unnecessarily.

## Zen of Python (as cited in README)
- Beautiful is better than ugly.
- Explicit is better than implicit.
- Simple is better than complex.
- Complex is better than complicated.
- Flat is better than nested.
- Sparse is better than dense.
- Readability counts.
- Special cases aren't special enough to break the rules.
- Although practicality beats purity.
- Errors should never pass silently.
- Unless explicitly silenced.
- In the face of ambiguity, refuse the temptation to guess.
- There should be one-- and preferably only one --obvious way to do it.
- Although that way may not be obvious at first unless you're Dutch.
- Now is better than never.
- Although never is often better than right now.
- If the implementation is hard to explain, it's a bad idea.
- If the implementation is easy to explain, it may be a good idea.
- Namespaces are one honking great idea -- let's do more of those!

## Agent Checklist
- Identify affected files before editing.
- Mirror existing patterns in the touched files.
- Update tests if behavior changes.
- Keep types and interfaces in sync with data changes.
- Run `npm run build` and `npm run test` before final review.

## Out-of-Scope
- Do not introduce Prettier or alternate formatters.
- Avoid large dependency updates unless requested.
- Avoid changing README or docs unless needed.

## Questions
- If a requirement is unclear, ask for clarification.
- If a change risks behavior differences, confirm with user.
