import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Card,
} from '@chakra-ui/react';
import { ArrowLeft, Save } from 'lucide-react';
import { fetchHostelFeatureSettings, updateHostelFeatureSettings, FeatureSetting, HostelFeatureSettings } from '../../api/admin';
import { useToast } from '../../components/ui/toaster';
import { fetchHostels, Hostel } from '../../api/admin';

const FEATURE_LABELS: Record<string, { label: string; description: string }> = {
  students: {
    label: 'Students Management',
    description: 'Register, view, and manage students',
  },
  rooms: {
    label: 'Rooms Management',
    description: 'Create, edit, and manage rooms',
  },
  payments: {
    label: 'Payments Management',
    description: 'Record payments and manage allocations',
  },
  checkin_checkout: {
    label: 'Check-in/Check-out',
    description: 'Manage student check-ins and check-outs',
  },
  semesters: {
    label: 'Semesters Management',
    description: 'Create and manage academic semesters',
  },
  receipts: {
    label: 'Receipts',
    description: 'View and manage payment receipts',
  },
  dashboard_quick_actions: {
    label: 'Dashboard Quick Action Buttons',
    description: 'Show quick action buttons (Record Payment, Check-in, Check-out, Generate Receipt) on the dashboard',
  },
};

export function FeatureSettingsPage() {
  const { hostelId } = useParams<{ hostelId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hostel, setHostel] = useState<Hostel | null>(null);
  const [settings, setSettings] = useState<HostelFeatureSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (hostelId) {
      loadData();
    }
  }, [hostelId]);

  const loadData = async () => {
    if (!hostelId) return;
    try {
      setLoading(true);
      const [hostelsData, settingsData] = await Promise.all([
        fetchHostels(),
        fetchHostelFeatureSettings(Number(hostelId)),
      ]);
      const foundHostel = hostelsData.find((h) => h.id === Number(hostelId));
      setHostel(foundHostel || null);
      setSettings(settingsData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to load feature settings',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (featureName: string, forOwner: boolean) => {
    if (!settings) return;
    const updatedFeatures = settings.features.map((f) => {
      if (f.featureName === featureName) {
        return {
          ...f,
          enabledForOwner: forOwner ? !f.enabledForOwner : f.enabledForOwner,
          enabledForCustodian: !forOwner ? !f.enabledForCustodian : f.enabledForCustodian,
        };
      }
      return f;
    });
    setSettings({ ...settings, features: updatedFeatures });
  };

  const handleSave = async () => {
    if (!settings || !hostelId) return;
    try {
      setSubmitting(true);
      await updateHostelFeatureSettings(Number(hostelId), settings.features);
      toast({
        title: 'Success',
        description: 'Feature settings updated successfully',
        status: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to update feature settings',
        status: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="60vh">
        <VStack>
          <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
          <Text mt={4} fontSize="lg" color="gray.600">
            Loading feature settings...
          </Text>
        </VStack>
      </Box>
    );
  }

  if (!hostel || !settings) {
    return (
      <Box>
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          Hostel not found or settings could not be loaded.
        </Alert>
        <Button leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/super-admin/hostels')}>
          Back to Hostels
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Flex align="center" gap={4} mb={6}>
        <Button
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          variant="ghost"
          onClick={() => navigate('/super-admin/hostels')}
        >
          Back
        </Button>
        <Box flex="1">
          <Heading size="lg" mb={2} color="gray.900" fontWeight="700">
            Control What {hostel.name} Owners Can See
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Turn features ON/OFF to show or hide them from Hostel Owners. Custodians always have full access.
          </Text>
        </Box>
        <Button
          leftIcon={<Save className="w-4 h-4" />}
          colorScheme="brand"
          onClick={handleSave}
          isLoading={submitting}
        >
          Save Changes
        </Button>
      </Flex>

      <Alert status="info" borderRadius="md" mb={6}>
        <AlertIcon />
        <Box>
          <Text fontWeight="semibold" mb={2}>Simple Explanation:</Text>
          <VStack align="flex-start" spacing={2} fontSize="sm">
            <Text>
              <strong>🎯 What you're doing:</strong> You're controlling what the <strong>Hostel Owner</strong> can see in their dashboard.
            </Text>
            <Text>
              <strong>✅ Toggle ON:</strong> Owner can see and use this feature (e.g., Students, Rooms, Payments)
            </Text>
            <Text>
              <strong>❌ Toggle OFF:</strong> Owner cannot see this feature. They'll see a simplified dashboard with only:
              <strong> Total Revenue, Total Rooms, Outstanding Balances, and Reports</strong>
            </Text>
            <Text color="green.600" fontWeight="600">
              <strong>👷 Custodians:</strong> They ALWAYS have full access to everything (they need it for day-to-day work)
            </Text>
          </VStack>
        </Box>
      </Alert>

      <Card p={6}>
        <VStack spacing={6} align="stretch">
          {settings.features.map((feature) => {
            const featureInfo = FEATURE_LABELS[feature.featureName] || {
              label: feature.featureName,
              description: '',
            };
            return (
              <Box key={feature.featureName}>
                <Flex justify="space-between" align="flex-start" mb={3}>
                  <Box flex="1">
                    <Text fontWeight="600" fontSize="md" color="gray.900" mb={1}>
                      {featureInfo.label}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {featureInfo.description}
                    </Text>
                  </Box>
                </Flex>
                <Box mt={4} p={4} bg="gray.50" borderRadius="md">
                  <FormControl display="flex" alignItems="center" justifyContent="space-between">
                    <Box flex="1">
                      <FormLabel htmlFor={`${feature.featureName}-owner`} mb={1} fontWeight="600" fontSize="md" color="gray.900">
                        Show this to Hostel Owner?
                      </FormLabel>
                      <Text fontSize="sm" color="gray.600">
                        {feature.enabledForOwner 
                          ? '✅ Owner CAN see and use this feature' 
                          : '❌ Owner CANNOT see this feature (will see simplified dashboard instead)'}
                      </Text>
                    </Box>
                    <Switch
                      id={`${feature.featureName}-owner`}
                      isChecked={feature.enabledForOwner}
                      onChange={() => handleToggle(feature.featureName, true)}
                      colorScheme="brand"
                      size="lg"
                    />
                  </FormControl>
                  <Text fontSize="xs" color="green.600" mt={2} fontWeight="500">
                    👷 Note: Custodians always have access to this feature (for day-to-day operations)
                  </Text>
                </Box>
                <Divider mt={4} />
              </Box>
            );
          })}
        </VStack>
      </Card>
    </Box>
  );
}
