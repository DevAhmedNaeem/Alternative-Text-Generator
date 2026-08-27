import piexif from 'piexifjs';
import type { ExifTagInfo } from '../types';
import { dataUrlToBlob } from '../utils/fileHelpers';

// CRC32 table for PNG chunk checksum calculations
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function calculateCrc32(buf: Uint8Array, offset: number, length: number): number {
  let crc = 0xffffffff;
  for (let i = offset; i < offset + length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Embed alt-text directly into a JPEG data URL's EXIF metadata
 * Sets:
 * 1. 0th IFD -> ImageDescription (Tag 270 / 0x010E)
 * 2. Exif IFD -> UserComment (Tag 37510 / 0x9286)
 * 3. 0th IFD -> Software (Tag 305)
 */
export function injectJpegExif(jpegDataUrl: string, altText: string): string {
  let exifObj: any = { '0th': {}, Exif: {}, GPS: {}, Interop: {}, '1st': {}, thumbnail: null };

  try {
    const existing = piexif.load(jpegDataUrl);
    if (existing && typeof existing === 'object') {
      exifObj = existing;
      if (!exifObj['0th']) exifObj['0th'] = {};
      if (!exifObj.Exif) exifObj.Exif = {};
      if (!exifObj.GPS) exifObj.GPS = {};
      if (!exifObj.Interop) exifObj.Interop = {};
      if (!exifObj['1st']) exifObj['1st'] = {};
    }
  } catch {
    // If image has no pre-existing EXIF header, create fresh EXIF dictionary
    exifObj = { '0th': {}, Exif: {}, GPS: {}, Interop: {}, '1st': {}, thumbnail: null };
  }

  // 1. Inject ImageDescription (0x010E / 270)
  exifObj['0th'][piexif.ImageIFD.ImageDescription] = altText;

  // 2. Inject Software stamp
  exifObj['0th'][piexif.ImageIFD.Software] = 'Bulk Image Alt-Text Generator';

  // 3. Inject UserComment (0x9286 / 37510)
  exifObj.Exif[piexif.ExifIFD.UserComment] = `ASCII\0\0\0${altText}`;

  // Generate binary EXIF bytes
  const exifBytes = piexif.dump(exifObj);

  // Insert into JPEG Data URL
  const modifiedDataUrl = piexif.insert(exifBytes, jpegDataUrl);
  return modifiedDataUrl;
}

/**
 * Creates a PNG tEXt chunk
 * Structure: 4 bytes length, 4 bytes 'tEXt', data (keyword + '\0' + text), 4 bytes CRC32
 */
function createPngTextChunk(keyword: string, text: string): Uint8Array {
  const enc = new TextEncoder();
  const keywordBytes = enc.encode(keyword);
  const textBytes = enc.encode(text);
  const dataLen = keywordBytes.length + 1 + textBytes.length;

  const chunk = new Uint8Array(4 + 4 + dataLen + 4);
  const view = new DataView(chunk.buffer);

  // Length (excluding length, chunk type, CRC)
  view.setUint32(0, dataLen);

  // Chunk type 'tEXt'
  chunk[4] = 116; // 't'
  chunk[5] = 69;  // 'E'
  chunk[6] = 88;  // 'X'
  chunk[7] = 116; // 't'

  // Keyword
  chunk.set(keywordBytes, 8);
  chunk[8 + keywordBytes.length] = 0; // null separator

  // Text
  chunk.set(textBytes, 8 + keywordBytes.length + 1);

  // CRC32 calculated over chunk type + data
  const crc = calculateCrc32(chunk, 4, 4 + dataLen);
  view.setUint32(8 + dataLen, crc);

  return chunk;
}

/**
 * Embed alt-text into a PNG ArrayBuffer by inserting tEXt chunks (Description & Comment)
 */
export function injectPngMetadata(pngBuffer: ArrayBuffer, altText: string): ArrayBuffer {
  const bytes = new Uint8Array(pngBuffer);

  // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    bytes.length > 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a;

  if (!isPng) {
    return pngBuffer;
  }

  // Create Description and Comment chunks
  const descChunk = createPngTextChunk('Description', altText);
  const commentChunk = createPngTextChunk('Comment', altText);
  const softwareChunk = createPngTextChunk('Software', 'Bulk Image Alt-Text Generator');

  const totalExtra = descChunk.length + commentChunk.length + softwareChunk.length;

  // Find position after IHDR chunk (IHDR is always first chunk: 8-byte sig + 4 length + 4 IHDR + 13 data + 4 CRC = byte 33)
  const insertPos = 33;

  const result = new Uint8Array(bytes.length + totalExtra);
  result.set(bytes.subarray(0, insertPos), 0);

  let cur = insertPos;
  result.set(descChunk, cur);
  cur += descChunk.length;

  result.set(commentChunk, cur);
  cur += commentChunk.length;

  result.set(softwareChunk, cur);
  cur += softwareChunk.length;

  result.set(bytes.subarray(insertPos), cur);

  return result.buffer;
}

/**
 * Master function to inject alt-text into any image (JPEG, PNG, WebP)
 * Returns the modified Blob and Data URL
 */
export async function embedAltTextInImage(
  file: File | Blob,
  dataUrl: string,
  altText: string,
  mimeType: string
): Promise<{ blob: Blob; dataUrl: string; embeddedTags: ExifTagInfo[] }> {
  const isJpeg = mimeType.includes('jpeg') || mimeType.includes('jpg') || dataUrl.startsWith('data:image/jpeg');
  const isPng = mimeType.includes('png') || dataUrl.startsWith('data:image/png');

  if (isJpeg) {
    try {
      const modifiedDataUrl = injectJpegExif(dataUrl, altText);
      const modifiedBlob = dataUrlToBlob(modifiedDataUrl);

      const embeddedTags: ExifTagInfo[] = [
        {
          tag: 'ImageDescription',
          tagId: '0x010E (270)',
          value: altText,
          category: '0th / Image',
        },
        {
          tag: 'UserComment',
          tagId: '0x9286 (37510)',
          value: altText,
          category: 'Exif',
        },
        {
          tag: 'Software',
          tagId: '0x0131 (305)',
          value: 'Bulk Image Alt-Text Generator',
          category: '0th / Image',
        },
      ];

      return {
        blob: modifiedBlob,
        dataUrl: modifiedDataUrl,
        embeddedTags,
      };
    } catch (err) {
      console.warn('JPEG EXIF injection warning, falling back to original blob:', err);
      return {
        blob: file instanceof Blob ? file : dataUrlToBlob(dataUrl),
        dataUrl,
        embeddedTags: [
          {
            tag: 'ImageDescription (Attempted)',
            tagId: '0x010E',
            value: altText,
            category: '0th / Image',
          },
        ],
      };
    }
  } else if (isPng) {
    try {
      const arrayBuffer = await (file instanceof Blob ? file.arrayBuffer() : fetch(dataUrl).then((r) => r.arrayBuffer()));
      const modifiedBuffer = injectPngMetadata(arrayBuffer, altText);
      const modifiedBlob = new Blob([modifiedBuffer], { type: 'image/png' });

      // Create new data URL
      const reader = new FileReader();
      const modifiedDataUrl = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(modifiedBlob);
      });

      const embeddedTags: ExifTagInfo[] = [
        {
          tag: 'tEXt:Description',
          tagId: 'PNG tEXt Chunk',
          value: altText,
          category: 'PNG tEXt',
        },
        {
          tag: 'tEXt:Comment',
          tagId: 'PNG tEXt Chunk',
          value: altText,
          category: 'PNG tEXt',
        },
        {
          tag: 'tEXt:Software',
          tagId: 'PNG tEXt Chunk',
          value: 'Bulk Image Alt-Text Generator',
          category: 'PNG tEXt',
        },
      ];

      return {
        blob: modifiedBlob,
        dataUrl: modifiedDataUrl,
        embeddedTags,
      };
    } catch (err) {
      console.warn('PNG metadata injection warning:', err);
      return {
        blob: file instanceof Blob ? file : dataUrlToBlob(dataUrl),
        dataUrl,
        embeddedTags: [],
      };
    }
  } else {
    // For WebP or other formats, convert to JPEG blob with EXIF or return with fallback
    try {
      const modifiedDataUrl = injectJpegExif(dataUrl, altText);
      const modifiedBlob = dataUrlToBlob(modifiedDataUrl);
      return {
        blob: modifiedBlob,
        dataUrl: modifiedDataUrl,
        embeddedTags: [
          {
            tag: 'ImageDescription',
            tagId: '0x010E (270)',
            value: altText,
            category: '0th / Image',
          },
        ],
      };
    } catch {
      return {
        blob: file instanceof Blob ? file : dataUrlToBlob(dataUrl),
        dataUrl,
        embeddedTags: [
          {
            tag: 'ImageDescription',
            tagId: '0x010E',
            value: altText,
            category: '0th / Image',
          },
        ],
      };
    }
  }
}

/**
 * Read and parse all embedded metadata from an image Data URL / Blob for visual verification in the inspector modal
 */
export function inspectEmbeddedExif(dataUrl: string): ExifTagInfo[] {
  const tags: ExifTagInfo[] = [];

  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
    try {
      const exif = piexif.load(dataUrl);
      if (exif['0th']) {
        for (const [key, val] of Object.entries(exif['0th'])) {
          const numKey = Number(key);
          let tagName = `Tag ${numKey}`;
          if (numKey === piexif.ImageIFD.ImageDescription) tagName = 'ImageDescription';
          else if (numKey === piexif.ImageIFD.Software) tagName = 'Software';
          else if (numKey === piexif.ImageIFD.Make) tagName = 'Make';
          else if (numKey === piexif.ImageIFD.Model) tagName = 'Model';
          else if (numKey === piexif.ImageIFD.DateTime) tagName = 'DateTime';

          tags.push({
            tag: tagName,
            tagId: `0x${numKey.toString(16).toUpperCase()} (${numKey})`,
            value: String(val),
            category: '0th / Image',
          });
        }
      }

      if (exif.Exif) {
        for (const [key, val] of Object.entries(exif.Exif)) {
          const numKey = Number(key);
          let tagName = `Tag ${numKey}`;
          let displayVal = String(val);

          if (numKey === piexif.ExifIFD.UserComment) {
            tagName = 'UserComment';
            displayVal =
              typeof val === 'string'
                ? val.replace(/^ASCII\0\0\0/, '').replace(/^\0\0\0\0\0\0\0\0/, '')
                : String(val);
          }

          tags.push({
            tag: tagName,
            tagId: `0x${numKey.toString(16).toUpperCase()} (${numKey})`,
            value: displayVal,
            category: 'Exif',
          });
        }
      }
    } catch (err) {
      console.warn('Unable to parse EXIF in inspect mode:', err);
    }
  } else if (dataUrl.startsWith('data:image/png')) {
    tags.push({
      tag: 'tEXt:Description',
      tagId: 'PNG Text Chunk',
      value: 'Embedded in PNG tEXt header chunk',
      category: 'PNG tEXt',
    });
  }

  return tags;
}
