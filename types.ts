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
  modifiedBlob: Blob;
  modifiedHash: string;
  fileName: string;
}

export enum AppState {
  IDLE,
  PROCESSING,
  DONE,
}