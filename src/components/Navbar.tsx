import React from 'react';
import { Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header
      className="glass-panel"
      style={{
        margin: '1.25rem auto 1.5rem',
        maxWidth: '1280px',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-brand)',
          }}
        >
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>AltVision</span>
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', fontWeight: 600 }}>
              Bulk AI Pro
            </span>
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Automated 6–8 Word Alt-Text Generator & Direct EXIF Metadata Embedder
          </p>
        </div>
      </div>
    </header>
  );
};
