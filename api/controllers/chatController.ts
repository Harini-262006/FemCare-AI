import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import User from '../models/User';
import MedicalReport from '../models/MedicalReport';
import Prescription from '../models/Prescription';
import { uploadFilesToCloudinary } from '../middleware/upload';
import { generateStreamResponse } from '../services/groqService';
import { processUploadedFiles } from '../services/fileProcessingService';
import { fetchUserHealthContext, buildStructuredHealthContext } from '../services/healthContextService.js';

export function formatUserProfileContext(
  user: any,
  reports: any[] = [],
  prescriptions: any[] = []
): string {
  const userName = user?.name || user?.profile?.name || 'User';
  if (!user || (!user.profile && !user.name)) return `User Name: ${userName}\nProfile: No detailed profile filled out yet.`;

  const p = user.profile || {};
  const lastPeriodStr = p.lastPeriodDate ? new Date(p.lastPeriodDate).toISOString().split('T')[0] : 'Not specified';

  const reportSummaries = reports && reports.length > 0
    ? reports.map(r => `• ${r.title} (${r.type}): ${r.notes || 'No extra notes'}`).join('\n')
    : 'None uploaded in database history';

  const prescriptionSummaries = prescriptions && prescriptions.length > 0
    ? prescriptions.map(pr => `• ${pr.medication} (${pr.dosage}, ${pr.frequency}, for ${pr.duration}): Notes: ${pr.notes || 'None'}`).join('\n')
    : 'None on record in database';

  return `User Name: ${userName}
Age: ${p.age ?? 'Not specified'}
Weight: ${p.weight ? `${p.weight} kg` : 'Not specified'}
Height: ${p.height ? `${p.height} cm` : 'Not specified'}
Blood Group: ${p.bloodGroup || 'Not specified'}
Pregnancy Status: ${p.pregnancyStatus || 'Not specified'}
Trimester: ${p.trimester ? `Trimester ${p.trimester}` : 'Not specified'}
Menstrual Cycle Info: Last Period Date: ${lastPeriodStr}, Cycle Length: ${p.cycleLength ? `${p.cycleLength} days` : 'Not specified'}
Fertility Info: ${p.fertilityInfo || 'Not specified'}
PCOS / PCOD Status: ${p.pcos ? 'Diagnosed with PCOS / PCOD' : 'No'}
Anemia History: ${p.anemiaHistory ? 'History of Iron-deficiency / Anemia' : 'No'}
Thyroid History: ${p.thyroidHistory || 'None reported'}
Diabetes History: ${p.diabetesHistory || 'None reported'}
Blood Pressure (BP) History: ${p.bpHistory || 'Normal'}
Menopause Status: ${p.menopauseStatus || 'Not specified'}
Medical History: ${p.medicalHistory || 'None reported'}
Chronic Conditions: ${p.chronicConditions || 'None reported'}
Allergies: ${p.allergies || 'None reported'}
Current Medications: ${p.currentMedications || 'None'}
Diet Preferences & Nutrition: ${p.dietPreferences || 'General healthy balance'}
Workout & Exercise History: ${p.workoutHistory || p.exerciseLevel || p.lifestyle || 'Moderate activity'}
Previous Surgeries: ${p.previousSurgeries || 'None'}
Family Medical History: ${p.familyMedicalHistory || 'None'}
Water Intake: ${p.waterIntake ? `${p.waterIntake} L/day` : 'Not specified'}
Sleep Hours: ${p.sleepHours ? `${p.sleepHours} hrs/night` : 'Not specified'}
Goals & Personal Notes: ${p.goals || 'General women health & wellness'}
Previous Uploaded Reports (MongoDB):
${reportSummaries}
Doctor Notes & Prescriptions (MongoDB):
${prescriptionSummaries}`;
}

export const createConversation = async (req: AuthRequest, res: Response) => {
  try {
    const conversation = new Conversation({
      userId: req.user._id,
      userEmail: req.user.email,
      title: 'New Multimodal Chat',
    });
    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    const conversations = await Conversation.find({
      $or: [
        { userId: req.user._id, userEmail: req.user.email },
        { userId: req.user._id, userEmail: { $exists: false } },
        { userId: req.user._id, userEmail: null },
      ],
    })
      .sort({ updatedAt: -1 });

    const backfillPromises = conversations
      .filter((conv) => !conv.userEmail)
      .map((conv) => {
        conv.userEmail = req.user.email;
        return conv.save();
      });
    if (backfillPromises.length > 0) {
      await Promise.all(backfillPromises);
    }

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const userIdMatch = conversation.userId.toString() === req.user._id.toString();
    const emailMatch =
      !conversation.userEmail ||
      conversation.userEmail.toString() === req.user.email.toString();
    if (!userIdMatch || !emailMatch) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!conversation.userEmail) {
      conversation.userEmail = req.user.email;
      await conversation.save();
    }
    const messages = await Message.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 });

    const msgBackfill = messages
      .filter((m) => !m.userEmail)
      .map((m) => {
        m.userEmail = req.user.email;
        return m.save();
      });
    if (msgBackfill.length > 0) await Promise.all(msgBackfill);
    res.json({ conversation, messages });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const renameConversation = async (req: AuthRequest, res: Response) => {
  try {
    const rawTitle = req.body.title;
    if (typeof rawTitle !== 'string' || !rawTitle.trim()) {
      return res.status(400).json({ message: 'Conversation title cannot be empty' });
    }
    const trimmedTitle = rawTitle.trim();

    const conversationId = req.params.id || req.params.conversationId;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const userIdMatch = conversation.userId.toString() === req.user._id.toString();
    const emailMatch =
      !conversation.userEmail ||
      conversation.userEmail.toString() === req.user.email.toString();
    if (!userIdMatch || !emailMatch) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!conversation.userEmail) {
      conversation.userEmail = req.user.email;
    }
    conversation.title = trimmedTitle;
    conversation.isCustomTitle = true;
    await conversation.save();
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const userIdMatch = conversation.userId.toString() === req.user._id.toString();
    const emailMatch =
      !conversation.userEmail ||
      conversation.userEmail.toString() === req.user.email.toString();
    if (!userIdMatch || !emailMatch) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Message.deleteMany({ conversationId: req.params.id });
    await Conversation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const rawContent = req.body.message || req.body.content || '';
    const conversationId = req.body.conversationId;
    const userId = req.user._id;
    const userEmail = req.user.email;

    const uploadedFiles = (req.files as Express.Multer.File[] | undefined) ?? [];
    const hasFiles = uploadedFiles.length > 0;

    if (!String(rawContent || '').trim() && !hasFiles) {
      return res
        .status(400)
        .json({ message: 'Message content or an uploaded file is required' });
    }

    console.log(`📥 [API /chat/message] Received request from user ${userId} (hasFiles: ${hasFiles}, count: ${uploadedFiles.length}).`);

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

    const imageUrls: string[] = uploadedAssets.filter(a => a.isImage).map(a => a.url);
    const fileUrls: string[] = uploadedAssets.filter(a => !a.isImage).map(a => a.url);

    const finalMetadata = fileSummary.attachmentsMetadata.map((meta, idx) => {
      return {
        ...meta,
        url: uploadedAssets[idx]?.url || meta.url
      };
    });

    let conversation;
    if (!conversationId) {
      const fallbackTitle = rawContent
        ? String(rawContent).slice(0, 30) + (String(rawContent).length > 30 ? '...' : '')
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
      const emailMatch =
        !conversation.userEmail ||
        conversation.userEmail.toString() === userEmail.toString();
      if (!userIdMatch || !emailMatch) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      if (!conversation.userEmail) {
        conversation.userEmail = userEmail;
        await conversation.save();
      }
    }

    const realUserContent = String(rawContent || '').trim() || (hasFiles ? 'Please analyze my uploaded attachment(s).' : 'Hello FemCare AI');
    const userMessage = new Message({
      conversationId: conversation._id,
      userId,
      userEmail,
      role: 'user',
      content: realUserContent,
      images: imageUrls,
      files: fileUrls,
      attachmentsMetadata: finalMetadata,
    });
    await userMessage.save();

    // Retrieve user health context efficiently with query relevance
    const healthData = await fetchUserHealthContext(String(userId), realUserContent);
    const profileContext = buildStructuredHealthContext(healthData);

    console.log(`👤 [MongoDB Unified Health Context Built for User ${userId}]:\n${profileContext}`);

    const previousMessages = await Message.find({
      conversationId: conversation._id,
      _id: { $ne: userMessage._id },
    })
      .sort({ createdAt: 1 })
      .select('role content');

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    const promptUserText = realUserContent;

    let aiContent = '';

    try {
      const stream = await generateStreamResponse(
        profileContext,
        previousMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        promptUserText,
        imageUrls,
        fileSummary.extractedText,
        fileSummary.combinedAudioTranscription,
        fileSummary.combinedImageObservations,
        fileSummary.combinedVideoObservations
      );
      for await (const chunk of stream) {
        aiContent += chunk;
        res.write(chunk);
      }
    } catch (aiError: any) {
      console.error('❌ AI Service Streaming Failure:', aiError?.message || aiError);
      aiContent = `I'm sorry, FemCare AI is temporarily unable to connect to the AI service right now. Please check your connection or try again. 💕`;
      res.write(aiContent);
    }

    const finalAiContent = String(aiContent || '').trim() || 'I reviewed your request and attachments. Please let me know if you have specific questions! 💕';
    const aiMessage = new Message({
      conversationId: conversation._id,
      userId,
      userEmail,
      role: 'assistant',
      content: finalAiContent,
      images: imageUrls,
      files: fileUrls,
      attachmentsMetadata: finalMetadata,
    });
    await aiMessage.save();

    conversation.updatedAt = new Date();
    await conversation.save();

    res.end();
  } catch (error) {
    console.error('Send message error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    } else {
      res.end();
    }
  }
};

export const regenerateResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const userEmail = req.user.email;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    const userIdMatch = conversation.userId.toString() === userId.toString();
    const emailMatch =
      !conversation.userEmail ||
      conversation.userEmail.toString() === userEmail.toString();
    if (!userIdMatch || !emailMatch) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });

    const lastAiMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (lastAiMessage) {
      await Message.findByIdAndDelete(lastAiMessage._id);
    }

    await sendMessage(req, res);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const feedbackMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { feedback } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    const userIdMatch = message.userId.toString() === req.user._id.toString();
    const emailMatch =
      !message.userEmail ||
      message.userEmail.toString() === req.user.email.toString();
    if (!userIdMatch || !emailMatch) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (!message.userEmail) {
      message.userEmail = req.user.email;
    }
    message.feedback = feedback;
    await message.save();
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
