import React, { useEffect, useState } from 'react';
import { 
  Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, 
  Input as ChakraInput, InputGroup, InputLeftElement, HStack, VStack, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  FormLabel, FormControl, Select, Divider
} from '@chakra-ui/react';
import { LogIn, Search, Users, BedDouble, User, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { StudentWithDetails, fetchStudentsWithDetails, Room, fetchRooms, allocateRoom, Allocation, fetchAllocations, Payment, fetchPayments, CheckIn, fetchCheckIns, checkInStudent } from '../../api/owner';
import { useToast } from '../../components/ui/toaster';

export function CheckInPage() {
  const { toast } = useToast();
  const { isOpen: isCheckInOpen, onOpen: onCheckInOpen, onClose: onCheckInClose } = useDisclosure();
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
  const [checkInForm, setCheckInForm] = useState({
    studentId: '',
    roomId: '',
  });
  
  // Track students who have been checked in (from backend)
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    loadData();
    loadCheckIns();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, checkIns]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, roomsData, allocationsData, paymentsData] = await Promise.all([
        fetchStudentsWithDetails().catch(() => []),
        fetchRooms().catch(() => []),
        fetchAllocations().catch(() => []),
        fetchPayments().catch(() => []),
      ]);

      setStudents(studentsData);
      setRooms(roomsData);
      setAllocations(allocationsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({ title: 'Error', description: 'Failed to load data', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadCheckIns = async () => {
    try {
      const checkInsData = await fetchCheckIns();
      setCheckIns(checkInsData);
    } catch (error) {
      console.error('Failed to load check-ins:', error);
    }
  };

  const filterStudents = () => {
    // Filter to show only students who:
    // 1. Are registered (have a student record)
    // 2. Have an allocation (room assigned) AND have paid some money
    // 3. Are NOT yet checked in (exclude students who have been checked in)
    
    // Get all allocation IDs that have payments
    const allocationsWithPayments = new Set(
      payments.map((p) => p.allocation_id)
    );

    // Get set of currently checked-in student IDs (not checked out)
    const checkedInStudentIds = new Set(
      checkIns.filter(ci => !ci.checked_out_at).map(ci => ci.student_id)
    );

    // Exclude students who have already been checked in (and not checked out)
    let filtered = students.filter((s) => {
      // Must have an allocation (room assigned) to have payments
      if (!s.allocation) return false;
      
      // Exclude students who have already been checked in (and not checked out)
      if (checkedInStudentIds.has(s.id)) return false;
      
      // Must have made at least one payment
      // Check if the allocation has payments
      const hasPayments = allocationsWithPayments.has(s.allocation.id);
      
      // Also check payment summary as backup
      const hasPaymentSummary = s.paymentSummary && s.paymentSummary.totalPaid > 0;
      
      return hasPayments || hasPaymentSummary;
    });

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((s) => 
        s.full_name.toLowerCase().includes(query) ||
        s.registration_number.toLowerCase().includes(query) ||
        s.phone?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
  };

  const handleCheckIn = async (student: StudentWithDetails) => {
    setSelectedStudent(student);
    
    // If student already has a room, use that room ID
    // Otherwise, they need to select a room
    if (student.room) {
      setCheckInForm({ studentId: student.id.toString(), roomId: student.room.id.toString() });
    } else {
      setCheckInForm({ studentId: student.id.toString(), roomId: '' });
    }
    
    onCheckInOpen();
  };

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInForm.studentId) {
      toast({ title: 'Error', description: 'Student is required', status: 'error' });
      return;
    }

    const student = students.find((s) => s.id === Number(checkInForm.studentId));
    if (!student) {
      toast({ title: 'Error', description: 'Student not found', status: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      
      // If student doesn't have a room yet, assign one
      if (!student.room || !student.allocation) {
        if (!checkInForm.roomId) {
          toast({ title: 'Error', description: 'Please select a room for the student', status: 'error' });
          return;
        }
        
        // Allocate room (this creates the allocation)
        await allocateRoom({
          studentId: Number(checkInForm.studentId),
          roomId: Number(checkInForm.roomId),
        });
      }
      // If student already has a room, we just confirm check-in
      // (In the current system, having an allocation means they're "checked in")
      // This is just a confirmation step

      // Check in student via backend API
      await checkInStudent({
        studentId: Number(checkInForm.studentId),
      });

      // Reload check-ins to update the UI
      await loadCheckIns();

      toast({ 
        title: 'Success', 
        description: 'Student has been checked in successfully. They have physically reported to the hostel.', 
        status: 'success' 
      });

      onCheckInClose();
      setCheckInForm({ studentId: '', roomId: '' });
      setSelectedStudent(null);
      await loadData();
      // Filter will automatically update due to checkIns dependency in useEffect
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error?.response?.data?.error || error?.message || 'Failed to check in student', 
        status: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get available rooms (not occupied)
  const availableRooms = rooms.filter((room) => {
    const isOccupied = allocations.some((a) => a.room_id === room.id);
    return !isOccupied && room.is_active === 1;
  });

  // Statistics
  // Count students who are registered, have paid, but not checked in
  // These are students with allocation + payments who are ready for check-in
  const pendingCheckIns = filteredStudents.length;
  
  // "Checked In" count: Only count students who have been explicitly checked in
  // through the check-in process (from backend)
  // Exclude students who have been checked out
  // Also validate that the student still exists in the current student list
  const currentStudentIds = new Set(students.map(s => s.id));
  const checkedInCount = checkIns.filter(
    (ci) => !ci.checked_out_at && currentStudentIds.has(ci.student_id)
  ).length;
  
  const totalStudents = students.length;
  const availableRoomsCount = availableRooms.length;

  const formatCurrency = (amount: number) => 
    `UGX ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Helper function to get check-in timestamp for a student
  const getCheckedInTimestamp = (studentId: number): string | null => {
    const checkIn = checkIns.find(ci => ci.student_id === studentId && !ci.checked_out_at);
    return checkIn?.checked_in_at || null;
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

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" mb={1} color="gray.900" fontWeight="700">
            Check-in
          </Heading>
          <Text color="gray.600" fontSize="sm">
            Check in students who have registered and made at least one payment. Students must physically report to the hostel before check-in.
          </Text>
        </Box>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={6}>
        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Pending Check-ins
              </Text>
              <Box p={2} bg="orange.100" borderRadius="md">
                <LogIn className="w-4 h-4 text-orange-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {pendingCheckIns}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Registered & paid, awaiting check-in
            </Text>
          </VStack>
        </Card>

        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Checked In
              </Text>
              <Box p={2} bg="green.100" borderRadius="md">
                <Users className="w-4 h-4 text-green-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {checkedInCount}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Physically checked in students
            </Text>
          </VStack>
        </Card>

        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Total Students
              </Text>
              <Box p={2} bg="blue.100" borderRadius="md">
                <User className="w-4 h-4 text-blue-600" />
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
                Available Rooms
              </Text>
              <Box p={2} bg="purple.100" borderRadius="md">
                <BedDouble className="w-4 h-4 text-purple-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {availableRoomsCount}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Rooms ready for assignment
            </Text>
          </VStack>
        </Card>
      </SimpleGrid>

      {/* Students Table */}
      <Card p={6}>
        <Flex justify="space-between" align="center" mb={4} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
          <Heading size="md" color="gray.900">
            Students Ready for Check-in
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Only students who have registered and made at least one payment are shown here.
          </Text>
          <InputGroup maxW={{ base: 'full', md: '300px' }}>
            <InputLeftElement pointerEvents="none">
              <Search className="w-4 h-4 text-gray-400" />
            </InputLeftElement>
            <ChakraInput
              placeholder="Search by name, registration, phone..."
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
            <LogIn className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <Text color="gray.500" fontSize="lg" fontWeight="500" mb={2}>
              {searchQuery ? 'No students found' : 'No students ready for check-in'}
            </Text>
            <Text color="gray.400" fontSize="sm">
              {searchQuery 
                ? 'Try adjusting your search criteria'
                : 'Students must be registered and have made at least one payment before they can be checked in'}
            </Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>STUDENT</Th>
                  <Th>REGISTRATION</Th>
                  <Th>CONTACT</Th>
                  <Th>PAYMENT STATUS</Th>
                  <Th>ROOM</Th>
                  <Th>ACTION</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredStudents.map((student) => (
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
                      {student.paymentSummary ? (
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="sm" fontWeight="600" color="green.600">
                            {formatCurrency(student.paymentSummary.totalPaid)} paid
                          </Text>
                          {student.paymentSummary.balance > 0 && (
                            <Text fontSize="xs" color="orange.600">
                              Balance: {formatCurrency(student.paymentSummary.balance)}
                            </Text>
                          )}
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color="gray.400">
                          No payments
                        </Text>
                      )}
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
                        <Text fontSize="sm" color="orange.600" fontWeight="500">
                          No room assigned
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(student)}
                        leftIcon={<LogIn className="w-4 h-4" />}
                        disabled={!student.room}
                      >
                        {student.room ? 'Check In' : 'Assign Room First'}
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Check-in Modal */}
      <Modal isOpen={isCheckInOpen} onClose={onCheckInClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Check In Student</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmitCheckIn}>
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="blue.50" borderRadius="md" mb={2}>
                  <Text fontSize="sm" fontWeight="600" color="blue.900" mb={1}>
                    Confirm Physical Arrival
                  </Text>
                  <Text fontSize="xs" color="blue.700">
                    This student has registered and made payment. Confirm that they have physically reported to the hostel before checking them in.
                  </Text>
                </Box>

                <FormControl>
                  <FormLabel>Student</FormLabel>
                  <ChakraInput
                    value={selectedStudent?.full_name || ''}
                    isReadOnly
                    bg="gray.50"
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Registration: {selectedStudent?.registration_number}
                  </Text>
                  {selectedStudent?.paymentSummary && (
                    <Text fontSize="xs" color="green.600" mt={1} fontWeight="500">
                      Amount Paid: {formatCurrency(selectedStudent.paymentSummary.totalPaid)}
                    </Text>
                  )}
                </FormControl>

                {selectedStudent?.room ? (
                  <FormControl>
                    <FormLabel>Assigned Room</FormLabel>
                    <ChakraInput
                      value={`${selectedStudent.room.name} - ${formatCurrency(selectedStudent.allocation?.room_price_at_allocation || 0)}`}
                      isReadOnly
                      bg="gray.50"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Student already has a room assigned
                    </Text>
                  </FormControl>
                ) : (
                  <FormControl isRequired>
                    <FormLabel>Select Room</FormLabel>
                    <Select
                      placeholder="Choose a room"
                      value={checkInForm.roomId}
                      onChange={(e) => setCheckInForm({ ...checkInForm, roomId: e.target.value })}
                      bg="white"
                    >
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} - {formatCurrency(Number(room.price))} (Capacity: {room.capacity})
                        </option>
                      ))}
                    </Select>
                    {availableRooms.length === 0 && (
                      <Text fontSize="xs" color="red.500" mt={1}>
                        No available rooms. Please create rooms first or check out existing students.
                      </Text>
                    )}
                  </FormControl>
                )}

                {checkInForm.roomId && (
                  <Box p={4} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="600" color="blue.900" mb={2}>
                      Room Details
                    </Text>
                    <VStack align="flex-start" spacing={1}>
                      {(() => {
                        const selectedRoom = rooms.find((r) => r.id === Number(checkInForm.roomId));
                        return selectedRoom ? (
                          <>
                            <Text fontSize="sm" color="gray.700">
                              <strong>Room:</strong> {selectedRoom.name}
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              <strong>Price:</strong> {formatCurrency(Number(selectedRoom.price))}
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              <strong>Capacity:</strong> {selectedRoom.capacity} student(s)
                            </Text>
                          </>
                        ) : null;
                      })()}
                    </VStack>
                  </Box>
                )}

                <Divider />

                <HStack justify="flex-end" spacing={3}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCheckInClose}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={submitting}
                    loadingText="Checking In..."
                    disabled={!selectedStudent?.room && (!checkInForm.roomId || availableRooms.length === 0)}
                  >
                    {selectedStudent?.room ? 'Confirm Check-in (Physical Arrival)' : 'Assign Room & Check In'}
                  </Button>
                </HStack>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
