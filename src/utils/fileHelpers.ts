import type { ZipFilenameFormat } from '../types';

/**
 * Convert a File object to a Base64 Data URL string
 */
export async function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as base64 string'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('FileReader error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Downscale image client-side to maximum 640x640 for lightning-fast network transmission
 * Drastically cuts base64 payload size (from ~5MB down to ~30KB) for instant API response.
 */
export async function createOptimizedVisionBase64(dataUrl: string, maxDimension: number = 640): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      // Smooth bicubic downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Convert Data URL to Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const byteString = atob(arr[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mime });
}

/**
 * Format bytes to readable string (e.g. 1.2 MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Count words in a string accurately
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Clean and sanitize raw AI response to pure alt-text.
 * Strips <think>...</think>, <thought>...</thought>, reasoning blocks,
 * markdown backticks, bold/italics, quotes, prefixes, and trailing punctuation.
 */
export function sanitizeAltText(raw: string): string {
  if (!raw) return '';
  let cleaned = raw.trim();

  // 1. Strip complete thinking / reasoning blocks (<think>...</think>, <thought>...</thought>, etc.)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
  cleaned = cleaned.replace(/<reflection>[\s\S]*?<\/reflection>/gi, '');
  cleaned = cleaned.replace(/<cot>[\s\S]*?<\/cot>/gi, '');

  // 2. Strip unclosed / truncated thinking tags (e.g. if token limit cut off before closing tag)
  cleaned = cleaned.replace(/<think>[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/<thought>[\s\S]*$/gi, '');
  cleaned = cleaned.replace(/<reasoning>[\s\S]*$/gi, '');

  // 3. Strip any stray closing tags or brackets
  cleaned = cleaned.replace(/<\/(?:think|thought|reasoning|reflection|cot)>/gi, '');

  // 4. Strip markdown code blocks
  cleaned = cleaned.replace(/```[a-z]*\s*([\s\S]*?)\s*```/gi, '$1');
  cleaned = cleaned.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '');
  cleaned = cleaned.replace(/^`+|`+$/g, '');

  // 5. Strip markdown bold / italic formatting (e.g. **text**, *text*, __text__, _text_)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1');
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1');
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1');

  // 6. Strip common conversational prefixes & labels
  const prefixes = [
    /^(?:alt\s*text|alt-text|image\s*description|description|caption|title|alt)\s*[:=-]\s*/i,
    /^(?:here\s*(?:is|'s)\s*(?:the|an|your)?\s*(?:alt\s*text|description|caption)?\s*[:=-]?\s*)/i,
    /^(?:sure,?\s*(?:here\s*(?:is|'s))?.*?:?\s*)/i,
  ];
  for (const prefix of prefixes) {
    cleaned = cleaned.replace(prefix, '').trim();
  }

  // 7. Strip surrounding quotes or brackets
  cleaned = cleaned.replace(/^["'“”‘’\(\[\{]+|["'“”‘’\)\]\}]+$/g, '').trim();

  // 8. Handle multiline responses - extract the actual descriptive line(s)
  cleaned = cleaned
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('<') && !l.toLowerCase().startsWith('note:'))
    .join(' ')
    .trim();

  // 9. Strip surrounding quotes or brackets again after joining
  cleaned = cleaned.replace(/^["'“”‘’\(\[\{]+|["'“”‘’\)\]\}]+$/g, '').trim();

  // 10. Normalize multiple whitespace into single space
  cleaned = cleaned.replace(/\s+/g, ' ');

  // 11. Remove trailing period or colon/semicolon
  cleaned = cleaned.replace(/[.,;:]+$/, '').trim();

  // 12. Final pass for any lingering enclosing quotes
  cleaned = cleaned.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();

  return cleaned;
}

/**
 * Clean a string so it is valid as a cross-platform filesystem filename
 */
export function sanitizeForFilename(text: string): string {
  if (!text) return 'image';
  return text
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // remove illegal chars
    .replace(/\s+/g, ' ')                  // normalize multiple spaces
    .trim()
    .slice(0, 150);                        // prevent overly long path limits
}

/**
 * Format the output image filename based on user preference
 * Defaults to pure alt-text without brackets: e.g. Damaged white SUV loaded onto blue tow truck.jpg
 */
export function formatImageExportFilename(
  altText: string,
  originalFilename: string,
  format: ZipFilenameFormat = 'alt-text'
): string {
  // Extract extension
  const dotIdx = originalFilename.lastIndexOf('.');
  const ext = dotIdx >= 0 ? originalFilename.substring(dotIdx) : '.jpg';
  const origBaseName = dotIdx >= 0 ? originalFilename.substring(0, dotIdx) : originalFilename;

  const cleanAlt = sanitizeForFilename(altText);

  if (!cleanAlt) {
    return originalFilename;
  }

  switch (format) {
    case 'alt-text':
    default:
      return `${cleanAlt}${ext}`;
    case 'alt-text-paren':
      return `(${cleanAlt})${ext}`;
    case 'original-and-alt':
      return `${sanitizeForFilename(origBaseName)} - ${cleanAlt}${ext}`;
    case 'original-only':
      return originalFilename;
  }
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return 'img_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
}
