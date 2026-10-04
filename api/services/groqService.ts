import Groq from "groq-sdk";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

let groqInstance: Groq | null = null;

const getGroqClient = (): Groq => {
  if (groqInstance) return groqInstance;

  const rawKey = process.env.GROQ_API_KEY?.trim();
  if (!rawKey) {
    console.error("❌ GROQ_API_KEY is missing in environment variables!");
    throw new Error("GROQ_API_KEY is missing in environment variables. Please check your .env file.");
  }

  groqInstance = new Groq({
    apiKey: rawKey,
    timeout: 35000,
    maxRetries: 2,
  });

  return groqInstance;
};

const systemPrompt = `You are FemCare AI, a highly personalized women’s health assistant with ChatGPT-level multimodal reasoning.

You MUST use the MongoDB user profile in every response.
You MUST use uploaded attachments as the primary source of truth.

Priority order:
1. Uploaded attachment contents (Highest Priority — Primary Source of Truth)
2. Previous uploaded reports
3. Doctor notes
4. User profile
5. Current user message
6. General medical knowledge

STRICT RULES:
- Address the user by name when available (e.g. "Hani, based on your profile...").
- NON-MEDICAL IMAGES (e.g., dog, cat, car, building, object): If the uploaded image contains a non-medical animal, object, or vehicle (e.g. a dog or a car), describe what is shown in the image directly as requested by the user. Do NOT give irrelevant women's health or medical advice for a general object/animal image query!
- MEDICAL IMAGES / PRESCRIPTIONS / REPORTS: Quote actual lab values (Hemoglobin 10.8 g/dL, WBC, RBC, Platelets, TSH), drug names, dosages, or visual skin observations in detail.
- NEVER say "I did not receive any uploaded attachments" if a file was uploaded OR for text-only questions!
- NEVER ignore the user profile for medical questions. Mention relevant profile fields (age, pregnancy status, PCOS, anemia, thyroid, blood pressure, workout level, goals).
- Mention uncertainty when appropriate.
- Never invent values or lab numbers that are not present in the files.
- If files were uploaded, start your first sentence by acknowledging the uploaded attachment(s) (e.g., "I reviewed your uploaded CBC blood report PDF...", "I analyzed your uploaded prescription image...").
`;

/**
 * Builds ONE unified multimodal prompt string containing all inputs.
 */
export const buildCombinedPrompt = (
  userProfileText: string,
  userMessage: string,
  extractedDocumentText: string,
  imageAnalysisText: string,
  audioTranscriptionText: string,
  videoAnalysisText: string = ''
): string => {
  const sections: string[] = [];

  const hasDocs = Boolean(extractedDocumentText && extractedDocumentText.trim());
  const hasImages = Boolean(imageAnalysisText && imageAnalysisText.trim());
  const hasAudio = Boolean(audioTranscriptionText && audioTranscriptionText.trim());
  const hasVideo = Boolean(videoAnalysisText && videoAnalysisText.trim());
  const hasAnyAttachment = hasDocs || hasImages || hasAudio || hasVideo;

  sections.push(`## User Profile (MongoDB Context)\n${userProfileText || 'No user profile context available.'}`);

  sections.push(`## User Message\n"${userMessage || 'Please analyze my uploaded attachment(s).'}"`);

  if (hasDocs) {
    sections.push(`## PDF / Document Analysis\n${extractedDocumentText.trim()}`);
  }

  if (hasImages) {
    sections.push(`## Image Analysis (Google Gemini 2.5 Flash Vision Observations)\n${imageAnalysisText.trim()}`);
  }

  if (hasAudio) {
    sections.push(`## Audio Transcription (Groq Whisper)\n${audioTranscriptionText.trim()}`);
  }

  if (hasVideo) {
    sections.push(`## Video Findings (Keyframe Analysis & Audio)\n${videoAnalysisText.trim()}`);
  }

  if (!hasAnyAttachment) {
    sections.push(`## Instructions for Text-Only Query\nNo attachments were uploaded in this message. Answer the user's message directly, fully personalized using their MongoDB profile context above. Do NOT output disclaimers about missing attachments.`);
  } else {
    sections.push(`## Instructions for Multimodal Attachment Response
1. FIRST SENTENCE MANDATE: Acknowledge every uploaded attachment explicitly in your first sentence (e.g. "I reviewed your uploaded CBC blood report PDF...", "I analyzed the uploaded prescription image...").
2. ATTACHMENT DOMINANCE: The uploaded attachment is the primary source of truth. If the image is a non-medical item (e.g. a dog or a car), describe the item directly without adding irrelevant health advice.
3. SPECIFIC QUOTES: Quote exact lab numbers, drug names, dosages, or visual skin/image features.
4. PROFILE CORRELATION: Correlate medical findings directly with the User Profile (pregnancy status, PCOS, anemia, thyroid, medications, allergies).`);
  }

  const finalPrompt = sections.join('\n\n');
  console.log(`\n======================================================`);
  console.log(`🚀 [FINAL UNIFIED MULTIMODAL & PROFILE PROMPT SENT TO MODEL]:`);
  console.log(`======================================================\n${finalPrompt}\n======================================================\n`);
  return finalPrompt;
};

/**
 * Response specificity validator to enforce user profile and attachment referencing.
 */
export function validateResponseSpecificity(
  response: string,
  hasAttachments: boolean,
  userName?: string
): { valid: boolean; reason?: string } {
  if (!response || response.trim().length === 0) {
    return { valid: false, reason: 'Empty response generated' };
  }

  const lower = response.toLowerCase();

  if (hasAttachments) {
    const firstParagraph = lower.split('\n')[0] || '';
    const acknowledgesAttachment =
      firstParagraph.includes('analyzed') ||
      firstParagraph.includes('reviewed') ||
      firstParagraph.includes('examined') ||
      firstParagraph.includes('uploaded') ||
      firstParagraph.includes('report') ||
      firstParagraph.includes('prescription') ||
      firstParagraph.includes('image') ||
      firstParagraph.includes('pdf') ||
      firstParagraph.includes('video') ||
      firstParagraph.includes('voice') ||
      firstParagraph.includes('audio') ||
      firstParagraph.includes('attachment') ||
      firstParagraph.includes('dog') ||
      firstParagraph.includes('car');

    if (!acknowledgesAttachment) {
      return { valid: false, reason: 'Response missing attachment acknowledgment in first sentence' };
    }
  }

  return { valid: true };
}

/**
 * Gemini text generator using @google/genai SDK
 */
async function generateGeminiTextFallback(systemPromptStr: string, userPromptStr: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();
  if (!geminiKey) {
    throw new Error('Gemini API key missing for AI generation.');
  }

  const ai = new GoogleGenAI({ apiKey: geminiKey });
  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
  let lastErr: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🤖 [Gemini Text Generator] Generating response with ${modelName} via @google/genai SDK...`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPromptStr}\n\n${userPromptStr}` }]
          }
        ]
      });
      const text = response.text?.trim() || '';
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(`⚠️ [Gemini Text Generator Warning] ${modelName} failed: ${err?.message || err}`);
      lastErr = err;
    }
  }

  throw new Error(`Gemini Text Generation Error: ${lastErr?.message || 'Text generation failed'}`);
}

/**
 * Non-streaming response generator (used by POST /api/ai/chat endpoint)
 */
export const generateCombinedMultimodalResponse = async (
  userProfileText: string,
  userMessage: string,
  extractedDocumentText: string,
  imageAnalysisText: string,
  imageUrls: string[] = [],
  audioTranscriptionText: string = '',
  videoAnalysisText: string = ''
): Promise<string> => {
  const combinedPrompt = buildCombinedPrompt(
    userProfileText,
    userMessage,
    extractedDocumentText,
    imageAnalysisText,
    audioTranscriptionText,
    videoAnalysisText
  );

  const textModel = process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile";

  try {
    const client = getGroqClient();
    console.log(`⚡ [Groq Service] Generating response using model: ${textModel}`);
    const completion = await client.chat.completions.create({
      model: textModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: combinedPrompt }
      ],
      temperature: 0.4,
      max_tokens: 1500,
    });
    const resultText = completion.choices[0]?.message?.content;
    if (resultText && resultText.trim().length > 0) {
      console.log(`\n======================================================`);
      console.log(`✨ [MODEL GENERATED SPECIFIC MULTIMODAL RESPONSE]:`);
      console.log(`======================================================\n${resultText}\n======================================================\n`);
      return resultText;
    }
    return await generateGeminiTextFallback(systemPrompt, combinedPrompt);
  } catch (err: any) {
    console.warn("⚠️ [Groq API Warning] Falling back to Gemini Flash text generation:", err?.message || err);
    try {
      const fallbackText = await generateGeminiTextFallback(systemPrompt, combinedPrompt);
      console.log(`\n======================================================`);
      console.log(`✨ [GEMINI FALLBACK GENERATED MULTIMODAL RESPONSE]:`);
      console.log(`======================================================\n${fallbackText}\n======================================================\n`);
      return fallbackText;
    } catch (geminiErr: any) {
      console.error("❌ Both Groq and Gemini generation failed:", geminiErr?.message || geminiErr);
      throw new Error(`AI generation error: ${err?.message || geminiErr?.message || 'Services unavailable'}`);
    }
  }
};

/**
 * Streamed response generator (used by POST /api/chat/message streaming endpoint)
 */
export const generateStreamResponse = async (
  userProfileText: string | null,
  previousMessages: Array<{ role: string; content: string }>,
  userMessage: string,
  imageUrls: string[] = [],
  extractedTexts: string[] = [],
  audioTranscriptionText: string = '',
  imageObservationsText: string = '',
  videoObservationsText: string = ''
): Promise<AsyncIterable<string>> => {
  const mergedDocText = extractedTexts.join("\n\n");
  const fullMultimodalPrompt = buildCombinedPrompt(
    userProfileText || "No profile specified.",
    userMessage,
    mergedDocText,
    imageObservationsText,
    audioTranscriptionText,
    videoObservationsText
  );

  const textModel = process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile";

  try {
    const client = getGroqClient();
    console.log(`⚡ [Groq Service Streaming] Request model: ${textModel}`);
    const messages: any[] = [{ role: "system", content: systemPrompt }];

    if (userProfileText) {
      messages.push({
        role: "system",
        content: `User Profile Context (MongoDB):\n${userProfileText}`,
      });
    }

    const recentHistory = previousMessages.slice(-4);
    for (const msg of recentHistory) {
      const role = msg.role === "user" ? "user" : "assistant";
      messages.push({ role, content: msg.content });
    }

    messages.push({ role: "user", content: fullMultimodalPrompt });

    const stream = await client.chat.completions.create({
      model: textModel,
      messages,
      stream: true,
      temperature: 0.5,
      max_tokens: 1500,
    });

    async function* yieldChunks() {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield content;
        }
      }
    }

    return yieldChunks();
  } catch (err: any) {
    console.warn("⚠️ [Groq Stream Warning] Falling back to Gemini Flash for stream response:", err?.message || err);
    const fallbackText = await generateGeminiTextFallback(systemPrompt, fullMultimodalPrompt);
    async function* yieldSingleChunk() {
      yield fallbackText;
    }
    return yieldSingleChunk();
  }
};
