
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Appointment from '../models/Appointment';
import Doctor from '../models/Doctor';
import Notification from '../models/Notification';

// Create an appointment
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { doctorId, date, time, notes, type } = req.body;

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointment = await Appointment.create({
      userId: req.user._id,
      doctorId,
      date,
      time,
      notes,
      type,
    });

    // Create notification for doctor
    await Notification.create({
      doctorId,
      type: 'appointment',
      title: 'New Appointment Request',
      message: `${req.user.name} has requested an appointment on ${new Date(date).toLocaleDateString()} at ${time}`,
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's appointments
export const getUserAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const appointments = await Appointment.find({ userId: req.user._id })
      .populate('doctorId', 'name specialty hospital')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get user appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get doctor's appointments
export const getDoctorAppointments = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.doctor) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const appointments = await Appointment.find({ doctorId: req.doctor._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update appointment status
export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.doctor) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { appointmentId } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.doctorId.toString() !== req.doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = status;
    await appointment.save();

    // Create notification for user
    await Notification.create({
      userId: appointment.userId,
      type: 'appointment',
      title: 'Appointment Updated',
      message: `Your appointment has been ${status}`,
    });

    res.json(appointment);
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel an appointment (user)
export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // Create notification for doctor
    await Notification.create({
      doctorId: appointment.doctorId,
      type: 'appointment',
      title: 'Appointment Cancelled',
      message: `${req.user.name} has cancelled their appointment`,
    });

    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
