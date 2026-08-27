import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, FolderPlus, FileCheck } from 'lucide-react';
import { getPresetSampleImages } from '../utils/sampleData';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
  totalLoaded: number;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, disabled, totalLoaded }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const validFiles: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
          validFiles.push(file);
        }
      }
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = Array.from(e.target.files).filter(
        (f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(f.name)
      );
      onFilesAdded(validFiles);
      // Reset input value so same files can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleLoadSamples = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoadingSamples(true);
    try {
      const samples = await getPresetSampleImages();
      onFilesAdded(samples.map((s) => s.file));
    } catch (err) {
      console.error('Failed loading sample images:', err);
    } finally {
      setIsLoadingSamples(false);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      style={{
        border: `2px dashed ${isDragOver ? '#6366f1' : 'rgba(255, 255, 255, 0.15)'}`,
        borderRadius: 'var(--radius-xl)',
        background: isDragOver
          ? 'rgba(99, 102, 241, 0.08)'
          : 'linear-gradient(180deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.6) 100%)',
        padding: '2.5rem 1.5rem',
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.25s ease',
        transform: isDragOver ? 'scale(1.008)' : 'scale(1)',
        boxShadow: isDragOver ? 'var(--glow-brand)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/jpg"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        disabled={disabled}
      />

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: isDragOver ? 'var(--gradient-brand)' : 'rgba(99, 102, 241, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDragOver ? '#ffffff' : '#818cf8',
            transition: 'all 0.3s ease',
          }}
        >
          {isDragOver ? <FolderPlus size={32} /> : <UploadCloud size={32} />}
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            {isDragOver ? 'Drop your images here' : 'Drag & Drop your images in bulk'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto' }}>
            Supports <span style={{ color: '#f8fafc', fontWeight: 500 }}>JPEG, JPG, PNG, WEBP</span>. Alt-text is
            automatically embedded straight into the image EXIF tags.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.25rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={disabled}
            style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
          >
            <ImageIcon size={18} />
            <span>Browse Files</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleLoadSamples}
            disabled={disabled || isLoadingSamples}
            style={{ padding: '0.65rem 1.2rem', fontSize: '0.9rem' }}
          >
            <Sparkles size={16} color="#fbbf24" />
            <span>{isLoadingSamples ? 'Loading...' : 'Load Sample Test Images'}</span>
          </button>
        </div>

        {totalLoaded > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.5rem',
              padding: '0.3rem 0.85rem',
              borderRadius: '999px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            <FileCheck size={15} />
            <span>{totalLoaded} {totalLoaded === 1 ? 'image' : 'images'} loaded</span>
          </div>
        )}
      </div>
    </div>
  );
};
