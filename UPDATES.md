# Lyriker — Updates Log

---

## v0.1.1 — Chunking Infrastructure (M1)

### M1.1 — Chunk data & persistence
- Added `useLyriker` hook that loads and saves a `<song>.lyriker.json` sidecar file per song.
- Sidecar stores chunk boundaries (`chunks`), translations, notes, and an LRC content hash (`lrcHash`).
- Changes are auto-saved with a 400 ms debounce via the File System Access API.
- File is created lazily on first mutation; no empty files are written.

### M1.2 — Chunk editing in normal lyric panel
- Each lyric line shows a `⊕`/`⊖` button in the left gutter on hover to set or clear a chunk boundary.
- Lines marked as chunk starts receive a blank-space gap above them (no divider line).
- Chunk boundaries are persisted immediately to the sidecar JSON.

### M1.3 — Chunk-aware lyrics display
- Lyric lines are grouped into chunks during playback.
- Lines in the active chunk are shown at full size and opacity; lines in inactive chunks are smaller and dimmed, with smooth CSS transitions.
- Auto-scroll centers the entire active chunk in the lyric panel (not just the active line).

### M1.4 — Chunking in stamp mode
- Stamp mode now displays `⊕`/`⊖` buttons on each line (visible on hover, right-aligned in the row).
- Keyboard shortcut `C` toggles a chunk boundary on the focused line.
- Lines marked as chunk starts show a top gap in the stamp list.
- The `+Gap` button and `G` shortcut have been removed; chunking covers the same structural purpose.

### M1.5 — LRC modification warning
- On load, the LRC content hash is compared against the stored hash in the sidecar.
- If a mismatch is detected, an amber warning banner appears above the lyric panel: *"LRC file has been modified. Chunk boundaries may be misaligned."*
- The banner has a Dismiss button that hides it for the current session.
- Available in both English and Chinese (i18n).
