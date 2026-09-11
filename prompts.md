# Cozy AI Studio — builder benchmark prompts

Paste these into Studio (`/studio`) to verify brief → generate → live preview.

## 1. Kanban

Personal kanban for a digital assistant. Columns Inbox, Doing, Done. Cards with priority chips, add-card form, and move buttons. Warm paper canvas, ink type, terracotta primary.

## 2. AI chat

A calm AI chat. Conversation list on the left, message thread in the center, composer at the bottom. Assistant bubbles on paper, user bubbles in terracotta. No streaming chrome.

## 3. Habits dashboard

Habits dashboard with a 7-day grid. Habits: water, movement, reading, sleep. Toggle cells, streak count, and a weekly progress bar. Editorial, not gamified.

## 4. Calendar

Month calendar with click-to-add events and a side list of today's notes. Quiet typography, terracotta for today, paper background.

## 5. Notes

Notes tool: searchable list on the left, editor on the right, new-note action. Persist notes in the page. Warm paper, ink text, terracotta accent.

## +1 Base44 diagnostic

Do not invent a new product. Inspect the running Studio and report only:

1. Does `/studio` render (not a blank gray page)?
2. Is the browser console free of `createRequire is not a function`?
3. Does Generate run through a server function (no `vite` / `rolldown` / `pg` in the client bundle)?
4. If the model is unavailable, does a local layout still fill the preview iframe?
5. Mobile (~390px): three tabs Brief / Code / Preview, no horizontal overflow.

Expected: `/studio` paints immediately, generate is user-initiated, preview is `srcDoc` HTML, client bundle `createRequire` count is 0.
