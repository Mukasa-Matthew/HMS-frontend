import React, { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader, Box, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useToast } from '../../components/ui/toaster';
import { requestPasswordResetOTP } from '../../api/passwordReset';

export function ForgotPasswordPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
      // Navigate to OTP verification page
      navigate('/verify-otp', { 
        state: { phone: phone.trim() },
        replace: false 
      });
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
              Forgot Password?
            </h1>
            <p className="text-sm text-gray-600">
              Enter your registered phone number to receive an OTP
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Phone Input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="0702913454 or +256702913454"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 w-full h-12 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
              </motion.div>

              {/* Back to Login */}
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
