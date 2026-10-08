export interface ProcessJob {
  id: string;
  file: File;
  options: any; // We'll type this strictly in M4+ depending on the tool
}

export interface WorkerProtocol {
  processImage(job: ProcessJob): Promise<{ blob: Blob, dimensions: { width: number, height: number } }>;
}

export type WorkerMessage = 
  | { type: 'PROCESS_REQUEST'; id: string; payload: any }
  | { type: 'CANCEL_REQUEST'; id: string };

export type WorkerResponse = 
  | { type: 'PROCESS_SUCCESS'; id: string; payload: any }
  | { type: 'PROCESS_ERROR'; id: string; error: string }
  | { type: 'PROGRESS'; id: string; progress: number };
