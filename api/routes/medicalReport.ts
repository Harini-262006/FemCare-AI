import express from 'express';
import { getReports, getReportById, createReport, deleteReport } from '../controllers/medicalReportController';
import { protect } from '../middleware/auth';
import upload from '../middleware/upload';

const router = express.Router();

router.use(protect);

router.get('/', getReports);
router.get('/:id', getReportById);
router.post('/', upload.array('files', 5), createReport);
router.delete('/:id', deleteReport);

export default router;
