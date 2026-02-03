import { Navigate, Route, Routes } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Box, Spinner } from '@chakra-ui/react';
import { Toaster } from './components/ui/toaster';
import { LoginPage } from './pages/auth/LoginPage';
import { TermsAndConditionsPage } from './pages/auth/TermsAndConditionsPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { VerifyOTPPage } from './pages/auth/VerifyOTPPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { SuperAdminDashboard } from './pages/dashboards/SuperAdminDashboard';
import { OwnerDashboard } from './pages/dashboards/OwnerDashboard';
import { CustodianDashboard } from './pages/dashboards/CustodianDashboard';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ role, children }: { role: string; children: JSX.Element }) {
  const { user, loading } = useAuth();
  
  // Wait for auth to initialize before checking
  // This prevents race condition where user is null initially but will be set from localStorage
  if (loading) {
    // Show a loading spinner while auth initializes
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="100vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Box>
    );
  }
  
  // Check if user exists
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user has the correct role
  if (user.role !== role) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <>
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/login"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LoginPage />
              </motion.div>
            }
          />
          <Route
            path="/terms"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TermsAndConditionsPage />
              </motion.div>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ForgotPasswordPage />
              </motion.div>
            }
          />
          <Route
            path="/verify-otp"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <VerifyOTPPage />
              </motion.div>
            }
          />
          <Route
            path="/reset-password"
            element={
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ResetPasswordPage />
              </motion.div>
            }
          />
          <Route
            path="/super-admin/*"
            element={
              <ProtectedRoute role="SUPER_ADMIN">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner/*"
            element={
              <ProtectedRoute role="HOSTEL_OWNER">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/custodian/*"
            element={
              <ProtectedRoute role="CUSTODIAN">
                <CustodianDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
      <Toaster />
    </>
  );
}

