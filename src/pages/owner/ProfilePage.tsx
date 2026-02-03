import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Alert,
  AlertIcon,
  AlertDescription,
  Divider,
  Icon,
} from '@chakra-ui/react';
import { User, Phone, Lock, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/ui/toaster';
import { fetchUserProfile, updateUserProfile } from '../../api/owner';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);

  // Form state
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Error state
  const [errors, setErrors] = useState<{
    username?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setFetching(true);
      const profile = await fetchUserProfile();
      setUsername(profile.username || '');
      setPhone(profile.phone || '');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to load profile',
        status: 'error',
      });
    } finally {
      setFetching(false);
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (username.trim().length === 0) {
      newErrors.username = 'Username is required';
    } else if (username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (phone && phone.trim().length > 0 && phone.trim().length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }

    if (newPassword) {
      if (!currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      }
      if (newPassword.length < 6) {
        newErrors.newPassword = 'Password must be at least 6 characters';
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const updateData: any = {};

      if (username.trim() !== user?.username) {
        updateData.username = username.trim();
      }

      if (phone !== (user?.phone || '')) {
        updateData.phone = phone.trim() || null;
      }

      if (newPassword) {
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        toast({
          title: 'No changes',
          description: 'No changes were made',
          status: 'info',
        });
        return;
      }

      const response = await updateUserProfile(updateData);
      
      // Update auth context with new user data
      if (response.user) {
        await refreshUser();
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({});

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        status: 'success',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to update profile';
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
      });

      // Set specific field errors if provided
      if (errorMessage.includes('password')) {
        setErrors({ currentPassword: errorMessage });
      } else if (errorMessage.includes('username')) {
        setErrors({ username: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Box p={6}>
        <Text>Loading profile...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack align="stretch" spacing={6}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Heading size="lg" color="gray.900" mb={2}>
            Profile Settings
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Manage your account information and security settings
          </Text>
        </motion.div>

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <AlertDescription>
                Your profile has been updated successfully!
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <VStack align="stretch" spacing={6}>
            {/* Username Section */}
            <Card>
              <CardHeader pb={4}>
                <HStack spacing={3}>
                  <Icon as={User} w={5} h={5} color="green.600" />
                  <Heading size="md" color="gray.800">
                    Username
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <FormControl isInvalid={!!errors.username}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                    Username
                  </FormLabel>
                  <Input
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) {
                        setErrors({ ...errors, username: undefined });
                      }
                    }}
                    placeholder="Enter your username"
                    size="lg"
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{
                      bg: 'white',
                      borderColor: 'green.500',
                      boxShadow: '0 0 0 1px #10b981',
                    }}
                  />
                  {errors.username && (
                    <FormErrorMessage>{errors.username}</FormErrorMessage>
                  )}
                </FormControl>
              </CardBody>
            </Card>

            {/* Phone Section */}
            <Card>
              <CardHeader pb={4}>
                <HStack spacing={3}>
                  <Icon as={Phone} w={5} h={5} color="green.600" />
                  <Heading size="md" color="gray.800">
                    Phone Number
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <FormControl isInvalid={!!errors.phone}>
                  <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                    Phone Number
                  </FormLabel>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) {
                        setErrors({ ...errors, phone: undefined });
                      }
                    }}
                    placeholder="Enter your phone number"
                    size="lg"
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{
                      bg: 'white',
                      borderColor: 'green.500',
                      boxShadow: '0 0 0 1px #10b981',
                    }}
                  />
                  {errors.phone && (
                    <FormErrorMessage>{errors.phone}</FormErrorMessage>
                  )}
                  <Text fontSize="xs" color="gray.500" mt={2}>
                    This is your contact phone number
                  </Text>
                </FormControl>
              </CardBody>
            </Card>

            {/* Password Section */}
            <Card>
              <CardHeader pb={4}>
                <HStack spacing={3}>
                  <Icon as={Lock} w={5} h={5} color="green.600" />
                  <Heading size="md" color="gray.800">
                    Change Password
                  </Heading>
                </HStack>
              </CardHeader>
              <CardBody pt={0}>
                <VStack align="stretch" spacing={4}>
                  <FormControl isInvalid={!!errors.currentPassword}>
                    <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                      Current Password
                    </FormLabel>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        if (errors.currentPassword) {
                          setErrors({ ...errors, currentPassword: undefined });
                        }
                      }}
                      placeholder="Enter your current password"
                      size="lg"
                      bg="gray.50"
                      borderColor="gray.200"
                      _focus={{
                        bg: 'white',
                        borderColor: 'green.500',
                        boxShadow: '0 0 0 1px #10b981',
                      }}
                    />
                    {errors.currentPassword && (
                      <FormErrorMessage>{errors.currentPassword}</FormErrorMessage>
                    )}
                    <Text fontSize="xs" color="gray.500" mt={2}>
                      Required only if you want to change your password
                    </Text>
                  </FormControl>

                  <Divider />

                  <FormControl isInvalid={!!errors.newPassword}>
                    <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                      New Password
                    </FormLabel>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword) {
                          setErrors({ ...errors, newPassword: undefined });
                        }
                      }}
                      placeholder="Enter your new password"
                      size="lg"
                      bg="gray.50"
                      borderColor="gray.200"
                      _focus={{
                        bg: 'white',
                        borderColor: 'green.500',
                        boxShadow: '0 0 0 1px #10b981',
                      }}
                    />
                    {errors.newPassword && (
                      <FormErrorMessage>{errors.newPassword}</FormErrorMessage>
                    )}
                  </FormControl>

                  <FormControl isInvalid={!!errors.confirmPassword}>
                    <FormLabel fontSize="sm" fontWeight="semibold" color="gray.700">
                      Confirm New Password
                    </FormLabel>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) {
                          setErrors({ ...errors, confirmPassword: undefined });
                        }
                      }}
                      placeholder="Confirm your new password"
                      size="lg"
                      bg="gray.50"
                      borderColor="gray.200"
                      _focus={{
                        bg: 'white',
                        borderColor: 'green.500',
                        boxShadow: '0 0 0 1px #10b981',
                      }}
                    />
                    {errors.confirmPassword && (
                      <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
                    )}
                  </FormControl>
                </VStack>
              </CardBody>
            </Card>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <Button
                type="submit"
                colorScheme="green"
                size="lg"
                width="full"
                leftIcon={<Save className="w-5 h-5" />}
                isLoading={loading}
                loadingText="Saving..."
                fontWeight="semibold"
                fontSize="md"
                py={6}
                bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                _hover={{
                  bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: 'lg',
                }}
                _active={{
                  transform: 'translateY(0)',
                }}
                transition="all 0.2s"
              >
                Save Changes
              </Button>
            </motion.div>
          </VStack>
        </form>
      </VStack>
    </Box>
  );
}
