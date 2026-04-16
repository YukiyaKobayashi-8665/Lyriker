# Lyriker — Updates Log

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
