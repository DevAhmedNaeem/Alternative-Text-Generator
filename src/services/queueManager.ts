import type { ImageItem, AppSettings } from '../types';
import { generateAltTextWithFailover } from './visionApi';
import { embedAltTextInImage } from './exifService';

export interface QueueCallbacks {
  onItemUpdate: (id: string, updates: Partial<ImageItem>) => void;
  onAllCompleted: (items: ImageItem[]) => void;
  onProgress: (current: number, total: number, message: string) => void;
}

export class BatchQueueManager {
  private items: ImageItem[] = [];
  private concurrency: number = 4;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private activeWorkers: number = 0;
  private queueIndices: number[] = [];
  private settings: AppSettings;
  private callbacks: QueueCallbacks;

  constructor(settings: AppSettings, callbacks: QueueCallbacks) {
    this.settings = settings;
    this.concurrency = settings.concurrency || 4;
    this.callbacks = callbacks;
  }

  public updateSettings(settings: AppSettings) {
    this.settings = settings;
    this.concurrency = settings.concurrency || 4;
  }

  /**
   * Start processing batch with independent concurrency
   */
  public start(items: ImageItem[]) {
    this.items = items;
    this.isRunning = true;
    this.isPaused = false;

    // Collect indices of items needing processing
    this.queueIndices = [];
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].status !== 'completed') {
        this.queueIndices.push(i);
        this.callbacks.onItemUpdate(this.items[i].id, {
          status: 'queued',
          progressMessage: 'Queued',
          error: undefined,
        });
      }
    }

    // Spawn concurrent independent worker loops
    const spawnCount = Math.min(this.concurrency, this.queueIndices.length);
    for (let w = 0; w < spawnCount; w++) {
      this.runWorker();
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    const needed = Math.min(this.concurrency - this.activeWorkers, this.queueIndices.length);
    for (let w = 0; w < needed; w++) {
      this.runWorker();
    }
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.queueIndices = [];
  }

  /**
   * Worker loop: picks next image independently
   */
  private async runWorker() {
    if (!this.isRunning || this.isPaused || this.queueIndices.length === 0) {
      return;
    }

    const index = this.queueIndices.shift();
    if (index === undefined || index >= this.items.length) {
      return;
    }

    const item = this.items[index];
    this.activeWorkers++;

    try {
      await this.processSingleImage(item);
    } catch (err) {
      console.error(`Unexpected worker error on item ${item.name}:`, err);
    } finally {
      this.activeWorkers--;
      this.checkCompletion();
      // Continue next item in queue
      this.runWorker();
    }
  }

  /**
   * Process a single image independently with multi-tier failover & 12s timeout
   */
  public async processSingleImage(item: ImageItem) {
    const total = this.items.length;
    const completedCount = this.items.filter((i) => i.status === 'completed').length;
    const currentPos = Math.min(completedCount + 1, total);

    // Initial Analyzing state
    this.callbacks.onProgress(currentPos, total, `Processing: ${item.name}`);
    this.callbacks.onItemUpdate(item.id, {
      status: 'analyzing',
      progressMessage: 'Analyzing (Primary Model)...',
      error: undefined,
    });

    try {
      // 1. Call Vision AI with automatic multi-tier fallback & 12s AbortController timeout
      const visionResult = await generateAltTextWithFailover(item.visionDataUrl || item.dataUrl, {
        apiKey: this.settings.apiKey,
        systemPrompt: this.settings.systemPrompt,
        onTierAttempt: (_tierNum, modelName, isRetry) => {
          this.callbacks.onItemUpdate(item.id, {
            status: isRetry ? 'retrying' : 'analyzing',
            progressMessage: isRetry ? `Retrying (${modelName})...` : `Analyzing (${modelName})...`,
            currentTierName: modelName,
          });
        },
      });

      // 2. Transition to Embedding EXIF
      this.callbacks.onItemUpdate(item.id, {
        status: 'embedding',
        altText: visionResult.altText,
        wordCount: visionResult.wordCount,
        rawResponse: visionResult.rawText,
        progressMessage: 'Embedding EXIF metadata...',
      });

      // 3. Inject EXIF metadata directly into binary blob
      const { blob: modifiedBlob, dataUrl: modifiedDataUrl, embeddedTags } = await embedAltTextInImage(
        item.file,
        item.dataUrl,
        visionResult.altText,
        item.type
      );

      // 4. Mark image as Ready (Completed)
      this.callbacks.onItemUpdate(item.id, {
        status: 'completed',
        progressMessage: 'Ready',
        processedBlob: modifiedBlob,
        processedDataUrl: modifiedDataUrl,
        embeddedTags,
        processingTimeMs: visionResult.executionTimeMs,
        currentTierName: visionResult.modelUsed,
      });
    } catch (err: any) {
      // Catch error locally for this image so it never crashes other concurrent images!
      console.error(`Independent processing error on ${item.name}:`, err);
      this.callbacks.onItemUpdate(item.id, {
        status: 'failed',
        error: err.message || 'Failed after trying all model tiers',
        progressMessage: 'Failed',
      });
    }
  }

  private checkCompletion() {
    const completed = this.items.filter((i) => i.status === 'completed').length;
    const failed = this.items.filter((i) => i.status === 'failed').length;
    const total = this.items.length;

    if (this.activeWorkers === 0 && (completed + failed >= total || this.queueIndices.length === 0)) {
      this.isRunning = false;
      this.callbacks.onProgress(total, total, `Finished processing ${completed} of ${total} images`);
      if (completed === total) {
        this.callbacks.onAllCompleted(this.items);
      }
    }
  }
}
