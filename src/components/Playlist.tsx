import { useRef, useEffect, type FC } from 'react';
import type { Song } from '../types';
import { useLang } from '../LangContext';

type Props = {
  songs: Song[];
  currentIndex: number;
  onSelect: (i: number) => void;
};

const Playlist: FC<Props> = ({ songs, currentIndex, onSelect }) => {
  const { t } = useLang();
  const activeRef = useRef<HTMLLIElement>(null);

  // Scroll active item into view whenever currentIndex changes
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentIndex]);

  if (songs.length === 0) {
    return <p className="playlist-empty">{t.noSongs}<br />{t.openFolderToBegin}</p>;
  }

  return (
    <ul className="playlist">
      {songs.map((song, i) => (
        <li
          key={song.name}
          ref={i === currentIndex ? activeRef : null}
          className={`playlist-item${i === currentIndex ? ' active' : ''}`}
          onClick={() => onSelect(i)}
          title={song.name}
        >
          <span className="track-num">{i + 1}</span>
          <span className="track-name">{song.name}</span>
          {song.lrcHandle && <span className="lrc-badge" title={t.lyricsAvailable}>♪</span>}
        </li>
      ))}
    </ul>
  );
};

export default Playlist;
