import { WorkerMessage, WorkerResponse } from './protocol';

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  
  if (msg.type === 'PROCESS_REQUEST') {
    try {
      const { file, options } = msg.payload;
      
      // Load image into an ImageBitmap
      const bitmap = await createImageBitmap(file);
      const width = options.width || bitmap.width;
      const height = options.height || bitmap.height;

      // Create an OffscreenCanvas
      const canvas = new OffscreenCanvas(width, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get 2d context for OffscreenCanvas');
      }
      
      // High quality smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // If a background color is provided (e.g., when converting PNG to JPEG), fill it first
      if (options.backgroundColor) {
        ctx.fillStyle = options.backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }

      // Draw the image
      ctx.drawImage(bitmap, 0, 0, width, height);

      // Re-encode
      const blob = await canvas.convertToBlob({
        type: options.type,
        quality: options.quality
      });
      
      // Release bitmap memory
      bitmap.close();

      const response: WorkerResponse = {
        type: 'PROCESS_SUCCESS',
        id: msg.id,
        payload: { blob, dimensions: { width, height } }
      };
      
      self.postMessage(response);
    } catch (error: unknown) {
      self.postMessage({
        type: 'PROCESS_ERROR',
        id: msg.id,
        error: error instanceof Error ? error.message : 'Unknown processing error'
      });
    }
  } else if (msg.type === 'CANCEL_REQUEST') {
    console.log(`Cancelled job ${msg.id}`);
  }
};
