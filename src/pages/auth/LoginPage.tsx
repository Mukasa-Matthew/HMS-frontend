import React, { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, CardHeader, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Phone, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toaster';
import { useAuth } from '../../hooks/useAuth';
import { requestPasswordResetOTP, verifyOTP, resetPassword } from '../../api/passwordReset';

type FormView = 'login' | 'forgot-password' | 'verify-otp' | 'reset-password';

export function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Form view state
  const [currentView, setCurrentView] = useState<FormView>('login');
  
  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot password state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(username, password);
      toast({ title: 'Welcome back', status: 'success' });
      if (user.role === 'SUPER_ADMIN') {
        navigate('/super-admin', { replace: true });
      } else if (user.role === 'HOSTEL_OWNER') {
        navigate('/owner', { replace: true });
      } else if (user.role === 'CUSTODIAN') {
        navigate('/custodian', { replace: true });
      } else {
        toast({ 
          title: 'Error', 
          description: `Role "${user.role}" is not supported. Please contact support.`, 
          status: 'error' 
        });
        console.error('Unsupported user role:', user.role);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Login failed';
      toast({ title: 'Error', description: msg, status: 'error' });
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length === 0) {
      toast({ 
        title: 'Error', 
        description: 'Please enter your phone number', 
        status: 'error' 
      });
      return;
    }

    setLoading(true);
    try {
      await requestPasswordResetOTP(phone.trim());
      toast({ 
        title: 'OTP Sent', 
        description: 'If this phone number is registered, an OTP has been sent to your phone.', 
        status: 'success' 
      });
      setCurrentView('verify-otp');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to send OTP';
      toast({ 
        title: 'Error', 
        description: msg, 
        status: 'error' 
      });
      console.error('Password reset request error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setCurrentView('forgot-password');
      return;
    }

    if (!otp || otp.length !== 6) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a valid 6-digit OTP', 
        status: 'error' 
      });
      return;
    }

    setLoading(true);
    try {
      const response = await verifyOTP(phone.trim(), otp);
      toast({ 
        title: 'OTP Verified', 
        description: 'OTP verified successfully. Please set your new password.', 
        status: 'success' 
      });
      setResetToken(response.resetToken);
      setCurrentView('reset-password');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to verify OTP';
      toast({ 
        title: 'Error', 
        description: msg, 
        status: 'error' 
      });
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone || !resetToken) {
      setCurrentView('forgot-password');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast({ 
        title: 'Error', 
        description: 'Password must be at least 6 characters long', 
        status: 'error' 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ 
        title: 'Error', 
        description: 'Passwords do not match', 
        status: 'error' 
      });
      return;
    }

    setLoading(true);
    try {
      await resetPassword(phone.trim(), resetToken, newPassword);
      toast({ 
        title: 'Success', 
        description: 'Password reset successfully! You can now login with your new password.', 
        status: 'success' 
      });
      // Reset all state and go back to login
      setCurrentView('login');
      setPhone('');
      setOtp('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to reset password';
      toast({ 
        title: 'Error', 
        description: msg, 
        status: 'error' 
      });
      console.error('Password reset error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const getTitle = () => {
    switch (currentView) {
      case 'forgot-password':
        return 'Forgot Password?';
      case 'verify-otp':
        return 'Verify OTP';
      case 'reset-password':
        return 'Reset Password';
      default:
        return null;
    }
  };

  const getSubtitle = () => {
    switch (currentView) {
      case 'forgot-password':
        return 'Enter your registered phone number to receive an OTP';
      case 'verify-otp':
        return `Enter the 6-digit code sent to ${phone || 'your phone'}`;
      case 'reset-password':
        return 'Create a new password for your account';
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage:
          'linear-gradient(to bottom right, rgba(15,23,42,0.65), rgba(15,23,42,0.45)), url("https://images.unsplash.com/photo-1596276020587-8044fe049813?w=1600&auto=format&fit=crop&q=80&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8aG9zdGVsc3xlbnwwfHwwfHx8MA%3D%3D")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Decorative overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-lg px-4 sm:px-6 relative z-10"
      >
        <Card 
          className="backdrop-blur-xl bg-white/98 border border-white/30 shadow-2xl" 
          variant="outline"
          style={{
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <CardHeader className="pt-8 pb-6 px-8">
            {/* Logo and Branding - Horizontal Layout */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-6 w-full"
            >
              {/* Logo Container - Left Side - Larger Size */}
              <div 
                className="flex-shrink-0 w-56 h-56 flex items-center justify-center bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100"
                style={{
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)'
                }}
              >
                <img 
                  src="/WhatsApp Image 2026-02-01 at 1.11.06 PM (1).jpeg" 
                  alt="Martmor Hostel Logo" 
                  className="w-full h-full object-contain"
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto'
                  }}
                />
              </div>
              
              {/* Branding Section - Right Side */}
              <div className="flex-1 space-y-1">
                <motion.h1
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-2xl font-bold tracking-tight leading-tight"
                  style={{
                    letterSpacing: '-0.3px',
                    color: '#10b981'
                  }}
                >
                  MARTMOR HOSTEL
                </motion.h1>
                <motion.h2
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="text-lg font-semibold"
                  style={{
                    color: '#10b981'
                  }}
                >
                  Management System
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="text-sm text-gray-500 font-medium pt-1"
                >
                  Digitize Your Hostel Operations
                </motion.p>
              </div>
            </motion.div>

            {/* Dynamic Title for Password Reset Views */}
            <AnimatePresence mode="wait">
              {getTitle() && (
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 text-center"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {getTitle()}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getSubtitle()}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>
          
          <CardBody className="px-8 pb-8">
            <AnimatePresence mode="wait">
              {/* Login Form */}
              {currentView === 'login' && (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLoginSubmit}
                  className="space-y-5"
                >
                  {/* Username Input */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                      <Mail className="w-5 h-5" />
                    </div>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Username or phone number"
                      autoComplete="username"
                      className="h-12 text-base pl-12 pr-4"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        borderWidth: '1.5px',
                        transition: 'all 0.2s',
                        borderRadius: '10px',
                        color: '#1e293b'
                      }}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#10b981';
                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f8fafc';
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Password Input */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="h-12 text-base pl-12 pr-4"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        borderWidth: '1.5px',
                        transition: 'all 0.2s',
                        borderRadius: '10px',
                        color: '#1e293b'
                      }}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#10b981';
                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f8fafc';
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  
                  {/* Submit Button */}
                  <div className="pt-1">
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2"
                      disabled={loading || !username || !password}
                      style={{
                        background: loading || !username || !password 
                          ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: loading || !username || !password ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Signing in...
                        </span>
                      ) : (
                        <>
                          NEXT
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Footer Links */}
                  <div className="space-y-3 pt-2">
                    <p className="text-xs text-gray-600 text-center">
                      By signing in, I agree to the{' '}
                      <a 
                        href="/terms" 
                        className="text-green-600 hover:text-green-700 font-semibold underline transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate('/terms');
                        }}
                      >
                        Terms & Conditions
                      </a>
                    </p>
                    <p className="text-xs text-gray-600 text-center">
                      Forgot Password?{' '}
                      <a 
                        href="#" 
                        className="text-green-600 hover:text-green-700 font-semibold underline transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentView('forgot-password');
                        }}
                      >
                        Reset Here
                      </a>
                    </p>
                  </div>
                </motion.form>
              )}

              {/* Forgot Password Form */}
              {currentView === 'forgot-password' && (
                <motion.form
                  key="forgot-password"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleForgotPasswordSubmit}
                  className="space-y-5"
                >
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                      <Phone className="w-5 h-5" />
                    </div>
                    <Input
                      type="tel"
                      placeholder="0702913454 or +256702913454"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-12 text-base pl-12 pr-4"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        borderWidth: '1.5px',
                        transition: 'all 0.2s',
                        borderRadius: '10px',
                        color: '#1e293b'
                      }}
                      disabled={loading}
                      required
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#10b981';
                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f8fafc';
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2"
                      disabled={loading || !phone}
                      style={{
                        background: loading || !phone 
                          ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: loading || !phone ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Sending OTP...
                        </span>
                      ) : (
                        <>
                          Send OTP
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
                      onClick={() => setCurrentView('login')}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Verify OTP Form */}
              {currentView === 'verify-otp' && (
                <motion.form
                  key="verify-otp"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleVerifyOTPSubmit}
                  className="space-y-5"
                >
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                      <Shield className="w-5 h-5" />
                    </div>
                    <Input
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otp}
                      onChange={handleOtpChange}
                      className="h-12 text-base pl-12 pr-4 text-center text-2xl font-bold tracking-widest"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        borderWidth: '1.5px',
                        transition: 'all 0.2s',
                        borderRadius: '10px',
                        color: '#1e293b'
                      }}
                      disabled={loading}
                      required
                      maxLength={6}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#10b981';
                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f8fafc';
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Code expires in 10 minutes
                  </p>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2"
                      disabled={loading || otp.length !== 6}
                      style={{
                        background: loading || otp.length !== 6
                          ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Verifying...
                        </span>
                      ) : (
                        <>
                          Verify OTP
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
                      onClick={() => setCurrentView('forgot-password')}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </Button>
                  </div>
                </motion.form>
              )}

              {/* Reset Password Form */}
              {currentView === 'reset-password' && (
                <motion.form
                  key="reset-password"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleResetPasswordSubmit}
                  className="space-y-5"
                >
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-12 text-base pl-12 pr-10"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        borderWidth: '1.5px',
                        transition: 'all 0.2s',
                        borderRadius: '10px',
                        color: '#1e293b'
                      }}
                      disabled={loading}
                      required
                      minLength={6}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#10b981';
                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f8fafc';
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be at least 6 characters
                  </p>

                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 z-10">
                      <Lock className="w-5 h-5" />
                    </div>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 text-base pl-12 pr-10"
                      style={{
                        backgroundColor: '#f8fafc',
                        borderColor: '#cbd5e1',
                        borderWidth: '1.5px',
                        transition: 'all 0.2s',
                        borderRadius: '10px',
                        color: '#1e293b'
                      }}
                      disabled={loading}
                      required
                      minLength={6}
                      onFocus={(e) => {
                        e.target.style.backgroundColor = '#ffffff';
                        e.target.style.borderColor = '#10b981';
                        e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.backgroundColor = '#f8fafc';
                        e.target.style.borderColor = '#cbd5e1';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="pt-1">
                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 uppercase tracking-wide flex items-center justify-center gap-2"
                      disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      style={{
                        background: loading || !newPassword || !confirmPassword || newPassword !== confirmPassword
                          ? 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        cursor: loading || !newPassword || !confirmPassword || newPassword !== confirmPassword ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          Resetting...
                        </span>
                      ) : (
                        <>
                          Reset Password
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
                      onClick={() => setCurrentView('login')}
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Login
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </CardBody>
        </Card>
        
        {/* Copyright Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.4 }}
          className="mt-6 text-center"
        >
          <Text className="text-xs text-white/80 font-medium">
            ©2026, a product of <span className="font-bold">MARTMOR TECHNOLOGIES</span>
          </Text>
        </motion.div>
      </motion.div>
    </div>
  );
}
