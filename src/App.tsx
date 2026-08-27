import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { DropZone } from './components/DropZone';
import { ProgressBar } from './components/ProgressBar';
import { ActionBar } from './components/ActionBar';
import { ImageGrid } from './components/ImageGrid';
import type { ImageItem, ProcessingMetrics, AppSettings } from './types';
import { DEFAULT_API_KEY, REQUIRED_SYSTEM_PROMPT } from './services/visionApi';
import { fileToDataUrl, createOptimizedVisionBase64, generateId, countWords, sanitizeAltText } from './utils/fileHelpers';
import { BatchQueueManager } from './services/queueManager';
import { generateAndDownloadZip } from './services/zipService';
import { embedAltTextInImage } from './services/exifService';

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // App Settings with pure alt-text filename format (no brackets) and auto-failover
  const [settings] = useState<AppSettings>({
    apiKey: DEFAULT_API_KEY,
    concurrency: 4,
    systemPrompt: REQUIRED_SYSTEM_PROMPT,
    zipFilenameFormat: 'alt-text',
    targetTags: {
      imageDescription: true,
      userComment: true,
      xpComment: true,
      pngTextChunk: true,
    },
  });

  const queueManagerRef = useRef<BatchQueueManager | null>(null);
  const imagesRef = useRef<ImageItem[]>(images);
  imagesRef.current = images;

  // Timer effect for elapsed processing time
  useEffect(() => {
    let timer: any;
    if (isProcessing && !isPaused && startTime) {
      timer = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isProcessing, isPaused, startTime]);

  // Compute metrics
  const metrics: ProcessingMetrics = useMemo(() => {
    const total = images.length;
    const completed = images.filter((i) => i.status === 'completed').length;
    const processing = images.filter((i) => i.status === 'analyzing' || i.status === 'embedding').length;
    const failed = images.filter((i) => i.status === 'failed').length;
    const queued = images.filter((i) => i.status === 'queued' || i.status === 'idle').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      processing,
      queued,
      failed,
      percent,
      elapsedSeconds,
    };
  }, [images, elapsedSeconds]);

  // Item updater
  const handleItemUpdate = useCallback((id: string, updates: Partial<ImageItem>) => {
    setImages((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          return updated;
        }
        return item;
      })
    );
  }, []);

  // Handle all completed
  const handleAllCompleted = useCallback(() => {
    setIsProcessing(false);
    setIsPaused(false);
    setStatusMessage('All images processed successfully');

    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#a855f7', '#06b6d4', '#10b981'],
      });
    } catch {
      // Ignored if confetti fails
    }
  }, []);

  // Handle progress
  const handleProgress = useCallback((_current: number, _total: number, message: string) => {
    setStatusMessage(message);
  }, []);

  // Setup queue manager
  useEffect(() => {
    queueManagerRef.current = new BatchQueueManager(settings, {
      onItemUpdate: handleItemUpdate,
      onAllCompleted: handleAllCompleted,
      onProgress: handleProgress,
    });
  }, [settings, handleItemUpdate, handleAllCompleted, handleProgress]);

  // Add files to state with fast vision downscaling
  const handleFilesAdded = async (files: File[]) => {
    const newItems: ImageItem[] = [];

    for (const file of files) {
      try {
        const dataUrl = await fileToDataUrl(file);
        const visionDataUrl = await createOptimizedVisionBase64(dataUrl, 1024);
        newItems.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type || 'image/jpeg',
          dataUrl,
          visionDataUrl,
          status: 'idle',
          altText: '',
          wordCount: 0,
        });
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
    }
  };

  // Start Generation
  const handleStartGeneration = () => {
    if (images.length === 0 || !queueManagerRef.current) return;

    setImages((prev) =>
      prev.map((it) => (it.status !== 'completed' ? { ...it, status: 'queued', error: undefined } : it))
    );

    setIsProcessing(true);
    setIsPaused(false);
    setStartTime(Date.now());
    setElapsedSeconds(0);

    setTimeout(() => {
      if (queueManagerRef.current) {
        queueManagerRef.current.start(imagesRef.current);
      }
    }, 50);
  };

  // Pause
  const handlePause = () => {
    if (queueManagerRef.current) {
      queueManagerRef.current.pause();
      setIsPaused(true);
    }
  };

  // Resume
  const handleResume = () => {
    if (queueManagerRef.current) {
      queueManagerRef.current.resume();
      setIsPaused(false);
    }
  };

  // Retry failed
  const handleRetryFailed = () => {
    if (!queueManagerRef.current) return;

    setImages((prev) =>
      prev.map((it) => (it.status === 'failed' ? { ...it, status: 'queued', error: undefined } : it))
    );

    setIsProcessing(true);
    setIsPaused(false);

    setTimeout(() => {
      if (queueManagerRef.current) {
        queueManagerRef.current.start(imagesRef.current);
      }
    }, 50);
  };

  // Clear all
  const handleClearAll = () => {
    if (queueManagerRef.current) {
      queueManagerRef.current.stop();
    }
    setImages([]);
    setIsProcessing(false);
    setIsPaused(false);
    setStatusMessage('');
    setStartTime(null);
    setElapsedSeconds(0);
  };

  // Single Item manual retry: completely resets state and restarts fresh from Tier 1
  const handleRetrySingle = async (id: string) => {
    const item = images.find((i) => i.id === id);
    if (!item) return;

    // 1. Completely reset state for this specific image
    handleItemUpdate(id, {
      status: 'analyzing',
      progressMessage: 'Analyzing (Gemini 1.5 Flash)...',
      error: undefined,
      processingTimeMs: undefined,
      currentTierName: undefined,
      altText: '',
      wordCount: 0,
      rawResponse: undefined,
    });

    // 2. Restart queue execution fresh from Tier 1 for this image
    if (queueManagerRef.current) {
      queueManagerRef.current.processSingleImage({
        ...item,
        status: 'analyzing',
        error: undefined,
        processingTimeMs: undefined,
      });
    }
  };

  // Update alt text manually and re-embed EXIF
  const handleUpdateAltText = async (id: string, newText: string) => {
    const item = images.find((i) => i.id === id);
    if (!item) return;

    const cleanedText = sanitizeAltText(newText);
    const wordCount = countWords(cleanedText);
    handleItemUpdate(id, { altText: cleanedText, wordCount, progressMessage: 'Re-embedding EXIF...' });

    try {
      const { blob: modifiedBlob, dataUrl: modifiedDataUrl, embeddedTags } = await embedAltTextInImage(
        item.file,
        item.dataUrl,
        cleanedText,
        item.type
      );

      handleItemUpdate(id, {
        processedBlob: modifiedBlob,
        processedDataUrl: modifiedDataUrl,
        embeddedTags,
        progressMessage: 'EXIF Updated',
      });
    } catch (err: any) {
      console.error('Failed to re-embed EXIF:', err);
    }
  };

  // Remove single image
  const handleRemoveSingle = (id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  };

  // Download ZIP with pure Alt-Text filenames (no brackets)
  const handleDownloadZip = async () => {
    if (images.length === 0) return;
    setIsZipping(true);

    try {
      await generateAndDownloadZip(
        images,
        `alt_text_images_${Date.now()}.zip`,
        'alt-text'
      );
    } catch (err: any) {
      alert(`Error creating ZIP archive: ${err.message || err}`);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '0 1rem 3rem' }}>
      {/* Clean Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Bulk Drag-and-Drop Zone */}
        <DropZone onFilesAdded={handleFilesAdded} disabled={isProcessing} totalLoaded={images.length} />

        {/* Live Progress Bar */}
        <ProgressBar metrics={metrics} isProcessing={isProcessing} statusText={statusMessage} />

        {/* Action Controls & Single Download ZIP button */}
        <ActionBar
          metrics={metrics}
          isProcessing={isProcessing}
          isPaused={isPaused}
          hasImages={images.length > 0}
          onStart={handleStartGeneration}
          onPause={handlePause}
          onResume={handleResume}
          onRetryFailed={handleRetryFailed}
          onClear={handleClearAll}
          onDownloadZip={handleDownloadZip}
          isZipping={isZipping}
        />

        {/* Uploaded Images Grid */}
        <ImageGrid
          items={images}
          onUpdateAltText={handleUpdateAltText}
          onRetrySingle={handleRetrySingle}
          onRemove={handleRemoveSingle}
          disabled={isProcessing}
        />
      </main>
    </div>
  );
}
