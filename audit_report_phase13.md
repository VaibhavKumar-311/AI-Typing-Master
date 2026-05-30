# Phase 13/14: Architecture Audit Report

## 1. Theme Override Performance
- The traditional method of replacing `bg-gray-900` with `bg-[var(--bg)]` on thousands of DOM elements causes high reflow overhead. By leveraging CSS attribute selectors (`[data-theme="light"] .bg-gray-900`), the browser delegates the color-swap entirely to the CSSOM paint layer without requiring DOM layout recalculations.
- `ThemeManager.js` operates completely offline for speed, and uses an asynchronous `fetch` payload strictly to backup the preferences to the `UserSettings` database model so they sync across devices without blocking the main UI thread.

## 2. Audio Node Memory Management
- `window.AudioContext` instances are heavy. The manager instantiates exactly **one** global context. Every keystroke spins up an ultra-lightweight `OscillatorNode`, fires its frequency curve, and immediately garbage collects itself. 

## 3. Admin Security & Cheater Audits
- The admin dashboard features specialized `list_filter` pipelines. Rather than just searching by username, admins can filter raw results by `created_at` or `is_reviewed` flags.
- Real-time multiplayer anti-cheat logs, previously sent to stdout, can now be directly wired into the `SuspiciousActivityLog` database table for permanent auditing.
