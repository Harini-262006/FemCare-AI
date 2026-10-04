import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeType = 'cherry-blossom' | 'fairy-forest' | 'moonlight-garden' | 'galaxy-fairy' | 'crystal-palace' | 'nature-bloom';

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role?: 'patient' | 'doctor' | 'admin';
  specialty?: string;
  token?: string;
};

export type Profile = {
  name: string;
  age: number;
  mobile: string;
  email: string;
  address: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  bloodGroup: string;
  maritalStatus?: string;
  lastPeriodDate: string;
  cycleLength: number;
  cycleRegularity?: string;
  periodDuration?: string;
  menstrualHistory: string;
  symptoms?: string[];
  pregnancyStatus: string;
  trimester?: string | number;
  pregnancyHistory?: string;
  pcos: string;
  thyroid: string;
  fertilityPlanning: string;
  menopauseStatus: string;
  medicalHistory: string;
  chronicDiseases: string;
  existingConditions?: string[];
  previousSurgeries: string;
  surgeries: string;
  currentMedicines: string;
  medications?: string[];
  medicationList?: string[];
  allergies: string;
  allergyList?: string[];
  familyMedicalHistory: string;
  waterIntake: number;
  sleepHours: number;
  sleepQuality?: string;
  sleepSchedule: string;
  exerciseRoutine: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | '' | string;
  stressLevel: 'low' | 'medium' | 'high' | '' | string;
  foodPreference: string;
  dietPreference?: string;
  alcoholStatus?: string;
  caffeineStatus?: string;
  emergencyContact: string;
  doctorName: string;
  hospital: string;
  preferredHospital: string;
  favoriteTheme?: ThemeType;
  favoriteColors?: string[];
  dailyRoutine?: string;
  lifestyle?: string;
  wellnessGoals?: string;
};

export type CycleEntry = {
  id: string;
  date: string;
  isPeriod: boolean;
  flowIntensity: 'light' | 'medium' | 'heavy';
  notes?: string;
};

export type SymptomType = 'cramps' | 'headache' | 'fatigue' | 'acne' | 'bloating' | 'breast-tenderness' | 'stress' | 'anxiety' | 'mood-swing' | 'insomnia' | 'low-energy';
export type SymptomSeverity = 'mild' | 'moderate' | 'severe';
export type SymptomEntry = {
  id: string;
  date: string;
  symptoms: Array<{ type: SymptomType; severity: SymptomSeverity }>;
  notes?: string;
};

export type MoodType = 'happy' | 'excited' | 'calm' | 'anxious' | 'stressed' | 'sad' | 'angry' | 'neutral';
export type MoodEntry = {
  id: string;
  date: string;
  mood: MoodType;
  stressLevel: number;
  notes?: string;
};

export type SleepQuality = 'excellent' | 'good' | 'average' | 'poor';
export type SleepEntry = {
  id: string;
  date: string;
  bedtime: string;
  wakeupTime: string;
  durationHours: number;
  quality: SleepQuality;
  awakenings: number;
  notes?: string;
};

export type HydrationEntry = {
  id: string;
  date: string;
  glasses: number;
  goal: number;
};

export type NutritionEntry = {
  id: string;
  date: string;
  meals: Array<{ type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; food: string; time: string }>;
  notes?: string;
};

export type WorkoutType = 'stretching' | 'yoga' | 'cardio' | 'strength' | 'meditation' | 'relaxation';
export type FitnessEntry = {
  id: string;
  date: string;
  workoutType: WorkoutType;
  duration: number;
  intensity: 'low' | 'medium' | 'high';
  notes?: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'doctor';
  content: string;
  imageUrl?: string;
  timestamp: Date;
};

export type Chat = {
  id: string;
  title: string;
  type: 'ai' | 'doctor';
  doctorId?: string;
  messages: Message[];
  createdAt: Date;
};

export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  hospital: string;
  rating: number;
  availableTime: string[];
  fees: number;
  online: boolean;
  phone: string;
  videoLink: string;
};

export type ReminderType = 'medicine' | 'appointment' | 'water' | 'exercise' | 'period' | 'meal' | 'sleep' | 'self-care' | 'prenatal-vitamins' | 'iron' | 'calcium' | 'scan' | 'ovulation' | 'fertility' | 'yoga' | 'meditation' | 'doctor-appointment' | 'scan-appointment' | 'menstrual-reminder' | 'ovulation-reminder' | 'fertility-reminder' | 'workout-reminder' | 'yoga-reminder' | 'meditation-reminder' | 'sleep-reminder';
export type Reminder = {
  id: string;
  title: string;
  type: ReminderType;
  time: string;
  date?: string;
  notes?: string;
  recurrence?: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  enabled: boolean;
  completedDates?: string[];
  lastTriggered?: string;
  isSmart?: boolean;
  smartKey?: string;
  smartPurpose?: string;
  category?: 'manual' | 'smart';
};

export type Appointment = {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  hospital: string;
  notes?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  fees?: number;
  type?: 'in-person' | 'video' | 'voice' | 'chat' | string;
  rating?: number;
  review?: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'appointment' | 'chat' | 'health' | 'wellness' | 'medicine' | 'pregnancy' | 'cycle' | 'emergency' | 'nutrition';
  read: boolean;
  timestamp: Date;
};

export type FemCareAIInteraction = {
  id: string;
  type: 'greet' | 'celebrate' | 'guide' | 'motivate';
  message: string;
  timestamp: Date;
};

export type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
};

export type MedicalReportFile = {
  name: string;
  type: 'application/pdf' | 'image/jpeg' | 'image/png' | string;
  size: number;
  dataUrl: string; // base64 for localStorage persistence
};

export type MedicalReport = {
  id: string;
  title: string;
  category: 'Blood Test' | 'Scan' | 'Prescription' | 'Discharge' | 'Checkup' | 'Other';
  date: string;
  doctorName?: string;
  hospital?: string;
  notes?: string;
  tags?: string[];
  file: MedicalReportFile;
  uploadedAt: Date;
};

export type MedicineEntry = {
  id: string;
  name: string;
  dosage: string;
  scheduleTimes: string[];
  startDate: string;
  endDate?: string;
  refillDate?: string;
  adherence: number;
  notes?: string;
  isActive: boolean;
};

export type JournalSymptom = {
  type: SymptomType;
  severity: SymptomSeverity;
};

export type JournalEntry = {
  id: string;
  date: string;
  notes: string;
  symptoms: JournalSymptom[];
  energyLevel: number;
  painLevel: number;
};

export type ChallengeStatus = 'active' | 'completed' | 'pending';
export type Challenge = {
  id: string;
  name: string;
  description: string;
  duration: number;
  progress: number;
  target: number;
  status: ChallengeStatus;
  startDate: string;
  icon: string;
  color: string;
  streak: number;
};

export type Achievement = {
  id: string;
  name: string;
  icon: string;
  unlockedAt: Date;
  description: string;
};

// User-specific data structure
type UserData = {
  profile: Profile | null;
  chats: Chat[];
  currentChatId: string | null;
  reminders: Reminder[];
  appointments: Appointment[];
  notifications: Notification[];
  cycleEntries: CycleEntry[];
  symptomEntries: SymptomEntry[];
  moodEntries: MoodEntry[];
  sleepEntries: SleepEntry[];
  hydrationEntries: HydrationEntry[];
  nutritionEntries: NutritionEntry[];
  fitnessEntries: FitnessEntry[];
  femcareAIInteractions: FemCareAIInteraction[];
  emergencyContacts: EmergencyContact[];
  medicines: MedicineEntry[];
  journalEntries: JournalEntry[];
  challenges: Challenge[];
  achievements: Achievement[];
  medicalReports: MedicalReport[];
};

const initialUserData: UserData = {
  profile: null,
  chats: [],
  currentChatId: null,
  reminders: [],
  appointments: [],
  notifications: [],
  cycleEntries: [],
  symptomEntries: [],
  moodEntries: [],
  sleepEntries: [],
  hydrationEntries: [],
  nutritionEntries: [],
  fitnessEntries: [],
  femcareAIInteractions: [],
  emergencyContacts: [],
  medicines: [],
  journalEntries: [],
  challenges: [],
  achievements: [],
  medicalReports: [],
};

interface AppState {
  users: User[];
  user: { id: string; name: string; email: string; role?: 'patient' | 'doctor' | 'admin'; specialty?: string; token?: string } | null;
  theme: ThemeType;
  doctors: Doctor[];
  userData: Record<string, UserData>; // Map of userId to their data
  // Helper to get current user's data
  getCurrentUserData: () => UserData;
  addUser: (user: User) => void;
  loginUser: (email: string, password: string) => { success: boolean; user?: { id: string; name: string; email: string; role?: 'patient' | 'doctor' | 'admin'; token?: string } };
  logoutUser: () => void;
  setUser: (user: { id: string; name: string; email: string; role?: 'patient' | 'doctor' | 'admin'; specialty?: string; token?: string } | null) => void;
  setProfile: (profile: Profile | null) => void;
  setTheme: (theme: ThemeType) => void;
  addChat: (chat: Chat) => void;
  setCurrentChat: (chat: Chat | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  addReminder: (reminder: Reminder) => void;
  setReminders: (reminders: Reminder[]) => void;
  updateReminder: (id: string, reminder: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addDoctor: (doctor: Doctor) => void;
  updateDoctor: (id: string, doctor: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  addCycleEntry: (entry: CycleEntry) => void;
  updateCycleEntry: (id: string, entry: Partial<CycleEntry>) => void;
  deleteCycleEntry: (id: string) => void;
  addSymptomEntry: (entry: SymptomEntry) => void;
  addMoodEntry: (entry: MoodEntry) => void;
  deleteMoodEntry: (id: string) => void;
  addSleepEntry: (entry: SleepEntry) => void;
  deleteSleepEntry: (id: string) => void;
  setSleepEntries: (entries: SleepEntry[]) => void;
  addHydrationEntry: (entry: HydrationEntry) => void;
  updateHydrationEntry: (id: string, entry: Partial<HydrationEntry>) => void;
  addNutritionEntry: (entry: NutritionEntry) => void;
  addFitnessEntry: (entry: FitnessEntry) => void;
  deleteFitnessEntry: (id: string) => void;
  addFemCareAIInteraction: (interaction: FemCareAIInteraction) => void;
  // Emergency contacts
  setEmergencyContacts: (contacts: EmergencyContact[]) => void;
  addEmergencyContact: (contact: EmergencyContact) => void;
  updateEmergencyContact: (id: string, contact: Partial<EmergencyContact>) => void;
  deleteEmergencyContact: (id: string) => void;
  // Medicines
  addMedicine: (medicine: MedicineEntry) => void;
  updateMedicine: (id: string, medicine: Partial<MedicineEntry>) => void;
  deleteMedicine: (id: string) => void;
  // Journal entries
  addJournalEntry: (entry: JournalEntry) => void;
  updateJournalEntry: (id: string, entry: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  // Challenges
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (id: string, challenge: Partial<Challenge>) => void;
  deleteChallenge: (id: string) => void;
  // Achievements
  addAchievement: (achievement: Achievement) => void;
  // Medical Reports
  addMedicalReport: (report: MedicalReport) => void;
  updateMedicalReport: (id: string, report: Partial<MedicalReport>) => void;
  deleteMedicalReport: (id: string) => void;
}

const initialProfile: Profile = {
  name: '',
  age: 0,
  mobile: '',
  email: '',
  address: '',
  dateOfBirth: '',
  height: 0,
  weight: 0,
  bloodGroup: '',
  maritalStatus: '',
  lastPeriodDate: '',
  cycleLength: 28,
  cycleRegularity: 'Regular (21-35 days)',
  periodDuration: '4-5 Days',
  menstrualHistory: '',
  symptoms: [],
  pregnancyStatus: 'No',
  trimester: '',
  pregnancyHistory: 'None',
  pcos: 'No',
  thyroid: 'No',
  fertilityPlanning: 'Not Planning',
  menopauseStatus: 'No',
  medicalHistory: '',
  chronicDiseases: '',
  existingConditions: [],
  previousSurgeries: '',
  surgeries: '',
  currentMedicines: '',
  medications: [],
  medicationList: [],
  allergies: '',
  allergyList: [],
  familyMedicalHistory: '',
  waterIntake: 2.0,
  sleepHours: 8,
  sleepQuality: 'Good (7-8 hrs)',
  sleepSchedule: 'Regular (11pm - 7am)',
  exerciseRoutine: '3-4 times/week',
  activityLevel: 'moderate',
  stressLevel: 'low',
  foodPreference: 'Vegetarian',
  dietPreference: 'Vegetarian',
  alcoholStatus: 'Never',
  caffeineStatus: '1-2 Cups Daily',
  emergencyContact: '',
  doctorName: '',
  hospital: '',
  preferredHospital: '',
  favoriteTheme: 'cherry-blossom',
  favoriteColors: ['#FFB6C1', '#E6E6FA'],
};

const initialDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Sarah Johnson',
    specialty: 'Gynecologist',
    experience: 10,
    hospital: "City Women's Hospital",
    rating: 4.9,
    availableTime: ['09:00 AM', '10:00 AM', '02:00 PM', '04:30 PM'],
    fees: 1700,
    online: true,
    phone: '+91 98765 43210',
    videoLink: 'https://zoom.us/j/1234567890',
  },
  {
    id: '2',
    name: 'Dr. Maria Garcia',
    specialty: 'Endocrinologist',
    experience: 8,
    hospital: 'Healthcare Plus',
    rating: 4.7,
    availableTime: ['11:00 AM', '03:00 PM', '04:00 PM'],
    fees: 2500,
    online: true,
    phone: '+91 98765 43211',
    videoLink: 'https://zoom.us/j/0987654321',
  },
  {
    id: '3',
    name: 'Dr. Emily Chen',
    specialty: 'Nutritionist & Wellness Specialist',
    experience: 6,
    hospital: 'Wellness Center',
    rating: 4.8,
    availableTime: ['10:00 AM', '01:00 PM', '05:00 PM'],
    fees: 1500,
    online: false,
    phone: '+91 98765 43212',
    videoLink: 'https://zoom.us/j/1122334455',
  },
  {
    id: '4',
    name: 'Dr. Rajesh Sharma',
    specialty: 'Obstetrician & Maternal Care',
    experience: 12,
    hospital: 'Apex Women Care Clinic',
    rating: 4.9,
    availableTime: ['09:30 AM', '11:30 AM', '03:30 PM'],
    fees: 2200,
    online: true,
    phone: '+91 98765 43213',
    videoLink: 'https://zoom.us/j/2233445566',
  },
  {
    id: '5',
    name: 'Dr. Priya Patel',
    specialty: 'Reproductive Endocrinologist',
    experience: 11,
    hospital: 'Fertility & Care Institute',
    rating: 4.95,
    availableTime: ['10:30 AM', '02:30 PM', '06:00 PM'],
    fees: 3000,
    online: true,
    phone: '+91 98765 43214',
    videoLink: 'https://zoom.us/j/3344556677',
  },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: [],
      user: null,
      theme: 'cherry-blossom',
      doctors: initialDoctors,
      userData: {},

      // Helper function to get current user's data
      getCurrentUserData: () => {
        const state = get();
        if (!state.user) return initialUserData;
        return state.userData[state.user.id] || initialUserData;
      },

      addUser: (user: User) =>
        set((state) => ({
          users: [...state.users, user],
          userData: {
            ...state.userData,
            [user.id]: { ...initialUserData },
          },
        })),

      loginUser: (email: string, password: string) => {
        const state = get();
        const foundUser = state.users.find(
          (u) => u.email === email && u.password === password
        );
        if (foundUser) {
          set({
            user: { id: foundUser.id, name: foundUser.name, email: foundUser.email },
          });
          return {
            success: true,
            user: { id: foundUser.id, name: foundUser.name, email: foundUser.email },
          };
        } else {
          return { success: false };
        }
      },

      logoutUser: () => set({ user: null }),

      setUser: (user) => set({ user }),
      setProfile: (profile) =>
        set((state) => {
          if (!state.user) return state;
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...state.getCurrentUserData(),
                profile,
              },
            },
          };
        }),
      setTheme: (theme) => set({ theme }),
      addChat: (chat) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                chats: [...currentData.chats, chat],
              },
            },
          };
        }),
      setCurrentChat: (chat) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                currentChatId: chat?.id || null,
              },
            },
          };
        }),
      addMessage: (chatId, message) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                chats: currentData.chats.map((chat) =>
                  chat.id === chatId ? { ...chat, messages: [...chat.messages, message] } : chat
                ),
                currentChatId: currentData.currentChatId === chatId ? chatId : currentData.currentChatId,
              },
            },
          };
        }),
      addReminder: (reminder) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                reminders: [...currentData.reminders, reminder],
              },
            },
          };
        }),
      setReminders: (reminders) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                reminders,
              },
            },
          };
        }),
      updateReminder: (id, reminder) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                reminders: currentData.reminders.map((r) => (r.id === id ? { ...r, ...reminder } : r)),
              },
            },
          };
        }),
      deleteReminder: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                reminders: currentData.reminders.filter((r) => r.id !== id),
              },
            },
          };
        }),
      addAppointment: (appointment) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          const autoReminder: Reminder = {
            id: `rem-apt-${appointment.id}`,
            title: `Appointment with ${appointment.doctorName}`,
            type: 'appointment',
            time: appointment.time || '09:00 AM',
            date: appointment.date,
            notes: `Consultation (${appointment.type || 'Video Call'}) with ${appointment.doctorName} - ${appointment.specialty}`,
            enabled: true,
          };
          const autoNotification: Notification = {
            id: `notif-apt-${appointment.id}`,
            title: 'Appointment Booked',
            message: `Your appointment with ${appointment.doctorName} is confirmed for ${appointment.date} at ${appointment.time}.`,
            type: 'appointment',
            read: false,
            timestamp: new Date(),
          };
          const existingReminders = currentData.reminders || [];
          const existingNotifications = currentData.notifications || [];

          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                appointments: [...currentData.appointments, appointment],
                reminders: [...existingReminders.filter(r => r.id !== autoReminder.id), autoReminder],
                notifications: [autoNotification, ...existingNotifications],
              },
            },
          };
        }),
      updateAppointment: (id, appointment) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                appointments: currentData.appointments.map((a) => (a.id === id ? { ...a, ...appointment } : a)),
              },
            },
          };
        }),
      addNotification: (notification) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                notifications: [notification, ...currentData.notifications],
              },
            },
          };
        }),
      markNotificationRead: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                notifications: currentData.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
              },
            },
          };
        }),
      markAllNotificationsRead: () =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                notifications: currentData.notifications.map((n) => ({ ...n, read: true })),
              },
            },
          };
        }),
      addDoctor: (doctor: Doctor) =>
        set((state) => ({ doctors: [...state.doctors, doctor] })),
      updateDoctor: (id, doctor) =>
        set((state) => ({
          doctors: state.doctors.map((d) => (d.id === id ? { ...d, ...doctor } : d)),
        })),
      deleteDoctor: (id: string) =>
        set((state) => ({ doctors: state.doctors.filter(d => d.id !== id) })),
      addCycleEntry: (entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                cycleEntries: [...currentData.cycleEntries, entry],
              },
            },
          };
        }),
      updateCycleEntry: (id, entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                cycleEntries: currentData.cycleEntries.map((e) => (e.id === id ? { ...e, ...entry } : e)),
              },
            },
          };
        }),
      deleteCycleEntry: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                cycleEntries: currentData.cycleEntries.filter((e) => e.id !== id),
              },
            },
          };
        }),
      addSymptomEntry: (entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                symptomEntries: [...currentData.symptomEntries, entry],
              },
            },
          };
        }),
      addMoodEntry: (entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                moodEntries: [...currentData.moodEntries, entry],
              },
            },
          };
        }),
      deleteMoodEntry: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                moodEntries: currentData.moodEntries.filter((entry) => entry.id !== id),
              },
            },
          };
        }),
      addSleepEntry: (entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          const existing = currentData.sleepEntries || [];
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                sleepEntries: [entry, ...existing.filter((e) => e.id !== entry.id)],
              },
            },
          };
        }),
      deleteSleepEntry: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          const existing = currentData.sleepEntries || [];
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                sleepEntries: existing.filter((entry) => entry.id !== id),
              },
            },
          };
        }),
      setSleepEntries: (entries) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                sleepEntries: entries,
              },
            },
          };
        }),
      addHydrationEntry: (entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                hydrationEntries: [...currentData.hydrationEntries, entry],
              },
            },
          };
        }),
      updateHydrationEntry: (id, entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                hydrationEntries: currentData.hydrationEntries.map((e) => (e.id === id ? { ...e, ...entry } : e)),
              },
            },
          };
        }),
      addNutritionEntry: (entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                nutritionEntries: [...currentData.nutritionEntries, entry],
              },
            },
          };
        }),
      addFitnessEntry: (entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                fitnessEntries: [...currentData.fitnessEntries, entry],
              },
            },
          };
        }),
      deleteFitnessEntry: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                fitnessEntries: currentData.fitnessEntries.filter((entry) => entry.id !== id),
              },
            },
          };
        }),
      addFemCareAIInteraction: (interaction) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                femcareAIInteractions: [...currentData.femcareAIInteractions, interaction],
              },
            },
          };
        }),
      setEmergencyContacts: (contacts) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                emergencyContacts: contacts,
              },
            },
          };
        }),
      addEmergencyContact: (contact) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                emergencyContacts: [...currentData.emergencyContacts, contact],
              },
            },
          };
        }),
      updateEmergencyContact: (id, contact) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                emergencyContacts: currentData.emergencyContacts.map((c) =>
                  c.id === id ? { ...c, ...contact } : c
                ),
              },
            },
          };
        }),
      deleteEmergencyContact: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                emergencyContacts: currentData.emergencyContacts.filter((c) => c.id !== id),
              },
            },
          };
        }),
      addMedicine: (medicine) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                medicines: [...currentData.medicines, medicine],
              },
            },
          };
        }),
      updateMedicine: (id, medicine) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                medicines: currentData.medicines.map((m) =>
                  m.id === id ? { ...m, ...medicine } : m
                ),
              },
            },
          };
        }),
      deleteMedicine: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                medicines: currentData.medicines.filter((m) => m.id !== id),
              },
            },
          };
        }),
      addJournalEntry: (entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                journalEntries: [...currentData.journalEntries, entry],
              },
            },
          };
        }),
      updateJournalEntry: (id, entry) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                journalEntries: currentData.journalEntries.map((e) =>
                  e.id === id ? { ...e, ...entry } : e
                ),
              },
            },
          };
        }),
      deleteJournalEntry: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                journalEntries: currentData.journalEntries.filter((e) => e.id !== id),
              },
            },
          };
        }),
      addChallenge: (challenge) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                challenges: [...currentData.challenges, challenge],
              },
            },
          };
        }),
      updateChallenge: (id, challenge) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                challenges: currentData.challenges.map((c) =>
                  c.id === id ? { ...c, ...challenge } : c
                ),
              },
            },
          };
        }),
      deleteChallenge: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                challenges: currentData.challenges.filter((c) => c.id !== id),
              },
            },
          };
        }),
      addAchievement: (achievement) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                achievements: [...currentData.achievements, achievement],
              },
            },
          };
        }),
      addMedicalReport: (report) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                medicalReports: [...currentData.medicalReports, report],
              },
            },
          };
        }),
      updateMedicalReport: (id, report) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                medicalReports: currentData.medicalReports.map((r) =>
                  r.id === id ? { ...r, ...report } : r
                ),
              },
            },
          };
        }),
      deleteMedicalReport: (id) =>
        set((state) => {
          if (!state.user) return state;
          const currentData = state.getCurrentUserData();
          return {
            userData: {
              ...state.userData,
              [state.user.id]: {
                ...currentData,
                medicalReports: currentData.medicalReports.filter((r) => r.id !== id),
              },
            },
          };
        }),
    }),
    {
      name: 'femcare-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        userData: state.userData,
        doctors: state.doctors,
      }),
    }
  )
);

// Helper hooks to make it easier to use - all user-specific data
export function useCurrentUserData() {
  const store = useAppStore();
  return store.getCurrentUserData();
}

export function useChats() {
  return useCurrentUserData().chats;
}

export function useCurrentChat() {
  const data = useCurrentUserData();
  return data.chats.find(c => c.id === data.currentChatId) || null;
}

export function useProfile() {
  return useCurrentUserData().profile;
}

export function useReminders() {
  return useCurrentUserData().reminders;
}

export function useNotifications() {
  return useCurrentUserData().notifications;
}

export function useCycleEntries() {
  return useCurrentUserData().cycleEntries;
}

export function useMoodEntries() {
  return useCurrentUserData().moodEntries;
}

export function useSleepEntries() {
  return useCurrentUserData().sleepEntries || [];
}

export function useFitnessEntries() {
  return useCurrentUserData().fitnessEntries;
}

export function useHydrationEntries() {
  return useCurrentUserData().hydrationEntries;
}

export function useNutritionEntries() {
  return useCurrentUserData().nutritionEntries;
}

export function useAppointments() {
  return useCurrentUserData().appointments;
}

export function useSymptomEntries() {
  return useCurrentUserData().symptomEntries;
}

export function useFemCareAIInteractions() {
  return useCurrentUserData().femcareAIInteractions;
}

export function useEmergencyContacts() {
  return useCurrentUserData().emergencyContacts;
}

export function useMedicines() {
  return useCurrentUserData().medicines;
}

export function useJournalEntries() {
  return useCurrentUserData().journalEntries;
}

export function useChallenges() {
  return useCurrentUserData().challenges;
}

export function useAchievements() {
  return useCurrentUserData().achievements;
}

export function useMedicalReports() {
  return useCurrentUserData().medicalReports;
}
