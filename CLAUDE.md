# CLAUDE.md

## Project
`vscode-gad` — the Gad language extension for VS Code (syntax highlighting via a
TextMate grammar, language configuration for `.gad` / `.gadt` / `.gadx`).

## Tooling — bun ONLY
- **Always use `bun`.** Never `npm`, `yarn`, `pnpm`, `npx` or `node` directly.
- Build and dev go through the `Makefile` (a thin wrapper over bun) — run `make help`.
- `make compile` (tsc → `out/`), `make package` (builds `vscode-gad.vsix` via `bunx @vscode/vsce`), `make clean`.

## Layout
- `src/` — the extension entry point.
- `syntaxes/`, `language-configuration*.json` — TextMate grammar and language config.
- `package.json` — the VS Code extension manifest.

## Conventions
- TypeScript strict. Packaging uses `bunx @vscode/vsce` (never `npm`/`vsce` global).
