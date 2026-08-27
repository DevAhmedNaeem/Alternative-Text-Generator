import JSZip from 'jszip';
import type { ImageItem, ZipFilenameFormat } from '../types';
import { formatImageExportFilename } from '../utils/fileHelpers';

export interface ZipProgressCallback {
  (percent: number, currentFile: string): void;
}

/**
 * Creates a ZIP file containing all processed images with embedded EXIF/metadata
 * Supports formatting filename with the generated Alt-Text (e.g., '(Damaged white SUV loaded onto blue tow truck).jpg')
 */
export async function generateAndDownloadZip(
  items: ImageItem[],
  zipFilename: string = 'images_with_alt_text.zip',
  filenameFormat: ZipFilenameFormat = 'alt-text',
  onProgress?: ZipProgressCallback
): Promise<Blob> {
  const zip = new JSZip();

  // Track filename uniqueness to prevent overwriting duplicates
  const nameCounts = new Map<string, number>();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const blobToInclude = item.processedBlob || item.file;

    // Generate output filename with alt text format
    let targetFilename = formatImageExportFilename(item.altText, item.name, filenameFormat);

    if (nameCounts.has(targetFilename)) {
      const count = nameCounts.get(targetFilename)! + 1;
      nameCounts.set(targetFilename, count);
      const dotIdx = targetFilename.lastIndexOf('.');
      if (dotIdx > 0) {
        targetFilename = `${targetFilename.substring(0, dotIdx)} (${count})${targetFilename.substring(dotIdx)}`;
      } else {
        targetFilename = `${targetFilename} (${count})`;
      }
    } else {
      nameCounts.set(targetFilename, 1);
    }

    if (onProgress) {
      const pct = Math.round(((i + 1) / items.length) * 50);
      onProgress(pct, targetFilename);
    }

    zip.file(targetFilename, blobToInclude);
  }

  // Generate ZIP blob with compression
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
    },
    (metadata) => {
      if (onProgress) {
        const overallPct = 50 + Math.round(metadata.percent * 0.5);
        onProgress(overallPct, metadata.currentFile || 'Compressing...');
      }
    }
  );

  // Trigger download in browser
  downloadBlob(zipBlob, zipFilename);

  return zipBlob;
}

/**
 * Helper to download any Blob in the browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
