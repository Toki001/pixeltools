import { WorkerMessage, WorkerResponse } from './protocol';

// Basic worker setup
self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;
  
  if (msg.type === 'PROCESS_REQUEST') {
    try {
      // In M4+ we will parse payload, create ImageBitmap, OffscreenCanvas, etc.
      // For now, just return success with a mock or echo payload for tests
      const response: WorkerResponse = {
        type: 'PROCESS_SUCCESS',
        id: msg.id,
        payload: { processed: true }
      };
      self.postMessage(response);
    } catch (error: any) {
      self.postMessage({
        type: 'PROCESS_ERROR',
        id: msg.id,
        error: error.message || 'Unknown error'
      });
    }
  } else if (msg.type === 'CANCEL_REQUEST') {
    // Handle cancellation logic (e.g. interrupt loop)
    console.log(`Cancelled job ${msg.id}`);
  }
};
