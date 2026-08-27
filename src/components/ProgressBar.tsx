import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import type { ProcessingMetrics } from '../types';

interface ProgressBarProps {
  metrics: ProcessingMetrics;
  isProcessing: boolean;
  statusText?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ metrics, isProcessing, statusText }) => {
  const { total, completed, processing, failed, percent, elapsedSeconds } = metrics;

  if (total === 0) return null;

  // Format progress message strictly following requirements: "Processing 3 of 10 images..."
  const currentStep = Math.min(completed + processing, total);
  const displayProgressText =
    isProcessing
      ? `Processing ${currentStep} of ${total} images...`
      : completed === total
      ? `All ${total} images successfully processed!`
      : `${completed} of ${total} images processed`;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem 1.5rem',
        marginTop: '1.25rem',
        border: isProcessing ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-subtle)',
        boxShadow: isProcessing ? '0 0 20px rgba(99, 102, 241, 0.15)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isProcessing ? (
            <Loader2 size={20} className="animate-spin" color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
          ) : completed === total ? (
            <CheckCircle2 size={20} color="#10b981" />
          ) : failed > 0 ? (
            <AlertCircle size={20} color="#f59e0b" />
          ) : (
            <Clock size={20} color="#94a3b8" />
          )}
          <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {displayProgressText}
          </span>
          {statusText && isProcessing && (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
              ({statusText})
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {elapsedSeconds > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Elapsed: {elapsedSeconds}s
            </span>
          )}
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'Outfit, sans-serif' }}>
            {percent}%
          </span>
        </div>
      </div>

      {/* Progress track */}
      <div
        style={{
          width: '100%',
          height: '10px',
          borderRadius: '999px',
          background: 'rgba(255, 255, 255, 0.07)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          className={isProcessing ? 'animate-shimmer' : ''}
          style={{
            height: '100%',
            width: `${percent}%`,
            background:
              completed === total
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #06b6d4 100%)',
            borderRadius: '999px',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* Metric breakdown badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginTop: '0.85rem',
          fontSize: '0.8rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>
          Total: <strong style={{ color: '#ffffff' }}>{total}</strong>
        </span>
        <span style={{ color: '#34d399' }}>
          ✓ Completed: <strong>{completed}</strong>
        </span>
        {processing > 0 && (
          <span style={{ color: '#818cf8' }}>
            ⚡ In-Flight: <strong>{processing}</strong>
          </span>
        )}
        {metrics.queued > 0 && (
          <span style={{ color: '#94a3b8' }}>
            ⏳ Queued: <strong>{metrics.queued}</strong>
          </span>
        )}
        {failed > 0 && (
          <span style={{ color: '#f43f5e' }}>
            ✕ Failed: <strong>{failed}</strong>
          </span>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
