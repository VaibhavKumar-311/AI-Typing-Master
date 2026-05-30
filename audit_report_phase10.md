# Phase 10: AI Analytics - Audit & Verification Report

## 1. Data Ingestion & Caching Audit
- **Database Efficiency**: The `save_metrics` API receives an array of roughly 300 keystrokes. Instead of writing 300 rows to the database per test, the `weak_key_detector.py` service aggregates the entire array in-memory via Python dictionaries. It groups by `expected` character, calculating the total correct, mistake count, and sum of reaction times. It then issues exactly 1 atomic `get_or_create` transaction per unique character (max ~26), vastly reducing DB I/O.
- **Exponential Moving Averages**: Reaction times are not simply appended. They are updated via `(current_avg_time * 0.8) + (new_avg * 0.2)`. This EMA formula ensures that early-game slow typing doesn't permanently drag down an experienced user's stats, while keeping the database model to a single float column.

## 2. Analytics Determinism
- **No LLM Hallucinations**: We explicitly avoided generative AI APIs to comply with the architecture rules. `recommendation_engine.py` only surfaces insights when the raw database thresholds are breached (e.g. `total_strokes > 20`).
- **Dynamic Training Safety**: The `adaptive_generator.py` scans a curated technical word-bank. If a user has no weak keys yet, it gracefully degrades to providing a generic selection of words, rather than crashing the loop.

## 3. Known Remaining Risks
- The `KeyAnalytics` model currently only tracks the `expected` key (e.g., "The user missed the letter 'H' 12 times"). Phase 11 could expand this to track *Digraphs* (e.g., "The user meant to hit 'H' but hit 'G' 12 times") which requires a larger DB table structure but provides higher fidelity insights.
