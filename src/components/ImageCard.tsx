import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  RotateCw,
  Trash2,
  Sparkles,
  Edit3,
  Check,
  RefreshCw,
} from 'lucide-react';
import type { ImageItem } from '../types';
import { formatBytes, countWords, sanitizeAltText } from '../utils/fileHelpers';

interface ImageCardProps {
  item: ImageItem;
  onUpdateAltText: (id: string, newText: string) => void;
  onRetrySingle: (id: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  item,
  onUpdateAltText,
  onRetrySingle,
  onRemove,
  disabled,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.altText);

  const wordCount = countWords(isEditing ? editText : item.altText);
  const isExactWordRange = wordCount >= 6 && wordCount <= 8;

  const handleSaveEdit = () => {
    const cleaned = sanitizeAltText(editText);
    onUpdateAltText(item.id, cleaned);
    setEditText(cleaned);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditText(item.altText);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border:
          item.status === 'completed'
            ? '1px solid rgba(16, 185, 129, 0.25)'
            : item.status === 'failed'
            ? '1px solid rgba(244, 63, 94, 0.35)'
            : item.status === 'retrying'
            ? '1px solid rgba(245, 158, 11, 0.45)'
            : item.status === 'analyzing' || item.status === 'embedding'
            ? '1px solid rgba(99, 102, 241, 0.5)'
            : '1px solid var(--border-subtle)',
        background:
          item.status === 'completed'
            ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, rgba(15, 23, 42, 0.8) 100%)'
            : item.status === 'failed'
            ? 'linear-gradient(180deg, rgba(244, 63, 94, 0.06) 0%, rgba(15, 23, 42, 0.8) 100%)'
            : 'var(--bg-card)',
        position: 'relative',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {/* Top Image Preview & Badges */}
      <div style={{ position: 'relative', width: '100%', height: '175px', background: '#060911' }}>
        <img
          src={item.processedDataUrl || item.dataUrl}
          alt={item.altText || item.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '6px',
          }}
        />

        {/* Dynamic Status Badge Overlay */}
        <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
          {item.status === 'completed' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(16, 185, 129, 0.92)',
                color: '#ffffff',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <CheckCircle2 size={12} />
              <span>Ready</span>
            </div>
          )}

          {item.status === 'retrying' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(245, 158, 11, 0.95)',
                color: '#ffffff',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <RefreshCw size={12} style={{ animation: 'spin 1.2s linear infinite' }} />
              <span>{item.progressMessage || 'Retrying Fallback...'}</span>
            </div>
          )}

          {(item.status === 'analyzing' || item.status === 'embedding') && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(99, 102, 241, 0.95)',
                color: '#ffffff',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              <span>{item.progressMessage || 'Analyzing...'}</span>
            </div>
          )}

          {item.status === 'failed' && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(244, 63, 94, 0.92)',
                color: '#ffffff',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={12} />
              <span>Failed</span>
            </div>
          )}

          {(item.status === 'idle' || item.status === 'queued') && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'rgba(30, 41, 59, 0.85)',
                color: '#94a3b8',
                padding: '0.2rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 500,
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <Clock size={12} />
              <span>{item.status === 'queued' ? 'Queued' : 'Ready'}</span>
            </div>
          )}
        </div>

        {/* Remove button */}
        {!disabled && (
          <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
            <button
              onClick={() => onRemove(item.id)}
              title="Remove image"
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#94a3b8',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: '0.85rem 1rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.5rem' }}>
        {/* Filename & size */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <span
            title={item.name}
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#f8fafc',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '190px',
            }}
          >
            {item.name}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatBytes(item.size)}</span>
        </div>

        {/* Alt-Text Display / Edit / Status text */}
        {item.status === 'completed' ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} color="#a855f7" />
                <span>Alt Text:</span>
              </span>

              {/* Word count validator badge */}
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  background: isExactWordRange ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: isExactWordRange ? '#34d399' : '#fbbf24',
                  border: `1px solid ${isExactWordRange ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                }}
              >
                {wordCount} words {isExactWordRange ? '✓' : ''}
              </span>
            </div>

            {isEditing ? (
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid #6366f1',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '0.35rem 0.55rem',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary"
                  style={{ padding: '0.35rem 0.55rem', borderRadius: '6px' }}
                >
                  <Check size={13} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setEditText(item.altText);
                  setIsEditing(true);
                }}
                title="Click to edit alt-text"
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px dashed rgba(255, 255, 255, 0.12)',
                  borderRadius: '6px',
                  padding: '0.45rem 0.6rem',
                  fontSize: '0.82rem',
                  color: '#e2e8f0',
                  lineHeight: 1.4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '0.4rem',
                }}
              >
                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{item.altText}</span>
                <Edit3 size={11} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
              </div>
            )}
          </div>
        ) : item.status === 'failed' ? (
          <div
            style={{
              padding: '0.5rem 0.65rem',
              borderRadius: '6px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#fda4af', wordBreak: 'break-word', lineHeight: 1.3 }}>
              {item.error || 'Failed after trying all models'}
            </div>
            <div>
              <button
                onClick={() => onRetrySingle(item.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: 'rgba(244, 63, 94, 0.2)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.55rem',
                  borderRadius: '4px',
                }}
              >
                <RotateCw size={11} />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '0.55rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed rgba(255, 255, 255, 0.08)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            {item.progressMessage || (item.status === 'queued' ? 'In queue...' : 'Ready')}
          </div>
        )}
      </div>
    </div>
  );
};
