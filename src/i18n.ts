export type Lang = 'en' | 'zh';

export type T = {
  switchLang: string;
  // FolderPicker
  openFolder: string;
  openMusicFolder: string;
  showSidebar: string;
  hideSidebar: string;
  // Playlist
  noSongs: string;
  openFolderToBegin: string;
  lyricsAvailable: string;
  // LyricLine
  clickToSeek: string;
  // LyricPanel
  noLyrics: string;
  addLrcHint: string;
  lyricsEmpty: string;
  follow: string;
  resumeAutoScroll: string;
  // PlayerBar
  prevBtn: string;
  playPause: string;
  nextBtn: string;
  seekLabel: string;
  unmute: string;
  mute: string;
  volume: string;
  speedBtn: (r: number) => string;
  // App
  noTrack: string;
  stampBtn: string;
  openStampEditor: string;
  selectSong: string;
  overwriteConfirm: (name: string) => string;
  saveFailed: string;
  // StampEditor
  illegalTimestamp: string;
  beyondDuration: string;
  instrumental: string;
  discardConfirm: string;
  stampLyricsTitle: string;
  startStamping: string;
  cancel: string;
  prepareHint1: string;
  prepareHint2: string;
  pastePlaceholder: string;
  stampStatus: (stamped: number, total: number) => string;
  illegalBadge: (n: number) => string;
  undo: string;
  undoTitle: string;
  save: string;
  saving: string;
  fixIllegal: (n: number) => string;
  saveTitle: string;
  stampHintClick: string;
  stampHintEnter: string;
  stampHintC: string;
  stampHintUndo: string;
  stampHintSave: string;
  usePlaybar: string;
  allStamped: string;
  // Chunk boundaries
  addChunkBoundary: string;
  removeChunkBoundary: string;
  // LRC staleness warning
  lrcStaleWarning: string;
  lrcStaleDismiss: string;
  // Translation panel
  translation: string;
  showTranslation: string;
  hideTranslation: string;
  noTranslation: string;
  // Notes panel
  notes: string;
  showNotes: string;
  hideNotes: string;
  noNotes: string;
};

export const translations: Record<Lang, T> = {
  en: {
    switchLang: '中文',
    openFolder: 'Open Folder',
    openMusicFolder: 'Open music folder',
    showSidebar: 'Show sidebar',
    hideSidebar: 'Hide sidebar',
    noSongs: 'No songs found.',
    openFolderToBegin: 'Open a folder to begin.',
    lyricsAvailable: 'Lyrics available',
    clickToSeek: 'Click to seek  ·  Double-click to edit',
    noLyrics: 'No lyrics available',
    addLrcHint: 'Add a .lrc file with the same name as the audio file',
    lyricsEmpty: 'Lyrics file is empty or could not be parsed',
    follow: '↩ Follow',
    resumeAutoScroll: 'Resume auto-scroll',
    prevBtn: 'Previous (Ctrl+←)',
    playPause: 'Play/Pause (Space)',
    nextBtn: 'Next (Ctrl+→)',
    seekLabel: 'Seek',
    unmute: 'Unmute',
    mute: 'Mute',
    volume: 'Volume',
    speedBtn: (r) => `${r}× speed`,
    noTrack: 'No track selected',
    stampBtn: '✏ Stamp',
    openStampEditor: 'Open stamp editor',
    selectSong: 'Select a song to begin',
    overwriteConfirm: (name) => `Overwrite existing lyrics file "${name}"?`,
    saveFailed: 'Failed to save lyrics file. Make sure the folder is still accessible.',
    illegalTimestamp: 'Timestamp is earlier than the previous line',
    beyondDuration: 'Timestamp exceeds song duration',
    instrumental: '[ instrumental ]',
    discardConfirm: 'Discard unsaved changes and exit stamp mode?',
    stampLyricsTitle: '✏ Stamp Lyrics',
    startStamping: '▶ Start Stamping',
    cancel: 'Cancel',
    prepareHint1: 'Paste or edit lyrics below — one line per row.',
    prepareHint2: 'Lines starting with [mm:ss.xx] will be pre-stamped.',
    pastePlaceholder: 'Paste lyrics here…',
    stampStatus: (s, t) => `${s} / ${t} stamped`,
    illegalBadge: (n) => `· ${n} illegal`,
    undo: '↩ Undo',
    undoTitle: 'Undo last stamp (Ctrl+Z)',
    save: '💾 Save',
    saving: 'Saving…',
    fixIllegal: (n) => `Fix ${n} illegal timestamp(s) before saving`,
    saveTitle: 'Save (Ctrl+S)',
    stampHintClick: 'Click = stamp any line',
    stampHintEnter: '= stamp focused',
    stampHintC: '= toggle chunk boundary',
    stampHintUndo: '= undo',
    stampHintSave: '= save',
    usePlaybar: 'Use playbar to control playback',
    allStamped: 'All lines stamped — press Ctrl+S or click Save',
    addChunkBoundary: 'Mark as chunk start',
    removeChunkBoundary: 'Remove chunk boundary',
    lrcStaleWarning: 'LRC file has been modified. Chunk boundaries may be misaligned.',
    lrcStaleDismiss: 'Dismiss',
    translation: 'Translation',
    showTranslation: 'Show translation panel',
    hideTranslation: 'Hide translation panel',
    noTranslation: 'No translation yet. Double-click a chunk to add one.',
    notes: 'Notes',
    showNotes: 'Show notes',
    hideNotes: 'Hide notes',
    noNotes: 'No notes for this chunk. Double-click to add.',
  },
  zh: {
    switchLang: 'English',
    openFolder: '打开文件夹',
    openMusicFolder: '打开音乐文件夹',
    showSidebar: '显示侧栏',
    hideSidebar: '隐藏侧栏',
    noSongs: '未找到歌曲',
    openFolderToBegin: '请先打开一个文件夹',
    lyricsAvailable: '歌词可用',
    clickToSeek: '单击跳转 · 双击编辑',
    noLyrics: '暂无歌词',
    addLrcHint: '请添加与音频同名的 .lrc 文件',
    lyricsEmpty: '歌词文件为空或无法解析',
    follow: '↩ 跟随',
    resumeAutoScroll: '恢复自动滚动',
    prevBtn: '上一首 (Ctrl+←)',
    playPause: '播放/暂停 (空格)',
    nextBtn: '下一首 (Ctrl+→)',
    seekLabel: '进度',
    unmute: '取消静音',
    mute: '静音',
    volume: '音量',
    speedBtn: (r) => `${r}× 速度`,
    noTrack: '未选择曲目',
    stampBtn: '✏ 打轴',
    openStampEditor: '打开打轴编辑器',
    selectSong: '请选择一首歌曲',
    overwriteConfirm: (name) => `确定要覆盖已有的歌词文件"${name}"？`,
    saveFailed: '保存歌词文件失败，请确认文件夹仍可访问。',
    illegalTimestamp: '时间戳早于上一行',
    beyondDuration: '时间戳超出歌曲时长',
    instrumental: '[ 纯音乐 ]',
    discardConfirm: '放弃未保存的修改并退出打轴模式？',
    stampLyricsTitle: '✏ 打轴',
    startStamping: '▶ 开始打轴',
    cancel: '取消',
    prepareHint1: '在下方粘贴或编辑歌词，每行一句。',
    prepareHint2: '以 [mm:ss.xx] 开头的行将自动预填时间戳。',
    pastePlaceholder: '在此粘贴歌词…',
    stampStatus: (s, total) => `已打 ${s} / ${total} 行`,
    illegalBadge: (n) => `· ${n} 个非法`,
    undo: '↩ 撤销',
    undoTitle: '撤销上一个时间戳 (Ctrl+Z)',
    save: '💾 保存',
    saving: '保存中…',
    fixIllegal: (n) => `请先修正 ${n} 个非法时间戳`,
    saveTitle: '保存 (Ctrl+S)',
    stampHintClick: '单击 = 给任意行打轴',
    stampHintEnter: '= 给焦点行打轴',
    stampHintC: '= 切换段落分界',
    stampHintUndo: '= 撤销',
    stampHintSave: '= 保存',
    usePlaybar: '播放进度由进度条控制',
    allStamped: '所有行已打轴 — 按 Ctrl+S 或点击保存',
    addChunkBoundary: '设为段落开头',
    removeChunkBoundary: '取消段落分界',
    lrcStaleWarning: 'LRC 文件已被修改，段落分界可能错位。',
    lrcStaleDismiss: '忽略',
    translation: '翻译',
    showTranslation: '显示翻译面板',
    hideTranslation: '隐藏翻译面板',
    noTranslation: '还没有翻译。双击段落可添加。',
    notes: '笔记',
    showNotes: '显示笔记',
    hideNotes: '隐藏笔记',
    noNotes: '本段暂无笔记。双击可添加。',
  },
};
