import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loader2 } from 'lucide-react';

// Lazy Load Pages
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const ModeSelection = React.lazy(() => import('./pages/ModeSelection').then(module => ({ default: module.ModeSelection })));
const SessionSetup = React.lazy(() => import('./pages/SessionSetup').then(module => ({ default: module.SessionSetup })));
const PermissionsCheck = React.lazy(() => import('./pages/PermissionsCheck').then(module => ({ default: module.PermissionsCheck })));
const FocusSession = React.lazy(() => import('./pages/FocusSession').then(module => ({ default: module.FocusSession })));
const SessionSummary = React.lazy(() => import('./pages/SessionSummary').then(module => ({ default: module.SessionSummary })));

// Loading Component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-emerald-50 dark:bg-gray-900 transition-colors">
    <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected Dashboard & Settings */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Session Wizard Routes */}
        <Route 
          path="/session/mode" 
          element={
            <ProtectedRoute>
              <ModeSelection />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/session/setup" 
          element={
            <ProtectedRoute>
              <SessionSetup />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/session/permissions" 
          element={
            <ProtectedRoute>
              <PermissionsCheck />
            </ProtectedRoute>
          } 
        />
        
        {/* Active Session Route */}
        <Route 
          path="/session/active" 
          element={
            <ProtectedRoute>
              <FocusSession />
            </ProtectedRoute>
          } 
        />
        
        {/* Session Summary Route */}
        <Route 
          path="/session/summary" 
          element={
            <ProtectedRoute>
              <SessionSummary />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SessionProvider>
            <ToastProvider>
              <HashRouter>
                <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-200">
                  <AppRoutes />
                </div>
              </HashRouter>
            </ToastProvider>
          </SessionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}