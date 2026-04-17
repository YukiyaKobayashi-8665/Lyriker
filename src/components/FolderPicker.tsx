import type { FC } from 'react';
import { useLang } from '../LangContext';

type Props = {
  onPick: () => void;
  folderName?: string;
  onHideSidebar: () => void;
};

const FolderPicker: FC<Props> = ({ onPick, folderName, onHideSidebar }) => {
  const { t } = useLang();
  return (
    <div className="folder-picker">
      <button className="folder-btn" onClick={onPick} title={t.openMusicFolder}>
        <span className="folder-icon">&#128193;</span>
        <span className="folder-label">{folderName ?? t.openFolder}</span>
      </button>
      <button
        className="sidebar-fold-btn"
        onClick={onHideSidebar}
        title={t.hideSidebar}
      >
        ‹
      </button>
    </div>
  );
};

export default FolderPicker;
