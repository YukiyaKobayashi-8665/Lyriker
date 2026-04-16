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
  const { chunks, toggleChunk, isStale, dismissStale } = lyriker;

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
      <aside className="sidebar">
        <FolderPicker onPick={pickFolder} folderName={dirHandle?.name} />
        <Playlist songs={songs} currentIndex={currentIndex} onSelect={selectSong} />
      </aside>
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
            <>
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
                chunks={chunks}
                onSeek={seek}
                updateLine={updateLine}
                onEditingChange={editing => { editingLyricRef.current = editing; }}
                onToggleChunk={toggleChunk}
              />
            </>
          ) : (
            <p className="lyric-placeholder">{t.selectSong}</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
