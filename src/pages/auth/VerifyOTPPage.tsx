import React, { FormEvent, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@chakra-ui/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toaster';
import { verifyOTP } from '../../api/passwordReset';

export function VerifyOTPPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone;

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) {
      toast({ 
        title: 'Error', 
        description: 'Phone number not found. Please start over.', 
        status: 'error' 
      });
      navigate('/forgot-password', { replace: true });
    }
  }, [phone, navigate, toast]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      navigate('/forgot-password', { replace: true });
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
      const response = await verifyOTP(phone, otp);
      toast({ 
        title: 'OTP Verified', 
        description: 'OTP verified successfully. Please set your new password.', 
        status: 'success' 
      });
      // Navigate to reset password page with token
      navigate('/reset-password', { 
        state: { 
          phone,
          resetToken: response.resetToken 
        },
        replace: false 
      });
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

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  if (!phone) {
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
              Verify OTP
            </h1>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to <br />
              <span className="font-semibold text-gray-900">{phone}</span>
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* OTP Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  OTP Code
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={otp}
                    onChange={handleOtpChange}
                    className="pl-10 w-full h-12 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-center text-2xl font-bold tracking-widest"
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
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Code expires in 10 minutes
                </p>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="pt-1"
              >
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
              </motion.div>

              {/* Back Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="pt-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-sm text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2"
                  onClick={() => navigate('/forgot-password', { state: { phone } })}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </motion.div>
            </form>
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
}
