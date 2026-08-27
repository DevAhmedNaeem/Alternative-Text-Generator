import React from 'react';
import { Play, Pause, RotateCcw, Trash2, DownloadCloud, Sparkles } from 'lucide-react';
import type { ProcessingMetrics } from '../types';

interface ActionBarProps {
  metrics: ProcessingMetrics;
  isProcessing: boolean;
  isPaused: boolean;
  hasImages: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onRetryFailed: () => void;
  onClear: () => void;
  onDownloadZip: () => void;
  isZipping?: boolean;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  metrics,
  isProcessing,
  isPaused,
  hasImages,
  onStart,
  onPause,
  onResume,
  onRetryFailed,
  onClear,
  onDownloadZip,
  isZipping,
}) => {
  if (!hasImages) return null;

  const { total, completed, failed } = metrics;
  const allCompleted = total > 0 && completed === total;
  const hasFailed = failed > 0;
  const hasUnprocessed = completed < total;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1rem 1.5rem',
        marginTop: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {/* Start / Pause / Resume controls */}
        {hasUnprocessed && !isProcessing && (
          <button onClick={onStart} className="btn-primary" id="btn-start-generation">
            <Play size={18} fill="currentColor" />
            <span>Generate Alt-Text ({total - completed} remaining)</span>
          </button>
        )}

        {isProcessing && !isPaused && (
          <button onClick={onPause} className="btn-secondary" id="btn-pause-generation">
            <Pause size={18} />
            <span>Pause</span>
          </button>
        )}

        {isProcessing && isPaused && (
          <button onClick={onResume} className="btn-primary" id="btn-resume-generation">
            <Play size={18} fill="currentColor" />
            <span>Resume</span>
          </button>
        )}

        {hasFailed && !isProcessing && (
          <button onClick={onRetryFailed} className="btn-secondary" style={{ color: '#f87171' }} id="btn-retry-failed">
            <RotateCcw size={16} />
            <span>Retry Failed ({failed})</span>
          </button>
        )}

        <button
          onClick={onClear}
          disabled={isProcessing}
          className="btn-secondary"
          style={{ opacity: isProcessing ? 0.4 : 1 }}
          id="btn-clear-images"
        >
          <Trash2 size={16} />
          <span>Clear All</span>
        </button>
      </div>

      {/* Prominent Single "Download ZIP" button - strictly appears once all images are successfully processed */}
      <div>
        {allCompleted && (
          <button
            onClick={onDownloadZip}
            disabled={isZipping}
            className="btn-download-zip"
            id="btn-download-zip"
          >
            {isZipping ? (
              <>
                <Sparkles size={20} className="animate-spin" />
                <span>Building ZIP Package...</span>
              </>
            ) : (
              <>
                <DownloadCloud size={22} />
                <span>Download ZIP ({total} Embedded Images)</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
