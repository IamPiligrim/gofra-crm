# Project Design System

Approved direction: `crm-focused-workflow`

Approval evidence: the user explicitly approved the dark grouped sidebar shown in the focused-workflow desktop reference. The independent Concept Jury recommended the same direction, with larger typography and stronger state contrast as mandatory implementation corrections.

## Principles

1. The next required action is always easier to find than supporting data.
2. Navigation, work canvas, and contextual detail use visibly different surfaces.
3. Dense CRM information is grouped by task, not split into interchangeable cards.
4. Typography and state contrast carry hierarchy before decoration.
5. Desktop drawers become full-width sheets or stacked flows on mobile.
6. Color never acts as the only status signal; pair it with text, icons, or shape.

## Typography

- Family: existing local Geist for headings and body; Geist Mono only for IDs, dates, and monetary values where alignment helps.
- Page title: `28px/34px`, weight `700`; mobile `24px/30px`.
- Section title: minimum `18px/24px`, weight `600`.
- Subsection title: `16px/22px`, weight `600`.
- Body and controls: minimum `14px/20px` on desktop and `15px/22px` on mobile.
- Labels and table headings: minimum `13px/18px`, weight `600`; mobile `14px/20px`.
- Supporting text: minimum `12px/17px` on desktop and `13px/18px` on mobile, only with WCAG AA contrast.
- Avoid all-caps for long navigation or field labels. Never use text below `12px`.
- Long company, product, and job titles wrap to two lines before truncation.

## Color

### Light work canvas

- `--bg`: `#f4f7fb`
- `--surface`: `#ffffff`
- `--surface-raised`: `#ffffff`
- `--surface-muted`: `#edf2f7`
- `--text`: `#111827`
- `--text-secondary`: `#475569`
- `--text-muted`: `#64748b`
- `--border`: `#cbd5e1`
- `--border-strong`: `#94a3b8`
- `--accent`: `#075fd8`
- `--accent-hover`: `#034eb8`
- `--accent-soft`: `#e8f1ff`
- `--focus`: `#38bdf8`

### Approved dark navigation

- `--nav-bg`: `#0b2033`
- `--nav-bg-deep`: `#071827`
- `--nav-text`: `#f8fafc`
- `--nav-text-muted`: `#c5d0dc`
- `--nav-divider`: `#2b4154`
- `--nav-hover`: `#163a58`
- `--nav-active`: `#075fd8`
- `--nav-focus`: `#7dd3fc`
- Active entries use the blue fill plus white icon/text; inactive entries remain readable without relying on opacity.

### Semantic states

- Success: text `#166534`, surface `#dcfce7`, border `#86efac`.
- Warning: text `#92400e`, surface `#fef3c7`, border `#fbbf24`.
- Error/blocking: text `#991b1b`, surface `#fee2e2`, border `#fca5a5`.
- Information: text `#1e40af`, surface `#dbeafe`, border `#93c5fd`.
- Disabled: text `#64748b`, surface `#e2e8f0`, border `#cbd5e1`; cursor and native disabled semantics are required.
- Dark-theme equivalents must maintain at least `4.5:1` text contrast and `3:1` control/boundary contrast.

## Spacing

- Scale: `4, 8, 12, 16, 20, 24, 32, 40`.
- Standard control height: `44px`; compact table controls may be `40px` on desktop only.
- Mobile touch target: at least `44×44px`.
- Form field gap: `16px`; section gap: `24px`; page region gap: `32px`.
- Radius: `6px` for controls, `8px` for panels, `10px` for dialogs. Avoid pill-shaped containers except small statuses.
- Use one-pixel visible borders; shadows are reserved for dialogs and overlays.

## Grid and Layout

- Desktop shell: fixed `224px` sidebar, flexible work canvas, optional contextual panel up to `380px`.
- Sidebar groups use labels and hairline separators. The approved blue active row spans the usable menu width.
- Main content max width is governed by the workflow, not a marketing container.
- Quick-contact desktop composition: primary form first, contextual client/deal detail second.
- Client drawer: `min(760px, 92vw)` so decision maps and repeat-order data remain readable.
- Tables switch to labelled stacked rows below `760px`; never force desktop tables into a narrow viewport.
- Mobile uses a compact top identity bar and bottom primary navigation; forms are single-column and important actions remain visible without horizontal scrolling.

## Components

### Navigation

- Grouped dark sidebar with visible section labels and dividers.
- Default, hover, active, `focus-visible`, and disabled states are all distinct.
- Icon and label share one hit area. Do not dim inactive labels below readable contrast.

### Page and section headers

- One page title per view.
- Every functional region has an `18px/600` section title and optional concise supporting text.
- Actions align with the title on desktop and stack below it on mobile.

### Forms

- Labels sit above controls and remain visible after input.
- Required fields use both `required` semantics and a visible “Обязательно” cue.
- Validation appears beside the field and in an accessible summary when submission is blocked.
- Primary and secondary actions are visually distinct; disabled primary buttons never resemble enabled ones.

### Decision map

- Contact rows show name, job/function role, decision influence, preferred channel, and introduction gap.
- Influence uses text plus a semantic marker: decision maker, influencer, or blocker.
- The map is a structured list/tree first; decorative connecting lines are optional and never required to understand it.

### Repeat sales

- Segment tabs show label and count: all, 30, 60, 90 days, sleeping.
- Client rows show manager, last shipment, expected next order, monthly volume, and reminder window.
- Overdue and upcoming states include text labels, not color alone.

### Quick contact

- One form contains result, client, deal, contact person, next step, date, attachments, and optional price approval.
- The next step and date are visually grouped as mandatory.
- Successful submit creates a task and presents a confirmation message.

### My day

- Sales managers land on five operational queues: overdue actions, today tasks, deals without a next step, sent quotes awaiting a reply, and approaching repeat orders.
- Queues use compact list rows with company/deal context, owner, due or reply date, and one clear action; counts are derived from real CRM records.
- Team leaders retain the existing team dashboard; role changes must not hide the current analytics surface.

### Deal technical brief

- The packaging brief uses four progressive steps: construction and dimensions; material and print; volumes and operation; supplier, problem, and assets.
- Preserve entered values while switching steps. Show a compact completion summary before the fields and never render all brief fields as one uninterrupted form.
- On mobile, steps remain single-column and sticky actions must not cover the last input.

### Calculation, sample and quote workflow

- Deal milestones form a chronological checklist with explicit dates for specification, calculation, sample and quote stages plus the expected client-reply date.
- Quote versions are a structured history. Each version shows revenue, cost, logistics, calculated margin, volume, validity, status, and reason for change.
- Use the labels «Выручка», «Себестоимость», «Логистика» and «Маржа» consistently; do not reintroduce «Наша цена».

### Price approval

- Statuses: pending, approved, rejected, clarification.
- Show current/requested price, volume, product/specification, reason, requester, and attachments.
- Manager-only actions are explicit buttons with confirmation and preserved audit data.

## Interaction States

- Hover: change surface and border, never text color alone.
- Active/selected: accent surface, strong border, and `font-weight: 600`.
- `focus-visible`: `3px` high-contrast ring with `2px` offset on every interactive element.
- Pressed: small color shift; no layout movement.
- Disabled: native `disabled`, reduced emphasis, readable label, and no pointer events.
- Error: semantic border, icon/text, and actionable message.
- Success: persistent inline confirmation or toast with clear outcome.
- Motion: color/opacity transitions only, `120–180ms`; respect `prefers-reduced-motion`.

## Responsive Behavior

- Required viewports: `1440×960`, `1024×768`, `768×1024`, and `390×844`.
- At `<=1024px`, contextual panels move below the main form.
- At `<=760px`, desktop sidebar is replaced by mobile navigation and drawers become full-screen sheets.
- Body text increases to `15px` on mobile; labels to `14px`.
- Long Russian labels wrap; controls and buttons may become full width.

## Motion

- Use 120–180ms color and opacity transitions for hover, focus, disclosure, and status changes.
- Motion must explain hierarchy, state, or causality; avoid decorative layout movement and long page-load sequences.
- Do not add animation dependencies for routine CRM interactions.
- Respect `prefers-reduced-motion` and remove nonessential transitions when it is enabled.

## Content Rules

- Interface copy is concise Russian operational language using the business terms already present in the CRM.
- Do not invent KPIs, customer claims, or commercial outcomes; use fixture or user-entered data.
- Mark required inputs with the word «Обязательно» or a clear required-field marker and matching validation message.
- Keep status names consistent across filters, cards, tables, and drawers.
- Format dates as `DD.MM.YYYY`, money in ₽, and volumes with their explicit units.
- Error messages must state what the user needs to correct; long company and contact names must wrap without truncating essential information.

## Accessibility

- Target: WCAG 2.2 AA.
- Keyboard order follows visual order; dialogs trap focus and restore it on close.
- Every icon button has an accessible name.
- Status and validation never depend on color alone.
- Contrast is checked in both light and dark themes.
- Minimum touch target is `44×44px`.
