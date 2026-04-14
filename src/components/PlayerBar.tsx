import { useRef, useCallback, useState, type FC } from 'react';
import type { AudioState } from '../hooks/useAudio';
import { useLang } from '../LangContext';

type Props = {
  state: AudioState;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (t: number) => void;
  onSetVolume: (v: number) => void;
  onToggleMute: () => void;
  onSetSpeed: (r: number) => void;
};

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PlayerBar: FC<Props> = ({
  state,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onSetVolume,
  onToggleMute,
  onSetSpeed,
}) => {
  const { t } = useLang();
  const { isPlaying, currentTime, duration, volume, isMuted, playbackRate } = state;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isDragging = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const ratioFromEvent = useCallback((clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const seekFromEvent = useCallback((clientX: number) => {
    const ratio = ratioFromEvent(clientX);
    if (ratio === null || duration <= 0) return;
    onSeek(ratio * duration);
  }, [duration, onSeek, ratioFromEvent]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (duration <= 0) return;
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(ratio * duration);
    setHoverX(e.clientX - rect.left);
  }, [duration]);

  const handleMouseLeave = useCallback(() => setHoverTime(null), []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    seekFromEvent(e.clientX);
    const onMove = (ev: MouseEvent) => { if (isDragging.current) seekFromEvent(ev.clientX); };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [seekFromEvent]);

  return (
    <div className="player-bar">
      {/* Controls row */}
      <div className="controls">
        <button className="ctrl-btn" onClick={onPrev} title={t.prevBtn}>
          &#9664;&#9664;
        </button>
        <button className="ctrl-btn play-btn" onClick={onTogglePlay} title={t.playPause}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn" onClick={onNext} title={t.nextBtn}>
          &#9654;&#9654;
        </button>
        <div className="speed-btns">
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map(r => (
            <button
              key={r}
              className={`speed-btn${playbackRate === r ? ' speed-active' : ''}`}
              onClick={() => onSetSpeed(r)}
              title={t.speedBtn(r)}
            >
              {r === 1 ? '1×' : `${r}×`}
            </button>
          ))}
        </div>
      </div>

      {/* Seek bar */}
      <div className="seek-row">
        <span className="time-label">{fmt(currentTime)}</span>
        <div
          ref={trackRef}
          className="seek-track"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          title={t.seekLabel}
        >
          <div className="seek-fill" style={{ width: `${progress}%` }} />
          <div className="seek-thumb" style={{ left: `${progress}%` }} />
          {hoverTime !== null && (
            <div className="seek-tooltip" style={{ left: hoverX }}>
              {fmt(hoverTime)}
            </div>
          )}
        </div>
        <span className="time-label">{fmt(duration)}</span>
      </div>

      {/* Volume row */}
      <div className="volume-row">
        <button
          className="ctrl-btn mute-btn"
          onClick={onToggleMute}
          title={isMuted ? t.unmute : t.mute}
        >
          {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
        </button>
        <input
          className="volume-slider"
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isMuted ? 0 : volume}
          onChange={e => onSetVolume(parseFloat(e.target.value))}
          title={t.volume}
        />
      </div>
    </div>
  );
};

export default PlayerBar;
