# Frontend Design Brief

Status: draft until a direction is approved.

## Product Context

- Product: ГОФРА CRM
- Product type: Операционная веб-CRM для B2B-продаж гофроупаковки
- Audience: Менеджеры по продажам, руководители отдела продаж и руководители компании-производителя упаковки
- Primary user task: После каждого контакта сохранить результат и обязательный следующий шаг, одновременно поддерживая карту влияния клиента и прогноз повторного заказа
- Business goal: Снизить потери повторных заказов, сделать возврат спящих клиентов системным и сократить цикл согласования цены

## Voice and Content

- Tone of voice: Краткий, деловой, операционный русский язык без рекламных формулировок
- Real data source: Типизированные демоданные app/crm/fixtures.ts с персистентностью через CrmGateway и localStorage; будущий backend подключается через тот же контракт
- Content source: Требования пользователя, существующие CRM-справочники и утверждённые пользователем reference screenshots
- Brand constraints: Собрать утверждённые пользователем focused-workflow экраны и тёмное navy/steel боковое меню. Основной текст не мельче 14px desktop/15px mobile, secondary не мельче 12/13px при WCAG AA, section title минимум 18px/600, явные active/hover/focus-visible/disabled, 44px touch targets, light/dark themes

## Screen Scope

- /#/clients
- /#/activity

## Required States

- default

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
