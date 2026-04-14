import type { FC } from 'react';
import type { LyricLine } from '../types';
import LyricLineComponent from './LyricLine';

type Props = {
  lines: LyricLine[];
  activeIndex: number;
  nearestIndex: number;
  followMode: boolean;
  editingIndex: number;
  onSeek: (time: number) => void;
  onStartEdit: (index: number) => void;
  onSave: (index: number, text: string) => void;
};

const LyricList: FC<Props> = ({
  lines, activeIndex, nearestIndex, followMode, editingIndex,
  onSeek, onStartEdit, onSave,
}) => (
  <ul className="lyric-list">
    {lines.map((line, i) => (
      <LyricLineComponent
        key={i}
        line={line}
        index={i}
        isActive={i === activeIndex}
        isNearest={!followMode && i === nearestIndex}
        isEditing={i === editingIndex}
        onSeek={onSeek}
        onStartEdit={onStartEdit}
        onSave={onSave}
      />
    ))}
  </ul>
);

export default LyricList;
