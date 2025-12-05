/**
 * Expected JSON format
 */
export interface LectureMetadata {
  title: string;
  author: string;
  mainfile: string;
  directory: string;
  packages: string[];
  files: string[];
}

interface ElectronAPI {
  openFile: () => Promise<string[] | null>;
  openFolder: () => Promise<string[] | null>;
  readJsonFile: (folderPath: string, fileName: string) => Promise<any | null>;
  generateAndWriteMainFile: (metadata: LectureMetadata, folderPath: string) => Promise<{ success: boolean, filePath?: string, error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};