import type { FC } from 'react';
import { useLang } from '../LangContext';

type Props = {
  onPick: () => void;
  folderName?: string;
};

const FolderPicker: FC<Props> = ({ onPick, folderName }) => {
  const { t } = useLang();
  return (
    <div className="folder-picker">
      <button className="folder-btn" onClick={onPick} title={t.openMusicFolder}>
        <span className="folder-icon">&#128193;</span>
        <span className="folder-label">{folderName ?? t.openFolder}</span>
      </button>
    </div>
  );
};

export default FolderPicker;
