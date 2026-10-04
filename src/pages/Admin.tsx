import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BackToHomeButton from '@/components/BackToHomeButton';
import { motion } from 'framer-motion';
import {
  Edit2,
  Save,
  X,
  Stethoscope,
  Clock,
  MapPin,
  Star,
  Phone,
  CheckCircle,
  Plus,
  Trash2,
  Mail,
  GraduationCap,
  Building2,
  Lock,
  Image as ImageIcon,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore, type Doctor } from '@/store';
import { adminAPI } from '@/services/api';

export default function Admin() {
  const navigate = useNavigate();
  const logoutUser = useAppStore((state) => state.logoutUser);
  const { addDoctor: addStoreDoctor, updateDoctor: updateStoreDoctor, deleteDoctor: deleteStoreDoctor } = useAppStore();

  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingDoctor, setEditingDoctor] = useState<string | null>(null);
  const [addingDoctor, setAddingDoctor] = useState(false);
  
  const [editForm, setEditForm] = useState<any>({});
  const [addForm, setAddForm] = useState<any>({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: 'Gynecologist',
    qualification: 'MD, MBBS',
    experience: 5,
    hospital: 'FemCare Women Clinic',
    location: 'City Center',
    consultationFee: 1500,
    profileImage: '',
    rating: 5,
  });

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getDoctors();
      setDoctorsList(data);
    } catch (err: any) {
      console.error('Failed to fetch admin doctors:', err);
      setError('Could not load doctors from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleEdit = (doctor: any) => {
    setAddingDoctor(false);
    setEditingDoctor(doctor._id || doctor.id);
    setEditForm({
      name: doctor.name || '',
      email: doctor.email || '',
      password: '',
      phone: doctor.phone || '',
      specialization: doctor.specialization || doctor.specialty || '',
      qualification: doctor.qualification || '',
      experience: doctor.experience || 0,
      hospital: doctor.hospital || '',
      location: doctor.location || '',
      consultationFee: doctor.consultationFee || doctor.fees || 0,
      profileImage: doctor.profileImage || '',
      rating: doctor.rating || 5,
    });
  };

  const handleSave = async () => {
    if (!editingDoctor) return;
    try {
      setError('');
      setSuccess('');
      const updated = await adminAPI.updateDoctor(editingDoctor, editForm);
      setSuccess(`Successfully updated ${updated.name}!`);
      setEditingDoctor(null);
      setEditForm({});
      fetchDoctors();
    } catch (err: any) {
      console.error('Save doctor error:', err);
      setError(err.message || 'Failed to update doctor details');
    }
  };

  const handleNameChange = (val: string) => {
    const trimmed = val.trim();
    const cleanName = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    const firstName = trimmed.split(' ')[0] || '';
    const formattedFirstName = firstName ? firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase() : '';
    
    setAddForm((prev: any) => ({
      ...prev,
      name: val,
      email: prev.userEditedEmail ? prev.email : (cleanName ? `${cleanName}@gmail.com` : ''),
      password: prev.userEditedPassword ? prev.password : (formattedFirstName ? `${formattedFirstName}@123` : ''),
    }));
  };

  const handleAddDoctor = async () => {
    if (!addForm.name || !addForm.name.trim()) {
      setError('Doctor Name is required');
      return;
    }

    const trimmedName = addForm.name.trim();
    const cleanName = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const firstName = trimmedName.split(' ')[0] || 'Doctor';
    const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    const finalEmail = addForm.email && addForm.email.trim() ? addForm.email.trim() : `${cleanName}@gmail.com`;
    const finalPassword = addForm.password && addForm.password.trim() ? addForm.password.trim() : `${formattedFirstName}@123`;

    try {
      setError('');
      setSuccess('');
      const created: any = await adminAPI.addDoctor({
        name: trimmedName,
        email: finalEmail,
        password: finalPassword,
        phone: addForm.phone,
        specialization: addForm.specialization || 'Gynecologist',
        qualification: addForm.qualification || 'MD, MBBS',
        experience: Number(addForm.experience) || 5,
        hospital: addForm.hospital || 'FemCare Clinic',
        location: addForm.location || 'City Hospital',
        consultationFee: Number(addForm.consultationFee) || 1500,
        profileImage: addForm.profileImage || '',
        rating: Number(addForm.rating) || 5,
      });

      setSuccess(`Doctor ${created.name} created! Login Email: ${finalEmail} | Password: ${finalPassword}`);
      setAddingDoctor(false);
      setAddForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        specialization: 'Gynecologist',
        qualification: 'MD, MBBS',
        experience: 5,
        hospital: 'FemCare Women Clinic',
        location: 'City Center',
        consultationFee: 1500,
        profileImage: '',
        rating: 5,
        userEditedEmail: false,
        userEditedPassword: false,
      });
      fetchDoctors();
    } catch (err: any) {
      console.error('Add doctor error:', err);
      setError(err.message || 'Failed to add new doctor');
    }
  };

  const handleDeleteDoctor = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete / deactivate ${name}?`)) return;
    try {
      setError('');
      setSuccess('');
      await adminAPI.deleteDoctor(id);
      setSuccess(`Doctor ${name} removed.`);
      fetchDoctors();
    } catch (err: any) {
      console.error('Delete doctor error:', err);
      setError(err.message || 'Failed to delete doctor');
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-emerald-100">
          <div className="flex items-center gap-4">
            <BackToHomeButton />
            <div>
              <h1 className="text-3xl font-black text-gray-900 flex items-center gap-2">
                FemCare AI <span className="text-sm bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">Admin Portal</span>
              </h1>
              <p className="text-xs text-gray-500 font-semibold">Doctor Management & Control Center</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-bold flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl text-sm font-bold flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-emerald-50">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Stethoscope className="w-6 h-6" />
              </div>
              Registered Doctors ({doctorsList.length})
            </h2>
            <button
              onClick={() => {
                setEditingDoctor(null);
                setAddingDoctor(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Add New Doctor
            </button>
          </div>

          {/* Add Doctor Form */}
          {addingDoctor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 p-6 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 rounded-3xl border border-emerald-200 shadow-inner"
            >
              <h3 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" />
                Add New Doctor Record
              </h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Doctor Name *</label>
                    <input
                      type="text"
                      value={addForm.name || ''}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Sarah Johnson"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Email (Auto-generated if empty)</label>
                    <input
                      type="email"
                      value={addForm.email || ''}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value, userEditedEmail: true })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. sarahjohnson@gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Password (Auto-generated if empty)</label>
                    <input
                      type="text"
                      value={addForm.password || ''}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value, userEditedPassword: true })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Sarah@123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={addForm.phone || ''}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Specialization / Specialty</label>
                    <input
                      type="text"
                      value={addForm.specialization || ''}
                      onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="Gynecologist & Obstetrician"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      value={addForm.qualification || ''}
                      onChange={(e) => setAddForm({ ...addForm, qualification: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="MD, MBBS, DGO"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      value={addForm.experience || 0}
                      onChange={(e) => setAddForm({ ...addForm, experience: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Hospital / Clinic</label>
                    <input
                      type="text"
                      value={addForm.hospital || ''}
                      onChange={(e) => setAddForm({ ...addForm, hospital: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="FemCare Health Center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={addForm.location || ''}
                      onChange={(e) => setAddForm({ ...addForm, location: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="New Delhi, India"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={addForm.consultationFee || 0}
                      onChange={(e) => setAddForm({ ...addForm, consultationFee: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Profile Image URL</label>
                    <input
                      type="url"
                      value={addForm.profileImage || ''}
                      onChange={(e) => setAddForm({ ...addForm, profileImage: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Rating (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={addForm.rating || 5}
                      onChange={(e) => setAddForm({ ...addForm, rating: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-4 pt-2">
                  <button
                    onClick={() => setAddingDoctor(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={handleAddDoctor}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Doctor to MongoDB
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Doctor List */}
          {loading ? (
            <div className="text-center py-16 text-gray-500 font-bold">Loading doctor records from database...</div>
          ) : doctorsList.length === 0 ? (
            <div className="text-center py-16 text-gray-500 font-medium">
              No doctors found in database. Click "Add New Doctor" above to create one.
            </div>
          ) : (
            <div className="space-y-4">
              {doctorsList.map((doc) => {
                const docId = doc._id || doc.id;
                const isEditing = editingDoctor === docId;
                return (
                  <div key={docId} className="border border-gray-200 rounded-2xl p-5 hover:border-emerald-200 transition-all bg-white">
                    {isEditing ? (
                      <div className="space-y-4">
                        <h4 className="font-bold text-gray-900 text-base">Edit Doctor Details</h4>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Name</label>
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              className="w-full px-3 py-2 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Email</label>
                            <input
                              type="email"
                              value={editForm.email || ''}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full px-3 py-2 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">New Password (optional)</label>
                            <input
                              type="password"
                              value={editForm.password || ''}
                              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              className="w-full px-3 py-2 border rounded-xl"
                              placeholder="Leave blank to keep unchanged"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Phone</label>
                            <input
                              type="text"
                              value={editForm.phone || ''}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full px-3 py-2 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Specialization</label>
                            <input
                              type="text"
                              value={editForm.specialization || ''}
                              onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                              className="w-full px-3 py-2 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Qualification</label>
                            <input
                              type="text"
                              value={editForm.qualification || ''}
                              onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                              className="w-full px-3 py-2 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Experience (Yrs)</label>
                            <input
                              type="number"
                              value={editForm.experience || 0}
                              onChange={(e) => setEditForm({ ...editForm, experience: Number(e.target.value) })}
                              className="w-full px-3 py-2 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Hospital</label>
                            <input
                              type="text"
                              value={editForm.hospital || ''}
                              onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })}
                              className="w-full px-3 py-2 border rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">Fee (₹)</label>
                            <input
                              type="number"
                              value={editForm.consultationFee || 0}
                              onChange={(e) => setEditForm({ ...editForm, consultationFee: Number(e.target.value) })}
                              className="w-full px-3 py-2 border rounded-xl"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button onClick={() => setEditingDoctor(null)} className="px-4 py-2 border rounded-xl font-bold text-xs">Cancel</button>
                          <button onClick={handleSave} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Save</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl font-black shadow-md flex-shrink-0">
                            {doc.profileImage ? (
                              <img src={doc.profileImage} alt={doc.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                              doc.name?.charAt(0) || 'D'
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900 text-lg">{doc.name}</h3>
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                                {doc.specialization || doc.specialty}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-1 font-medium">
                              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-gray-400" /> {doc.email}</span>
                              <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-gray-400" /> {doc.phone || 'N/A'}</span>
                              <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5 text-gray-400" /> {doc.qualification || 'MD, MBBS'}</span>
                              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5 text-gray-400" /> {doc.hospital}</span>
                              <span className="flex items-center gap-1 font-bold text-emerald-700">₹{(doc.consultationFee || doc.fees || 0).toLocaleString('en-IN')}/consult</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => handleEdit(doc)}
                            className="p-2.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-xl transition-all"
                            title="Edit Doctor"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(docId, doc.name)}
                            className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all"
                            title="Delete Doctor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
