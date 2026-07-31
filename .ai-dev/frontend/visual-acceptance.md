# Visual Acceptance

## Approved Direction

`crm-focused-workflow`

Evidence:

- User explicitly approved the dark grouped sidebar in the focused-workflow desktop reference.
- Independent Concept Jury recommended focused-workflow for hierarchy, responsive viability, brand coherence, and authentic CRM content.
- Generated reference typography is directional only; implementation must use the larger sizes and stronger contrast defined in `design-system.md`.

## Reference Mapping

- Desktop client workspace, grouped sidebar, decision map, and repeat-order context:
  `.ai-dev/frontend/references/generated/rf-20260730210111-6c3ba61966/crm-focused-workflow/crm-focused-workflow--clients--desktop--default.png`
- Mobile client workspace, next action, repeat order, recent contact, and key people:
  `.ai-dev/frontend/references/generated/rf-20260730210111-6c3ba61966/crm-focused-workflow/crm-focused-workflow--clients--mobile--default.png`
- Desktop quick-contact workflow and contextual decision/repeat-order panels:
  `.ai-dev/frontend/references/generated/rf-20260730210111-6c3ba61966/crm-focused-workflow/crm-focused-workflow--activity--desktop--default.png`
- Mobile quick-contact workflow, mandatory next step, decision contacts, and linked deal:
  `.ai-dev/frontend/references/generated/rf-20260730210111-6c3ba61966/crm-focused-workflow/crm-focused-workflow--activity--mobile--default.png`
- Operational-clarity references are reserve-only sources for module content and must not be copied at their original density.
- Generated mobile baselines define composition, not literal type size. The larger
  `15px` body, `13px` support text, `18px` section headings, and `44px` targets
  in `design-system.md` override generated-pixel typography and rail density.

## Viewport Matrix

- Desktop: `1440×960`.
- Mobile: `390×844`.

Intermediate laptop and tablet widths remain responsive QA checks, but only
desktop and mobile are visual-reference baselines.

## State Matrix

- `/clients`, default: grouped navigation, repeat segment tabs, readable rows, and client drawer.
- Client drawer, populated: repeat-order summary and multiple decision contacts.
- Client drawer, empty: clear empty state with “Добавить контакт”.
- Quick contact, ready: client/deal/contact selected, next step/date visible and mandatory.
- Quick contact, invalid: missing next step/date visibly blocks submit and preserves entered data.
- Quick contact, price approval: pricing fields and attachment list visible.
- Quick contact, success: interaction and canonical task appear; pending approval appears when requested.
- Navigation: default, hover, active, focus-visible, disabled.
- Theme: light work canvas and dark theme both retain WCAG AA contrast.

## Product Design Scorecard

- hierarchy: primary contact/follow-up task is immediately obvious.
- composition: sidebar, main work, and context are distinct without card soup.
- typography: body, labels, headers, and support text meet the approved minimum scale.
- density: expert-level but readable; mobile removes secondary columns.
- action clarity: one primary action per active workflow.
- content quality: all labels and records use packaging-sales language and real fixture schemas.
- asset authenticity: interface uses existing icons and data; no decorative generated imagery ships in product UI.
- mobile UX: 44px targets, single-column forms, no horizontal overflow.
- state coverage: validation, empty, success, pending, rejected, clarification, and disabled are verified.
- brand coherence: approved navy sidebar and blue action accent persist across modules.

## Anti-Slop Exceptions

None approved. Generic dashboard ornament, excessive pills, low-contrast text, decorative gradients, tiny labels, weak section hierarchy, and card-within-card clutter remain blocking defects.

## Handoff Evidence

- Direction approval: the user confirmed that the sidebar and all prepared screens are well developed and ready to assemble.
- Independent jury: `crm-focused-workflow` was selected as the most implementation-ready direction.
- Baseline set: the four registered desktop/mobile client and activity references under manifest `rf-20260730210111-6c3ba61966`.
- Final handoff requires successful build and automated tests, browser verification of desktop and mobile routes, screenshot inspection, and a recorded visual review.
