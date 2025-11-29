// Global definition for the loaded script
declare global {
  interface Window {
    SparkMD5: any;
    JSZip: any;
  }
}

export interface ProcessedFile {
  originalFile: File;
  originalHash: string;
  modifiedBlob: Blob | null;
  modifiedHash: string;
  fileName: string;
}

export interface CopywritingResponse {
  version1: string;
  version2: string;
  version3: string;
}

export enum AppState {
  IDLE,
  PROCESSING,
  DONE,
}