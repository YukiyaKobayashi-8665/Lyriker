import { useCallback, useEffect, useRef, useState } from 'react';
import { usePlaylist } from './hooks/usePlaylist';
import { useAudio } from './hooks/useAudio';
import { useLyrics } from './hooks/useLyrics';
import { useKeyboard } from './hooks/useKeyboard';
import FolderPicker from './components/FolderPicker';
import Playlist from './components/Playlist';
import PlayerBar from './components/PlayerBar';
import LyricPanel from './components/LyricPanel';
import StampEditor from './components/StampEditor';
import TranslationPanel from './components/TranslationPanel';
import { lsSaveTrack } from './utils/persist';
import { useLang } from './LangContext';
import { useLyriker } from './hooks/useLyriker';
import './App.css';

function App() {
  const { t, toggleLang } = useLang();
  const {
    songs, currentIndex, dirHandle,
    pickFolder, goNext, goPrev, selectSong,
    restoredPosition, isRestoring, clearRestoring,
    attachLrcHandle,
  } = usePlaylist();
  const currentSong = currentIndex >= 0 ? songs[currentIndex] : null;

  // ── Stamp mode ───────────────────────────────────────────
  const [stampMode, setStampMode] = useState(false);
  const stampModeRef = useRef(false);
  useEffect(() => { stampModeRef.current = stampMode; }, [stampMode]);

  // Close stamp mode when the song changes
  useEffect(() => { setStampMode(false); }, [currentIndex]);

  const onEnded = useCallback(() => {
    // In stamp mode, just let audio pause at end; do not advance to next track
    if (!stampModeRef.current) goNext();
  }, [goNext]);
  const { state: audioState, togglePlay, seek, setVolume, toggleMute, setSpeed } =
    useAudio(currentSong, onEnded);
  const { lines, activeIndex, hasLrc, updateLine } = useLyrics(currentSong, audioState.currentTime);

  // ── Lyriker sidecar (chunks, translations, notes) ────────────────────────
  // Wired here for M1.2+; destructure fields as milestones are built
  const lyriker = useLyriker(currentSong, dirHandle, lines);
  const { chunks, toggleChunk, isStale, dismissStale, translations, setTranslation, notes, setNotes } = lyriker;

  // ── Translation panel layout ─────────────────────────────
  const [translationOpen, setTranslationOpen] = useState(true);
  const [leftPct, setLeftPct] = useState(55);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const columnsRef = useRef<HTMLDivElement>(null);

  const handleSidebarSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = sidebarWidth;
    const onMouseMove = (ev: MouseEvent) => {
      const newW = Math.min(500, Math.max(150, startW + (ev.clientX - startX)));
      setSidebarWidth(newW);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startPct = leftPct;
    const containerWidth = columnsRef.current?.offsetWidth ?? 1;
    const onMouseMove = (ev: MouseEvent) => {
      const newPct = Math.min(80, Math.max(20, startPct + ((ev.clientX - startX) / containerWidth) * 100));
      setLeftPct(newPct);
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [leftPct]);

  // ── Keyboard shortcuts ───────────────────────────────────
  const editingLyricRef = useRef(false);
  const audioStateRef = useRef(audioState);
  useEffect(() => { audioStateRef.current = audioState; }, [audioState]);

  useKeyboard({
    togglePlay,
    seek,
    goPrev,
    goNext,
    getCurrentTime: () => audioStateRef.current.currentTime,
    getDuration: () => audioStateRef.current.duration,
    isEditingLyric: () => editingLyricRef.current || stampModeRef.current,
  });

  // ── Restoration seek ─────────────────────────────────────
  // Fire once when the restored song's duration first becomes known (metadata ready).
  // Using a ref so the effect fires only on the very first duration>0 event per restore.
  const seekAppliedRef = useRef(false);
  useEffect(() => {
    // Reset the flag whenever restoration starts for a new song
    seekAppliedRef.current = false;
  }, [currentIndex]);

  useEffect(() => {
    if (!isRestoring || seekAppliedRef.current) return;
    if (audioState.duration > 0 && restoredPosition > 0) {
      seekAppliedRef.current = true;
      seek(restoredPosition);
      clearRestoring();
    }
  }, [isRestoring, audioState.duration, restoredPosition, seek, clearRestoring]);

  // ── Save track + position ────────────────────────────────
  // Reset saved position to 0 only when the user (not restore) changes the track.
  const isRestoringRef = useRef(isRestoring);
  useEffect(() => { isRestoringRef.current = isRestoring; }, [isRestoring]);

  useEffect(() => {
    if (currentIndex >= 0 && !isRestoringRef.current) {
      lsSaveTrack(currentIndex, 0);
    }
  }, [currentIndex]);

  // ── Document title ─────────────────────────────────────
  useEffect(() => {
    document.title = currentSong ? `${currentSong.name} — Simp Player` : 'Simp Player';
  }, [currentSong]);

  // Persist current position every 5 s while playing
  useEffect(() => {
    if (currentIndex < 0) return;
    const id = setInterval(() => {
      lsSaveTrack(currentIndex, audioState.currentTime);
    }, 5000);
    return () => clearInterval(id);
  // audioState.currentTime intentionally omitted — captured via closure is fine for interval
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  return (
    <div className="app">
      {sidebarOpen ? (
        <aside className="sidebar" style={{ width: sidebarWidth }}>
          <FolderPicker onPick={pickFolder} folderName={dirHandle?.name} onHideSidebar={() => setSidebarOpen(false)} />
          <Playlist songs={songs} currentIndex={currentIndex} onSelect={selectSong} />
        </aside>
      ) : (
        <aside className="sidebar sidebar--folded">
          <button
            className="sidebar-fold-btn sidebar-fold-btn--show"
            onClick={() => setSidebarOpen(true)}
            title={t.showSidebar}
          >
            ›
          </button>
        </aside>
      )}
      {sidebarOpen && (
        <div className="sidebar-splitter" onMouseDown={handleSidebarSplitterMouseDown} />
      )}
      <main className="main">
        <div className="player-area">
          <div className="now-playing-row">
            <div className="now-playing">
              {currentSong ? currentSong.name : t.noTrack}
            </div>
            <button className="lang-toggle-btn" onClick={toggleLang}>{t.switchLang}</button>
          </div>
          <PlayerBar
            state={audioState}
            onTogglePlay={togglePlay}
            onPrev={goPrev}
            onNext={goNext}
            onSeek={seek}
            onSetVolume={setVolume}
            onToggleMute={toggleMute}
            onSetSpeed={setSpeed}
          />
          {audioState.error && (
            <p className="audio-error">{audioState.error}</p>
          )}
        </div>
        <div className="lyric-area">
          {stampMode && currentSong && dirHandle ? (
            <StampEditor
              song={currentSong}
              dirHandle={dirHandle}
              currentTime={audioState.currentTime}
              duration={audioState.duration}
              chunks={chunks}
              onClose={() => setStampMode(false)}
              onSaved={handle => {
                attachLrcHandle(currentIndex, handle);
                setStampMode(false);
              }}
              onToggleChunk={toggleChunk}
            />
          ) : currentSong ? (
            <div className="lyric-columns" ref={columnsRef}>
              <div
                className="lyric-column"
                style={translationOpen ? { flex: `0 0 ${leftPct}%` } : undefined}
              >
                {isStale && (
                  <div className="lrc-stale-banner">
                    <span>{t.lrcStaleWarning}</span>
                    <button className="lrc-stale-dismiss" onClick={dismissStale}>{t.lrcStaleDismiss} ×</button>
                  </div>
                )}
                <div className="lyric-header">
                  <button
                    className="stamp-open-btn"
                    onClick={() => setStampMode(true)}
                    title={t.openStampEditor}
                  >
                    {t.stampBtn}
                  </button>
                </div>
                <LyricPanel
                  lines={lines}
                  activeIndex={activeIndex}
                  hasLrc={hasLrc}
                  isPlaying={audioState.isPlaying}
                  chunks={chunks}
                  onSeek={seek}
                  updateLine={updateLine}
                  onEditingChange={editing => { editingLyricRef.current = editing; }}
                  onToggleChunk={toggleChunk}
                />
              </div>
              {translationOpen && (
                <div
                  className="lyric-splitter"
                  onMouseDown={handleSplitterMouseDown}
                />
              )}
              <TranslationPanel
                isOpen={translationOpen}
                onToggle={() => setTranslationOpen(o => !o)}
                chunks={chunks}
                translations={translations}
                notes={notes}
                activeIndex={activeIndex}
                lineCount={lines.length}
                lines={lines}
                onSetTranslation={setTranslation}
                onSetNotes={setNotes}
              />
            </div>
          ) : (
            <p className="lyric-placeholder">{t.selectSong}</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
