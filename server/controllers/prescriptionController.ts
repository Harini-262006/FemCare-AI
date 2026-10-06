import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Prescription from '../models/Prescription';
import DoctorConversation from '../models/DoctorConversation';
import Notification from '../models/Notification';
import User from '../models/User';
import Doctor from '../models/Doctor';

/**
 * Get prescriptions for logged-in User or Doctor
 * GET /api/prescriptions
 */
export const getPrescriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (req.role === 'doctor' || req.doctor) {
      const doctorId = (req.doctor?._id || req.user?._id).toString();
      const { patientId } = req.query;

      const query: any = { doctorId };
      if (patientId) {
        query.userId = patientId;
      }

      const prescriptions = await Prescription.find(query)
        .populate('userId', 'name email profile')
        .sort({ date: -1 });

      res.json(prescriptions);
      return;
    }

    if (req.user) {
      const userId = req.user._id;
      const prescriptions = await Prescription.find({ userId })
        .populate('doctorId', 'name specialty hospital phone')
        .sort({ date: -1 });

      res.json(prescriptions);
      return;
    }

    res.status(401).json({ message: 'Not authorized' });
  } catch (error: any) {
    console.error('Get prescriptions error:', error);
    res.status(500).json({ message: error?.message || 'Server error fetching prescriptions' });
  }
};

/**
 * Create a new prescription (Doctor only)
 * POST /api/prescriptions
 */
export const createPrescription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isDoctor = req.role === 'doctor' || Boolean(req.doctor);
    if (!isDoctor) {
      res.status(403).json({ message: 'Only authorized doctors can issue prescriptions' });
      return;
    }

    const doctorId = (req.doctor?._id || req.user?._id).toString();
    const { userId, medication, dosage, frequency, duration, notes, instructions } = req.body;

    if (!userId || !medication || !dosage || !frequency || !duration) {
      res.status(400).json({ message: 'Patient, Medication Name, Dosage, Frequency, and Duration are required' });
      return;
    }

    // Security check: Verify doctor has an active conversation / relationship with this patient
    const conversation = await DoctorConversation.findOne({ userId, doctorId });
    if (!conversation) {
      res.status(403).json({ message: 'Cannot create prescription for a patient who has not consulted with you' });
      return;
    }

    const prescription = await Prescription.create({
      userId,
      doctorId,
      medication: String(medication).trim(),
      dosage: String(dosage).trim(),
      frequency: String(frequency).trim(),
      duration: String(duration).trim(),
      notes: notes || instructions || '',
      date: new Date(),
    });

    const docObj = await Doctor.findById(doctorId).select('name specialty');
    const doctorName = docObj?.name || 'Your Doctor';

    // Create notification for patient
    await Notification.create({
      userId,
      type: 'reminder',
      title: 'New Prescription Issued',
      message: `${doctorName} has issued a prescription for ${medication} (${dosage}, ${frequency}).`,
      read: false,
    });

    res.status(201).json(prescription);
  } catch (error: any) {
    console.error('Create prescription error:', error);
    res.status(500).json({ message: error?.message || 'Server error creating prescription' });
  }
};

/**
 * Delete a prescription
 * DELETE /api/prescriptions/:id
 */
export const deletePrescription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findById(id);

    if (!prescription) {
      res.status(404).json({ message: 'Prescription not found' });
      return;
    }

    const isDoc = (req.role === 'doctor' || Boolean(req.doctor)) && prescription.doctorId.toString() === (req.doctor?._id || req.user?._id).toString();
    const isUser = req.user && prescription.userId.toString() === req.user._id.toString();

    if (!isDoc && !isUser) {
      res.status(403).json({ message: 'Not authorized to delete this prescription' });
      return;
    }

    await Prescription.findByIdAndDelete(id);
    res.json({ message: 'Prescription deleted successfully', id });
  } catch (error: any) {
    console.error('Delete prescription error:', error);
    res.status(500).json({ message: error?.message || 'Server error deleting prescription' });
  }
};
