# Project Map

Generated: 2026-07-25T05:44:13.579Z

## Identity

- Name: gofra-crm
- Root: `C:\Users\sacha\Documents\Codex\2026-07-23\new-chat`
- Git repository detected: yes
- Project types: `frontend`

## Stack

- Node.js
- TypeScript
- React
- Vite
- Tailwind CSS
- GitHub Actions

Package manager: `pnpm`

## Important Files And Folders

- README.md
- package.json
- tsconfig.json
- vite.config.ts
- GitHub Actions
- src/
- app/
- tests/

## Documentation

| Item | Status | Type |
| --- | --- | --- |
| README.md | present | file |
| docs | missing | missing |
| CONTRIBUTING.md | missing | missing |
| CHANGELOG.md | missing | missing |
| .github | present | directory |
| .github/workflows | present | directory |

## Environment And Secrets Risk

- No `.env*` files detected by the lightweight scan.

## Commands

| Task | Command | Source |
| --- | --- | --- |
| Install | pnpm install | project files |
| Dev | pnpm dev | package script: dev |
| Test | pnpm test | package script: test |
| Lint | pnpm lint | package script: lint |
| Typecheck | Not detected | missing |
| Build | pnpm build | package script: build |

## Package Scripts

| Script | Command |
| --- | --- |
| dev | vite |
| build | vite build |
| preview | vite preview |
| lint | tsc --noEmit |
| test | vite build && node --test tests/static-build.test.mjs |

## Quality Gaps

- Typecheck command is not detected.

## Risk Signals

- No automatic risk signals detected.

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

## Top-Level Tree

```text
- .ai-dev/
  - frontend-qa-report.md
  - project-brief.md
  - project-map.md
- .github/
  - workflows/
    - deploy-pages.yml
- .openai/
- .vinext/
  - fonts/
    - geist-8ac0455e797f/
    - geist-mono-00e989178794/
- .wrangler/
  - deploy/
    - config.json
  - registry/
    - __asset-worker__
    - __router-worker__
    - __vite_proxy_worker__
    - gofra-crm-frontend
    - site-creator-vinext-starter
  - state/
    - v3/
- app/
  - _sites-preview/
  - crm/
    - chat-gateway.ts
    - chat.css
    - ChatView.tsx
    - crm-gateway.ts
    - CrmApp.tsx
    - domain.ts
    - fixtures.ts
    - Icons.tsx
    - permissions.ts
    - theme.tsx
    - workspace-features.css
    - WorkspaceFeatures.tsx
  - agency-redesign.css
  - globals.css
- db/
- drizzle/
  - meta/
- examples/
  - d1/
    - app/
    - db/
- outputs/
- public/
  - fonts/
    - geist-cyrillic.woff2
    - geist-latin.woff2
    - geist-mono-cyrillic.woff2
    - geist-mono-latin.woff2
  - .nojekyll
  - favicon.svg
  - file.svg
  - globe.svg
  - og.png
  - window.svg
- src/
  - main.tsx
- tests/
  - static-build.test.mjs
- work/
  - agency-redesign-qa/
    - chat__desktop.png
    - chat__mobile.png
    - chat__tablet.png
    - clients__desktop.png
    - clients__mobile.png
    - clients__tablet.png
    - dashboard__desktop.png
    - dashboard__mobile.png
    - dashboard__tablet.png
    - statistics__desktop.png
    - statistics__mobile.png
    - statistics__tablet.png
  - custom-icons-stats-qa/
    - dashboard__desktop.png
    - dashboard__mobile.png
    - dashboard__tablet.png
    - statistics__desktop.png
    - statistics__mobile.png
    - statistics__tablet.png
  - data-foundation-check/
  - feature-final-qa/
    - calendar__mobile.png
  - feature-routes-qa/
    - calendar__desktop.png
    - calendar__mobile.png
    - statistics__desktop.png
    - statistics__mobile.png
  - frontend-qa/
    - root__desktop.png
    - root__mobile.png
  - frontend-qa-final/
    - root__desktop.png
    - root__mobile.png
  - frontend-qa-retry/
    - root__desktop.png
    - root__mobile.png
  - icon-polish-qa/
    - root__desktop.png
    - root__mobile.png
    - root__tablet.png
  - redesign-qa/
    - root__desktop.png
    - root__mobile.png
  - sales-light-fix/
    - statistics__desktop.png
    - statistics__mobile.png
  - steel-palette-qa/
    - chat__desktop.png
    - chat__mobile.png
    - clients__desktop.png
    - clients__mobile.png
    - dashboard__desktop.png
    - dashboard__mobile.png
    - deals__desktop.png
    - deals__mobile.png
    - statistics__desktop.png
    - statistics__mobile.png
  - dev-server.err.log
  - dev-server.out.log
  - gofra-crm-site.tar.gz
  - pages-preview.err.log
  - pages-preview.out.log
  - pnpm-install-retry.err.log
  - pnpm-install-retry.out.log
  - pnpm-install.err.log
  - pnpm-install.out.log
  - preview-4178.err.log
  - preview-4178.log
  - preview-4179.err.log
  - preview-4179.log
- worker/
- .gitignore
- РАЗДЕЛЫ-СИСТЕМЫ.txt
- index.html
- next-env.d.ts
- package.json
- pnpm-lock.yaml
- pnpm-workspace.yaml
- README.md
- tsconfig.json
- tsconfig.tsbuildinfo
- vite.config.ts
```
