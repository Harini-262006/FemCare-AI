import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import EmergencyContact from '../models/EmergencyContact';

export const getEmergencyContacts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const contacts = await EmergencyContact.find({ userId }).sort({ isPrimary: -1, createdAt: -1 });
    res.json(contacts);
  } catch (error: any) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ message: 'Failed to fetch emergency contacts', error: error?.message });
  }
};

export const addEmergencyContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { name, relationship, phone, email, address, isPrimary } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Contact name is required.' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }
    if (!relationship || !relationship.trim()) {
      return res.status(400).json({ message: 'Relationship is required.' });
    }

    if (isPrimary) {
      await EmergencyContact.updateMany({ userId }, { isPrimary: false });
    }

    const contact = new EmergencyContact({
      userId,
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : '',
      address: address ? address.trim() : '',
      isPrimary: Boolean(isPrimary),
    });

    await contact.save();
    res.status(201).json(contact);
  } catch (error: any) {
    console.error('Error saving emergency contact:', error);
    res.status(500).json({ message: 'Failed to save emergency contact', error: error?.message });
  }
};

export const updateEmergencyContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, relationship, phone, email, address, isPrimary } = req.body;

    const contact = await EmergencyContact.findOne({ _id: id, userId });
    if (!contact) {
      return res.status(404).json({ message: 'Emergency contact not found.' });
    }

    if (name !== undefined) contact.name = name.trim();
    if (relationship !== undefined) contact.relationship = relationship.trim();
    if (phone !== undefined) contact.phone = phone.trim();
    if (email !== undefined) contact.email = email.trim();
    if (address !== undefined) contact.address = address.trim();

    if (isPrimary) {
      await EmergencyContact.updateMany({ userId, _id: { $ne: id } }, { isPrimary: false });
      contact.isPrimary = true;
    } else if (isPrimary === false) {
      contact.isPrimary = false;
    }

    await contact.save();
    res.json(contact);
  } catch (error: any) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({ message: 'Failed to update emergency contact', error: error?.message });
  }
};

export const deleteEmergencyContact = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const deleted = await EmergencyContact.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Emergency contact not found or unauthorized.' });
    }

    res.json({ message: 'Emergency contact deleted successfully', id });
  } catch (error: any) {
    console.error('Error deleting emergency contact:', error);
    res.status(500).json({ message: 'Failed to delete emergency contact', error: error?.message });
  }
};
