process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { GoogleGenAI } from '@google/genai';

export interface ImageAnalysisRequest {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

/**
 * Perform vision analysis using official Google GenAI SDK (@google/genai) with gemini-2.5-flash
 */
export async function analyzeImageWithGemini(
  file: ImageAnalysisRequest
): Promise<string[]> {
  const apiKey =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    process.env.GROQ_API_KEY?.trim();

  const base64Image = file.buffer.toString('base64');
  console.log(`📥 [Gemini Vision TRACE] Processing "${file.filename}" | MIME: "${file.mimeType}" | Buffer Size: ${file.buffer.length} bytes | Base64 Length: ${base64Image.length} chars`);

  if (!apiKey) {
    console.error(`❌ [Gemini Vision TRACE] No API Key found in environment variables for image: ${file.filename}`);
    throw new Error(`Gemini API Key missing for ${file.filename}. Please check your environment variables.`);
  }

  let effectiveMime = file.mimeType;
  const lowerName = file.filename.toLowerCase();
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
    effectiveMime = 'image/jpeg';
  } else if (lowerName.endsWith('.png')) {
    effectiveMime = 'image/png';
  } else if (lowerName.endsWith('.webp')) {
    effectiveMime = 'image/webp';
  } else if (lowerName.endsWith('.heic')) {
    effectiveMime = 'image/heic';
  }
  if (!effectiveMime || effectiveMime === 'application/octet-stream') {
    effectiveMime = 'image/jpeg';
  }

  const ai = new GoogleGenAI({ apiKey });

  const promptText = "Analyze this image exactly like ChatGPT. Describe everything visible, extract any text, identify medicines, prescriptions, blood reports, rashes, X-rays, ultrasound findings, nutrition labels, and any other important details.";

  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`👁️ [Gemini Vision TRACE] Sending base64 payload to ${modelName} using @google/genai SDK...`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: effectiveMime,
                  data: base64Image,
                },
              },
            ],
          },
        ],
      });

      const rawText = response.text?.trim() || '';
      console.log(`\n=== GEMINI RAW RESPONSE for ${file.filename} ===\n${rawText}\n=====================================\n`);

      if (!rawText) {
        throw new Error(`Empty response returned by ${modelName} model.`);
      }

      return [rawText];
    } catch (err: any) {
      console.warn(`⚠️ [Gemini Vision TRACE Warning] Model ${modelName} failed for ${file.filename}: ${err?.message || err}`);
      lastError = err;
    }
  }

  console.error(`❌ [Gemini Vision Error] All models failed for ${file.filename}:`, lastError?.message || lastError);
  throw new Error(`Gemini Vision Error analyzing ${file.filename}: ${lastError?.message || 'Vision API call failed.'}`);
}

/**
 * Analyze Video Frames using Gemini Vision
 */
export async function analyzeVideoFramesWithGemini(
  frames: ImageAnalysisRequest[]
): Promise<string[]> {
  if (!frames || frames.length === 0) {
    return ['No video frames available for visual analysis.'];
  }

  const allObservations: string[] = [];
  for (let i = 0; i < frames.length; i++) {
    const frameObs = await analyzeImageWithGemini(frames[i]);
    if (frameObs.length > 0) {
      allObservations.push(`[Video Frame #${i + 1} Visual Observations]:\n${frameObs.join('\n')}`);
    }
  }

  return allObservations.length > 0
    ? allObservations
    : ['No video visual frames could be analyzed.'];
}
