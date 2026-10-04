import express from 'express';
import {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  regenerateResponse,
  renameConversation,
  feedbackMessage,
  deleteConversation
} from "../controllers/chatController";
import { handleAiChat } from "../controllers/aiChatController";
import { protect } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

router.use(protect);

router.post('/', createConversation);
router.get('/', getConversations);
router.get('/:id', getConversation);
router.patch('/:id/rename', renameConversation);
router.patch('/:id', renameConversation);
router.delete('/:id', deleteConversation);
router.post('/message', upload.array('files', 5), sendMessage);
router.post('/chat', upload.array('files', 5), handleAiChat);
router.post('/:conversationId/regenerate', regenerateResponse);
router.patch('/message/:id/feedback', feedbackMessage);

export default router;
