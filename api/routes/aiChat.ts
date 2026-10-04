import express from 'express';
import { handleAiChat, getAiHealthInsights, analyzeMedicalReport } from '../controllers/aiChatController';
import { protect } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

router.use(protect);

// POST /api/ai/chat - Multimodal AI Chat endpoint
router.post('/chat', upload.array('files', 5), handleAiChat);
router.post('/', upload.array('files', 5), handleAiChat);

// POST /api/ai/insights - AI Health Insights endpoint
router.post('/insights', getAiHealthInsights);
router.get('/insights', getAiHealthInsights);

// POST /api/ai/analyze-report - AI Medical Report Analyzer endpoint
router.post('/analyze-report', upload.array('files', 5), analyzeMedicalReport);

export default router;
