export type SupportedMimeType = "image/jpeg" | "image/png" | "image/webp";

export interface ImageMetadata {
  width: number;
  height: number;
  mimeType: string;
  sizeBytes: number;
  filename: string;
}

export interface ProcessingResult {
  blob: Blob;
  mimeType: string;
  filename: string;
  sizeBytes: number;
  width: number;
  height: number;
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

export class ImageProcessingError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "ImageProcessingError";
  }
}

export interface WorkerMessage<T = unknown> {
  id: string;
  type: "process" | "cancel";
  payload?: T;
}

export interface WorkerResponse<T = unknown> {
  id: string;
  type: "success" | "error" | "progress";
  payload?: T;
  error?: string;
  progress?: number;
}
