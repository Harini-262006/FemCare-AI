import { useAppStore } from '../store'

const API_BASE = '/api'

export type DoctorAttachmentPayload = {
  name: string
  type: string
  size: number
  dataUrl: string
}

// API Response Types
export interface ApiConversation {
  _id: string
  userId: string
  title: string
  isCustomTitle?: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiAttachmentMetadata {
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  extractedText?: string;
  imageObservations?: string;
  audioTranscription?: string;
  videoObservations?: string;
}

interface ApiMessage {
  _id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  files?: string[];
  attachmentsMetadata?: ApiAttachmentMetadata[];
  feedback?: 'like' | 'dislike';
  createdAt: string;
  updatedAt: string;
}

interface ApiDoctor {
  _id: string
  name: string
  specialty: string
  experience: number
  hospital: string
  rating: number
  availableTime: string[]
  fees: number
  online: boolean
  phone: string
  videoLink: string
  createdAt: string
  updatedAt: string
}

interface ApiDoctorConversation {
  _id: string
  userId: string
  doctorId: string
  lastMessage?: string
  unreadCount: number
  createdAt: string
  updatedAt: string
}

interface ApiDoctorMessage {
  _id: string
  conversationId: string
  senderId: string
  senderType: 'patient' | 'doctor'
  content: string
  attachments?: DoctorAttachmentPayload[]
  read: boolean
  createdAt: string
  updatedAt: string
}

interface GetConversationResponse {
  conversation: ApiConversation
  messages: ApiMessage[]
}

interface GetDoctorConversationResponse {
  conversation: ApiDoctorConversation
  messages: ApiDoctorMessage[]
  doctor: ApiDoctor
}

interface SendDoctorMessageResponse {
  message: ApiDoctorMessage
  messages: ApiDoctorMessage[]
}

const getToken = () => useAppStore.getState().user?.token ?? null

const redirectToLogin = () => {
  try {
    useAppStore.getState().logoutUser();
    localStorage.removeItem('user-storage');
  } catch (e) {
    // Ignore storage clear error
  }
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

const buildHeaders = (headers?: HeadersInit, includeJson = true) => {
  const token = getToken()
  const builtHeaders = new Headers(headers)

  if (includeJson && !builtHeaders.has('Content-Type')) {
    builtHeaders.set('Content-Type', 'application/json')
  }

  if (token) {
    builtHeaders.set('Authorization', `Bearer ${token}`)
  }

  return builtHeaders
}

const parseError = async (response: Response) => {
  const contentType = response.headers.get('content-type') || ''

  // 1. Handle HTTP 429 Rate Limiting
  if (response.status === 429) {
    if (contentType.includes('application/json')) {
      try {
        const error = await response.json()
        throw new Error(error.message || error.error || 'Too many login attempts. Please wait a moment and try again.')
      } catch (err: any) {
        if (err?.message && !err.message.includes('JSON')) throw err
      }
    }
    throw new Error('Too many login attempts. Please wait a moment and try again.')
  }

  // 2. Handle HTTP 401 Unauthorized / Invalid Credentials
  if (response.status === 401) {
    let customMsg = ''
    if (contentType.includes('application/json')) {
      try {
        const error = await response.json()
        customMsg = error.message || error.error || ''
      } catch (err) {
        // ignore JSON parse error
      }
    }
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const isAuthPage = currentPath === '/login' || currentPath === '/signup'
    if (!isAuthPage) {
      redirectToLogin()
    }
    throw new Error(customMsg || 'Invalid credentials. Please check email/username and password.')
  }

  // 3. Handle Other JSON Error Responses (e.g. 400 Bad Request, 403, 500)
  if (contentType.includes('application/json')) {
    try {
      const error = await response.json()
      throw new Error(error.message || error.error || `Server error (${response.status})`)
    } catch (err: any) {
      if (err?.message && !err.message.includes('JSON') && !err.message.includes('token') && !err.message.includes('Unexpected')) {
        throw err
      }
    }
  }

  let text = ''
  try {
    text = await response.text()
  } catch (e) {
    // Ignore text read error
  }

  if (response.status === 404) {
    throw new Error('Requested service endpoint is not available')
  }
  if (response.status >= 500) {
    throw new Error('Unable to connect to server. Please try again later.')
  }

  throw new Error(text && text.length < 100 && !text.includes('<') ? text : `API error (${response.status})`)
}

const fetchJSON = async <T>(url: string, options: RequestInit = {}, includeJson = true) => {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: buildHeaders(options.headers, includeJson),
    })
  } catch (netErr) {
    throw new Error('Unable to connect to server. Please check backend connection.')
  }

  if (!response.ok) {
    await parseError(response)
  }

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    if (!text || text.trim().startsWith('<')) {
      throw new Error('Received invalid server response format')
    }
    try {
      return JSON.parse(text) as T
    } catch (e) {
      throw new Error('Received invalid JSON response from server')
    }
  }

  try {
    return (await response.json()) as T
  } catch (e) {
    throw new Error('Unable to parse server response')
  }
}

const streamWithAuth = async (
  url: string,
  options: RequestInit,
  onChunk: (chunk: string) => void,
  includeJson = true
) => {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: buildHeaders(options.headers, includeJson),
  })

  if (!response.ok) {
    await parseError(response)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let fullText = ''

  if (!reader) {
    return fullText
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    fullText += chunk
    onChunk(chunk)
  }

  return fullText
}

export const authAPI = {
  register: (name: string, email: string, password: string) =>
    fetchJSON<{ _id: string; name: string; email: string; role: 'patient'; token: string }>('/auth/register', {
      method: 'POST',
      headers: buildHeaders(undefined, true),
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    fetchJSON<{ _id: string; name: string; email: string; role: 'patient' | 'doctor' | 'admin'; specialty?: string; token: string }>('/auth/login', {
      method: 'POST',
      headers: buildHeaders(undefined, true),
      body: JSON.stringify({ email, password }),
    }),
  doctorLogin: (email: string, password: string) =>
    fetchJSON<{ _id: string; name: string; email: string; specialty: string; role: 'doctor'; token: string }>('/auth/doctor/login', {
      method: 'POST',
      headers: buildHeaders(undefined, true),
      body: JSON.stringify({ email, password }),
    }),
  adminLogin: (email: string, password: string) =>
    fetchJSON<{ _id: string; name: string; email: string; role: 'admin'; token: string }>('/auth/admin/login', {
      method: 'POST',
      headers: buildHeaders(undefined, true),
      body: JSON.stringify({ email, password }),
    }),
  doctorRegister: (payload: { name: string; email: string; password: string; specialty?: string; experience?: number; hospital?: string; fees?: number }) =>
    fetchJSON<{ _id: string; name: string; email: string; role: 'doctor'; token: string }>('/auth/doctor/register', {
      method: 'POST',
      headers: buildHeaders(undefined, true),
      body: JSON.stringify(payload),
    }),
  getProfile: () => fetchJSON('/auth/me'),
  updateProfile: (profileData: unknown) =>
    fetchJSON('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
}

export const chatAPI = {
  createConversation: () =>
    fetchJSON<ApiConversation>('/chat', {
      method: 'POST',
    }),
  getConversations: () => fetchJSON<ApiConversation[]>('/chat'),
  getConversation: (id: string) => fetchJSON<GetConversationResponse>(`/chat/${id}`),
  renameConversation: (id: string, title: string) =>
    fetchJSON<ApiConversation>(`/chat/${id}/rename`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    }),
  deleteConversation: (id: string) =>
    fetchJSON<{ message: string }>(`/chat/${id}`, {
      method: 'DELETE',
    }),
  sendMessage: (
    conversationId: string | null,
    content: string,
    onChunk: (chunk: string) => void,
    files?: File[]
  ) => {
    const formData = new FormData();
    if (conversationId) formData.append('conversationId', conversationId);
    if (content) {
      formData.append('content', content);
      formData.append('message', content);
    }
    if (files && files.length > 0) {
      for (const file of files) {
        formData.append('files', file);
      }
    }

    return streamWithAuth(
      '/chat/message',
      {
        method: 'POST',
        body: formData,
      },
      onChunk,
      false
    );
  },
  sendAiChat: (
    conversationId: string | null,
    message: string,
    files?: File[]
  ) => {
    const formData = new FormData();
    if (conversationId) formData.append('conversationId', conversationId);
    formData.append('message', message);
    if (files && files.length > 0) {
      for (const file of files) {
        formData.append('files', file);
      }
    }

    const token = getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers,
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        await parseError(res);
      }
      return res.json() as Promise<{
        response: string;
        attachments: Array<{ filename: string; mimeType: string; size: number; isImage: boolean; url?: string }>;
        extractedText: string[];
        imageAnalysis: string[];
        conversationId?: string;
      }>;
    });
  },
  regenerateResponse: (conversationId: string, onChunk: (chunk: string) => void) =>
    streamWithAuth(
      `/chat/${conversationId}/regenerate`,
      {
        method: 'POST',
      },
      onChunk
    ),
  feedbackMessage: (id: string, feedback: 'like' | 'dislike') =>
    fetchJSON<ApiMessage>(`/chat/message/${id}/feedback`, {
      method: 'PATCH',
      body: JSON.stringify({ feedback }),
    }),
}

export interface ApiReminder {
  _id: string;
  userId: string;
  title: string;
  type: string;
  time: string;
  date?: string;
  notes?: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  enabled: boolean;
  completedDates?: string[];
  lastTriggered?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const reminderAPI = {
  getReminders: () => fetchJSON<ApiReminder[]>('/reminders'),
  createReminder: (payload: {
    title: string;
    type?: string;
    time: string;
    date?: string;
    notes?: string;
    recurrence?: string;
    enabled?: boolean;
  }) =>
    fetchJSON<ApiReminder>('/reminders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateReminder: (id: string, payload: Partial<ApiReminder>) =>
    fetchJSON<ApiReminder>(`/reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteReminder: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/reminders/${id}`, {
      method: 'DELETE',
    }),
  toggleReminder: (id: string) =>
    fetchJSON<ApiReminder>(`/reminders/${id}/toggle`, {
      method: 'PATCH',
    }),
};

export const doctorAPI = {
  getDoctors: () => fetchJSON<ApiDoctor[]>('/doctor-chat/doctors'),
  getConversation: (doctorId: string) =>
    fetchJSON<GetDoctorConversationResponse>(`/doctor-chat/${doctorId}`),
  getConversations: () => fetchJSON<ApiDoctorConversation[]>('/doctor-chat/conversations'),
  sendMessage: (payload: {
    doctorId: string
    userId?: string
    conversationId?: string
    content: string
    images?: File[]
    files?: File[]
  }) => {
    const formData = new FormData();
    formData.append('doctorId', payload.doctorId);
    if (payload.userId) formData.append('userId', payload.userId);
    if (payload.conversationId) formData.append('conversationId', payload.conversationId);
    if (payload.content) formData.append('content', payload.content);
    const filesToUpload = payload.files || payload.images;
    if (filesToUpload) {
      for (const file of filesToUpload) {
        formData.append('files', file);
      }
    }

    return fetchJSON<SendDoctorMessageResponse>('/doctor-chat/send', {
      method: 'POST',
      body: formData,
    }, false);
  },
  deleteConversation: (conversationId: string) =>
    fetchJSON<{ message: string }>(`/doctor-chat/${conversationId}`, {
      method: 'DELETE',
    }),
}

export interface ApiPrescription {
  _id: string;
  userId: any;
  doctorId: any;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  date: string;
  createdAt?: string;
}

export const prescriptionAPI = {
  getPrescriptions: (patientId?: string) =>
    fetchJSON<ApiPrescription[]>(`/prescriptions${patientId ? `?patientId=${patientId}` : ''}`),
  createPrescription: (payload: {
    userId: string;
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    notes?: string;
  }) =>
    fetchJSON<ApiPrescription>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deletePrescription: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/prescriptions/${id}`, {
      method: 'DELETE',
    }),
};

export interface ApiAppointment {
  _id: string;
  userId: any;
  doctorId: any;
  date: string;
  time: string;
  status: 'Requested' | 'Confirmed' | 'Upcoming' | 'Completed' | 'Rejected' | 'Cancelled' | 'pending' | 'approved';
  type: 'in-person' | 'video';
  notes?: string;
  createdAt?: string;
}

export const appointmentAPI = {
  getUserAppointments: () => fetchJSON<ApiAppointment[]>('/appointments/user'),
  getDoctorAppointments: () => fetchJSON<ApiAppointment[]>('/appointments/doctor'),
  createAppointment: (payload: {
    doctorId: string;
    date: string;
    time: string;
    type?: string;
    notes?: string;
  }) =>
    fetchJSON<ApiAppointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateStatus: (appointmentId: string, status: string) =>
    fetchJSON<ApiAppointment>(`/appointments/${appointmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  cancelAppointment: (appointmentId: string) =>
    fetchJSON<{ message: string }>(`/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
    }),
};

export interface ApiNotificationItem {
  _id: string;
  userId?: string;
  doctorId?: string;
  type: 'appointment' | 'message' | 'reminder' | 'period' | 'pregnancy';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export const notificationAPI = {
  getNotifications: () =>
    fetchJSON<{ notifications: ApiNotificationItem[]; unreadCount: number }>('/notifications'),
  markRead: (id: string) =>
    fetchJSON<ApiNotificationItem>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllRead: () =>
    fetchJSON<{ message: string }>('/notifications/mark-all-read', {
      method: 'PUT',
    }),
};

export const aiInsightsAPI = {
  getInsights: () =>
    fetchJSON<{
      insights: {
        sleepTrend: string;
        activitySuggestion: string;
        wellnessSuggestion: string;
        moodPattern: string;
        cycleInfo: string;
      };
      disclaimer: string;
      generatedAt: string;
    }>('/ai/insights', { method: 'POST' }),
  analyzeReport: (payload: { reportId?: string; title?: string; type?: string; notes?: string; files?: File[] }) => {
    const formData = new FormData();
    if (payload.reportId) formData.append('reportId', payload.reportId);
    if (payload.title) formData.append('title', payload.title);
    if (payload.type) formData.append('type', payload.type);
    if (payload.notes) formData.append('notes', payload.notes);
    if (payload.files && payload.files.length > 0) {
      for (const file of payload.files) {
        formData.append('files', file);
      }
    }
    return fetchJSON<{
      success: boolean;
      analysis: {
        summary: string;
        reportType: string;
        date: string;
        disclaimer: string;
      };
      disclaimer: string;
    }>('/ai/analyze-report', {
      method: 'POST',
      body: formData,
    }, false);
  },
};

export interface ApiMedicalReportItem {
  _id: string;
  userId: string;
  title: string;
  type: string;
  category?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  notes?: string;
  extractedText?: string;
  analysis?: {
    summary: string;
    reportType: string;
    date: string;
    disclaimer?: string;
  };
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export const reportsAPI = {
  getReports: () => fetchJSON<ApiMedicalReportItem[]>('/reports'),
  getReport: (id: string) => fetchJSON<ApiMedicalReportItem>(`/reports/${id}`),
  createReport: (payload: {
    title: string;
    type?: string;
    category?: string;
    notes?: string;
    date?: string;
    extractedText?: string;
    analysis?: any;
    fileUrl?: string;
    files?: File[];
  }) => {
    const formData = new FormData();
    formData.append('title', payload.title);
    if (payload.type) formData.append('type', payload.type);
    if (payload.category) formData.append('category', payload.category);
    if (payload.notes) formData.append('notes', payload.notes);
    if (payload.date) formData.append('date', payload.date);
    if (payload.extractedText) formData.append('extractedText', payload.extractedText);
    if (payload.fileUrl) formData.append('fileUrl', payload.fileUrl);
    if (payload.analysis) {
      formData.append('analysis', typeof payload.analysis === 'string' ? payload.analysis : JSON.stringify(payload.analysis));
    }
    if (payload.files && payload.files.length > 0) {
      for (const file of payload.files) {
        formData.append('files', file);
      }
    }
    return fetchJSON<ApiMedicalReportItem>('/reports', {
      method: 'POST',
      body: formData,
    }, false);
  },
  deleteReport: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/reports/${id}`, {
      method: 'DELETE',
    }),
};

export const adminAPI = {
  getDoctors: () => fetchJSON<ApiDoctor[]>('/admin/doctors'),
  addDoctor: (payload: any) =>
    fetchJSON<ApiDoctor>('/admin/doctors', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateDoctor: (id: string, payload: any) =>
    fetchJSON<ApiDoctor>(`/admin/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteDoctor: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/admin/doctors/${id}`, {
      method: 'DELETE',
    }),
}

export interface ApiHydrationEntryItem {
  _id: string;
  amountMl: number;
  timestamp: string;
}

export interface ApiHydration {
  _id: string;
  userId: string;
  date: string;
  goalMl: number;
  consumedMl: number;
  remainingMl: number;
  percentage: number;
  rawPercentage: number;
  entries: ApiHydrationEntryItem[];
  createdAt: string;
  updatedAt: string;
}

export const hydrationAPI = {
  getToday: (date?: string) => fetchJSON<ApiHydration>(`/hydration/today${date ? `?date=${date}` : ''}`),
  addWater: (amountMl: number, date?: string) =>
    fetchJSON<ApiHydration>('/hydration/add', {
      method: 'POST',
      body: JSON.stringify({ amountMl, date }),
    }),
  setGoal: (goalMl: number, date?: string) =>
    fetchJSON<ApiHydration>('/hydration/goal', {
      method: 'PUT',
      body: JSON.stringify({ goalMl, date }),
    }),
  editEntry: (entryId: string, amountMl: number, date?: string) =>
    fetchJSON<ApiHydration>(`/hydration/entry/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify({ amountMl, date }),
    }),
  deleteEntry: (entryId: string, date?: string) =>
    fetchJSON<ApiHydration>(`/hydration/entry/${entryId}${date ? `?date=${date}` : ''}`, {
      method: 'DELETE',
    }),
  getHistory: () => fetchJSON<ApiHydration[]>('/hydration/history'),
};

export interface ApiSleepEntry {
  _id: string;
  userId: string;
  date: string;
  bedtime: string;
  wakeupTime: string;
  durationHours: number;
  quality: 'excellent' | 'good' | 'average' | 'poor';
  awakenings: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const sleepAPI = {
  getHistory: () => fetchJSON<ApiSleepEntry[]>('/sleep/history'),
  addEntry: (payload: {
    date: string;
    bedtime: string;
    wakeupTime: string;
    durationHours: number;
    quality: string;
    awakenings: number;
    notes?: string;
  }) =>
    fetchJSON<ApiSleepEntry>('/sleep/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteEntry: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/sleep/${id}`, {
      method: 'DELETE',
    }),
};

export interface ApiMoodEntry {
  _id: string;
  userId: string;
  date: string;
  mood: string;
  stressLevel: number;
  notes?: string;
  createdAt?: string;
}

export const moodAPI = {
  getHistory: () => fetchJSON<ApiMoodEntry[]>('/mood/history'),
  addEntry: (payload: { date: string; mood: string; stressLevel: number; notes?: string }) =>
    fetchJSON<ApiMoodEntry>('/mood/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteEntry: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/mood/${id}`, {
      method: 'DELETE',
    }),
};

export interface ApiWorkoutEntry {
  _id: string;
  userId: string;
  date: string;
  workoutType: string;
  duration: number;
  intensity: string;
  notes?: string;
  createdAt?: string;
}

export const workoutAPI = {
  getHistory: () => fetchJSON<ApiWorkoutEntry[]>('/workout/history'),
  addEntry: (payload: { date: string; workoutType: string; duration: number; intensity: string; notes?: string }) =>
    fetchJSON<ApiWorkoutEntry>('/workout/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteEntry: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/workout/${id}`, {
      method: 'DELETE',
    }),
};

export interface ApiCycleEntry {
  _id: string;
  userId: string;
  date: string;
  isPeriod: boolean;
  flowIntensity: string;
  notes?: string;
  createdAt?: string;
}

export const cycleAPI = {
  getHistory: () => fetchJSON<ApiCycleEntry[]>('/cycle/history'),
  addEntry: (payload: { date: string; isPeriod: boolean; flowIntensity: string; notes?: string }) =>
    fetchJSON<ApiCycleEntry>('/cycle/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteEntry: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/cycle/${id}`, {
      method: 'DELETE',
    }),
};

export interface ApiEmergencyContact {
  _id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const emergencyContactAPI = {
  getContacts: () => fetchJSON<ApiEmergencyContact[]>('/emergency-contacts'),
  addContact: (payload: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
    isPrimary?: boolean;
  }) =>
    fetchJSON<ApiEmergencyContact>('/emergency-contacts/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateContact: (
    id: string,
    payload: Partial<{
      name: string;
      relationship: string;
      phone: string;
      email?: string;
      address?: string;
      isPrimary?: boolean;
    }>
  ) =>
    fetchJSON<ApiEmergencyContact>(`/emergency-contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteContact: (id: string) =>
    fetchJSON<{ message: string; id: string }>(`/emergency-contacts/${id}`, {
      method: 'DELETE',
    }),
};



