import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import { processUploadedFiles } from '../services/fileProcessingService';
import { generateCombinedMultimodalResponse } from '../services/groqService';
import { uploadFilesToCloudinary } from '../middleware/upload';

import MedicalReport from '../models/MedicalReport';
import Prescription from '../models/Prescription';
import { formatUserProfileContext } from './chatController';
import { fetchUserHealthContext, buildStructuredHealthContext } from '../services/healthContextService';

export const handleAiChat = async (req: AuthRequest, res: Response) => {
  try {
    const rawMessage = req.body.message || req.body.content || '';
    const { conversationId } = req.body;
    const userId = req.user._id;
    const userEmail = req.user.email;

    const uploadedFiles = (req.files as Express.Multer.File[] | undefined) ?? [];
    const hasFiles = uploadedFiles.length > 0;

    if (!String(rawMessage).trim() && !hasFiles) {
      return res.status(400).json({ message: 'Message content or at least one file is required.' });
    }

    console.log(`📥 [API /ai/chat] Received request (hasFiles: ${hasFiles}, count: ${uploadedFiles.length}).`);

    let fileSummary;
    let uploadedAssets: any[] = [];

    if (hasFiles) {
      fileSummary = await processUploadedFiles(uploadedFiles);
      uploadedAssets = await uploadFilesToCloudinary(uploadedFiles);
    } else {
      fileSummary = {
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
    }

    const imageUrls = uploadedAssets.filter(a => a.isImage).map(a => a.url);
    const fileUrls = uploadedAssets.filter(a => !a.isImage).map(a => a.url);

    const finalMetadata = fileSummary.attachmentsMetadata.map((meta, idx) => {
      return {
        ...meta,
        url: uploadedAssets[idx]?.url || meta.url
      };
    });

    let conversation;
    if (!conversationId) {
      const fallbackTitle = rawMessage
        ? String(rawMessage).slice(0, 30) + (String(rawMessage).length > 30 ? '...' : '')
        : (hasFiles ? uploadedFiles[0]?.originalname : 'Multimodal Chat');
      conversation = new Conversation({
        userId,
        userEmail,
        title: fallbackTitle,
      });
      await conversation.save();
    } else {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      const userIdMatch = conversation.userId.toString() === userId.toString();
      const emailMatch = !conversation.userEmail || conversation.userEmail.toString() === userEmail.toString();
      if (!userIdMatch || !emailMatch) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const realUserText = String(rawMessage || '').trim() || (hasFiles ? 'Please analyze my uploaded attachment(s).' : 'Hello FemCare AI');
    const healthData = await fetchUserHealthContext(String(userId), realUserText);
    const profileContext = buildStructuredHealthContext(healthData);

    const userMessage = new Message({
      conversationId: conversation._id,
      userId,
      userEmail,
      role: 'user',
      content: realUserText,
      images: imageUrls,
      files: fileUrls,
      attachmentsMetadata: finalMetadata,
    });
    await userMessage.save();

    const aiResponseText = await generateCombinedMultimodalResponse(
      profileContext,
      realUserText,
      fileSummary.combinedDocumentText,
      fileSummary.combinedImageObservations,
      imageUrls,
      fileSummary.combinedAudioTranscription,
      fileSummary.combinedVideoObservations
    );

    const finalAiText = String(aiResponseText || '').trim() || 'I evaluated your attachments, but could not generate text. Please try again.';
    const aiMessage = new Message({
      conversationId: conversation._id,
      userId,
      userEmail,
      role: 'assistant',
      content: finalAiText,
      images: imageUrls,
      files: fileUrls,
      attachmentsMetadata: finalMetadata,
    });
    await aiMessage.save();

    conversation.updatedAt = new Date();
    await conversation.save();

    return res.status(200).json({
      response: aiResponseText,
      attachments: fileSummary.attachments,
      extractedText: fileSummary.extractedText,
      imageAnalysis: fileSummary.imageAnalysis,
      audioTranscriptions: fileSummary.audioTranscriptions,
      videoAnalysis: fileSummary.videoAnalysis,
      attachmentsMetadata: finalMetadata,
      conversationId: conversation._id,
    });
  } catch (error: any) {
    console.error('❌ Error in handleAiChat controller:', error);
    return res.status(500).json({
      response: 'I could not process the uploaded files. Please check your attachments and try again.',
      error: error?.message || 'Server internal error',
    });
  }
};

const MEDICAL_DISCLAIMER = 'AI-generated information is for general informational purposes and is not a substitute for professional medical advice.';

/**
 * Generate Personalized AI Health Insights for User Dashboard
 * POST /api/ai/insights
 */
export const getAiHealthInsights = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const healthData = await fetchUserHealthContext(String(userId), 'Health insights summary');
    const profileContext = buildStructuredHealthContext(healthData);

    const prompt = `Based on the following user health data, generate 4-5 concise, encouraging health insights.
User Data:
${profileContext}

Format your response strictly as JSON with keys:
"sleepTrend", "activitySuggestion", "wellnessSuggestion", "moodPattern", "cycleInfo".
Do NOT include Markdown code fences if possible, or return valid JSON.`;

    try {
      const responseText = await generateCombinedMultimodalResponse(
        profileContext,
        'Please generate my personalized health insights.',
        '',
        ''
      );

      let parsed: any = null;
      try {
        const cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        // Soft fallback extraction
        parsed = {
          sleepTrend: 'Sleep patterns appear consistent. Aim for 7-8 hours of restful sleep daily.',
          activitySuggestion: 'Light yoga, walking, or stretching is recommended for balanced energy.',
          wellnessSuggestion: 'Stay hydrated with at least 2-2.5L water daily and maintain balanced nutrition.',
          moodPattern: 'Tracking daily stress and mood helps identify energy patterns across your cycle.',
          cycleInfo: 'Keep tracking symptoms to receive accurate phase predictions.',
        };
      }

      return res.json({
        insights: {
          sleepTrend: parsed.sleepTrend || 'Maintain a regular sleep schedule for optimal hormonal recovery.',
          activitySuggestion: parsed.activitySuggestion || 'Moderate activity like walking or gentle yoga boosts energy.',
          wellnessSuggestion: parsed.wellnessSuggestion || 'Prioritize adequate hydration and nutrient-dense foods.',
          moodPattern: parsed.moodPattern || 'Mindfulness and rest help balance stress throughout your routine.',
          cycleInfo: parsed.cycleInfo || 'Tracking your cycle regularly enhances personalized health tracking.',
        },
        disclaimer: MEDICAL_DISCLAIMER,
        generatedAt: new Date(),
      });
    } catch (aiErr) {
      console.warn('⚠️ AI insights generation warning, using rule-based fallback:', aiErr);
      return res.json({
        insights: {
          sleepTrend: 'Aim for 7-8 hours of sleep per night for optimal physical recovery.',
          activitySuggestion: 'Light stretching or a 20-minute daily walk can elevate mood and energy.',
          wellnessSuggestion: 'Drink 8-10 glasses of water daily and include iron-rich foods in your diet.',
          moodPattern: 'Log your daily mood to monitor patterns across your menstrual cycle.',
          cycleInfo: 'Track period start dates to improve cycle phase predictions.',
        },
        disclaimer: MEDICAL_DISCLAIMER,
        generatedAt: new Date(),
      });
    }
  } catch (error: any) {
    console.error('Error fetching AI health insights:', error);
    return res.status(500).json({
      message: 'Unable to generate insights right now. Please try again later.',
      disclaimer: MEDICAL_DISCLAIMER,
    });
  }
};

/**
 * AI Medical Report Analyzer
 * POST /api/ai/analyze-report
 */
export const analyzeMedicalReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { reportId, title, type, notes } = req.body;
    const uploadedFiles = (req.files as Express.Multer.File[] | undefined) ?? [];

    let extractedText = '';
    let imageObservations = '';
    let fileUrl = '';

    if (uploadedFiles.length > 0) {
      const fileSummary = await processUploadedFiles(uploadedFiles);
      const uploadedAssets = await uploadFilesToCloudinary(uploadedFiles);
      extractedText = fileSummary.combinedDocumentText;
      imageObservations = fileSummary.combinedImageObservations;
      fileUrl = uploadedAssets[0]?.url || '';
    }

    if (!extractedText && !imageObservations && !notes) {
      return res.status(400).json({
        message: 'Unable to read this report. Please upload a clearer/supported file.',
        disclaimer: MEDICAL_DISCLAIMER,
      });
    }

    const reportPrompt = `Analyze the following medical report details neutrally and summarize:
Extracted Report Content:
${extractedText || imageObservations || notes}

Instructions:
1. Identify Report Type (e.g., Blood Test, Ultrasound, Prescription, etc.).
2. Extract Date if available.
3. List important lab values with reference ranges if present.
4. For any values that appear outside standard reference ranges, use NEUTRAL wording such as: "This value appears outside the reference range shown in the report. Please discuss it with a qualified healthcare professional."
5. DO NOT diagnose diseases or prescribe medications.

Provide a clear structured summary.`;

    let summaryText = '';
    try {
      summaryText = await generateCombinedMultimodalResponse(
        'User Medical Report Context',
        reportPrompt,
        extractedText,
        imageObservations
      );
    } catch (e) {
      summaryText = `Report Summary for ${title || 'Medical Report'}:\n` +
        `• Type: ${type || 'General Medical Report'}\n` +
        `• Date: ${new Date().toLocaleDateString()}\n` +
        `• Key Finding: Report contents received. If any values appear outside the reference range shown in the report, please discuss them with a qualified healthcare professional.`;
    }

    const analysisObj = {
      summary: summaryText,
      reportType: type || 'Medical Report',
      date: new Date(),
      disclaimer: MEDICAL_DISCLAIMER,
    };

    // If reportId was provided, update existing document in MongoDB
    if (reportId) {
      await MedicalReport.findByIdAndUpdate(reportId, {
        analysis: analysisObj,
        ...(fileUrl ? { fileUrl } : {}),
      });
    } else if (title) {
      await MedicalReport.create({
        userId,
        title,
        type: type || 'Medical Report',
        fileUrl,
        notes,
        analysis: analysisObj,
        date: new Date(),
      });
    }

    return res.json({
      success: true,
      analysis: analysisObj,
      disclaimer: MEDICAL_DISCLAIMER,
    });
  } catch (error: any) {
    console.error('Analyze medical report error:', error);
    return res.status(500).json({
      message: 'Unable to read this report. Please upload a clearer/supported file.',
      disclaimer: MEDICAL_DISCLAIMER,
    });
  }
};
