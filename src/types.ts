export type Song = {
  name: string;
  file: FileSystemFileHandle;
  lrcHandle: FileSystemFileHandle | null;
};

export type LyricLine = {
  time: number; // seconds
  text: string; // may contain <b> and <i> tags
};
