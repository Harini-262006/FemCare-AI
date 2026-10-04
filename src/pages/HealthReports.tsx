import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PageHeader from '@/components/PageHeader';
import { useAppStore, useMedicalReports, MedicalReport, MedicalReportFile } from '@/store';
import { aiInsightsAPI, reportsAPI } from '../services/api';
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Calendar,
  Plus,
  X,
  ChevronRight,
  Search,
  Filter,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Stethoscope,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: MedicalReport['category'][] = [
  'Blood Test',
  'Scan',
  'Prescription',
  'Discharge',
  'Checkup',
  'Other',
];

const CATEGORY_GRADIENT: Record<MedicalReport['category'], string> = {
  'Blood Test': 'from-rose-100 to-pink-100 text-rose-700 border-rose-200',
  Scan: 'from-purple-100 to-indigo-100 text-purple-700 border-purple-200',
  Prescription: 'from-teal-100 to-cyan-100 text-teal-700 border-teal-200',
  Discharge: 'from-amber-100 to-orange-100 text-amber-700 border-amber-200',
  Checkup: 'from-emerald-100 to-green-100 text-emerald-700 border-emerald-200',
  Other: 'from-slate-100 to-gray-100 text-slate-700 border-slate-200',
};

const ACCEPTED_FILES = 'application/pdf,image/jpeg,image/png';
const ACCEPTED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : '';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export default function HealthReports() {
  const reports = useMedicalReports();
  const addMedicalReport = useAppStore((s) => s.addMedicalReport);
  const deleteMedicalReport = useAppStore((s) => s.deleteMedicalReport);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<MedicalReport | null>(null);
  const [summaryReport, setSummaryReport] = useState<MedicalReport | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // AI Report Analyzer State
  const [analyzingReport, setAnalyzingReport] = useState<MedicalReport | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    summary: string;
    reportType: string;
    date: string;
    disclaimer: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeReport = async (report: MedicalReport) => {
    try {
      setAnalyzingReport(report);
      setIsAnalyzing(true);
      setAnalysisResult(null);
      const res = await aiInsightsAPI.analyzeReport({
        reportId: report.id,
        title: report.title,
        type: report.category,
        notes: report.notes,
      });
      if (res && res.analysis) {
        setAnalysisResult(res.analysis);
      }
    } catch (err) {
      console.error('Failed to analyze report:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MedicalReport['category']>('Blood Test');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDoctor, setFormDoctor] = useState('');
  const [formHospital, setFormHospital] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const resetForm = useCallback(() => {
    setFormTitle('');
    setFormCategory('Blood Test');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDoctor('');
    setFormHospital('');
    setFormNotes('');
    setSelectedFile(null);
    setSelectedPreview(null);
    setIsSaving(false);
  }, []);

  const openUploadModal = useCallback(() => {
    resetForm();
    setShowUploadModal(true);
  }, [resetForm]);

  const closeUploadModal = useCallback(() => {
    setShowUploadModal(false);
    resetForm();
  }, [resetForm]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const isValidExt = ACCEPTED_EXTENSIONS.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );
      if (!isValidExt) {
        alert('Please upload a PDF, JPG, or PNG file.');
        return;
      }
      setSelectedFile(file);
      const dataUrl = await fileToBase64(file);
      setSelectedPreview(dataUrl);
      if (!formTitle.trim()) {
        setFormTitle(file.name.replace(/\.[^.]+$/, ''));
      }
    },
    [formTitle]
  );

  const onDropZoneClick = () => fileInputRef.current?.click();

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  useEffect(() => {
    const fetchBackendReports = async () => {
      try {
        const backendReports = await reportsAPI.getReports();
        if (Array.isArray(backendReports) && backendReports.length > 0) {
          backendReports.forEach((br) => {
            const exists = reports.some((r) => r.id === br._id || r.title === br.title);
            if (!exists) {
              addMedicalReport({
                id: br._id,
                title: br.title,
                category: (br.category as MedicalReport['category']) || 'Blood Test',
                date: br.date ? new Date(br.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                notes: br.notes,
                file: {
                  name: br.fileName || br.title,
                  type: br.fileType || 'application/pdf',
                  size: br.fileSize || 0,
                  dataUrl: br.fileUrl || '',
                },
                uploadedAt: br.createdAt ? new Date(br.createdAt) : new Date(),
              });
            }
          });
        }
      } catch (e) {
        // Fall back to local store
      }
    };
    fetchBackendReports();
  }, []);

  const handleSaveReport = async () => {
    if (!formTitle.trim()) {
      alert('Please enter a report title.');
      return;
    }
    if (!selectedFile || !selectedPreview) {
      alert('Please select a file to upload.');
      return;
    }
    setIsSaving(true);

    const reportFile: MedicalReportFile = {
      name: selectedFile.name,
      type: selectedFile.type,
      size: selectedFile.size,
      dataUrl: selectedPreview,
    };

    const tempId = 'report-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    let finalId = tempId;

    try {
      const serverReport = await reportsAPI.createReport({
        title: formTitle.trim(),
        category: formCategory,
        notes: formNotes.trim() || undefined,
        date: formDate,
        files: [selectedFile],
      });
      if (serverReport && serverReport._id) {
        finalId = serverReport._id;
      }
    } catch (apiErr) {
      console.warn('Backend report sync warning, saved to local store:', apiErr);
    }

    const report: MedicalReport = {
      id: finalId,
      title: formTitle.trim(),
      category: formCategory,
      date: formDate,
      doctorName: formDoctor.trim() || undefined,
      hospital: formHospital.trim() || undefined,
      notes: formNotes.trim() || undefined,
      file: reportFile,
      uploadedAt: new Date(),
    };

    addMedicalReport(report);
    setIsSaving(false);
    closeUploadModal();
  };

  const handleDelete = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMedicalReport(id);
      try {
        await reportsAPI.deleteReport(id);
      } catch (e) {
        // ignore delete API error if local
      }
    }
  };

  const handleView = (report: MedicalReport) => {
    const isImage = report.file.type.startsWith('image/');
    const isPdf = report.file.type === 'application/pdf';
    if (isImage) {
      setViewingReport(report);
    } else if (isPdf) {
      const blob = base64ToBlob(report.file.dataUrl);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.addEventListener('beforeunload', () => URL.revokeObjectURL(url));
      } else {
        URL.revokeObjectURL(url);
      }
    } else {
      const blob = base64ToBlob(report.file.dataUrl);
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.addEventListener('beforeunload', () => URL.revokeObjectURL(url));
      } else {
        URL.revokeObjectURL(url);
      }
    }
  };

  const handleDownload = (report: MedicalReport) => {
    const blob = base64ToBlob(report.file.dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = report.file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const stats = useMemo(() => {
    const total = reports.length;
    const blood = reports.filter((r) => r.category === 'Blood Test').length;
    const scans = reports.filter((r) => r.category === 'Scan').length;
    const other = reports.filter(
      (r) => !['Blood Test', 'Scan'].includes(r.category)
    ).length;
    return { total, blood, scans, other };
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = r.title.toLowerCase().includes(q);
          const matchesDoctor = r.doctorName?.toLowerCase().includes(q);
          const matchesHospital = r.hospital?.toLowerCase().includes(q);
          const matchesNotes = r.notes?.toLowerCase().includes(q);
          const matchesFile = r.file.name.toLowerCase().includes(q);
          if (!(matchesTitle || matchesDoctor || matchesHospital || matchesNotes || matchesFile)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [reports, searchQuery, categoryFilter]);

  const statCards = [
    {
      label: 'Total Reports',
      value: stats.total,
      gradient: 'from-pink-500 via-fuchsia-500 to-purple-500',
      bg: 'from-pink-50 to-fuchsia-50',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      label: 'Blood Tests',
      value: stats.blood,
      gradient: 'from-rose-500 to-pink-500',
      bg: 'from-rose-50 to-pink-50',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      label: 'Scans',
      value: stats.scans,
      gradient: 'from-purple-500 to-indigo-500',
      bg: 'from-purple-50 to-indigo-50',
      icon: <FileText className="w-6 h-6" />,
    },
    {
      label: 'Other',
      value: stats.other,
      gradient: 'from-teal-500 to-cyan-500',
      bg: 'from-teal-50 to-cyan-50',
      icon: <FileText className="w-6 h-6" />,
    },
  ];

  const uploadCTA = (
    <button
      onClick={openUploadModal}
      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
    >
      <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="whitespace-nowrap">Upload Report</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Health Reports"
          subtitle="Securely store and manage your medical documents"
          hideBell={true}
          extra={uploadCTA}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
        >
          {statCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`relative overflow-hidden bg-gradient-to-br ${card.bg} rounded-3xl p-5 sm:p-6 border border-white/60 shadow-lg shadow-purple-500/5`}
            >
              <div
                className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 blur-2xl`}
              />
              <div className="relative">
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${card.gradient} text-white flex items-center justify-center shadow-md mb-4`}
                >
                  {card.icon}
                </div>
                <p className="text-3xl sm:text-4xl font-black text-gray-800">
                  {card.value}
                </p>
                <p className="text-sm text-gray-500 mt-1 font-medium">{card.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-purple-500/5 border border-white mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports, doctors, hospitals..."
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100 outline-none text-gray-800 placeholder:text-gray-400 transition-all"
              />
            </div>
            <div className="relative min-w-[200px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none pl-12 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100 outline-none text-gray-800 transition-all cursor-pointer"
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
            </div>
          </div>
        </motion.div>

        {reports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-white rounded-3xl p-10 sm:p-16 shadow-xl shadow-purple-500/5 border border-white text-center"
          >
            <div className="mx-auto w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-pink-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              No reports yet
            </h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Upload your blood tests, scans, prescriptions, and other medical records to keep them organized and accessible.
            </p>
            <button
              onClick={openUploadModal}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white font-semibold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-5 h-5" />
              Upload Your First Report
            </button>
          </motion.div>
        ) : filteredReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-white rounded-3xl p-10 sm:p-16 shadow-xl shadow-purple-500/5 border border-white text-center"
          >
            <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No matching reports
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            <AnimatePresence mode="popLayout">
              {filteredReports.map((report, i) => (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: 'easeOut' }}
                  className="group relative bg-white rounded-3xl overflow-hidden border border-white shadow-lg shadow-purple-500/5 hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-1 transition-all duration-300"
                >
                  <div
                    className={`h-2 w-full bg-gradient-to-r ${CATEGORY_GRADIENT[report.category].split(' ').slice(0, 2).join(' ').replace(/text-[^\s]+/, '').replace(/border-[^\s]+/, '').trim()}`}
                  />
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r border ${CATEGORY_GRADIENT[report.category]}`}
                      >
                        {report.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-medium shrink-0">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(report.date)}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3.5rem]">
                      {report.title}
                    </h3>

                    <div className="space-y-1.5 mb-4 text-sm">
                      {report.doctorName && (
                        <p className="text-gray-600 line-clamp-1">
                          <span className="text-gray-400 font-medium">Dr: </span>
                          {report.doctorName}
                        </p>
                      )}
                      {report.hospital && (
                        <p className="text-gray-600 line-clamp-1">
                          <span className="text-gray-400 font-medium">🏥 </span>
                          {report.hospital}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                        {report.file.type.startsWith('image/') ? (
                          <Eye className="w-5 h-5 text-purple-500" />
                        ) : (
                          <FileText className="w-5 h-5 text-pink-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {report.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {report.file.type.split('/')[1]?.toUpperCase() || 'FILE'} · {formatBytes(report.file.size)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      <button
                        onClick={() => handleView(report)}
                        className="flex items-center justify-center gap-1 py-2 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 font-semibold text-xs transition-all border border-purple-100/80"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <button
                        onClick={() => handleAnalyzeReport(report)}
                        className="flex items-center justify-center gap-1 py-2 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 text-pink-700 font-semibold text-xs transition-all border border-pink-100/80"
                        title="AI Summary"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                        AI Summary
                      </button>
                      <button
                        onClick={() => handleDownload(report)}
                        className="flex items-center justify-center gap-1 py-2 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 text-teal-700 font-semibold text-xs transition-all border border-teal-100/80"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Save
                      </button>
                      <button
                        onClick={() => handleDelete(report.id, report.title)}
                        className="flex items-center justify-center gap-1 py-2 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 text-rose-700 font-semibold text-xs transition-all border border-rose-100/80"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
              onClick={closeUploadModal}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
              >
                <div className="sticky top-0 z-10 bg-gradient-to-r from-pink-50 via-white to-purple-50 px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-100 flex items-start justify-between gap-4 rounded-t-3xl">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800">
                      Upload Report
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Add details and attach your medical file
                    </p>
                  </div>
                  <button
                    onClick={closeUploadModal}
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      File <span className="text-rose-500">*</span>
                    </label>
                    <div
                      ref={dropZoneRef}
                      onClick={onDropZoneClick}
                      onDrop={onDrop}
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      className={`relative cursor-pointer border-2 border-dashed rounded-3xl p-6 sm:p-8 transition-all duration-200 text-center ${
                        isDragging
                          ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 scale-[1.01]'
                          : selectedFile
                          ? 'border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50'
                          : 'border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-pink-300 hover:from-pink-50/50 hover:to-purple-50/50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ACCEPTED_FILES}
                        onChange={onFileInputChange}
                        className="hidden"
                      />
                      {selectedFile && selectedPreview ? (
                        <div className="flex flex-col items-center gap-4">
                          {selectedFile.type.startsWith('image/') ? (
                            <div className="w-full max-h-48 rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-inner">
                              <img
                                src={selectedPreview}
                                alt="preview"
                                className="w-full h-48 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                              <FileText className="w-10 h-10 text-pink-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-800">
                              {selectedFile.name}
                            </p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {formatBytes(selectedFile.size)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFile(null);
                              setSelectedPreview(null);
                            }}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-4 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 transition-colors"
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/25">
                            <Upload className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              Drag & drop your file here
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              or click to browse · PDF, JPG, PNG
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Report Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Complete Blood Count - August 2026"
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100 outline-none text-gray-800 placeholder:text-gray-400 transition-all"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as MedicalReport['category'])}
                        className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100 outline-none text-gray-800 transition-all cursor-pointer"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Report Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100 outline-none text-gray-800 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        value={formDoctor}
                        onChange={(e) => setFormDoctor(e.target.value)}
                        placeholder="Dr. Sarah Johnson"
                        className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100 outline-none text-gray-800 placeholder:text-gray-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Hospital / Clinic
                      </label>
                      <input
                        type="text"
                        value={formHospital}
                        onChange={(e) => setFormHospital(e.target.value)}
                        placeholder="City Women's Hospital"
                        className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100 outline-none text-gray-800 placeholder:text-gray-400 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      rows={3}
                      placeholder="Any additional notes about this report..."
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white focus:border-pink-300 focus:ring-4 focus:ring-pink-100 outline-none text-gray-800 placeholder:text-gray-400 transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 sm:px-8 py-5 flex flex-col sm:flex-row gap-3 sm:justify-end rounded-b-3xl">
                  <button
                    onClick={closeUploadModal}
                    className="px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveReport}
                    disabled={isSaving}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white font-bold shadow-lg shadow-pink-500/25 hover:shadow-xl hover:shadow-pink-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isSaving ? 'Saving...' : 'Save Report'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewingReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm"
              onClick={() => setViewingReport(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-pink-50 via-white to-purple-50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r border ${CATEGORY_GRADIENT[viewingReport.category]}`}
                      >
                        {viewingReport.category}
                      </span>
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(viewingReport.date)}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-gray-800 truncate">
                      {viewingReport.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDownload(viewingReport)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-teal-600 hover:bg-teal-50 transition-all"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewingReport(null)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[calc(92vh-5rem)] bg-gray-50">
                  <img
                    src={viewingReport.file.dataUrl}
                    alt={viewingReport.title}
                    className="w-full h-auto object-contain mx-auto"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {analyzingReport && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
              onClick={() => setAnalyzingReport(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 p-6 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur rounded-2xl">
                      <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">FemCare AI Report Analyzer</h2>
                      <p className="text-xs text-white/80">{analyzingReport.title} · {analyzingReport.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAnalyzingReport(null)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5 flex-1">
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Medical AI Disclaimer:</strong> This summary is generated for informational and educational guidance only. It is NOT a confirmed medical diagnosis. Please consult a qualified doctor for professional evaluation.
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-pink-50/60 to-purple-50/60 rounded-2xl p-4 border border-pink-100">
                    <h3 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Report Overview
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Structured analysis for <strong>{summaryReport.title}</strong> dated <strong>{formatDate(summaryReport.date)}</strong>. Category: <span className="font-semibold text-purple-700">{summaryReport.category}</span>.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Key Findings & Values
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                        <span>Report Category Status</span>
                        <span className="font-semibold text-emerald-600">Processed</span>
                      </li>
                      <li className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                        <span>Attending / Ref Doctor</span>
                        <span className="font-medium text-gray-800">{summaryReport.doctorName || 'Not specified'}</span>
                      </li>
                      <li className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                        <span>Facility / Hospital</span>
                        <span className="font-medium text-gray-800">{summaryReport.hospital || 'Direct Upload'}</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-100 space-y-2">
                    <h3 className="font-bold text-rose-800 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                      Notable / Out-of-Range Markers (Identified)
                    </h3>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      Always double-check reference intervals indicated on your physical lab sheet. Values marked outside normal reference range should be discussed during doctor consultation.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-2">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-purple-600" />
                      Questions to Ask Your Doctor
                    </h3>
                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
                      <li>What do these specific report values mean for my ongoing symptoms?</li>
                      <li>Are any follow-up blood tests or scans recommended in 4-6 weeks?</li>
                      <li>Do I need dietary modifications or dosage adjustments based on this report?</li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setSummaryReport(null)}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 font-semibold text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setSummaryReport(null);
                      window.location.href = '/ai-chat';
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm shadow-md hover:shadow-lg flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ask AI Chat About This
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
