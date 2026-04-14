# Product Requirements Document — Local Music Player with Lyrics

## 1. Overview

A lightweight, browser-based local music player that plays audio files from a user-selected folder, displays synchronized rolling lyrics, and supports drag-to-seek and inline lyric editing with basic rich-text styling.

**Target platform:** Windows (Chrome / Edge)
**Tech stack:** Vite + React + TypeScript, zero backend

---

## 2. User Personas

**Primary:** A Windows user who has a local music library with `.lrc` sidecar files and wants a minimal, distraction-free player with lyric interaction.

---

## 3. Functional Requirements

### 3.1 Folder Selection & Scanning

| ID | Requirement |
|----|-------------|
| F1.1 | User clicks a button to select a local folder via the File System Access API. |
| F1.2 | App scans the folder (non-recursive) for supported audio files: `.mp3`, `.flac`, `.wav`, `.ogg`, `.m4a`. |
| F1.3 | For each audio file, app looks for a matching `.lrc` file with the same base name. |
| F1.4 | The folder handle is persisted in IndexedDB so the user can re-grant access on reload without re-picking. |

### 3.2 Playlist

| ID | Requirement |
|----|-------------|
| F2.1 | Display a flat, scrollable list of discovered songs (file name without extension). |
| F2.2 | Click a song to load and play it. |
| F2.3 | Highlight the currently playing song. |

### 3.3 Playback Controls

| ID | Requirement |
|----|-------------|
| F3.1 | Play / Pause toggle. |
| F3.2 | Next / Previous track. Wraps around at list boundaries. |
| F3.3 | Seek bar showing current position and total duration. User can click/drag to seek. |
| F3.4 | Volume slider with mute toggle. |
| F3.5 | When a track ends, auto-advance to next track. |

### 3.4 Lyric Display & Sync

| ID | Requirement |
|----|-------------|
| F4.1 | Parse standard LRC format: `[mm:ss.xx] text` lines. Ignore metadata tags (`[ti:]`, `[ar:]`, etc.). |
| F4.2 | Display lyrics in a vertically scrollable panel. |
| F4.3 | Highlight the currently active line based on playback time. |
| F4.4 | Auto-scroll smoothly to keep the active line centered ("follow mode"). |
| F4.5 | When no `.lrc` file exists, show a "No lyrics available" placeholder. |

### 3.5 Drag-to-Seek on Lyrics

| ID | Requirement |
|----|-------------|
| F5.1 | User can drag/scroll the lyric panel freely; doing so pauses follow mode temporarily. |
| F5.2 | While scrolled away, show a "Seek here" indicator on the line nearest to the panel center. |
| F5.3 | Clicking the indicator (or pressing Enter) seeks audio to that line's timestamp and resumes follow mode. |
| F5.4 | Follow mode auto-resumes after 3 seconds of inactivity if the user does not seek. |

### 3.6 Inline Lyric Editing

| ID | Requirement |
|----|-------------|
| F6.1 | Double-click a lyric line to enter edit mode for that line. |
| F6.2 | In edit mode, user can modify text content. |
| F6.3 | Support basic rich-text styling: **bold** and *italic* via toolbar buttons or keyboard shortcuts (Ctrl+B, Ctrl+I). |
| F6.4 | Styled text is stored in the LRC file using inline HTML-like tags: `<b>bold</b>`, `<i>italic</i>`. |
| F6.5 | On blur (click away or press Escape), changes are auto-saved: the full LRC content is written back to the original `.lrc` file via File System Access API. |
| F6.6 | If no `.lrc` file exists, editing is not available (no file to write to). |

### 3.7 Persistence

| ID | Requirement |
|----|-------------|
| F7.1 | Persist folder handle in IndexedDB. |
| F7.2 | Persist last played song index and playback position in localStorage. |
| F7.3 | On reload, prompt to re-grant folder access, then resume from last state. |

### 3.8 Keyboard Shortcuts

| Key | Context | Action |
|-----|---------|--------|
| Space | Normal playback | Play / Pause |
| ← / → | Normal playback | Seek backward / forward 5 seconds |
| Ctrl+← / Ctrl+→ | Normal playback | Previous / Next track |
| Ctrl+B | Inline lyric edit mode | Bold |
| Ctrl+I | Inline lyric edit mode | Italic |
| Enter | Stamp mode | Stamp focused line with current time; advance focus |
| G | Stamp mode | Insert gap line at focus, stamp it, advance |
| Ctrl+Z | Stamp mode | Undo last stamp |
| Ctrl+S | Stamp mode | Save (triggers save / overwrite flow) |
| Escape | Stamp mode | Exit stamp mode (prompts if unsaved changes exist) |
| Space | Stamp mode | Play / Pause (playback controls stay active) |

### 3.9 LRC Timestamping Mode

#### 3.9.1 Overview

A dedicated mode that lets the user create or re-create an `.lrc` file by pasting raw lyrics and tapping along in real time as the song plays. The mode is always accessible for any loaded song, regardless of whether an `.lrc` file already exists.

**UI surface:** The lyric panel transforms *in place* into the stamp editor (no modal). The rest of the app — player bar, playlist — remains visible and fully usable during stamping.

#### 3.9.2 Entry & Exit

| ID | Requirement |
|----|-------------|
| F9.1 | A "Stamp" button is always visible in the lyric panel header area. |
| F9.2 | Clicking "Stamp" enters stamp mode. The lyric panel transforms in place into the stamp editor (see §3.9.3). |
| F9.3 | If a `.lrc` file exists for the current song, its lines — text **and** existing timestamps — are pre-loaded as the starting content. |
| F9.4 | If no `.lrc` file exists, the editor starts with an empty textarea and a paste prompt. |
| F9.5 | The user can exit stamp mode at any time via the "Cancel" button or Escape. If unsaved stamps exist, a confirmation dialog asks whether to discard changes. |

#### 3.9.3 Prepare Phase (before stamping begins)

| ID | Requirement |
|----|-------------|
| F9.6 | In the prepare phase, the lyric panel shows a `<textarea>` pre-filled with the loaded content (one lyric line per text line, timestamps stripped from the display but preserved internally). |
| F9.7 | If the pasted text already contains LRC timestamp tags (`[mm:ss.xx]`), they are parsed and pre-filled as starting timestamps; the user does not need to re-stamp already-timed lines. |
| F9.8 | The user may freely edit, add, or delete lines in the textarea before starting. |
| F9.9 | A "Start Stamping" button transitions to the stamp phase. Playback begins (or resumes) from the current position. |

#### 3.9.4 Stamp Phase (active timestamping)

| ID | Requirement |
|----|-------------|
| F9.10 | Lines are displayed as a sequential list. The *focused* line — next to be stamped — is visually distinct (highlighted outline / background). |
| F9.11 | **Clicking the focused line** stamps it: records the current playback time as that line's timestamp, then automatically advances focus to the next unstamped line. |
| F9.12 | Pressing **Enter** is equivalent to clicking the focused line. |
| F9.13 | Clicking an **already-stamped line** re-stamps it with the current time, replacing the existing timestamp. Focus does not advance on re-stamp. |
| F9.14 | **Undo (Ctrl+Z):** removes the timestamp from the most recently stamped line and returns focus to that line. Sequential undos walk back through the full stamp history for the session. |
| F9.15 | **Gap / instrumental break:** a dedicated "**+ Gap**" button (also triggered by pressing **G**) inserts a blank-text line at the current focus position, immediately stamps it with the current playback time, then advances focus. This marks a silent section in the LRC output. |
| F9.16 | All standard playback controls (play/pause, seek bar, volume) remain fully functional during stamp mode. |
| F9.17 | Lines pre-loaded from an existing `.lrc` file are shown with a visual indicator (e.g. dimmer color) to distinguish them from newly-stamped lines in the current session. |
| F9.18 | When the song ends during stamp phase, playback pauses automatically. The user can seek backward, re-stamp, or save. |

#### 3.9.5 Focus Behavior on Seek

| ID | Requirement |
|----|-------------|
| F9.19 | When the user seeks during stamp mode, the focus cursor moves to the **first unstamped line whose predecessor's timestamp is ≤ the new playback time**. Existing stamps are **not** cleared by a seek. |

#### 3.9.6 Timestamp Validation

| ID | Requirement |
|----|-------------|
| F9.20 | **Monotonicity violation (illegal):** If a line's timestamp is *earlier* than its predecessor's, that line is flagged with a red outline as an illegal timestamp. |
| F9.21 | Saving is **blocked** while any illegal timestamps exist. The Save button is disabled and a message indicates how many violations remain. |
| F9.22 | **Beyond-duration (warning only):** If a line's timestamp exceeds the song's total duration, a yellow warning indicator is shown. This does **not** block saving — such lines are simply never reached during normal playback. |

#### 3.9.7 Save Flow

| ID | Requirement |
|----|-------------|
| F9.23 | The save flow triggers when the user clicks "Save" or presses Ctrl+S (song ending does **not** auto-save; it pauses and waits). |
| F9.24 | If illegal timestamps exist (see §3.9.6), saving is blocked. |
| F9.25 | If no `.lrc` file exists for the song, the app creates a new one in the same folder using the song's base name. |
| F9.26 | If a `.lrc` file **already exists**, a confirmation prompt is shown: *"A lyrics file already exists for this song. Overwrite it?"* with Overwrite / Cancel options. |
| F9.27 | On confirm, all lines are serialized to LRC format. Lines that were never stamped are written with a `[00:00.00]` placeholder timestamp. |
| F9.28 | After a successful save, stamp mode exits. The lyric panel returns to normal display mode showing the newly written lyrics in sync. |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NF1 | No backend or server. Entire app runs client-side. |
| NF2 | Minimal UI: clean, flat, monochrome-friendly. No heavy animations beyond lyric scroll. |
| NF3 | Bundle size < 500 KB gzipped (no large UI libraries). |
| NF4 | Startup to playback in < 2 seconds for a folder with ≤ 500 songs. |
| NF5 | Lyric scroll must feel smooth at 60 fps. |

---

## 5. LRC Format Specification (subset supported)

```
[00:12.34] This is a normal line
[00:15.00] This has <b>bold</b> and <i>italic</i> words
[00:18.50]
```

- Lines with no text are treated as instrumental breaks.
- Metadata lines (`[ti:...]`, `[ar:...]`, `[al:...]`, `[by:...]`) are preserved on save but not displayed.
- Multiple timestamps per line (compressed LRC) are expanded into separate entries.

---

## 6. Out of Scope

- Karaoke / word-level sync.
- Recursive folder scanning.
- Online lyric fetching.
- Album art display.
- Playlist reordering / custom playlists.
- Firefox / Safari support.
- Mobile layout.
- Multi-line simultaneous re-timing (each line is stamped individually in §3.9).

---

## 7. Component Architecture

```
App
├── FolderPicker              — grants folder access, triggers scan
├── Playlist                  — song list, click to play
├── PlayerBar                 — controls, seek bar, volume
├── LyricPanel                — normal display mode (follow, drag-to-seek, inline edit)
│   ├── LyricScroller         — scroll container, follow mode, drag-to-seek
│   ├── LyricLine             — renders one line, handles edit mode + styling
│   └── SeekIndicator         — "seek here" overlay when dragged
├── StampEditor               — stamp mode; replaces LyricPanel content in place
│   ├── PreparePane           — textarea for paste / edit before stamping starts
│   ├── StampList             — sequential line list during active stamping
│   ├── StampLine             — single line: text, timestamp badge, focus / stamped state
│   └── StampToolbar          — "Start Stamping", "+ Gap", "Undo", "Save", "Cancel"
└── hooks/
    ├── useAudio.ts           — HTMLAudioElement wrapper
    ├── useLyrics.ts          — LRC parse/serialize, active line tracking, edit+save
    ├── usePlaylist.ts        — scan folder, track list, current index, next/prev
    ├── usePersistedState.ts  — localStorage/IndexedDB helpers
    └── useStampSession.ts    — stamp session state: lines[], focusIndex, undo history stack
```

---

## 8. Milestones

| # | Name | Scope |
|---|------|-------|
| A | Scaffold + Folder | Vite project, FolderPicker, scan files, render Playlist |
| B | Playback | useAudio, PlayerBar (play/pause/next/prev/seek/volume) |
| C | Lyrics sync | LRC parser, useLyrics, LyricPanel with auto-scroll + highlight |
| D | Interactive lyrics | Drag-to-seek, inline edit, bold/italic, autosave to file |
| E | Persistence | IndexedDB folder handle, localStorage last track/position |
| F | Polish | Keyboard shortcuts, edge cases, minimal CSS pass |
| G | Stamp Mode | StampEditor (prepare + stamp phases), undo, gap lines, save flow |
| H | Playback Speed | Variable playback speed (0.5×–2×) for normal playback and stamp mode |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| File System Access API requires user gesture on every page load | Store handle in IndexedDB; prompt once on load with clear messaging |
| Writing to LRC file could corrupt data | Write full file atomically; keep one undo level in memory |
| Rich-text tags in LRC are non-standard | Use simple `<b>`/`<i>` tags that degrade gracefully in other players (shown as plain text) |
| Stamp session lost on accidental navigation or tab close | In stamp mode, register a `beforeunload` handler warning the user of unsaved changes |
| Pasted text contains malformed or mixed timestamp formats | On paste, sanitize: strip unrecognised bracket patterns, preserve only valid `[mm:ss.xx]` tags; display a warning count so the user knows what was dropped |

---

## 10. Known Issues

| ID | Area | Description | Status |
|----|------|-------------|--------|
| KI-1 | Lyric inline edit | **Double-click on active line triggers an unwanted seek.** The browser fires `click` before `dblclick`, so the first click of a double-click on the active line seeks to that line's timestamp before edit mode opens. A timer-based approach (delay single-click seek, cancel on dblclick) resolves the double-seek but introduces a noticeable 200 ms lag on every single click. Current workaround: single-click on the **active** line does nothing; single-click on any other line seeks immediately; double-click on the active line opens edit mode without seeking. A native solution requires the browser to expose a pre-dblclick hook, which is not available in the Web Platform. | Open — workaround in place |
| KI-2 | Persistence | **Playback position is not restored after page reload.** `lsSaveTrack` correctly persists the index and position to localStorage, and the value is read back on load. However the seek applied after `audioState.duration > 0` does not reliably take effect — the audio element either rejects the seek silently or the effect races with auto-play starting from 0. Multiple approaches tried (loadedmetadata listener, duration-watch effect, startPosition prop). Track (song index) restoration works correctly; only position is affected. | Open — skipped for now |

*Ready for review. Once approved, implementation begins with Milestone A.*