export interface ProcessJob {
  id: string;
  file: File | Blob;
  options: CompressOptions;
}

export interface CompressOptions {
  type: 'image/webp' | 'image/jpeg' | 'image/png';
  quality: number; // 0 to 1
  keepOriginalDimensions?: boolean;
  backgroundColor?: string;
  width?: number;
  height?: number;
}

export type WorkerMessage = 
  | { type: 'PROCESS_REQUEST'; id: string; payload: ProcessJob }
  | { type: 'CANCEL_REQUEST'; id: string };

export type WorkerResponse = 
  | { type: 'PROCESS_SUCCESS'; id: string; payload: { blob: Blob, dimensions: { width: number, height: number } } }
  | { type: 'PROCESS_ERROR'; id: string; error: string }
  | { type: 'PROGRESS'; id: string; progress: number };
