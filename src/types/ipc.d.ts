/**
 * Expected JSON format
 */

interface ElectronAPI {
  getProjectDirectory(): unknown;
  setProjectDirectory: any;
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