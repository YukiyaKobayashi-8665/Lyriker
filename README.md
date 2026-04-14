# Simp Player

A minimal, browser-based local music player with synchronized lyric display. No backend, no installation — just open the page in Chrome or Edge and pick a folder.

## Features

- **Local playback** — reads audio files directly from a folder on your machine via the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API); nothing is uploaded
- **Synchronized lyrics** — parses `.lrc` sidecar files and scrolls in sync with playback; currently-playing line is highlighted
- **Click-to-seek on lyrics** — click any lyric line to jump to its timestamp; follow mode auto-resumes after 3 s
- **Inline lyric editor** — double-click any line to edit it in place; supports **bold** and *italic* (Ctrl+B / Ctrl+I); changes are auto-saved back to the `.lrc` file
- **LRC stamp mode** — paste raw lyrics, hit play, and press Enter (or click any line) to stamp timestamps in real time; supports undo, gap insertion, and monotonicity validation before saving
- **Playback speed control** — 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2× speed buttons
- **Seek bar hover tooltip** — hovering over the seek bar shows the time at that position
- **Keyboard shortcuts** — Space: play/pause · ←/→: seek ±5 s · Ctrl+←/→: prev/next track · G: insert gap (stamp mode) · Ctrl+Z: undo stamp · Ctrl+S: save LRC
- **Session restore** — folder handle is persisted in IndexedDB; last played track is remembered across reloads
- **Chinese / English UI** — switch language with the toggle button in the top-right corner
- **Zero dependencies on UI libraries** — ~70 kB gzipped

## Supported formats

| Audio | Lyrics |
|-------|--------|
| `.mp3` `.flac` `.wav` `.ogg` `.m4a` | `.lrc` (standard + compressed, with `<b>`/`<i>` inline tags) |

## Getting started

```bash
npm install
npm run dev
```

Open the URL printed by Vite (Chrome or Edge required for File System Access API support).

## Build

```bash
npm run build
```

Output is written to `dist/`. Serve with any static file server.

## Tech stack

- [Vite](https://vitejs.dev/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- File System Access API (folder picker, writable streams for LRC autosave)
- IndexedDB (folder handle persistence), localStorage (last track)

## Known issues


- **KI-2** — Playback position is not restored after a page reload (only the track index is remembered).

