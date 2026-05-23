# Send Event Targets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `/send` with target selection, known group storage, and shared participation buttons.

**Architecture:** Add a focused `send` module for persistence and domain operations, then keep Telegram UX orchestration in `tg-bot.service.ts`. Store events separately from send campaigns so future UI can attach a new post to an existing event without changing participant data.

**Tech Stack:** NestJS 10, nestjs-telegraf, Telegraf, TypeORM, PostgreSQL, Jest.

---

### Task 1: Send Persistence Module

- [x] Add TypeORM entities for known chats, events, campaigns, campaign targets, and participants.
- [x] Add `SendService` tests for chat upsert, campaign creation, idempotent participant join, and participant labels.
- [x] Implement `SendService` and module exports.

### Task 2: `/send` Settings Menu

- [x] Extend session data with send settings and selected groups.
- [x] Replace confirmation keyboard with settings keyboard.
- [x] Add callbacks for toggling personal delivery, group delivery, participation buttons, and group selection.

### Task 3: Publishing and Participation

- [x] Publish text/photo messages to selected targets.
- [x] Store all delivered `chatId/messageId` pairs.
- [x] Add `Я иду` callback with idempotent join and counter refresh.
- [x] Add `Кто идет` deep-link and `/start event_<id>` participant list.

### Task 4: Docs and Verification

- [x] Update README with the new `/send` flow and bot permissions.
- [x] Keep TODO entry for future `Привязать к событию`.
- [x] Run `npm test` and `npm run build`.
