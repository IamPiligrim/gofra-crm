# Frontend Design Brief

Status: draft until a direction is approved.

## Product Context

- Product: ГОФРА CRM
- Product type: Операционная веб-CRM для B2B-продаж гофроупаковки
- Audience: Менеджеры по продажам и руководители отдела продаж
- Primary user task: Менеджеру видеть задачи дня и вести сделку от технического брифа через расчёт, образец и версии КП; руководителю контролировать команду.
- Business goal: Не терять следующие шаги, ответы на КП и повторные заказы, сохранив прозрачный процесс расчёта и согласования цены.

## Voice and Content

- Tone of voice: Краткий, деловой, операционный русский язык
- Real data source: Типизированные демоданные app/crm/fixtures.ts с persistence через CrmGateway/localStorage
- Content source: Требования пользователя и существующие справочники CRM
- Brand constraints: Сохранить утверждённый crm-focused-workflow, тёмную navy/steel навигацию, крупную читаемую типографику, light/dark themes и текущие компоненты.

## Screen Scope

- /#/dashboard
- /#/deals
- /#/clients
- /#/activity

## Required States

- default
- empty
- validation
- success

## Accessibility Target

WCAG 2.2 AA

## Forbidden Patterns

- card-soup: Card soup
- empty-hero: Oversized empty hero
- purple-gradient: Default purple gradient
- glassmorphism: Decorative glassmorphism
- decorative-orbs: Decorative orbs
- fabricated-metrics: Fabricated metrics
- generic-saas-copy: Generic SaaS copy
- excessive-rounding: Excessive rounding
- meaningless-motion: Meaningless motion
- card-soup
- empty-hero
- purple-gradient
- glassmorphism
- decorative-orbs
- fabricated-metrics
- generic-saas-copy
- excessive-rounding
- meaningless-motion

## Success Definition

- The primary task is obvious without explanatory UI copy.
- Product claims and metrics are backed by the declared content or data source.
- Desktop and mobile implementations match an approved visual direction.
- Every Product Design Scorecard dimension has direct screenshot evidence.
