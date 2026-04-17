export type Song = {
  name: string;
  file: FileSystemFileHandle;
  lrcHandle: FileSystemFileHandle | null;
  lyrikerHandle: FileSystemFileHandle | null;
};

export type LyricLine = {
  time: number; // seconds
  text: string; // may contain <b> and <i> tags
};

export type LyrikerData = {
  lrcHash: string;
  chunks: number[];                     // sorted line indices of chunk starts
  translations: Record<string, string>; // key = chunk start line index
  notes: Record<string, string>;        // key = chunk start line index
};
