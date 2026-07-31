# Project Brief

Generated: 2026-07-25T05:44:13.506Z

This is the short handoff cache for Codex, Claude, and other agents. Read it before loading the larger project map.

## Identity

- Name: gofra-crm
- Root: `C:\Users\sacha\Documents\Codex\2026-07-23\new-chat`
- Git repository detected: yes
- Project types: `frontend`
- Package manager: `pnpm`

## Stack

- Node.js
- TypeScript
- React
- Vite
- Tailwind CSS
- GitHub Actions

## Important Files And Folders

- README.md
- package.json
- tsconfig.json
- vite.config.ts
- GitHub Actions
- src/
- app/
- tests/

## Command Map

| Task | Command | Source |
| --- | --- | --- |
| Install | pnpm install | project files |
| Dev | pnpm dev | package script: dev |
| Test | pnpm test | package script: test |
| Lint | pnpm lint | package script: lint |
| Typecheck | Not detected | missing |
| Build | pnpm build | package script: build |

## Quality Gaps

- Typecheck command is not detected.

## Risk Signals

- No automatic risk signals detected.

## Dangerous Or Side-Effectful Scripts

- No package scripts were automatically flagged as side-effectful.

## Documentation

| Item | Status | Type |
| --- | --- | --- |
| README.md | present | file |
| docs | missing | missing |
| CONTRIBUTING.md | missing | missing |
| CHANGELOG.md | missing | missing |
| .github | present | directory |
| .github/workflows | present | directory |

## Environment And Secrets

- No `.env*` files detected by the lightweight scan.

## Recommended Skills

| Skill | Use when |
| --- | --- |
| `repo-onboarding` | Repository setup, AGENTS.md, project map, quality gate. |
| `feature-builder` | Feature implementation with repo patterns and tests. |
| `bugfix-investigator` | Bug, regression, failing test, or CI investigation. |
| `code-reviewer` | Risk review, missing tests, security/data/behavior checks. |
| `frontend-polisher` | Frontend/UI quality, states, responsiveness. |
| `beta-frontend-maintainer` | Existing beta frontend support with minimal safe diffs. |
| `frontend-quality-gate` | Final UI QA: responsive, accessibility, browser checks. |
| `landing-conversion-reviewer` | Landing page clarity, trust, CTA, and conversion review. |
| `design-taste-frontend` | Visually important frontend/design work. |
| `knowledge-curator` | Durable project notes and lessons. |

## Recommended Next Commands

- начни новую фичу: <описание>
- найди баг: <симптом или ошибка>
- поддержи frontend/beta: <экран или компонент>
- проверь frontend quality gate
- проверь лендинг/конверсию: <страница>
- улучши frontend/design: <экран или компонент>
- сделай ревью
- обнови память проекта
- обнови базу знаний

## Agent Handoff Rule

- Do not load the whole repository into chat context.
- Use this file for quick orientation, then `.ai-dev/project-map.md` for structure and `.ai-dev/quality-gate.md` for verification.
- Use MCP search for specific files, commands, risks, and skills.
- Do not run side-effectful scripts without explicit user approval.
