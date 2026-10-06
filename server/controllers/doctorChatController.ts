import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import DoctorConversation from '../models/DoctorConversation';
import DoctorMessage from '../models/DoctorMessage';
import Doctor from '../models/Doctor';
import User from '../models/User';
import { uploadFilesToCloudinary } from '../middleware/upload';

// Get all doctors (for patients to browse - Admin-created doctors only)
export const getDoctors = async (req: AuthRequest, res: Response) => {
  try {
    const doctors = await Doctor.find({ active: { $ne: false } }).select('-password').sort({ rating: -1 });
    
    // Deduplicate doctors by unique database _id
    const seenIds = new Set<string>();
    const uniqueDoctors = [];
    for (const doc of doctors) {
      const docId = doc._id.toString();
      if (!seenIds.has(docId)) {
        seenIds.add(docId);
        uniqueDoctors.push(doc);
      }
    }
    res.json(uniqueDoctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get or create conversation with a doctor or user
export const getConversation = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.params.doctorId || req.params.targetId;
    if (!targetId) {
      return res.status(400).json({ message: 'Target ID is required' });
    }

    let userId: string;
    let doctorId: string;

    const isDoc = req.role === 'doctor' || Boolean(req.doctor);

    if (isDoc) {
      doctorId = (req.doctor?._id || req.user?._id).toString();
      userId = targetId;
    } else {
      userId = req.user._id.toString();
      doctorId = targetId;
    }

    // Find existing conversations for this (userId, doctorId) pair and merge duplicates if any exist
    const conversations = await DoctorConversation.find({ userId, doctorId }).sort({ createdAt: 1 });
    let conversation;

    if (conversations.length > 1) {
      conversation = conversations[0];
      const primaryId = conversation._id;
      const duplicateIds = conversations.slice(1).map(c => c._id);

      await DoctorMessage.updateMany(
        { conversationId: { $in: duplicateIds } },
        { conversationId: primaryId }
      );
      await DoctorConversation.deleteMany({ _id: { $in: duplicateIds } });
    } else if (conversations.length === 1) {
      conversation = conversations[0];
    }

    if (!conversation) {
      if (isDoc) {
        return res.status(404).json({ message: 'No active conversation found with this patient' });
      }
      // Verify doctor exists before creating conversation for patient
      const doctorExists = await Doctor.findById(doctorId);
      if (!doctorExists) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      conversation = new DoctorConversation({
        userId,
        doctorId,
      });
      await conversation.save();
    }

    // Security Check: User/Doctor must be part of this conversation
    const isUser = req.role === 'patient' && req.user && conversation.userId.toString() === req.user._id.toString();
    const isDoctor = isDoc && conversation.doctorId.toString() === doctorId;

    if (!isUser && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized to access this conversation' });
    }

    const messages = await DoctorMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
    const doctor = await Doctor.findById(doctorId).select('-password');
    const patientUser = await User.findById(userId).select('-password');

    res.json({
      conversation,
      messages,
      doctor,
      patient: patientUser ? { _id: patientUser._id, name: patientUser.name, email: patientUser.email } : null,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Send message (Patient ↔ Doctor)
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId, userId: targetUserId, patientId, conversationId, content } = req.body;
    const uploadedImages = (req.files as Express.Multer.File[] | undefined) ?? [];
    const uploadedAssets = await uploadFilesToCloudinary(uploadedImages);

    if (!String(content || '').trim() && uploadedAssets.length === 0) {
      return res.status(400).json({ message: 'Message content or attachment is required' });
    }

    const attachments = uploadedAssets.map((asset) => ({
      name: asset.originalName,
      type: asset.mimeType,
      size: asset.size,
      dataUrl: asset.url,
      url: asset.url,
    }));

    let senderId: string;
    let senderType: 'patient' | 'doctor';
    let pId: string;
    let dId: string;

    if (req.role === 'doctor' || req.doctor) {
      senderId = (req.doctor?._id || req.user?._id).toString();
      senderType = 'doctor';
      dId = senderId;
      pId = targetUserId || patientId;
    } else {
      senderId = req.user._id.toString();
      senderType = 'patient';
      pId = senderId;
      dId = doctorId;
    }

    if (!pId || !dId) {
      return res.status(400).json({ message: 'Patient ID and Doctor ID are required' });
    }

    let conversation;
    if (conversationId) {
      conversation = await DoctorConversation.findById(conversationId);
    }
    if (!conversation && pId && dId) {
      const conversations = await DoctorConversation.find({ userId: pId, doctorId: dId }).sort({ createdAt: 1 });
      if (conversations.length > 0) {
        conversation = conversations[0];
        if (conversations.length > 1) {
          const duplicateIds = conversations.slice(1).map(c => c._id);
          await DoctorMessage.updateMany({ conversationId: { $in: duplicateIds } }, { conversationId: conversation._id });
          await DoctorConversation.deleteMany({ _id: { $in: duplicateIds } });
        }
      }
    }
    if (!conversation && pId && dId) {
      conversation = new DoctorConversation({ userId: pId, doctorId: dId });
      await conversation.save();
    }

    if (!conversation) {
      return res.status(400).json({ message: 'Invalid conversation parameters' });
    }

    // Security Check
    const isUser = req.role === 'patient' && req.user && conversation.userId.toString() === req.user._id.toString();
    const isDoctor = (req.role === 'doctor' || Boolean(req.doctor)) && conversation.doctorId.toString() === (req.doctor?._id || req.user?._id).toString();
    if (!isUser && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized for this conversation' });
    }

    const message = new DoctorMessage({
      conversationId: conversation._id,
      senderId,
      senderType,
      content: content || '',
      attachments,
    });

    await message.save();

    conversation.lastMessage = content || (attachments.length > 0 ? `Sent ${attachments.length} attachment(s)` : '');
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    await conversation.save();

    const messages = await DoctorMessage.find({ conversationId: conversation._id }).sort({ createdAt: 1 });

    res.json({ message, messages, conversation });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ message: error?.message || 'Server error' });
  }
};

// Get all conversations for current logged-in user or doctor
export const getConversations = async (req: AuthRequest, res: Response) => {
  try {
    if (req.role === 'doctor' || req.doctor) {
      const doctorId = (req.doctor?._id || req.user?._id).toString();
      const conversations = await DoctorConversation.find({ doctorId })
        .populate('userId', 'name email profile')
        .sort({ updatedAt: -1 });

      // Only return conversations where at least 1 message has been exchanged with this doctor
      const activeConversations = [];
      const seenPatientIds = new Set<string>();

      for (const conv of conversations) {
        if (!conv.userId || !(conv.userId as any)._id) continue;
        const patientIdStr = (conv.userId as any)._id.toString();
        if (seenPatientIds.has(patientIdStr)) continue;

        const msgCount = await DoctorMessage.countDocuments({ conversationId: conv._id });
        if (msgCount > 0) {
          seenPatientIds.add(patientIdStr);
          activeConversations.push(conv);
        }
      }
      return res.json(activeConversations);
    } else if (req.user) {
      const userId = req.user._id;
      const conversations = await DoctorConversation.find({ userId })
        .populate('doctorId', 'name specialty specialization qualification experience hospital location fees consultationFee rating online phone profileImage')
        .sort({ updatedAt: -1 });

      const activeConversations = [];
      const seenDoctorIds = new Set<string>();

      for (const conv of conversations) {
        if (!conv.doctorId || !(conv.doctorId as any)._id) continue;
        const docIdStr = (conv.doctorId as any)._id.toString();
        if (seenDoctorIds.has(docIdStr)) continue;

        seenDoctorIds.add(docIdStr);
        activeConversations.push(conv);
      }
      return res.json(activeConversations);
    }
    res.status(401).json({ message: 'Not authorized' });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete conversation
export const deleteConversation = async (req: AuthRequest, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = await DoctorConversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const isUser = req.user && conversation.userId.toString() === req.user._id.toString();
    const isDoctor = req.doctor && conversation.doctorId.toString() === req.doctor._id.toString();

    if (!isUser && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await DoctorMessage.deleteMany({ conversationId });
    await DoctorConversation.findByIdAndDelete(conversationId);

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Delete conversation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

