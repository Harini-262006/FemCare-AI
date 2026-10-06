import { Response } from 'express';
import bcrypt from 'bcryptjs';
import Doctor from '../models/Doctor';
import { AuthRequest } from '../middleware/auth';

/**
 * Get all doctors (Admin view)
 * GET /api/admin/doctors
 */
export const getAdminDoctors = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doctors = await Doctor.find().select('-password').sort({ createdAt: -1 });
    res.json(doctors);
  } catch (error) {
    console.error('Get admin doctors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Add a new doctor (Admin)
 * POST /api/admin/doctors
 */
export const addDoctorByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      email,
      password,
      phone,
      specialization,
      specialty,
      qualification,
      experience,
      hospital,
      location,
      consultationFee,
      fees,
      profileImage,
      rating,
      availableTime,
      videoLink,
    } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400).json({ message: 'Doctor Name is required' });
      return;
    }

    const trimmedName = String(name).trim();
    const cleanName = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const firstName = trimmedName.split(' ')[0] || 'Doctor';
    const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    // Default Email: sarahjohnson@gmail.com
    const docEmail = email && String(email).trim().length > 0
      ? String(email).toLowerCase().trim()
      : `${cleanName}@gmail.com`;

    // Default Password: Sarah@123
    const docPassword = password && String(password).trim().length > 0
      ? String(password).trim()
      : `${formattedFirstName}@123`;

    const doctorExists = await Doctor.findOne({
      $or: [{ email: docEmail }, { name: trimmedName }],
    });
    if (doctorExists) {
      res.status(400).json({ message: `Doctor record for "${trimmedName}" or "${docEmail}" already exists` });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(docPassword, salt);

    const docSpecialty = specialization || specialty || 'General Physician';
    const docFees = consultationFee !== undefined ? Number(consultationFee) : (fees !== undefined ? Number(fees) : 0);

    const doctor = await Doctor.create({
      name: trimmedName,
      email: docEmail,
      password: hashedPassword,
      phone: phone || '',
      specialty: docSpecialty,
      specialization: docSpecialty,
      qualification: qualification || 'MD, MBBS',
      experience: Number(experience) || 0,
      hospital: hospital || 'FemCare Clinic',
      location: location || 'Main Hospital',
      fees: docFees,
      consultationFee: docFees,
      profileImage: profileImage || '',
      rating: Number(rating) || 5,
      availableTime: availableTime || ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
      videoLink: videoLink || '',
      online: true,
      active: true,
      role: 'doctor',
    });

    console.log(`✅ [Admin] Created doctor account: ${doctor.name} -> Email: ${doctor.email} | Initial Password: ${docPassword}`);

    res.status(201).json({
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      generatedPassword: docPassword,
      phone: doctor.phone,
      specialty: doctor.specialty,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      hospital: doctor.hospital,
      location: doctor.location,
      fees: doctor.fees,
      consultationFee: doctor.consultationFee,
      profileImage: doctor.profileImage,
      rating: doctor.rating,
      role: 'doctor',
    });
  } catch (error: any) {
    console.error('Add doctor by admin error:', error);
    res.status(500).json({ message: error.message || 'Server error adding doctor' });
  }
};

/**
 * Edit doctor details (Admin)
 * PUT /api/admin/doctors/:id
 */
export const updateDoctorByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }

    const {
      name,
      email,
      password,
      phone,
      specialization,
      specialty,
      qualification,
      experience,
      hospital,
      location,
      consultationFee,
      fees,
      profileImage,
      rating,
      availableTime,
      videoLink,
      online,
      active,
    } = req.body;

    if (name !== undefined) doctor.name = name;
    if (email !== undefined) doctor.email = email;
    if (phone !== undefined) doctor.phone = phone;
    if (specialization !== undefined) {
      doctor.specialization = specialization;
      doctor.specialty = specialization;
    } else if (specialty !== undefined) {
      doctor.specialty = specialty;
      doctor.specialization = specialty;
    }
    if (qualification !== undefined) doctor.qualification = qualification;
    if (experience !== undefined) doctor.experience = Number(experience);
    if (hospital !== undefined) doctor.hospital = hospital;
    if (location !== undefined) doctor.location = location;
    if (consultationFee !== undefined) {
      doctor.consultationFee = Number(consultationFee);
      doctor.fees = Number(consultationFee);
    } else if (fees !== undefined) {
      doctor.fees = Number(fees);
      doctor.consultationFee = Number(fees);
    }
    if (profileImage !== undefined) doctor.profileImage = profileImage;
    if (rating !== undefined) doctor.rating = Number(rating);
    if (availableTime !== undefined) doctor.availableTime = availableTime;
    if (videoLink !== undefined) doctor.videoLink = videoLink;
    if (online !== undefined) doctor.online = Boolean(online);
    if (active !== undefined) doctor.active = Boolean(active);

    if (password && password.trim().length > 0) {
      const salt = await bcrypt.genSalt(10);
      doctor.password = await bcrypt.hash(password.trim(), salt);
    }

    const updatedDoctor = await doctor.save();
    const result = updatedDoctor.toObject();
    delete (result as any).password;

    res.json(result);
  } catch (error: any) {
    console.error('Update doctor by admin error:', error);
    res.status(500).json({ message: error.message || 'Server error updating doctor' });
  }
};

/**
 * Delete / deactivate doctor (Admin)
 * DELETE /api/admin/doctors/:id
 */
export const deleteDoctorByAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findByIdAndDelete(id);

    if (!doctor) {
      res.status(404).json({ message: 'Doctor not found' });
      return;
    }

    res.json({ message: 'Doctor deleted successfully', id });
  } catch (error: any) {
    console.error('Delete doctor error:', error);
    res.status(500).json({ message: 'Server error deleting doctor' });
  }
};
