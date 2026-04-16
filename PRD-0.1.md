# Lyriker v0.1 — PRD: Multilingual Lyrics & Notes

## Overview

Extend Lyriker from a music player + LRC editor into a language-learning music tool. Users can divide lyrics into chunks, attach translations and notes per chunk, and view everything in sync with playback.

---

## Data Model

### Chunk boundaries

- Stored as an **array of line indices** in a JSON sidecar (see below).
- Each index marks the **first line** of a new chunk. Line 0 is always implicitly a chunk start.
- No chunk names or labels.
- If the LRC file is modified externally (detected via file-modified-date or content hash mismatch), display a **dismissible warning banner**: "LRC file was modified. Chunk boundaries may be incorrect. Consider re-chunking." The user can click to dismiss and continue.

### JSON sidecar: `<song>.lyriker.json`

One file per song, stored in the same directory. Structure:

```json
{
  "lrcHash": "<sha256 or simple hash of LRC content at last save>",
  "chunks": [0, 12, 24, 36],
  "translations": {
    "0": "Translation text for chunk starting at line 0\nSecond line of translation",
    "12": "Translation for chunk starting at line 12",
    "24": "",
    "36": ""
  },
  "notes": {
    "0": "<b>Vocab:</b> word1 = meaning1\nword2 = meaning2",
    "12": "Grammar note: ...",
    "24": "",
    "36": ""
  }
}
```

- Keys in `translations` and `notes` are stringified line indices matching entries in `chunks`.
- `lrcHash` is computed when saving the JSON. On next load, compare against the current LRC content. Mismatch triggers the warning.
- Translations are **freeform multiline plain text**.
- Notes are **rich text** supporting `<b>` and `<i>` inline tags (same format as LRC inline editing).

### File discovery

- On folder scan, for each `<song>.lrc`, also check for `<song>.lyriker.json`.
- The `Song` type gains an optional `lyrikerHandle: FileSystemFileHandle`.

---

## Milestone M1 — Chunking Infrastructure

### M1.1 — Chunk data & persistence

- Add `useLyriker` hook: loads/saves `<song>.lyriker.json` via File System Access API.
- Exposes: `chunks`, `translations`, `notes`, `lrcHash`, `isDirty`, `isStale` (hash mismatch).
- Auto-save on changes (same pattern as LRC inline editing).

### M1.2 — Chunk editing in normal mode

- In the lyric panel, add a **chunk boundary toggle**: click a button on any lyric line to set/unset it as a chunk start.
- Visual: a horizontal separator line rendered between chunks.
- Chunk boundaries stored in `useLyriker` state → persisted to JSON.

### M1.3 — Chunk-aware lyrics display

- Group lyric lines by chunk boundaries.
- During playback:
  - **Active chunk** (containing the active lyric line): normal font size, full opacity.
  - **Inactive chunks** above/below: smaller font, higher opacity (dimmed).
- Smooth transition when the active chunk changes.
- Follow-mode auto-scroll targets the active chunk, not just the active line.

### M1.4 — Chunking in stamp mode

- Add a **"New Chunk"** button (and keyboard shortcut, e.g. `C`) in stamp mode.
- Pressing it marks the current focus line as a chunk boundary.
- Chunk boundaries are committed to the JSON sidecar when saving the stamped LRC.
- Undo supports reverting chunk boundary insertions.

### M1.5 — LRC modification warning

- On load, compute hash of current LRC content and compare with `lrcHash` in JSON.
- If mismatch, show a **yellow warning banner** at the top of the lyric area: "LRC file has been modified. Chunk boundaries may be misaligned."
- Banner has a dismiss (×) button. Clicking it hides the warning for this session.
- No automatic re-alignment; user must manually re-chunk if needed.

---

## Milestone M2 — Translation Section

### M2.1 — Layout change: two-column

- Main area becomes two columns when a lyriker JSON exists (or translation mode is activated):
  - **Left column**: lyrics (existing lyric panel, now chunk-aware).
  - **Right column**: translation panel.
- If no lyriker data exists, the right column shows a placeholder with a "Start translating" button that creates the JSON sidecar.
- Columns are equal width by default. Consider a draggable splitter (stretch goal).

### M2.2 — Translation panel display

- Renders translation chunks aligned with lyric chunks.
- Each translation chunk is a text block positioned alongside its corresponding lyric chunk.
- Active chunk's translation: normal opacity. Inactive: dimmed (matching lyric chunk styling).
- Auto-scrolls to the active chunk's translation during playback.

### M2.3 — Translation editing

- **Double-click** a translation chunk to enter edit mode (contentEditable or textarea).
- Supports multiline freeform text.
- **Enter** = newline (not save). **Ctrl+Enter** or **Escape** = commit and exit edit mode.
- Changes auto-saved to JSON sidecar.
- While editing, the translation panel does not auto-scroll (stays pinned).

---

## Milestone M3 — Notes Section

### M3.1 — Notes panel

- A **collapsible panel** below the two-column area (or below the lyrics area in single-column).
- Shows notes for the **active chunk only**.
- Collapsed by default; toggle button to expand.

### M3.2 — Notes display

- Renders the notes block as rich text (bold/italic supported).
- When playback moves to a new chunk and the panel is in **display mode**, auto-switch to the new chunk's notes.

### M3.3 — Notes editing

- A **pencil button** on the notes panel header (or in the lyric chunk gutter) to enter edit mode.
- Edit mode: contentEditable div with Ctrl+B / Ctrl+I support (same as lyric inline editing).
- **While editing**: notes stay pinned to the chunk being edited, even if playback moves on.
- **On exit**: if playback has moved to a different chunk, show a **"Return to current playback"** button instead of auto-switching. Clicking it navigates to the now-active chunk's notes.
- Changes auto-saved to JSON sidecar.

### M3.4 — Notes entry from lyrics

- Each lyric chunk has a small **📝 button** in its gutter/header.
- Clicking it: opens/expands the notes panel and enters edit mode for that chunk's notes.
- If notes already exist for that chunk, it scrolls to and focuses the notes editor.

---

## Milestone M4 — Integration & Polish

### M4.1 — Keyboard shortcuts

| Key | Context | Action |
|-----|---------|--------|
| `C` | Stamp mode | Mark chunk boundary |
| `Ctrl+Enter` | Translation/notes edit | Save and exit edit mode |
| `Escape` | Translation/notes edit | Save and exit edit mode |

### M4.2 — i18n

- Add Chinese translations for all new UI strings (chunk controls, translation panel, notes panel, warning banner).

### M4.3 — Folder scan update

- Scan for `.lyriker.json` alongside `.lrc` files.
- Attach handle to `Song` type.

### M4.4 — README update

- Document new features: chunking, translation, notes.
- Update known issues if any arise.

---

## Out of Scope for v0.1

- Structured vocabulary cards (word/reading/meaning fields)
- Translation line-by-line alignment within a chunk
- Drag-to-reorder chunks
- Import/export to subtitle formats (SRT, ASS)
- Chunk labels/names
- Draggable column splitter
