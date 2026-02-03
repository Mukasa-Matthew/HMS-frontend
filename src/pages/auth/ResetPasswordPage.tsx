import React, { FormEvent, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toaster';
import { resetPassword } from '../../api/passwordReset';

export function ResetPasswordPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { phone, resetToken } = location.state || {};

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone || !resetToken) {
      toast({ 
        title: 'Error', 
        description: 'Reset session expired. Please start over.', 
        status: 'error' 
      });
      navigate('/forgot-password', { replace: true });
    }
  }, [phone, resetToken, navigate, toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!phone || !resetToken) {
      navigate('/forgot-password', { replace: true });
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
      await resetPassword(phone, resetToken, newPassword);
      toast({ 
        title: 'Success', 
        description: 'Password reset successfully! You can now login with your new password.', 
        status: 'success' 
      });
      // Navigate to login page after a short delay
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
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

  if (!phone || !resetToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center mb-4"
            >
              <img
                src="/WhatsApp Image 2026-02-01 at 1.11.06 PM (1).jpeg"
                alt="Martmor Hostel Logo"
                className="h-20 w-20 object-contain"
              />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Reset Password
            </h1>
            <p className="text-sm text-gray-600">
              Create a new password for your account
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* New Password Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-10 w-full h-12 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
              </motion.div>

              {/* Confirm Password Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 w-full h-12 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="pt-1"
              >
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
              </motion.div>

              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="pt-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
                  onClick={() => navigate('/login')}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Button>
              </motion.div>
            </form>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
