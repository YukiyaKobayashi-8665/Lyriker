import { useEffect } from 'react';

type Handlers = {
  togglePlay: () => void;
  seek: (t: number) => void;
  goPrev: () => void;
  goNext: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isEditingLyric: () => boolean;
};

export function useKeyboard({
  togglePlay, seek, goPrev, goNext,
  getCurrentTime, getDuration, isEditingLyric,
}: Handlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Never fire shortcuts when the user is typing in a lyric editor or input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.target as HTMLElement).isContentEditable) return;
      if (isEditingLyric()) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
        return;
      }

      if (e.key === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        goPrev();
        return;
      }

      if (e.key === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        goNext();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, getCurrentTime() - 5));
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(getDuration(), getCurrentTime() + 5));
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [togglePlay, seek, goPrev, goNext, getCurrentTime, getDuration, isEditingLyric]);
}
