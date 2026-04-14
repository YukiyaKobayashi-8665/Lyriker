import { useState, useEffect, useRef, useCallback } from 'react';
import type { Song } from '../types';

export type AudioState = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  error: string | null;
  playbackRate: number;
};

export function useAudio(song: Song | null, onEnded: () => void) {
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const objectUrlRef = useRef<string | null>(null);

  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    error: null,
    playbackRate: 1,
  });

  // Load new song whenever `song` changes
  useEffect(() => {
    const audio = audioRef.current;
    audio.pause();

    // Revoke previous object URL to free memory
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!song) {
      audio.src = '';
      setState(s => ({ ...s, isPlaying: false, currentTime: 0, duration: 0, error: null }));
      return;
    }

    let cancelled = false;
    song.file.getFile().then(file => {
      if (cancelled) return;
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      audio.src = url;
      audio.load();
      audio.play().catch(() => {/* user gesture may be needed */});
    });

    // Clear any previous error when loading a new song
    setState(s => ({ ...s, error: null }));

    return () => { cancelled = true; };
  }, [song]);

  // Wire up audio event listeners once
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () =>
      setState(s => ({ ...s, currentTime: audio.currentTime }));
    const onDurationChange = () =>
      setState(s => ({ ...s, duration: isFinite(audio.duration) ? audio.duration : 0 }));
    const onPlay = () => setState(s => ({ ...s, isPlaying: true }));
    const onPause = () => setState(s => ({ ...s, isPlaying: false }));
    const onVolumeChange = () =>
      setState(s => ({ ...s, volume: audio.volume, isMuted: audio.muted }));
    const handleEnded = () => {
      setState(s => ({ ...s, isPlaying: false, currentTime: 0 }));
      onEnded();
    };
    const onError = () => {
      const msg = audio.error ? `Playback error (code ${audio.error.code})` : 'Unsupported or unreadable audio file';
      setState(s => ({ ...s, isPlaying: false, error: msg }));
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('volumechange', onVolumeChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('volumechange', onVolumeChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', onError);
    };
  }, [onEnded]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (audio.paused) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(time, audio.duration || 0));
  }, []);

  const setVolume = useCallback((vol: number) => {
    audioRef.current.volume = Math.max(0, Math.min(1, vol));
  }, []);

  const toggleMute = useCallback(() => {
    audioRef.current.muted = !audioRef.current.muted;
  }, []);

  const setSpeed = useCallback((rate: number) => {
    const clamped = Math.max(0.25, Math.min(4, rate));
    audioRef.current.playbackRate = clamped;
    setState(s => ({ ...s, playbackRate: clamped }));
  }, []);

  return { state, togglePlay, seek, setVolume, toggleMute, setSpeed };
}
