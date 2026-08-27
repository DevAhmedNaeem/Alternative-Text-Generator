export type ProcessStatus = 'idle' | 'queued' | 'analyzing' | 'retrying' | 'embedding' | 'completed' | 'failed';

export interface ExifTagInfo {
  tag: string;
  tagId: string;
  value: string;
  category: '0th / Image' | 'Exif' | 'PNG tEXt' | 'Other';
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // Base64 representation for preview and EXIF
  visionDataUrl?: string; // Downscaled lightweight base64 for fast API calls
  status: ProcessStatus;
  progressMessage?: string;
  currentTierName?: string;
  attemptCount?: number;
  error?: string;
  altText: string;
  rawResponse?: string;
  wordCount: number;
  processedBlob?: Blob; // Image blob with embedded EXIF
  processedDataUrl?: string;
  embeddedTags?: ExifTagInfo[];
  processingTimeMs?: number;
}

export interface ProcessingMetrics {
  total: number;
  completed: number;
  processing: number;
  queued: number;
  failed: number;
  percent: number;
  startTime?: number;
  elapsedSeconds: number;
}

export type ZipFilenameFormat = 'alt-text' | 'alt-text-paren' | 'original-and-alt' | 'original-only';

export interface ModelTier {
  id: string;
  tierNumber: number;
  model: string;
  displayName: string;
  endpoint: string;
}

export interface AppSettings {
  apiKey: string;
  concurrency: number;
  systemPrompt: string;
  zipFilenameFormat: ZipFilenameFormat;
  targetTags: {
    imageDescription: boolean;
    userComment: boolean;
    xpComment: boolean;
    pngTextChunk: boolean;
  };
}
