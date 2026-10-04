import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import os from 'os';
import { createRequire } from 'module';
import { createCanvas } from '@napi-rs/canvas';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import Groq from 'groq-sdk';
import { analyzeImageWithGemini } from './geminiVisionService';
import { processVideoFile } from './videoProcessingService';

const require = createRequire(import.meta.url);

let groqClient: Groq | null = null;
const getGroq = (): Groq | null => {
  if (groqClient) return groqClient;
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  groqClient = new Groq({ apiKey });
  return groqClient;
};

export interface ProcessedFileResult {
  filename: string;
  mimeType: string;
  size: number;
  isImage: boolean;
  isDocument: boolean;
  isAudio: boolean;
  isVideo: boolean;
  extractedText: string;
  imageAnalysis: string[];
  audioTranscription: string;
  videoAnalysis: string[];
  url?: string;
  error?: string;
}

export interface MultimodalProcessingSummary {
  attachments: Array<{
    filename: string;
    mimeType: string;
    size: number;
    isImage: boolean;
    isAudio?: boolean;
    isVideo?: boolean;
    url?: string;
  }>;
  extractedText: string[];
  imageAnalysis: string[];
  audioTranscriptions: string[];
  videoAnalysis: string[];
  combinedDocumentText: string;
  combinedImageObservations: string;
  combinedAudioTranscription: string;
  combinedVideoObservations: string;
  attachmentsMetadata: Array<{
    filename: string;
    mimeType: string;
    size: number;
    url?: string;
    extractedText?: string;
    imageObservations?: string;
    audioTranscription?: string;
    videoObservations?: string;
  }>;
  errors: string[];
}

/**
 * Validate MIME types & extensions
 */
export const validateUploadedFile = (
  file: Express.Multer.File
): { valid: boolean; error?: string } => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
  const docExts = ['pdf', 'docx', 'doc', 'txt', 'csv'];
  const audioExts = ['mp3', 'wav', 'm4a', 'webm', 'ogg'];
  const videoExts = ['mp4', 'mov', 'avi', 'mkv'];

  const isImage = imageExts.includes(ext) || file.mimetype.startsWith('image/');
  const isDoc =
    docExts.includes(ext) ||
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'text/plain' ||
    file.mimetype === 'text/csv' ||
    file.mimetype === 'application/csv' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const isAudio = audioExts.includes(ext) || file.mimetype.startsWith('audio/');
  const isVideo = videoExts.includes(ext) || file.mimetype.startsWith('video/');

  if (!isImage && !isDoc && !isAudio && !isVideo) {
    return { valid: false, error: 'This file type is not supported.' };
  }

  if (isImage && file.size > 10 * 1024 * 1024) {
    return { valid: false, error: `Image ${file.originalname} exceeds the 10 MB limit.` };
  }

  if ((isDoc || isAudio || isVideo) && file.size > 25 * 1024 * 1024) {
    return { valid: false, error: `File ${file.originalname} exceeds the 25 MB limit.` };
  }

  return { valid: true };
};

/**
 * Clean audio transcriptions from filler words while preserving symptoms & medical details
 */
export function cleanAudioTranscription(rawText: string): string {
  if (!rawText) return '';
  let cleaned = rawText
    .replace(/\b(um+|uh+|er+|like+|you know|i mean|sort of|kind of)\b[,;]?/gi, ' ')
    .replace(/\s*,\s*,/g, ',')
    .replace(/^\s*[,;\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || rawText;
}

/**
 * Audio transcription using Groq Whisper API (whisper-large-v3) with retry logic
 */
export async function transcribeAudioFile(
  file: Express.Multer.File,
  retryCount = 0
): Promise<string> {
  const client = getGroq();
  if (!client) {
    console.error('❌ [Whisper Audio] GROQ_API_KEY is missing!');
    return "I couldn't clearly understand the uploaded audio. (AI Speech key not configured).";
  }

  const tempFilePath = path.join(
    os.tmpdir(),
    `femcare_audio_${Date.now()}_${path.basename(file.originalname)}`
  );

  try {
    const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);
    if (!buffer) throw new Error('Audio buffer unreadable');

    await fs.writeFile(tempFilePath, buffer);

    console.log(`🎙️ [Whisper Audio] Transcribing "${file.originalname}" (Attempt ${retryCount + 1})...`);
    
    const transcription = await client.audio.transcriptions.create({
      file: fsSync.createReadStream(tempFilePath),
      model: 'whisper-large-v3',
      response_format: 'json',
      temperature: 0.0,
    });

    const rawText = (transcription.text || '').trim();
    console.log(`🔍 [Whisper Audio Raw Output for ${file.originalname}]: "${rawText}"`);

    if (!rawText) {
      if (retryCount < 1) {
        return transcribeAudioFile(file, retryCount + 1);
      }
      return "Audio transcription produced no text.";
    }

    return cleanAudioTranscription(rawText);
  } catch (err: any) {
    console.error(`❌ [Whisper Audio Error] ${file.originalname}:`, err?.message || err);
    if (retryCount < 1) {
      return transcribeAudioFile(file, retryCount + 1);
    }
    return `Audio transcription error: ${err?.message || 'Speech processing failed.'}`;
  } finally {
    try {
      if (fsSync.existsSync(tempFilePath)) {
        await fs.unlink(tempFilePath);
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
}

/**
 * Extract structured medical report key-value metrics from document text
 * Required metrics: Hemoglobin, WBC, RBC, Platelets, TSH, T3, T4, Ferritin, Vitamin D, Glucose, Cholesterol
 */
export function extractStructuredMedicalMetrics(text: string): string {
  if (!text) return '';
  const metrics: string[] = [];

  const patterns: Array<{ key: string; regex: RegExp; normalRange?: string }> = [
    { key: 'Hemoglobin (Hb)', regex: /(?:hemoglobin|hb)\s*[:=-]?\s*([\d\.]+\s*(?:g\/dl|gm\/dl|g%|g\/L)?)/i, normalRange: '12.0 - 15.5 g/dL' },
    { key: 'WBC / Leukocytes', regex: /(?:wbc|white blood cell|leukocytes|total wbc)\s*[:=-]?\s*([\d\.,]+\s*(?:\/cumm|\/ul|10\^3\/ul|x10\^3|\/mm3)?)/i, normalRange: '4,500 - 11,000 /mcL' },
    { key: 'RBC / Erythrocytes', regex: /(?:rbc|red blood cell|erythrocytes|total rbc)\s*[:=-]?\s*([\d\.]+\s*(?:million\/cumm|10\^6\/ul|x10\^6|\/mm3)?)/i, normalRange: '4.0 - 5.2 million/mcL' },
    { key: 'Platelets', regex: /(?:platelets?|plt|platelet count)\s*[:=-]?\s*([\d\.,]+\s*(?:lakhs?\/cumm|\/cumm|10\^3\/ul|x10\^3|\/mm3)?)/i, normalRange: '150,000 - 450,000 /mcL' },
    { key: 'TSH (Thyroid)', regex: /(?:tsh|thyroid stimulating hormone)\s*[:=-]?\s*([\d\.]+\s*(?:uIU\/ml|mIU\/L|microIU\/ml)?)/i, normalRange: '0.4 - 4.0 mIU/L' },
    { key: 'T3', regex: /\b(?:t3|triiodothyronine|total t3|free t3)\b\s*[:=-]?\s*([\d\.]+\s*(?:ng\/dl|pg\/ml|nmol\/L)?)/i, normalRange: '80 - 200 ng/dL' },
    { key: 'T4', regex: /\b(?:t4|thyroxine|total t4|free t4)\b\s*[:=-]?\s*([\d\.]+\s*(?:ug\/dl|ng\/dl|pmol\/L)?)/i, normalRange: '5.0 - 12.0 ug/dL' },
    { key: 'Ferritin', regex: /(?:ferritin|serum ferritin)\s*[:=-]?\s*([\d\.]+\s*(?:ng\/ml|mcg\/L|ug\/L)?)/i, normalRange: '11 - 307 ng/mL' },
    { key: 'Vitamin D', regex: /(?:vitamin\s*d|25-oh\s*vitamin\s*d|25-hydroxy)\s*[:=-]?\s*([\d\.]+\s*(?:ng\/ml|nmol\/L)?)/i, normalRange: '20 - 50 ng/mL' },
    { key: 'Glucose / Sugar', regex: /(?:glucose|fasting blood sugar|fbs|ppbs|random blood sugar)\s*[:=-]?\s*([\d\.]+\s*(?:mg\/dl|mmol\/L)?)/i, normalRange: '70 - 99 mg/dL (fasting)' },
    { key: 'Cholesterol', regex: /(?:total cholesterol|cholesterol|serum cholesterol)\s*[:=-]?\s*([\d\.]+\s*(?:mg\/dl|mmol\/L)?)/i, normalRange: '< 200 mg/dL' },
  ];

  for (const item of patterns) {
    const match = text.match(item.regex);
    if (match && match[1]) {
      metrics.push(`• ${item.key}: ${match[1].trim()} (Ref: ${item.normalRange || 'Standard Range'})`);
    }
  }

  if (metrics.length > 0) {
    return `\n\n[Structured Medical Report Key Findings]:\n${metrics.join('\n')}\n`;
  }
  return '';
}

/**
 * Render PDF pages to PNG images for scanned PDF page analysis
 */
async function renderPdfPagesToImages(pdfBuffer: Buffer): Promise<Buffer[]> {
  try {
    const data = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjs.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    const pageImages: Buffer[] = [];

    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');

      await page.render({
        canvasContext: context as any,
        canvas: canvas as any,
        viewport,
      }).promise;

      const pngBuffer = canvas.toBuffer('image/png');
      pageImages.push(pngBuffer);
    }
    return pageImages;
  } catch (err) {
    console.warn('⚠️ Could not render PDF pages to image:', err);
    return [];
  }
}

/**
 * PDF text extraction with Gemini 2.5 Flash direct PDF page vision analysis
 */
async function processPdfFile(file: Express.Multer.File): Promise<string> {
  try {
    const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);
    if (!buffer) throw new Error('File buffer unreadable');

    console.log(`📄 [PDF Extractor] Extracting text from ${file.originalname}...`);
    let parsedText = '';

    try {
      const pdfParseModule = require('pdf-parse');
      const { PDFParse } = pdfParseModule;
      if (PDFParse) {
        const parser = new PDFParse({ verbosity: 0 });
        await parser.load(buffer);
        parsedText = (await parser.getText() || '').trim();
      } else if (typeof pdfParseModule === 'function') {
        const pdfData = await pdfParseModule(buffer);
        parsedText = (pdfData.text || '').trim();
      }
    } catch (pdfErr) {
      console.warn(`⚠️ [PDF Extractor] pdf-parse text extraction warning for "${file.originalname}":`, pdfErr);
    }

    if (!parsedText) {
      try {
        const data = new Uint8Array(buffer);
        const loadingTask = pdfjs.getDocument({ data });
        const pdfDoc = await loadingTask.promise;
        let textAcc = '';
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContentObj = await page.getTextContent();
          const pageText = textContentObj.items.map((item: any) => item.str).join(' ').trim();
          if (pageText) textAcc += pageText + '\n';
        }
        parsedText = textAcc.trim();
      } catch (e) {
        // Ignore pdfjs text extraction fallback
      }
    }

    let pageAnalysisText = '';

    // If PDF is scanned or text is minimal, convert pages to PNG & analyze with Gemini 2.5 Flash
    if (parsedText.length < 50) {
      console.log(`📷 [PDF Extractor] PDF "${file.originalname}" appears scanned/image-based. Rendering pages to PNG for Gemini 2.5 Flash Vision...`);
      const pageImages = await renderPdfPagesToImages(buffer);
      if (pageImages.length > 0) {
        const obsParts: string[] = [];
        for (let p = 0; p < pageImages.length; p++) {
          const geminiObs = await analyzeImageWithGemini({
            filename: `${file.originalname}_page_${p + 1}.png`,
            mimeType: 'image/png',
            buffer: pageImages[p],
          });
          if (geminiObs && geminiObs.length > 0) {
            obsParts.push(`[Scanned PDF Page ${p + 1} Gemini 2.5 Flash Vision Analysis]:\n${geminiObs.join('\n')}`);
          }
        }
        pageAnalysisText = obsParts.join('\n\n');
      }
    }

    let finalText = [parsedText, pageAnalysisText].filter(Boolean).join('\n\n');

    if (!finalText) {
      finalText = `Medical report PDF "${file.originalname}" attached.`;
    }

    const structuredAddon = extractStructuredMedicalMetrics(finalText);
    return finalText + structuredAddon;
  } catch (err: any) {
    console.error(`❌ [PDF Extractor Error] ${file.originalname}:`, err);
    throw err;
  }
}

/**
 * DOCX text extraction with mammoth
 */
async function processDocxFile(file: Express.Multer.File): Promise<string> {
  try {
    const mammothModule = await import('mammoth');
    const mammoth = mammothModule.default || mammothModule;
    const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);

    if (!buffer) throw new Error('Buffer unreadable');

    console.log(`📄 [DOCX Extractor] Extracting text from ${file.originalname}...`);
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || '').trim();

    if (!text) {
      return `DOCX document "${file.originalname}" attached.`;
    }
    const structuredAddon = extractStructuredMedicalMetrics(text);
    return text + structuredAddon;
  } catch (err: any) {
    console.error(`❌ [DOCX Extractor Error] ${file.originalname}:`, err);
    throw err;
  }
}

/**
 * TXT and CSV reading
 */
async function processTextFile(file: Express.Multer.File): Promise<string> {
  try {
    const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);
    if (!buffer) throw new Error('Buffer unreadable');

    console.log(`📄 [Text File Extractor] Reading ${file.originalname}...`);
    const text = buffer.toString('utf8').trim();
    if (!text) return `Text file "${file.originalname}" attached.`;
    const structuredAddon = extractStructuredMedicalMetrics(text);
    return text + structuredAddon;
  } catch (err: any) {
    console.error(`❌ [Text Extractor Error] ${file.originalname}:`, err);
    throw err;
  }
}

/**
 * Main parallel processing pipeline for uploaded files
 */
export const processUploadedFiles = async (
  files: Express.Multer.File[]
): Promise<MultimodalProcessingSummary> => {
  const summary: MultimodalProcessingSummary = {
    attachments: [],
    extractedText: [],
    imageAnalysis: [],
    audioTranscriptions: [],
    videoAnalysis: [],
    combinedDocumentText: '',
    combinedImageObservations: '',
    combinedAudioTranscription: '',
    combinedVideoObservations: '',
    attachmentsMetadata: [],
    errors: [],
  };

  if (!files || files.length === 0) {
    return summary;
  }

  console.log(`📦 [File Processing Pipeline] Received ${files.length} uploaded file(s):`);
  files.forEach((f, i) => console.log(`  ${i + 1}. Filename: "${f.originalname}", MIME: "${f.mimetype}", Size: ${f.size} bytes`));

  const results = await Promise.all(
    files.map(async (file): Promise<ProcessedFileResult> => {
      const validation = validateUploadedFile(file);
      if (!validation.valid) {
        return {
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          isImage: /^image\//.test(file.mimetype),
          isDocument: false,
          isAudio: false,
          isVideo: false,
          extractedText: '',
          imageAnalysis: [],
          audioTranscription: '',
          videoAnalysis: [],
          error: validation.error || 'This file type is not supported.',
        };
      }

      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      const isImage =
        ['jpg', 'jpeg', 'png', 'webp', 'heic'].includes(ext) || file.mimetype.startsWith('image/');
      const isAudio =
        ['mp3', 'wav', 'm4a', 'webm', 'ogg'].includes(ext) || file.mimetype.startsWith('audio/');
      const isVideo =
        ['mp4', 'mov', 'avi', 'mkv'].includes(ext) || file.mimetype.startsWith('video/');
      const isPdf = ext === 'pdf' || file.mimetype === 'application/pdf';
      const isDocx = ext === 'docx' || ext === 'doc' || file.mimetype.includes('word');
      const isTextOrCsv = ext === 'txt' || ext === 'csv' || file.mimetype.startsWith('text/');

      let extractedText = '';
      let imageAnalysis: string[] = [];
      let audioTranscription = '';
      let videoAnalysis: string[] = [];

      try {
        if (isAudio) {
          audioTranscription = await transcribeAudioFile(file);
        } else if (isImage) {
          const buffer = file.buffer || (file.path ? await fs.readFile(file.path) : null);
          if (buffer) {
            imageAnalysis = await analyzeImageWithGemini({
              filename: file.originalname,
              mimeType: file.mimetype,
              buffer,
            });
          } else {
            throw new Error(`Missing image file buffer for ${file.originalname}`);
          }
        } else if (isVideo) {
          const vidRes = await processVideoFile(file);
          if (vidRes.audioTranscription) audioTranscription = vidRes.audioTranscription;
          if (vidRes.videoObservations) videoAnalysis = vidRes.videoObservations;
        } else if (isPdf) {
          extractedText = await processPdfFile(file);
        } else if (isDocx) {
          extractedText = await processDocxFile(file);
        } else if (isTextOrCsv) {
          extractedText = await processTextFile(file);
        }
      } catch (procErr: any) {
        console.error(`❌ [File Processing Error] ${file.originalname}:`, procErr?.message || procErr);
        return {
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          isImage,
          isDocument: !isImage && !isAudio && !isVideo,
          isAudio,
          isVideo,
          extractedText: '',
          imageAnalysis: [],
          audioTranscription: '',
          videoAnalysis: [],
          error: `Error processing ${file.originalname}: ${procErr?.message || 'Processing failed'}`,
        };
      }

      return {
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        isImage,
        isDocument: !isImage && !isAudio && !isVideo,
        isAudio,
        isVideo,
        extractedText,
        imageAnalysis,
        audioTranscription,
        videoAnalysis,
      };
    })
  );

  const docTextParts: string[] = [];
  const imgObsParts: string[] = [];
  const audioTextParts: string[] = [];
  const videoObsParts: string[] = [];

  for (const res of results) {
    summary.attachments.push({
      filename: res.filename,
      mimeType: res.mimeType,
      size: res.size,
      isImage: res.isImage,
      isAudio: res.isAudio,
      isVideo: res.isVideo,
      url: res.url,
    });

    if (res.error) {
      summary.errors.push(`${res.filename}: ${res.error}`);
    }

    if (res.extractedText) {
      summary.extractedText.push(`[File: ${res.filename}]\n${res.extractedText}`);
      docTextParts.push(`--- ATTACHED DOCUMENT: ${res.filename} ---\n${res.extractedText}`);
    }

    if (res.imageAnalysis && res.imageAnalysis.length > 0) {
      summary.imageAnalysis.push(...res.imageAnalysis);
      imgObsParts.push(`--- ATTACHED IMAGE: ${res.filename} ---\n${res.imageAnalysis.join('\n')}`);
    }

    if (res.audioTranscription) {
      summary.audioTranscriptions.push(`[Audio: ${res.filename}]\n${res.audioTranscription}`);
      audioTextParts.push(`--- ATTACHED AUDIO TRANSCRIPTION (${res.filename}) ---\n"${res.audioTranscription}"`);
    }

    if (res.videoAnalysis && res.videoAnalysis.length > 0) {
      summary.videoAnalysis.push(...res.videoAnalysis);
      videoObsParts.push(`--- ATTACHED VIDEO ANALYSIS (${res.filename}) ---\n${res.videoAnalysis.join('\n')}`);
    }
  }

  summary.combinedDocumentText = docTextParts.join('\n\n');
  summary.combinedImageObservations = imgObsParts.join('\n\n');
  summary.combinedAudioTranscription = audioTextParts.join('\n\n');
  summary.combinedVideoObservations = videoObsParts.join('\n\n');

  summary.attachmentsMetadata = results.map((res) => {
    return {
      filename: res.filename,
      mimeType: res.mimeType,
      size: res.size,
      extractedText: res.extractedText || undefined,
      imageObservations:
        res.imageAnalysis && res.imageAnalysis.length > 0 ? res.imageAnalysis.join('\n') : undefined,
      audioTranscription: res.audioTranscription || undefined,
      videoObservations:
        res.videoAnalysis && res.videoAnalysis.length > 0 ? res.videoAnalysis.join('\n') : undefined,
    };
  });

  return summary;
};
