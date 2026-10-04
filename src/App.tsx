import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Component, Suspense, lazy, useEffect } from 'react';
import Splash from './pages/Splash';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Doctors from './pages/Doctors';
import DoctorChat from './pages/DoctorChat';
import Reminders from './pages/Reminders';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';
import CycleTracker from './pages/CycleTracker';
import HealthReports from './pages/HealthReports';
import MoodEntry from './pages/MoodEntry';
import SleepEntry from './pages/SleepEntry';
import WorkoutEntry from './pages/WorkoutEntry';
import Settings from './pages/Settings';
import Appointments from './pages/Appointments';
import EmergencyContacts from './pages/EmergencyContacts';
import CalendarPage from './pages/CalendarPage';
import MedicineTracker from './pages/MedicineTracker';
import HealthJournal from './pages/HealthJournal';
import Challenges from './pages/Challenges';
import PregnancyTracker from './pages/PregnancyTracker';
import NutritionTracker from './pages/NutritionTracker';
import EmergencySupport from './pages/EmergencySupport';
import CommunitySupport from './pages/CommunitySupport';
import Hydration from './pages/Hydration';
import { useAppStore } from './store';
import { ThemeProvider } from './hooks/useTheme';
import { useReminders } from './hooks/useReminders';
import { Sparkles, RotateCcw, Home as HomeIcon, Shield, AlertTriangle } from 'lucide-react';

// --------- Error Boundary: prevents BLANK SCREEN on any child component crash ---------
interface ErrorBoundaryProps { children: React.ReactNode }
interface ErrorBoundaryState { hasError: boolean; error?: Error }
class PageErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
     
    console.error('[FemCare] Page error boundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    if (typeof window !== 'undefined') window.location.href = '/home';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-8 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-pink-200/40 rounded-full blur-3xl -mt-10 -mr-10" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-200/40 rounded-full blur-3xl -mb-16 -ml-12" />
            <div className="relative z-10">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-400 via-pink-500 to-rose-500 animate-pulse opacity-20 blur-xl" />
                <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 flex items-center justify-center text-white shadow-2xl">
                  <AlertTriangle className="w-12 h-12" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-2 font-medium text-base">
                We encountered a small issue loading this page
              </p>
              {this.state.error?.message && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-100 rounded-2xl text-left">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-red-600 mb-1">Error details</div>
                      <div className="text-sm font-mono text-red-700 break-words">{this.state.error.message}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <button
                  onClick={this.handleReset}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset & Go Home
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 bg-white border-2 border-gray-100 text-gray-700 font-bold py-3.5 px-5 rounded-2xl hover:border-gray-200 hover:shadow-md transition-all"
                >
                  <HomeIcon className="w-5 h-5" />
                  Reload Page
                </button>
              </div>
              <div className="pt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-semibold mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  FEMCARE AI · PROTECTED BY ERROR SAFETY
                </div>
                <p className="text-xs text-gray-400">
                  Your data is safely stored. Try resetting or refreshing — if the issue persists, please contact support.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --------- Page Loading Skeleton (used while any page Suspenses or state initializes) ---------
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 sm:p-6 lg:p-10">
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-200 to-purple-200" />
            <div className="space-y-2">
              <div className="h-7 w-52 rounded-xl bg-gradient-to-r from-pink-200 to-purple-200" />
              <div className="h-4 w-40 rounded-lg bg-gray-200" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-200" />
            <div className="w-12 h-12 rounded-2xl bg-gray-200" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-60 rounded-3xl bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100" />
          <div className="space-y-6">
            <div className="h-28 rounded-3xl bg-gray-100" />
            <div className="h-28 rounded-3xl bg-gray-100" />
          </div>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="h-96 rounded-3xl bg-gray-100" />
      </div>
    </div>
  );
}

import DoctorDashboard from './pages/DoctorDashboard';

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'patient' | 'doctor' | 'admin' }) {
  const user = useAppStore((state) => state.user);
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }
  const currentRole = user.role || 'patient';
  if (allowedRole && currentRole !== allowedRole) {
    if (currentRole === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
    if (currentRole === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/home" replace />;
  }
  if (!allowedRole && currentRole !== 'patient') {
    if (currentRole === 'doctor') return <Navigate to="/doctor-dashboard" replace />;
    if (currentRole === 'admin') return <Navigate to="/admin" replace />;
  }
  return (
    <PageErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
    </PageErrorBoundary>
  );
}

export default function App() {
  useReminders();

  return (
    <ThemeProvider>
      <Router>
        <PageErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />
          <Route
            path="/doctor-dashboard"
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/home"
            element={
              <ProtectedRoute allowedRole="patient">
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRole="patient">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <ProtectedRoute allowedRole="patient">
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors"
            element={
              <ProtectedRoute allowedRole="patient">
                <Doctors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor-chat/:doctorId"
            element={
              <ProtectedRoute allowedRole="patient">
                <DoctorChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reminders"
            element={
              <ProtectedRoute allowedRole="patient">
                <Reminders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRole="patient">
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
          {/* New wellness features */}
          <Route
            path="/cycle-tracker"
            element={
              <ProtectedRoute>
                <CycleTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health-reports"
            element={
              <ProtectedRoute>
                <HealthReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hydration"
            element={
              <ProtectedRoute>
                <Hydration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hydration-tracker"
            element={
              <ProtectedRoute>
                <Hydration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mood-entry"
            element={
              <ProtectedRoute>
                <MoodEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sleep-entry"
            element={
              <ProtectedRoute>
                <SleepEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sleep-tracker"
            element={
              <ProtectedRoute>
                <SleepEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workout-entry"
            element={
              <ProtectedRoute>
                <WorkoutEntry />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pregnancy-tracker"
            element={
              <ProtectedRoute>
                <PregnancyTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/nutrition"
            element={
              <ProtectedRoute>
                <NutritionTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency"
            element={
              <ProtectedRoute>
                <EmergencySupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <CommunitySupport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/emergency-contacts"
            element={
              <ProtectedRoute>
                <EmergencyContacts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medicine-tracker"
            element={
              <ProtectedRoute>
                <MedicineTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/health-journal"
            element={
              <ProtectedRoute>
                <HealthJournal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges"
            element={
              <ProtectedRoute>
                <Challenges />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor-chat"
            element={
              <ProtectedRoute>
                <Doctors />
              </ProtectedRoute>
            }
          />
            </Routes>
          </Suspense>
        </PageErrorBoundary>
      </Router>
    </ThemeProvider>
  );
}
