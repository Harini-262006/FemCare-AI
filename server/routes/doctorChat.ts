import express from 'express';
import {
  getDoctors,
  getConversation,
  sendMessage,
  getConversations,
  deleteConversation,
} from '../controllers/doctorChatController';
import { protect } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

router.use(protect);

// Doctors
router.get('/doctors', getDoctors);

// Doctor chat
router.get('/conversations', getConversations);
router.get('/:doctorId', getConversation);
router.post('/send', upload.any(), sendMessage); // Allow up to 5 files/images
router.delete('/:conversationId', deleteConversation);

export default router;
