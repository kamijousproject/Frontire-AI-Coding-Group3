---
phase: 4
slug: autocomplete-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-12
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — no jest/vitest/playwright detected |
| **Config file** | None |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | Manual browser checklist against 4 success criteria |
| **Estimated runtime** | ~5 seconds (TypeScript compile) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit` + manual browser checklist
- **Before `/gsd-verify-work`:** TypeScript clean + all 4 AUTO criteria confirmed in browser
- **Max feedback latency:** ~5 seconds (TypeScript only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-T1 | 01 | 1 | AUTO-01 | T-04-01 | encodeURIComponent on query | manual | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 04-01-T2 | 01 | 1 | AUTO-02 | T-04-02 | JSX text nodes (no XSS) | manual | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 04-01-T3 | 01 | 1 | AUTO-03 | — | N/A | manual | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 04-01-T4 | 01 | 1 | AUTO-04 | T-04-03 | JSX rendering (no dangerouslySetInnerHTML) | manual | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all automated gates for this phase.

- `npx tsc --noEmit` — available via project devDependencies (TypeScript 5)

*No test runner installation required — confirmed by absence of jest.config.*, vitest.config.*, and test/ directories. Consistent with Phase 01–03 validation approach.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Debounce 200ms — no request before 2 chars or 200ms | AUTO-01 | DOM timing + network requires browser | Type "ba" rapidly; confirm single request after pause; use DevTools Network |
| AbortController — no stale results on rapid input | AUTO-01 | Race condition requires browser | Type "bang" fast over "bali"; confirm only "bang" results appear |
| Dropdown: 8 results, City/Region/Country format | AUTO-02 | DOM render requires browser | Type "ba" → check ≤8 results, format matches spec |
| "No cities found for 'xyz'" message | AUTO-02 | DOM render requires browser | Type "xyznonexistent" → confirm exact message text |
| ↑/↓ highlight movement | AUTO-03 | Keyboard events require browser | Tab to input → ↑↓ arrows move highlight |
| Enter adds highlighted city | AUTO-03 | Keyboard + state requires browser | Highlight a city → Enter → appears on dashboard |
| Escape closes dropdown | AUTO-03 | Keyboard + DOM requires browser | Open dropdown → Escape → dropdown gone |
| Tab dismisses without selecting | AUTO-03 | Keyboard requires browser | Open dropdown → Tab → no city added |
| Typed chars bold in suggestions | AUTO-04 | DOM render requires browser | Type "ban" → "ban" portion of "Bangkok" is bold |
