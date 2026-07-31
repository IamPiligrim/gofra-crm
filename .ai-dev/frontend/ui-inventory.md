# UI Inventory
Project: ГОФРА CRM

## Screens and Routes

- `/#/dashboard`: role-aware home; five-list «Мой день» for sales managers and the existing team dashboard for leaders.
- `/#/clients`: client pipeline/list, repeat-sales segments, client drawer.
- `/#/deals`: deal pipeline/list and mandatory next-action visibility.
- `/#/contacts`: contact directory and entry point to log a contact.
- `/#/activity`: interaction history and global quick-contact action.
- `/#/calendar`: canonical tasks, including contact follow-ups and repeat-order reminders.
- Global quick-contact dialog: one-screen post-contact workflow.
- Client drawer: profile, repeat-order data, decision map, related deals, interactions, and price approvals.
- Deal drawer: required next step, staged packaging brief, dated calculation/sample/quote process, quote version history, and approval history.

## Components

- `CrmApp`: application shell, sidebar, routing, persistence orchestration, global dialogs.
- `ClientsView`, `ClientCard`, `ClientTable`: client browsing and repeat-sales segmentation.
- `DealsView`, `DealCard`, `DealTable`: open/closed deal workflows.
- `RecordDrawer`: client and deal contextual workspace.
- `CreateDialog`: client, deal, contact, and quick-contact forms.
- `CalendarView`: task and reminder surface.
- `ManagerFocusBoard`: five manager queues backed by pure selectors.
- `DealProcessView`: milestone controls, progressive technical brief, and quote history.
- `Field`, `SelectField`, `DrawerSection`, `Detail`: existing shared UI primitives.
- New domain helpers: expected-order calculation, repeat segment classification, reminder synchronization, and open-deal validation.

## Data and Content

- Source of truth: `app/crm/domain.ts`.
- Local migration/persistence: `app/crm/crm-gateway.ts`.
- Realistic demo content: `app/crm/fixtures.ts`.
- Existing user, client, contact, deal, interaction, task, target, and dictionary collections remain compatible.
- New contact data: function role, decision influence, preferred channel, introduction gap.
- New client data: order frequency, last shipment, expected next order, manual override, average monthly volume, reminder window.
- New interaction data: linked deal and attachment metadata.
- New price approval data: pricing, volume, reason, attachments, status, requester/reviewer audit fields.
- New deal data: packaging brief, dated process milestones, active quote link, and normalized quote versions with explicit economics.

## Required States

- Loading, storage error, and retry.
- Empty decision map and populated decision map.
- Repeat-sales segment with results and zero-result state.
- Quick-contact validation failure, ready, submit success, and attachment selection.
- Open deal missing next action/date is blocked; closed deal is exempt.
- Price approval: pending, approved, rejected, clarification.
- Navigation: default, hover, active, focus-visible, and disabled.
- Light and dark themes.
- My Day: populated and zero-result queues for each of the five list types; leaders retain team analytics.
- Technical brief: each of four stages, preserved draft values, validation, attachment metadata, and saved summary.
- Deal process: incomplete and complete milestones, reply date, first quote, revised quote, accepted/rejected/replaced versions.

## Responsive Risks

- Long Russian company, product, and job titles.
- Dense tables and multiple monetary columns.
- Decision map hierarchy on narrow screens.
- Long quick-contact form and keyboard viewport on mobile.
- Sidebar labels, group headings, and bottom navigation target sizes.
- Dialog scroll locking, focus restoration, and sticky actions.
