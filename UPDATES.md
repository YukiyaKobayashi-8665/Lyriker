# Lyriker — Updates Log

---

## v0.1.3.1 — Draggable sidebar splitter

- **Draggable sidebar:** The divider between the sidebar and the main content area is now a draggable splitter. Drag it horizontally to resize the sidebar (150 – 500 px). Width snaps to 260 px on first load.

---

## v0.1.3 — Notes panel, UX & bug fixes

- **M3.1–M3.3 — Notes panel:** Notes section added below translations in the right column. Shows notes for the active chunk; auto-follows playback. Edit mode via double-click anywhere on the panel (rich text: Ctrl+B bold, Ctrl+I italic). Commit with Ctrl+Enter or Escape. While editing and playback moves on, a "Return to current playback" button appears.
- **Notes fold:** Notes section folds to a header bar at the bottom of the right column; draggable vertical splitter between translation and notes hides when notes are folded.
- **Right column open by default:** Translation/notes panel now starts expanded.
- **Foldable sidebar:** `‹` button added to the right of the folder picker folds the sidebar to a narrow strip; `›` restores it.
- **Dynamic translation textarea rows:** Edit area grows/shrinks immediately as lines are typed (`max(5, line_count)`).
- **Scroll-center fix during splitter drag:** Active translation chunk stays centered in the translation body while dragging the vertical splitter.
- **Pause scroll fix:** Auto-scroll back to active lyric no longer fires when playback is paused. Follow mode resumes automatically when playback restarts.

---

## v0.1.2 — Translation panel fixes

- **Chunk 0 always set:** Line 0 is now always a chunk start by default; `toggleChunk(0)` is a no-op. Existing sidecars missing index 0 are upgraded on load.
- **Translation placeholder:** Empty chunks now show the first lyric line of the chunk as placeholder text instead of `[N–M]` line numbers.
- **Placeholder visibility:** Placeholder opacity raised so it's readable but still distinguishable from real translations.
- **Stamp save corruption fix:** Unstamped lines are now written as bare text (no `[00:00.00]` tag) so they don't corrupt LRC sort order. On reload, mixed stamped/plain lines resume correctly as `time: null`.

---

## v0.1.1 — Chunking & translation panel (M1 + M2)

- `useLyriker` hook — loads/saves `<song>.lyriker.json` sidecar (chunks, translations, notes, LRC hash). Auto-saved with 400 ms debounce; created lazily on first mutation.
- Chunk toggle buttons (`⊕`/`⊖`) in lyric panel and stamp mode; keyboard shortcut `C` in stamp mode.
- Chunk-aware display: active chunk at full opacity/size, others dimmed; auto-scroll centers active chunk.
- LRC staleness banner when stored hash mismatches current file.
- Two-column layout with foldable translation panel and draggable splitter.
- Translation panel: chunk-aligned display, auto-scroll, double-click to edit (commit with Ctrl+Enter or Escape).
