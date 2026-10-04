import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import MedicalReport from '../models/MedicalReport';
import { processUploadedFiles } from '../services/fileProcessingService';
import { uploadFilesToCloudinary } from '../middleware/upload';
import { generateCombinedMultimodalResponse } from '../services/groqService';

/**
 * Get all medical reports for the logged-in patient
 * GET /api/reports
 */
export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const reports = await MedicalReport.find({ userId }).sort({ date: -1, createdAt: -1 });
    res.json(reports);
  } catch (error: any) {
    console.error('Error fetching medical reports:', error);
    res.status(500).json({ message: 'Failed to retrieve medical reports', error: error?.message });
  }
};

/**
 * Get single report by ID (patient-scoped)
 * GET /api/reports/:id
 */
export const getReportById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const report = await MedicalReport.findOne({ _id: req.params.id, userId });
    if (!report) {
      return res.status(404).json({ message: 'Medical report not found' });
    }
    res.json(report);
  } catch (error: any) {
    console.error('Error fetching medical report:', error);
    res.status(500).json({ message: 'Failed to retrieve report', error: error?.message });
  }
};

/**
 * Create a new medical report with optional file upload, OCR, and AI analysis
 * POST /api/reports
 */
export const createReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { title, type, category, notes, date, analysis, extractedText: providedText, fileUrl: providedUrl } = req.body;
    const uploadedFiles = (req.files as Express.Multer.File[] | undefined) ?? [];

    if (!title) {
      return res.status(400).json({ message: 'Report title is required.' });
    }

    let extractedText = providedText || '';
    let fileUrl = providedUrl || '';
    let fileName = '';
    let fileType = '';
    let fileSize = 0;
    let autoAnalysis = analysis || null;

    if (uploadedFiles.length > 0) {
      const file = uploadedFiles[0];
      fileName = file.originalname;
      fileType = file.mimetype;
      fileSize = file.size;

      try {
        const fileSummary = await processUploadedFiles(uploadedFiles);
        const uploadedAssets = await uploadFilesToCloudinary(uploadedFiles);
        extractedText = fileSummary.combinedDocumentText || fileSummary.combinedImageObservations || extractedText;
        fileUrl = uploadedAssets[0]?.url || fileUrl;

        if (!autoAnalysis && (extractedText || notes)) {
          const reportPrompt = `Analyze the following patient medical report:
Title: ${title}
Type/Category: ${category || type || 'General'}
Content: ${extractedText || notes}

Provide a concise, patient-friendly clinical summary with:
1. Key findings & lab values.
2. What these values typically mean.
3. Relevant self-care and questions to ask a doctor.`;

          try {
            const summary = await generateCombinedMultimodalResponse(
              'Patient Medical Report Upload',
              reportPrompt,
              extractedText,
              fileSummary.combinedImageObservations
            );
            autoAnalysis = {
              summary,
              reportType: category || type || 'Medical Report',
              date: new Date(),
            };
          } catch (aiErr) {
            console.warn('AI analysis skipped for report creation:', aiErr);
          }
        }
      } catch (fileErr) {
        console.warn('File processing warning during report creation:', fileErr);
      }
    }

    const newReport = await MedicalReport.create({
      userId,
      title: title.trim(),
      type: type || category || 'Medical Report',
      category: category || type || 'Blood Test',
      fileUrl,
      fileName,
      fileType,
      fileSize,
      notes: notes ? notes.trim() : undefined,
      extractedText,
      analysis: autoAnalysis,
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json(newReport);
  } catch (error: any) {
    console.error('Error creating medical report:', error);
    res.status(500).json({ message: 'Failed to create medical report', error: error?.message });
  }
};

/**
 * Delete medical report (patient-scoped)
 * DELETE /api/reports/:id
 */
export const deleteReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const deleted = await MedicalReport.findOneAndDelete({ _id: req.params.id, userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Report not found or unauthorized' });
    }
    res.json({ message: 'Medical report deleted successfully', id: req.params.id });
  } catch (error: any) {
    console.error('Error deleting medical report:', error);
    res.status(500).json({ message: 'Failed to delete report', error: error?.message });
  }
};
