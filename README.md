# Alternative-Text-Generator

An intelligent, multi-tier Vision AI tool that automatically generates concise 6-8 word descriptive alt-text for bulk images, embeds metadata directly into JPEG (EXIF) and PNG (tEXt) files, and exports clean formatted archives.

## 🚀 Features
- **Multi-Tier Vision AI Pipeline**: Lightning-fast automatic failover.
- **Strict 6-8 Word Alt-Text**: Removes reasoning tags, `<think>` blocks, quotes, and filler.
- **Direct Metadata Injection**: Injects `ImageDescription` and `UserComment` into JPEG EXIF and `tEXt` chunks into PNG.
- **Bulk Processing & ZIP Export**: Process multiple images concurrently and download them with formatted filenames.
- **Vercel Ready**: Includes rewrite configuration for serverless deployment.

## 🛠️ Environment Setup
Create a `.env` file in the root directory (refer to `.env.example`):
```env
VITE_API_KEY=your_api_key_here
```

## 📦 Getting Started
```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Build for production
npm run build
```
