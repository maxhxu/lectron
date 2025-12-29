export interface LectureMetadata {
  title: string;
  author: string;
  mainfile: string;
  directory: string;
  packages: string[];
  files: [string, string][];
}