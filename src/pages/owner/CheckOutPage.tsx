import React, { useEffect, useState } from 'react';
import { 
  Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, 
  Input as ChakraInput, InputGroup, InputLeftElement, HStack, VStack, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  FormLabel, FormControl, Divider, Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import { LogOut, Search, Users, BedDouble, User, Phone, Mail, MapPin, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StudentWithDetails, fetchStudentsWithDetails, checkOutStudentFromCheckIn, fetchCheckIns, CheckIn } from '../../api/owner';
import { useToast } from '../../components/ui/toaster';

export function CheckOutPage() {
  const { toast } = useToast();
  const { isOpen: isCheckOutOpen, onOpen: onCheckOutOpen, onClose: onCheckOutClose } = useDisclosure();
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, checkIns]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, checkInsData] = await Promise.all([
        fetchStudentsWithDetails().catch(() => []),
        fetchCheckIns().catch(() => []),
      ]);
      setStudents(studentsData);
      setCheckIns(checkInsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({ title: 'Error', description: 'Failed to load data', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    // Filter to show only students who have been explicitly checked in (from backend)
    // AND not yet checked out
    const checkedInStudentIds = new Set(
      checkIns.filter(ci => !ci.checked_out_at).map(ci => ci.student_id)
    );
    
    let filtered = students.filter((s) => {
      // Must have allocation (room assigned) AND be checked in (from backend)
      // AND not yet checked out
      return s.allocation && checkedInStudentIds.has(s.id);
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => 
        s.full_name.toLowerCase().includes(query) ||
        s.registration_number.toLowerCase().includes(query) ||
        s.phone?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.room?.name.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleCheckOut = async (student: StudentWithDetails) => {
    if (!student.allocation) {
      toast({ title: 'Error', description: 'Student is not checked in', status: 'error' });
      return;
    }

    setSelectedStudent(student);
    onCheckOutOpen();
  };

  const handleConfirmCheckOut = async () => {
    if (!selectedStudent) {
      toast({ title: 'Error', description: 'No student selected', status: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await checkOutStudentFromCheckIn({ studentId: selectedStudent.id });

      toast({ 
        title: 'Success', 
        description: 'Student checked out successfully', 
        status: 'success' 
      });

      onCheckOutClose();
      setSelectedStudent(null);
      await loadData(); // Reload to get updated check-ins from backend
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error?.response?.data?.error || error?.message || 'Failed to check out student', 
        status: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get checked-in students as a Map
  const getCheckedInStudents = () => {
    const map = new Map();
    checkIns.forEach(ci => {
      if (!ci.checked_out_at) {
        map.set(ci.student_id, {
          checkedInAt: ci.checked_in_at,
          checkedOutAt: ci.checked_out_at,
        });
      }
    });
    return map;
  };

  // Statistics - use backend check-ins data
  const checkedInCount = students.filter((s) => {
    const checkIn = checkIns.find(ci => ci.student_id === s.id && !ci.checked_out_at);
    return s.allocation && checkIn !== undefined;
  }).length;
  const totalStudents = students.length;
  const pendingCheckOuts = checkedInCount;
  const studentsWithOutstanding = students.filter((s) => {
    if (!s.allocation || !s.paymentSummary) return false;
    // Only count outstanding for students who are actually checked in and not checked out
    const checkedInStudents = getCheckedInStudents();
    const checkedInData = checkedInStudents.get(s.id);
    return checkedInData && !checkedInData.checkedOutAt && s.paymentSummary.balance > 0;
  }).length;

  const formatCurrency = (amount: number) => 
    `UGX ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get check-in timestamp for a student
  const getCheckedInTimestamp = (studentId: number): string | null => {
    const checkedInStudents = getCheckedInStudents();
    return checkedInStudents.get(studentId)?.checkedInAt || null;
  };

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" mb={1} color="gray.900" fontWeight="700">
            Check-out
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Check out students and remove their room assignments at the end of the semester.
          </Text>
        </Box>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={6}>
        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Checked In
              </Text>
              <Box p={2} bg="blue.100" borderRadius="md">
                <Users className="w-4 h-4 text-blue-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {checkedInCount}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Students with room assignments
            </Text>
          </VStack>
        </Card>

        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Pending Check-out
              </Text>
              <Box p={2} bg="orange.100" borderRadius="md">
                <LogOut className="w-4 h-4 text-orange-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {pendingCheckOuts}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Students ready for check-out
            </Text>
          </VStack>
        </Card>

        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Total Students
              </Text>
              <Box p={2} bg="purple.100" borderRadius="md">
                <User className="w-4 h-4 text-purple-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {totalStudents}
            </Text>
            <Text fontSize="xs" color="gray.500">
              All registered students
            </Text>
          </VStack>
        </Card>

        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                With Outstanding
              </Text>
              <Box p={2} bg="red.100" borderRadius="md">
                <DollarSign className="w-4 h-4 text-red-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {studentsWithOutstanding}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Students with unpaid balances
            </Text>
          </VStack>
        </Card>
      </SimpleGrid>

      {/* Students Table */}
      <Card p={6}>
        <Flex justify="space-between" align="center" mb={4} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
          <Heading size="md" color="gray.900">
            Checked In Students
          </Heading>
          <InputGroup maxW={{ base: 'full', md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <Search className="w-4 h-4 text-gray-400" />
            </InputLeftElement>
            <ChakraInput
              placeholder="Search by name, registration, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="white"
            />
          </InputGroup>
        </Flex>

        {loading ? (
          <Text textAlign="center" py={8} color="gray.500">
            Loading...
          </Text>
        ) : filteredStudents.length === 0 ? (
          <Box textAlign="center" py={12}>
            <LogOut className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <Text color="gray.500" fontSize="lg" fontWeight="500" mb={2}>
              {searchQuery ? 'No students found' : 'No students checked in'}
            </Text>
            <Text color="gray.400" fontSize="sm">
              {searchQuery 
                ? 'Try adjusting your search criteria'
                : 'All students need to be checked in first'}
            </Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>STUDENT</Th>
                  <Th>REGISTRATION</Th>
                  <Th>ROOM</Th>
                  <Th>CHECKED IN</Th>
                  <Th>PAYMENT STATUS</Th>
                  <Th>CONTACT</Th>
                  <Th>ACTION</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredStudents.map((student) => {
                  const hasOutstanding = student.paymentSummary && student.paymentSummary.balance > 0;
                  return (
                    <Tr key={student.id} _hover={{ bg: 'gray.50' }}>
                      <Td>
                        <VStack align="flex-start" spacing={0}>
                          <Text fontWeight="600" color="gray.900">
                            {student.full_name}
                          </Text>
                          {student.email && (
                            <HStack spacing={1}>
                              <Mail className="w-3 h-3 text-gray-400" />
                              <Text fontSize="xs" color="gray.500">
                                {student.email}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontFamily="mono" fontSize="sm" color="gray.700">
                          {student.registration_number}
                        </Text>
                      </Td>
                      <Td>
                        {student.room ? (
                          <HStack spacing={1}>
                            <BedDouble className="w-3 h-3 text-gray-400" />
                            <Text fontSize="sm" fontWeight="600" color="gray.900">
                              {student.room.name}
                            </Text>
                          </HStack>
                        ) : (
                          <Text fontSize="sm" color="gray.400">
                            N/A
                          </Text>
                        )}
                      </Td>
                      <Td>
                        {(() => {
                          const checkedInAt = getCheckedInTimestamp(student.id);
                          if (checkedInAt) {
                            return (
                              <VStack align="flex-start" spacing={0}>
                                <HStack spacing={1}>
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <Text fontSize="sm" color="gray.700" fontWeight="500">
                                    {formatDateTime(checkedInAt)}
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">
                                  Checked in
                                </Text>
                              </VStack>
                            );
                          }
                          return (
                            <Text fontSize="sm" color="gray.400">
                              N/A
                            </Text>
                          );
                        })()}
                      </Td>
                      <Td>
                        {student.paymentSummary ? (
                          <VStack align="flex-start" spacing={0}>
                            {hasOutstanding ? (
                              <Text fontSize="xs" color="red.600" fontWeight="600">
                                Outstanding: {formatCurrency(student.paymentSummary.balance)}
                              </Text>
                            ) : (
                              <Text fontSize="xs" color="green.600" fontWeight="600">
                                Paid in Full
                              </Text>
                            )}
                            <Text fontSize="xs" color="gray.500">
                              {formatCurrency(student.paymentSummary.totalPaid)} / {formatCurrency(student.paymentSummary.totalRequired)}
                            </Text>
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.400">
                            N/A
                          </Text>
                        )}
                      </Td>
                      <Td>
                        {student.phone ? (
                          <HStack spacing={1}>
                            <Phone className="w-3 h-3 text-gray-400" />
                            <Text fontSize="sm" color="gray.700">
                              {student.phone}
                            </Text>
                          </HStack>
                        ) : (
                          <Text fontSize="sm" color="gray.400">
                            N/A
                          </Text>
                        )}
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          variant={hasOutstanding ? "outline" : "default"}
                          colorScheme={hasOutstanding ? "orange" : "blue"}
                          onClick={() => handleCheckOut(student)}
                          leftIcon={<LogOut className="w-4 h-4" />}
                        >
                          Check Out
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Check-out Confirmation Modal */}
      <Modal isOpen={isCheckOutOpen} onClose={onCheckOutClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Check-out</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedStudent && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>
                    You are about to check out the following student:
                  </Text>
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <VStack align="flex-start" spacing={2}>
                      <Text fontSize="lg" fontWeight="700" color="gray.900">
                        {selectedStudent.full_name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Registration: {selectedStudent.registration_number}
                      </Text>
                      {selectedStudent.room && (
                        <Text fontSize="sm" color="gray.600">
                          Room: {selectedStudent.room.name}
                        </Text>
                      )}
                      {(() => {
                        const checkedInAt = getCheckedInTimestamp(selectedStudent.id);
                        if (checkedInAt) {
                          return (
                            <Text fontSize="sm" color="gray.600">
                              Checked in: {formatDateTime(checkedInAt)}
                            </Text>
                          );
                        }
                        return null;
                      })()}
                    </VStack>
                  </Box>
                </Box>

                {selectedStudent.paymentSummary && selectedStudent.paymentSummary.balance > 0 && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Outstanding Balance!</AlertTitle>
                      <AlertDescription>
                        This student has an outstanding balance of {formatCurrency(selectedStudent.paymentSummary.balance)}. 
                        Consider collecting payment before check-out.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Check-out Action</AlertTitle>
                    <AlertDescription>
                      This will remove the room assignment for this student. The allocation record will be deleted, 
                      but payment history will be preserved.
                    </AlertDescription>
                  </Box>
                </Alert>

                <Divider />

                <HStack justify="flex-end" spacing={3}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCheckOutClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    colorScheme="red"
                    onClick={handleConfirmCheckOut}
                    isLoading={submitting}
                    loadingText="Checking Out..."
                  >
                    Confirm Check-out
                  </Button>
                </HStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
