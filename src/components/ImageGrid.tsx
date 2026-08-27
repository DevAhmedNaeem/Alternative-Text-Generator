import React, { useState } from 'react';
import type { ImageItem } from '../types';
import { ImageCard } from './ImageCard';
import { LayoutGrid, Search, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface ImageGridProps {
  items: ImageItem[];
  onUpdateAltText: (id: string, newText: string) => void;
  onRetrySingle: (id: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  items,
  onUpdateAltText,
  onRetrySingle,
  onRemove,
  disabled,
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (items.length === 0) return null;

  const filteredItems = items.filter((item) => {
    // Status filter
    if (filter === 'completed' && item.status !== 'completed') return false;
    if (filter === 'failed' && item.status !== 'failed') return false;
    if (filter === 'pending' && (item.status === 'completed' || item.status === 'failed')) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchAlt = item.altText?.toLowerCase().includes(q);
      return matchName || matchAlt;
    }

    return true;
  });

  return (
    <div style={{ marginTop: '1.25rem' }}>
      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              background: filter === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: filter === 'all' ? '#818cf8' : 'var(--text-secondary)',
              border: `1px solid ${filter === 'all' ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <LayoutGrid size={13} />
            <span>All ({items.length})</span>
          </button>

          <button
            onClick={() => setFilter('completed')}
            style={{
              background: filter === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: filter === 'completed' ? '#34d399' : 'var(--text-secondary)',
              border: `1px solid ${filter === 'completed' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <CheckCircle2 size={13} />
            <span>Done ({items.filter((i) => i.status === 'completed').length})</span>
          </button>

          <button
            onClick={() => setFilter('pending')}
            style={{
              background: filter === 'pending' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: filter === 'pending' ? '#fbbf24' : 'var(--text-secondary)',
              border: `1px solid ${filter === 'pending' ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}`,
              borderRadius: '6px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Clock size={13} />
            <span>Pending ({items.filter((i) => i.status !== 'completed' && i.status !== 'failed').length})</span>
          </button>

          {items.some((i) => i.status === 'failed') && (
            <button
              onClick={() => setFilter('failed')}
              style={{
                background: filter === 'failed' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                color: filter === 'failed' ? '#fda4af' : 'var(--text-secondary)',
                border: `1px solid ${filter === 'failed' ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)'}`,
                borderRadius: '6px',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <AlertCircle size={13} />
              <span>Failed ({items.filter((i) => i.status === 'failed').length})</span>
            </button>
          )}
        </div>

        {/* Search filter input */}
        <div style={{ position: 'relative', minWidth: '200px' }}>
          <Search
            size={14}
            color="#64748b"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search images or alt text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.35rem 0.75rem 0.35rem 2rem',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: '1rem',
        }}
      >
        {filteredItems.map((item) => (
          <ImageCard
            key={item.id}
            item={item}
            onUpdateAltText={onUpdateAltText}
            onRetrySingle={onRetrySingle}
            onRemove={onRemove}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
};
