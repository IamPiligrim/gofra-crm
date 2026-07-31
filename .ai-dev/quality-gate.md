# Quality Gate

Generated: 2026-07-30T20:40:45.148Z

## Default Verification

- Test: `pnpm run test`
- Lint: `pnpm run lint`
- Build: `pnpm run build`

## Missing Checks

- Typecheck command is not detected.

## Unsafe Or Manual Commands

- `test`: Shell operator '&' is forbidden.. Command: `vite build && node --test tests/static-build.test.mjs`

## Minimum Standard

- Run the narrowest fast check that proves the change.
- Run broader checks when touching shared utilities, build config, routing, auth, data models, or UI foundations.
- If a check is unavailable or cannot run locally, record the reason in the final response.
- Do not mark the task complete while known relevant checks are failing.

## Frontend QA

- Check desktop and mobile layouts.
- Check loading, empty, and error states when touched by the task.
- Verify text does not overflow buttons, cards, tables, or navigation.
- Verify interactive controls have clear hover/focus/disabled states.
- For visual changes, run or open the app and inspect the changed screens.
- When Playwright is available, run MCP `run_frontend_qa` for desktop/mobile screenshots, console errors, overflow, and basic accessibility.
- For product/design work, ordinary `run_frontend_qa` is not sufficient: require an approved direction and design system, then use `run_visual_reference_qa`, independent `record_visual_review`, and `frontend_product_gate` with `gate=handoff`.
- Check hierarchy, composition, typography, density, action clarity, content quality, asset authenticity, mobile UX, state coverage, and brand coherence separately. Do not use one overall design score.
- For handoff or beta release, use the `frontend-quality-gate` skill and report Gate: pass, warn, or block.

## Final Response Checklist

- Mention changed files.
- Mention checks run and results.
- Mention any skipped checks or residual risk.
