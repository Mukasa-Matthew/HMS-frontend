import React, { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { Plus, Calendar, CheckCircle, XCircle, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { useSemester } from '../../hooks/useSemester';
import { createSemester, activateSemester, deactivateSemester, updateSemester, deleteSemester, Semester } from '../../api/owner';
import { useToast } from '../../components/ui/toaster';
import { useAuth } from '../../hooks/useAuth';

export function SemestersPage() {
  const { allSemesters, activeSemester, loading, refreshSemester, refreshAllSemesters } = useSemester();
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const { toast } = useToast();
  
  // Custodians cannot delete semesters
  const canDelete = user?.role !== 'CUSTODIAN';
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [deletingSemester, setDeletingSemester] = useState<Semester | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  // Refresh data when component mounts
  React.useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([refreshSemester(), refreshAllSemesters()]);
      } catch (error) {
        console.error('Error loading semesters on mount:', error);
      }
    };
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshSemester(), refreshAllSemesters()]);
      toast({ title: 'Success', description: 'Semesters refreshed', status: 'success' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to refresh semesters', status: 'error' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createSemester({
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
      });
      toast({ title: 'Success', description: 'Semester created successfully', status: 'success' });
      await refreshAllSemesters();
      setFormData({ name: '', startDate: '', endDate: '' });
      onClose();
    } catch (error: any) {
      // Handle errors gracefully - don't let them cause logout
      const status = error?.response?.status;
      let message = 'Failed to create semester';
      
      if (status === 401) {
        message = 'Authentication failed. Please try logging in again.';
      } else if (status === 403) {
        message = error?.response?.data?.error || 'You do not have permission to create semesters.';
      } else if (status === 400) {
        message = error?.response?.data?.error || 'Invalid semester data. Please check your inputs.';
      } else {
        message = error?.response?.data?.error || 'Failed to create semester';
      }
      
      toast({ title: 'Error', description: message, status: 'error' });
      console.error('Create semester error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (semester: Semester) => {
    setEditingSemester(semester);
    // Format dates for input fields (YYYY-MM-DD)
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };
    setFormData({
      name: semester.name,
      startDate: formatDateForInput(semester.start_date),
      endDate: formatDateForInput(semester.end_date),
    });
    onEditOpen();
  };

  const handleUpdateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSemester) return;
    
    setSubmitting(true);
    try {
      await updateSemester(editingSemester.id, {
        name: formData.name,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
      });
      toast({ title: 'Success', description: 'Semester updated successfully', status: 'success' });
      await Promise.all([refreshSemester(), refreshAllSemesters()]);
      setFormData({ name: '', startDate: '', endDate: '' });
      setEditingSemester(null);
      onEditClose();
    } catch (error: any) {
      const status = error?.response?.status;
      let message = 'Failed to update semester';
      
      if (status === 401) {
        message = 'Authentication failed. Please try logging in again.';
      } else if (status === 403) {
        message = error?.response?.data?.error || 'You do not have permission to update this semester.';
      } else if (status === 400) {
        message = error?.response?.data?.error || 'Invalid semester data. Please check your inputs.';
      } else if (status === 404) {
        message = 'Semester not found.';
      } else {
        message = error?.response?.data?.error || 'Failed to update semester';
      }
      
      toast({ title: 'Error', description: message, status: 'error' });
      console.error('Update semester error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (semester: Semester) => {
    setDeletingSemester(semester);
    onDeleteOpen();
  };

  const handleConfirmDelete = async () => {
    if (!deletingSemester) return;
    
    setSubmitting(true);
    try {
      await deleteSemester(deletingSemester.id);
      toast({ title: 'Success', description: 'Semester deleted successfully', status: 'success' });
      await Promise.all([refreshSemester(), refreshAllSemesters()]);
      setDeletingSemester(null);
      onDeleteClose();
    } catch (error: any) {
      const status = error?.response?.status;
      let message = 'Failed to delete semester';
      
      if (status === 401) {
        message = 'Authentication failed. Please try logging in again.';
      } else if (status === 403) {
        message = error?.response?.data?.error || 'You do not have permission to delete this semester.';
      } else if (status === 400) {
        message = error?.response?.data?.error || 'Cannot delete this semester. It may be active or have associated students.';
      } else if (status === 404) {
        message = 'Semester not found.';
      } else {
        message = error?.response?.data?.error || 'Failed to delete semester';
      }
      
      toast({ title: 'Error', description: message, status: 'error' });
      console.error('Delete semester error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (semesterId: number) => {
    try {
      await activateSemester(semesterId);
      toast({ title: 'Success', description: 'Semester activated successfully', status: 'success' });
      await Promise.all([refreshSemester(), refreshAllSemesters()]);
    } catch (error: any) {
      // Don't let errors propagate - handle them gracefully
      const status = error?.response?.status;
      let message = 'Failed to activate semester';
      
      if (status === 401) {
        message = 'Authentication failed. Please try logging in again.';
      } else if (status === 403) {
        message = error?.response?.data?.error || 'You do not have permission to activate this semester.';
      } else if (status === 404) {
        message = 'Semester not found.';
      } else {
        message = error?.response?.data?.error || 'Failed to activate semester';
      }
      
      toast({ title: 'Error', description: message, status: 'error' });
      console.error('Activate semester error:', error);
    }
  };

  const handleDeactivate = async (semesterId: number) => {
    try {
      await deactivateSemester(semesterId);
      toast({ title: 'Success', description: 'Semester deactivated successfully', status: 'success' });
      await Promise.all([refreshSemester(), refreshAllSemesters()]);
    } catch (error: any) {
      // Don't let errors propagate - handle them gracefully
      const status = error?.response?.status;
      let message = 'Failed to deactivate semester';
      
      if (status === 401) {
        message = 'Authentication failed. Please try logging in again.';
      } else if (status === 403) {
        message = error?.response?.data?.error || 'You do not have permission to deactivate this semester.';
      } else if (status === 404) {
        message = 'Semester not found.';
      } else {
        message = error?.response?.data?.error || 'Failed to deactivate semester';
      }
      
      toast({ title: 'Error', description: message, status: 'error' });
      console.error('Deactivate semester error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Debug logging
  React.useEffect(() => {
    console.log('SemestersPage - loading:', loading, 'allSemesters:', allSemesters, 'count:', allSemesters.length, 'items:', allSemesters);
  }, [loading, allSemesters]);

  if (loading) {
    return (
      <Box>
        <Text>Loading semesters...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2}>
            Semester Management
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Create and manage academic semesters for your hostel
          </Text>
        </Box>
        <Flex gap={3} flexWrap="wrap">
          <Button 
            leftIcon={<RefreshCw className="w-4 h-4" />} 
            onClick={handleRefresh} 
            variant="outline"
            isLoading={refreshing}
            disabled={refreshing}
            size="md"
          >
            Refresh
          </Button>
          <Button 
            leftIcon={<Plus className="w-4 h-4" />} 
            onClick={onOpen} 
            colorScheme="blue"
            size="md"
            fontWeight="600"
          >
            Create Semester
          </Button>
        </Flex>
      </Flex>

      {!activeSemester && (
        <Alert status="warning" mb={6} borderRadius="md">
          <AlertIcon />
          No active semester. Please activate a semester to start managing student records.
        </Alert>
      )}

      {activeSemester && (
        <Alert status="info" mb={6} borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">Active Semester: {activeSemester.name}</Text>
            <Text fontSize="sm">
              {formatDate(activeSemester.start_date)}
              {activeSemester.end_date ? ` - ${formatDate(activeSemester.end_date)}` : ' (Ongoing)'}
            </Text>
          </Box>
        </Alert>
      )}

      <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.200" overflow="hidden">
        <Table variant="simple">
          <Thead bg="gray.50">
            <Tr>
              <Th>Name</Th>
              <Th>Start Date</Th>
              <Th>End Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {allSemesters.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8}>
                  <VStack spacing={2}>
                    <Calendar className="w-8 h-8 text-gray-400" />
                    <Text color="gray.500">No semesters created yet</Text>
                    <Text fontSize="sm" color="gray.400">
                      Create your first semester to get started
                    </Text>
                  </VStack>
                </Td>
              </Tr>
            ) : (
              allSemesters.map((semester) => (
                <Tr key={semester.id}>
                  <Td fontWeight="medium">{semester.name}</Td>
                  <Td>{formatDate(semester.start_date)}</Td>
                  <Td>{semester.end_date ? formatDate(semester.end_date) : '—'}</Td>
                  <Td>
                    {semester.is_active === 1 ? (
                      <Badge colorScheme="green">Active</Badge>
                    ) : (
                      <Badge colorScheme="gray">Inactive</Badge>
                    )}
                  </Td>
                  <Td>
                    <Flex gap={2}>
                      {semester.is_active === 1 ? (
                        <Tooltip label="Deactivate Semester">
                          <IconButton
                            aria-label="Deactivate"
                            icon={<XCircle className="w-4 h-4" />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeactivate(semester.id)}
                          />
                        </Tooltip>
                      ) : (
                        <Tooltip label="Activate Semester">
                          <IconButton
                            aria-label="Activate"
                            icon={<CheckCircle className="w-4 h-4" />}
                            size="sm"
                            colorScheme="green"
                            variant="ghost"
                            onClick={() => handleActivate(semester.id)}
                          />
                        </Tooltip>
                      )}
                      <Tooltip label="Edit Semester">
                        <IconButton
                          aria-label="Edit"
                          icon={<Edit className="w-4 h-4" />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={() => handleEditClick(semester)}
                        />
                      </Tooltip>
                      {semester.is_active === 0 && canDelete && (
                        <Tooltip label="Delete Semester">
                          <IconButton
                            aria-label="Delete"
                            icon={<Trash2 className="w-4 h-4" />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleDeleteClick(semester)}
                          />
                        </Tooltip>
                      )}
                    </Flex>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Create Semester Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Semester</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleCreateSemester}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Semester Name</FormLabel>
                  <Input
                    placeholder="e.g., Fall 2024, Spring 2025"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </FormControl>
                <Flex gap={3} w="full" justify="flex-end">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" colorScheme="blue" isLoading={submitting}>
                    Create Semester
                  </Button>
                </Flex>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Edit Semester Modal */}
      <Modal 
        isOpen={isEditOpen} 
        onClose={() => {
          onEditClose();
          setEditingSemester(null);
          setFormData({ name: '', startDate: '', endDate: '' });
        }} 
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Semester</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleUpdateSemester}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Semester Name</FormLabel>
                  <Input
                    placeholder="e.g., Fall 2024, Spring 2025"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    disabled={editingSemester?.is_active === 1}
                  />
                  {editingSemester?.is_active === 1 && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Cannot change dates of an active semester. Deactivate it first.
                    </Text>
                  )}
                </FormControl>
                <FormControl>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    disabled={editingSemester?.is_active === 1}
                  />
                </FormControl>
                <Flex gap={3} w="full" justify="flex-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      onEditClose();
                      setEditingSemester(null);
                      setFormData({ name: '', startDate: '', endDate: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" colorScheme="blue" isLoading={submitting}>
                    Update Semester
                  </Button>
                </Flex>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Semester
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{deletingSemester?.name}"? This action cannot be undone.
              {deletingSemester?.is_active === 1 && (
                <Alert status="warning" mt={3} borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">
                    This semester is currently active. You must deactivate it before deleting.
                  </Text>
                </Alert>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                ml={3}
                isLoading={submitting}
                disabled={deletingSemester?.is_active === 1}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
