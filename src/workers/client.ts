import { WorkerMessage, WorkerResponse } from './protocol';

export class ImageWorkerClient {
  private worker: Worker;
  private pendingJobs: Map<string, { resolve: (res: any) => void; reject: (err: any) => void }>;

  constructor() {
    this.worker = new Worker(new URL('./image.worker.ts', import.meta.url), { type: 'module' });
    this.pendingJobs = new Map();

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      const job = this.pendingJobs.get(msg.id);
      
      if (!job) return;

      if (msg.type === 'PROCESS_SUCCESS') {
        job.resolve(msg.payload);
        this.pendingJobs.delete(msg.id);
      } else if (msg.type === 'PROCESS_ERROR') {
        job.reject(new Error(msg.error));
        this.pendingJobs.delete(msg.id);
      }
    };
  }

  async process(payload: any): Promise<any> {
    const id = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      this.pendingJobs.set(id, { resolve, reject });
      const msg: WorkerMessage = { type: 'PROCESS_REQUEST', id, payload };
      this.worker.postMessage(msg);
    });
  }

  cancel(id: string) {
    if (this.pendingJobs.has(id)) {
      this.worker.postMessage({ type: 'CANCEL_REQUEST', id });
      this.pendingJobs.get(id)?.reject(new Error('Cancelled'));
      this.pendingJobs.delete(id);
    }
  }
  
  destroy() {
    this.worker.terminate();
    this.pendingJobs.clear();
  }
}
