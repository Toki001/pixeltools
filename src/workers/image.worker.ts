import { WorkerMessage, WorkerResponse } from './protocol';

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  
  if (msg.type === 'PROCESS_REQUEST') {
    try {
      const { file, options } = msg.payload;
      
      // Load image into an ImageBitmap
      const bitmap = await createImageBitmap(file);
      
      let finalWidth = options.width || (options.crop ? options.crop.width : bitmap.width);
      let finalHeight = options.height || (options.crop ? options.crop.height : bitmap.height);
      
      // Calculate rotation bounding box
      if (options.rotate) {
        const rad = (options.rotate * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        const newW = finalWidth * cos + finalHeight * sin;
        const newH = finalWidth * sin + finalHeight * cos;
        finalWidth = Math.round(newW);
        finalHeight = Math.round(newH);
      }

      // Create an OffscreenCanvas
      const canvas = new OffscreenCanvas(finalWidth, finalHeight);
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
        ctx.fillRect(0, 0, finalWidth, finalHeight);
      }

      // Apply transforms
      ctx.save();
      ctx.translate(finalWidth / 2, finalHeight / 2);
      
      if (options.rotate) {
        ctx.rotate((options.rotate * Math.PI) / 180);
      }
      
      const scaleX = options.flipHorizontal ? -1 : 1;
      const scaleY = options.flipVertical ? -1 : 1;
      ctx.scale(scaleX, scaleY);
      
      const originalW = options.width || (options.crop ? options.crop.width : bitmap.width);
      const originalH = options.height || (options.crop ? options.crop.height : bitmap.height);

      // Draw the image
      if (options.crop) {
        ctx.drawImage(bitmap, options.crop.x, options.crop.y, options.crop.width, options.crop.height, -originalW / 2, -originalH / 2, originalW, originalH);
      } else {
        ctx.drawImage(bitmap, -originalW / 2, -originalH / 2, originalW, originalH);
      }
      ctx.restore();

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
        payload: { blob, dimensions: { width: finalWidth, height: finalHeight } }
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
