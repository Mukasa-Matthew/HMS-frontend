import React, { useEffect, useState, FormEvent } from 'react';
import { 
  Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, Badge, 
  Input as ChakraInput, InputGroup, InputLeftElement, HStack, VStack, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  FormLabel, FormControl, Select, Divider, Menu, MenuButton, MenuList, MenuItem, RadioGroup, Radio, Stack
} from '@chakra-ui/react';
import { Users, Search, Phone, Mail, MapPin, User, BedDouble, DollarSign, Plus, MoreVertical, LogIn, Eye, Receipt } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { 
  StudentWithDetails, fetchStudentsWithDetails, createStudent,
  Room, fetchRooms, allocateRoom, fetchAllocations,
  recordPayment, Allocation, fetchStudentSMSHistory, SMSHistory,
  Payment, fetchPayments
} from '../../api/owner';
import { useToast } from '../../components/ui/toaster';
import { useFeatureSettings } from '../../hooks/useFeatureSettings';
import { useAuth } from '../../hooks/useAuth';
import { ReceiptPreview } from '../../components/receipt/ReceiptPreview';

export function StudentsPage() {
  const { toast } = useToast();
  const { features } = useFeatureSettings();
  const { user } = useAuth();
  
  // Check if owner can view payment amounts (defaults to true if not set)
  const canViewPaymentAmounts = features.get('owner_view_payment_amounts') ?? true;
  
  // Check if custodian price markup is enabled and user is custodian
  const isCustodian = user?.role === 'CUSTODIAN';
  const markupEnabled = features.get('allow_custodian_price_markup') ?? false;
  const canSetDisplayPrice = isCustodian && markupEnabled;
  const { isOpen: isRegisterOpen, onOpen: onRegisterOpen, onClose: onRegisterClose } = useDisclosure();
  const { isOpen: isAssignRoomOpen, onOpen: onAssignRoomOpen, onClose: onAssignRoomClose } = useDisclosure();
  const { isOpen: isPaymentOpen, onOpen: onPaymentOpen, onClose: onPaymentClose } = useDisclosure();
  const { isOpen: isViewDetailsOpen, onOpen: onViewDetailsOpen, onClose: onViewDetailsClose } = useDisclosure();
  const { isOpen: isSMSHistoryOpen, onOpen: onSMSHistoryOpen, onClose: onSMSHistoryClose } = useDisclosure();
  const { isOpen: isReceiptPreviewOpen, onOpen: onReceiptPreviewOpen, onClose: onReceiptPreviewClose } = useDisclosure();
  
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithDetails | null>(null);
  const [smsHistory, setSmsHistory] = useState<SMSHistory[]>([]);
  const [loadingSMSHistory, setLoadingSMSHistory] = useState(false);
  
  const [newStudent, setNewStudent] = useState({
    fullName: '',
    registrationNumber: '',
    phone: '',
    email: '',
    accessNumber: '',
    address: '',
    emergencyContact: '',
    gender: '',
    roomId: '',
    initialPayment: '',
    displayPrice: '',
  });
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  const [assignRoomForm, setAssignRoomForm] = useState({
    roomId: '',
    displayPrice: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery]);

  // Reload rooms and allocations when registration modal opens to ensure we have latest data
  useEffect(() => {
    if (isRegisterOpen) {
      const refreshRoomsAndAllocations = async () => {
        try {
          console.log('Refreshing rooms and allocations for registration modal...');
          const [roomsData, allocationsData] = await Promise.all([
            fetchRooms().catch((err) => {
              console.error('Error fetching rooms:', err);
              return [];
            }),
            fetchAllocations().catch((err) => {
              console.error('Error fetching allocations:', err);
              return [];
            }),
          ]);
          console.log('Refreshed data:', {
            rooms: roomsData.length,
            allocations: allocationsData.length,
            roomsSample: roomsData.slice(0, 3),
            allocationsSample: allocationsData.slice(0, 3)
          });
          setRooms(roomsData);
          setAllocations(allocationsData);
        } catch (error) {
          console.error('Failed to refresh rooms and allocations:', error);
        }
      };
      refreshRoomsAndAllocations();
    }
  }, [isRegisterOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, roomsData, allocationsData, paymentsData] = await Promise.all([
        fetchStudentsWithDetails().catch((err) => {
          console.error('Error fetching students:', err);
          return [];
        }),
        fetchRooms().catch((err) => {
          console.error('Error fetching rooms:', err);
          return [];
        }),
        fetchAllocations().catch((err) => {
          console.error('Error fetching allocations:', err);
          return [];
        }),
        fetchPayments().catch((err) => {
          console.error('Error fetching payments:', err);
          return [];
        }),
      ]);
      
      console.log('Loaded data for StudentsPage:', {
        students: studentsData.length,
        rooms: roomsData.length,
        allocations: allocationsData.length,
        roomsSample: roomsData.slice(0, 3),
        allocationsSample: allocationsData.slice(0, 3)
      });
      
      setStudents(studentsData);
      setRooms(roomsData);
      setAllocations(allocationsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast({ title: 'Error', description: 'Failed to load data', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

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

  const handleRegisterStudent = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStudent.fullName || !newStudent.registrationNumber || !newStudent.gender) {
      toast({ title: 'Error', description: 'Full name, registration number, and gender are required', status: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      
      // Step 1: Create the student
      await createStudent({
        fullName: newStudent.fullName,
        registrationNumber: newStudent.registrationNumber,
        phone: newStudent.phone || undefined,
        email: newStudent.email || undefined,
        accessNumber: newStudent.accessNumber || undefined,
        address: newStudent.address || undefined,
        emergencyContact: newStudent.emergencyContact || undefined,
        gender: newStudent.gender as 'male' | 'female',
      });
      
      // Reload students to get the newly created student ID
      const updatedStudents = await fetchStudentsWithDetails();
      const createdStudent = updatedStudents.find(
        (s) => s.registration_number === newStudent.registrationNumber
      );

      if (!createdStudent) {
        throw new Error('Student was created but could not be found');
      }

      // Step 2: Allocate room if selected
      if (newStudent.roomId) {
        const allocationPayload: { studentId: number; roomId: number; displayPrice?: number } = {
          studentId: createdStudent.id,
          roomId: Number(newStudent.roomId),
        };
        
        // Add displayPrice if feature is enabled and value is provided
        if (canSetDisplayPrice && newStudent.displayPrice) {
          const displayPrice = parseFloat(newStudent.displayPrice);
          if (!isNaN(displayPrice) && displayPrice > 0) {
            allocationPayload.displayPrice = displayPrice;
          }
        }
        
        const allocationResult = await allocateRoom(allocationPayload);

        // Step 3: Record initial payment if provided
        if (newStudent.initialPayment && parseFloat(newStudent.initialPayment) > 0) {
          await recordPayment({
            allocationId: allocationResult.allocationId,
            amount: parseFloat(newStudent.initialPayment),
          });
        }
      } else if (newStudent.initialPayment && parseFloat(newStudent.initialPayment) > 0) {
        toast({ 
          title: 'Warning', 
          description: 'Payment cannot be recorded without a room assignment. Please assign a room first.', 
          status: 'warning' 
        });
      }
      
      toast({ title: 'Success', description: 'Student registered successfully', status: 'success' });
      onRegisterClose();
      setNewStudent({
        fullName: '',
        registrationNumber: '',
        phone: '',
        email: '',
        accessNumber: '',
        address: '',
        emergencyContact: '',
        gender: '',
        roomId: '',
        initialPayment: '',
        displayPrice: '',
      });
      setRoomSearchQuery('');
      await loadData();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error?.response?.data?.error || error?.message || 'Failed to register student', 
        status: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignRoom = async (student: StudentWithDetails) => {
    setSelectedStudent(student);
    setAssignRoomForm({ roomId: '', displayPrice: '' });
    onAssignRoomOpen();
  };

  const handleSubmitAssignRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !assignRoomForm.roomId) {
      toast({ title: 'Error', description: 'Please select a room', status: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const payload: { studentId: number; roomId: number; displayPrice?: number } = {
        studentId: selectedStudent.id,
        roomId: Number(assignRoomForm.roomId),
      };
      
      // Add displayPrice if feature is enabled and value is provided
      if (canSetDisplayPrice && assignRoomForm.displayPrice) {
        const displayPrice = parseFloat(assignRoomForm.displayPrice);
        if (!isNaN(displayPrice) && displayPrice > 0) {
          payload.displayPrice = displayPrice;
        }
      }
      
      await allocateRoom(payload);

      toast({ title: 'Success', description: 'Room assigned successfully', status: 'success' });
      onAssignRoomClose();
      setSelectedStudent(null);
      setAssignRoomForm({ roomId: '', displayPrice: '' });
      await loadData();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error?.response?.data?.error || error?.message || 'Failed to assign room', 
        status: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (student: StudentWithDetails) => {
    if (!student.allocation) {
      toast({ title: 'Error', description: 'Student must have a room assigned first', status: 'error' });
      return;
    }
    setSelectedStudent(student);
    setPaymentForm({ amount: '' });
    onPaymentOpen();
  };

  const handleSubmitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedStudent?.allocation || !paymentForm.amount) {
      toast({ title: 'Error', description: 'Please enter payment amount', status: 'error' });
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', status: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await recordPayment({
        allocationId: selectedStudent.allocation.id,
        amount: amount,
      });

      toast({ title: 'Success', description: 'Payment recorded successfully', status: 'success' });
      onPaymentClose();
      setSelectedStudent(null);
      setPaymentForm({ amount: '' });
      await loadData();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error?.response?.data?.error || error?.message || 'Failed to record payment', 
        status: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Get available rooms (not occupied)
  // Note: Backend already filters by is_active = 1, so all rooms returned are active
  const availableRooms = React.useMemo(() => {
    console.log('Calculating available rooms:', {
      roomsCount: rooms.length,
      allocationsCount: allocations.length,
      rooms: rooms.map(r => ({ id: r.id, name: r.name, idType: typeof r.id, is_active: r.is_active })),
      allocations: allocations.map(a => ({ id: a.id, room_id: a.room_id, room_idType: typeof a.room_id }))
    });

    if (rooms.length === 0) {
      console.log('No rooms loaded yet');
      return [];
    }
    
    // Filter to only active rooms and rooms that are not occupied
    const filtered = rooms.filter((room) => {
      // Ensure room is active
      if (room.is_active !== 1 && room.is_active !== true) {
        console.log(`Room ${room.id} (${room.name}) is not active`);
        return false;
      }
      
      // Check if room is occupied by comparing room_id from allocations
      // Convert both to numbers to handle type mismatches
      const roomId = Number(room.id);
      const isOccupied = allocations.some((a) => {
        const allocationRoomId = Number(a.room_id);
        const matches = allocationRoomId === roomId;
        if (matches) {
          console.log(`Room ${room.id} (${room.name}) is occupied by allocation ${a.id}`);
        }
        return matches;
      });
      
      if (!isOccupied) {
        console.log(`Room ${room.id} (${room.name}) is available`);
      }
      
      return !isOccupied;
    });
    
    console.log('Available rooms result:', {
      totalRooms: rooms.length,
      totalAllocations: allocations.length,
      availableRoomsCount: filtered.length,
      availableRooms: filtered.map(r => ({ id: r.id, name: r.name }))
    });
    
    return filtered;
  }, [rooms, allocations]);

  // Filter rooms based on search query
  const filteredAvailableRooms = availableRooms.filter((room) => {
    if (!roomSearchQuery) return true;
    const query = roomSearchQuery.toLowerCase();
    return (
      room.name.toLowerCase().includes(query) ||
      room.price.toString().includes(query) ||
      room.capacity.toString().includes(query)
    );
  });

  const formatCurrency = (amount: number) => 
    `UGX ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const totalStudents = students.length;
  const studentsWithRooms = students.filter((s) => s.room !== null).length;
  const studentsWithOutstanding = students.filter((s) => s.paymentSummary && s.paymentSummary.balance > 0).length;
  const totalOutstanding = students.reduce((sum, s) => sum + (s.paymentSummary?.balance || 0), 0);

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" mb={1} color="gray.900" fontWeight="700">
            Students
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Register students, assign rooms, record payments, and manage student information.
          </Text>
        </Box>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onRegisterOpen}
        >
          Register Student
        </Button>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 2, sm: 4 }} gap={3} mb={6}>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            Total Students
          </Text>
          <Heading size="lg" color="gray.900" fontWeight="700">
            {totalStudents}
          </Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            With Rooms
          </Text>
          <Heading size="lg" color="gray.900" fontWeight="700">
            {studentsWithRooms}
          </Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            Outstanding
          </Text>
          <Heading size="lg" color="gray.900" fontWeight="700">
            {studentsWithOutstanding}
          </Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            Total Outstanding
          </Text>
          <Heading size="lg" color="gray.900" fontWeight="700">
            UGX {totalOutstanding.toLocaleString()}
          </Heading>
        </Box>
      </SimpleGrid>

      {/* Students Table */}
      <Card p={0} overflow="hidden">
        <Box p={5} borderBottom="1px solid" borderColor="gray.100" bg="white">
          <Flex gap={3} flexWrap="wrap" align="center">
            <InputGroup size="md" maxW="400px">
              <InputLeftElement pointerEvents="none">
                <Search className="w-4 h-4 text-gray-400" />
              </InputLeftElement>
              <ChakraInput
                placeholder="Search by name, registration, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderColor="gray.300"
                bg="white"
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
              />
            </InputGroup>
            <Box ml="auto">
              <Text fontSize="sm" color="gray.500">
                {filteredStudents.length} of {students.length}
              </Text>
            </Box>
          </Flex>
        </Box>
        <Box overflowX="auto">
          <Table variant="simple" size="md">
            <Thead bg="gray.50">
              <Tr>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Student
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Contact
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Room
                </Th>
                {canViewPaymentAmounts && (
                  <>
                    <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3} isNumeric>
                      Amount Paid
                    </Th>
                    <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3} isNumeric>
                      Balance
                    </Th>
                  </>
                )}
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Status
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Actions
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={canViewPaymentAmounts ? 7 : 5} py={12} textAlign="center" color="gray.500">
                    Loading students...
                  </Td>
                </Tr>
              ) : filteredStudents.length === 0 ? (
                <Tr>
                  <Td colSpan={canViewPaymentAmounts ? 7 : 5} py={12} textAlign="center" color="gray.500">
                    <VStack spacing={2}>
                      <Users className="w-8 h-8 text-gray-300" />
                      <Text>
                        {searchQuery ? 'No students match your search' : 'No students found'}
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                filteredStudents.map((student) => {
                  const hasOutstanding = student.paymentSummary && student.paymentSummary.balance > 0;
                  const isFullyPaid = student.paymentSummary && student.paymentSummary.balance <= 0;
                  
                  return (
                    <Tr key={student.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                      <Td py={3}>
                        <VStack align="flex-start" spacing={1}>
                          <Text 
                            fontSize="sm" 
                            fontWeight="700" 
                            color="gray.900"
                            cursor="pointer"
                            _hover={{ color: 'brand.600', textDecoration: 'underline' }}
                            onClick={() => {
                              setSelectedStudent(student);
                              onSMSHistoryOpen();
                              loadSMSHistory(student.id);
                            }}
                          >
                            {student.full_name}
                          </Text>
                          <HStack spacing={2} flexWrap="wrap">
                            <Badge colorScheme="blue" fontSize="xs" px={2} py={0.5} borderRadius="md">
                              Reg: {student.registration_number}
                            </Badge>
                            {student.access_number && (
                              <Badge colorScheme="gray" fontSize="xs" px={2} py={0.5} borderRadius="md">
                                Access: {student.access_number}
                              </Badge>
                            )}
                            {student.gender && (
                              <Badge colorScheme={student.gender === 'male' ? 'blue' : 'pink'} fontSize="xs" px={2} py={0.5} borderRadius="md">
                                {student.gender === 'male' ? 'Male' : 'Female'}
                              </Badge>
                            )}
                          </HStack>
                        </VStack>
                      </Td>
                      <Td py={3}>
                        <VStack align="flex-start" spacing={1}>
                          {student.phone && (
                            <HStack spacing={1}>
                              <Phone className="w-3 h-3 text-gray-400" />
                              <Text fontSize="xs" color="gray.600">
                                {student.phone}
                              </Text>
                            </HStack>
                          )}
                          {student.email && (
                            <HStack spacing={1}>
                              <Mail className="w-3 h-3 text-gray-400" />
                              <Text fontSize="xs" color="gray.600">
                                {student.email}
                              </Text>
                            </HStack>
                          )}
                          {student.emergency_contact && (
                            <HStack spacing={1}>
                              <User className="w-3 h-3 text-gray-400" />
                              <Text fontSize="xs" color="gray.600">
                                Emergency: {student.emergency_contact}
                              </Text>
                            </HStack>
                          )}
                          {student.address && (
                            <HStack spacing={1}>
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <Text fontSize="xs" color="gray.600">
                                {student.address}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </Td>
                      <Td py={3}>
                        {student.room ? (
                          <VStack align="flex-start" spacing={1}>
                            <HStack spacing={2}>
                              <BedDouble className="w-4 h-4 text-brand-600" />
                              <Text fontSize="sm" fontWeight="700" color="brand.600">
                                {student.room.name}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                              Room Number
                            </Text>
                          </VStack>
                        ) : (
                          <Text fontSize="sm" color="gray.400" fontStyle="italic">
                            Not assigned
                          </Text>
                        )}
                      </Td>
                      {canViewPaymentAmounts && (
                        <>
                          <Td py={3} isNumeric>
                            {student.paymentSummary ? (
                              <VStack align="flex-end" spacing={0}>
                                {student.allocation ? (
                                  <Text fontSize="sm" fontWeight="600" color="green.600">
                                    {Number(student.paymentSummary.totalPaid).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/{Number(student.allocation.room_price_at_allocation).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                  </Text>
                                ) : (
                                  <Text fontSize="sm" fontWeight="600" color="green.600">
                                    {Number(student.paymentSummary.totalPaid).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                  </Text>
                                )}
                              </VStack>
                            ) : (
                              <Text fontSize="sm" color="gray.400">
                                -
                              </Text>
                            )}
                          </Td>
                          <Td py={3} isNumeric>
                            {student.paymentSummary ? (
                              <Text 
                                fontSize="sm" 
                                fontWeight="600" 
                                color={hasOutstanding ? 'red.600' : 'green.600'}
                              >
                                {hasOutstanding ? (
                                  <>UGX {student.paymentSummary.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                                ) : (
                                  <>UGX 0.00</>
                                )}
                              </Text>
                            ) : (
                              <Text fontSize="sm" color="gray.400">
                                -
                              </Text>
                            )}
                          </Td>
                        </>
                      )}
                      <Td py={3}>
                        {student.room ? (
                          isFullyPaid ? (
                            <Badge colorScheme="green" fontSize="xs" px={2.5} py={0.5} borderRadius="md" fontWeight="500" variant="subtle">
                              Fully Paid
                            </Badge>
                          ) : hasOutstanding ? (
                            <Badge colorScheme="red" fontSize="xs" px={2.5} py={0.5} borderRadius="md" fontWeight="500" variant="subtle">
                              Outstanding
                            </Badge>
                          ) : (
                            <Badge colorScheme="blue" fontSize="xs" px={2.5} py={0.5} borderRadius="md" fontWeight="500" variant="subtle">
                              Active
                            </Badge>
                          )
                        ) : (
                          <Badge colorScheme="gray" fontSize="xs" px={2.5} py={0.5} borderRadius="md" fontWeight="500" variant="subtle">
                            No Room
                          </Badge>
                        )}
                      </Td>
                      <Td py={3}>
                        <Menu>
                          <MenuButton as={Button} size="sm" variant="ghost">
                            <MoreVertical className="w-4 h-4" />
                          </MenuButton>
                          <MenuList>
                            <MenuItem icon={<Eye className="w-4 h-4" />} onClick={() => {
                              setSelectedStudent(student);
                              onViewDetailsOpen();
                            }}>
                              View Full Details
                            </MenuItem>
                            {!student.room ? (
                              <MenuItem icon={<LogIn className="w-4 h-4" />} onClick={() => handleAssignRoom(student)}>
                                Assign Room
                              </MenuItem>
                            ) : (
                              <>
                                <MenuItem icon={<DollarSign className="w-4 h-4" />} onClick={() => handleRecordPayment(student)}>
                                  Record Payment
                                </MenuItem>
                                {(() => {
                                  // Get latest payment for this student
                                  const studentAllocation = allocations.find(a => a.student_id === student.id);
                                  if (!studentAllocation) return null;
                                  const studentPayments = payments
                                    .filter(p => p.allocation_id === studentAllocation.id)
                                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                                  const latestPayment = studentPayments[0];
                                  if (!latestPayment) return null;
                                  return (
                                    <MenuItem 
                                      icon={<Receipt className="w-4 h-4" />} 
                                      onClick={() => {
                                        setSelectedPaymentId(latestPayment.id);
                                        onReceiptPreviewOpen();
                                      }}
                                    >
                                      View Receipt
                                    </MenuItem>
                                  );
                                })()}
                              </>
                            )}
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      </Card>

      {/* Register Student Modal */}
      <Modal isOpen={isRegisterOpen} onClose={onRegisterClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Register New Student</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleRegisterStudent}>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <ChakraInput
                    value={newStudent.fullName}
                    onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                    placeholder="Enter full name"
                    bg="white"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Registration Number</FormLabel>
                  <ChakraInput
                    value={newStudent.registrationNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, registrationNumber: e.target.value })}
                    placeholder="Enter registration number"
                    bg="white"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Phone Number</FormLabel>
                  <ChakraInput
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="Enter phone number"
                    bg="white"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <ChakraInput
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="Enter email address"
                    bg="white"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Access Number</FormLabel>
                  <ChakraInput
                    value={newStudent.accessNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, accessNumber: e.target.value })}
                    placeholder="Enter access number"
                    bg="white"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Address</FormLabel>
                  <ChakraInput
                    value={newStudent.address}
                    onChange={(e) => setNewStudent({ ...newStudent, address: e.target.value })}
                    placeholder="Enter address"
                    bg="white"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Emergency Contact</FormLabel>
                  <ChakraInput
                    value={newStudent.emergencyContact}
                    onChange={(e) => setNewStudent({ ...newStudent, emergencyContact: e.target.value })}
                    placeholder="Enter emergency contact"
                    bg="white"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Gender</FormLabel>
                  <RadioGroup
                    value={newStudent.gender}
                    onChange={(value) => setNewStudent({ ...newStudent, gender: value })}
                  >
                    <Stack direction="row" spacing={4}>
                      <Radio value="male" colorScheme="blue">
                        Male
                      </Radio>
                      <Radio value="female" colorScheme="pink">
                        Female
                      </Radio>
                    </Stack>
                  </RadioGroup>
                </FormControl>

                <Divider />

                <Heading size="sm" color="gray.700" mb={2}>
                  Room Assignment & Payment
                </Heading>

                <FormControl>
                  <FormLabel>Select Room (Optional)</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </InputLeftElement>
                    <ChakraInput
                      placeholder="Search rooms by name, price, or capacity..."
                      value={roomSearchQuery}
                      onChange={(e) => setRoomSearchQuery(e.target.value)}
                      bg="white"
                      mb={2}
                    />
                  </InputGroup>
                  
                  {roomSearchQuery && filteredAvailableRooms.length === 0 && (
                    <Text fontSize="xs" color="gray.500" mt={1} mb={2}>
                      No rooms found matching "{roomSearchQuery}"
                    </Text>
                  )}

                  {availableRooms.length === 0 ? (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      No available rooms. You can assign a room later.
                    </Text>
                  ) : (
                    <Box
                      maxH="200px"
                      overflowY="auto"
                      border="1px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      bg="white"
                      mt={2}
                    >
                      {filteredAvailableRooms.length === 0 ? (
                        <Box p={4} textAlign="center">
                          <Text fontSize="sm" color="gray.500">
                            Start typing to search for rooms
                          </Text>
                        </Box>
                      ) : (
                        filteredAvailableRooms.map((room) => {
                          const isSelected = newStudent.roomId === room.id.toString();
                          return (
                            <Box
                              key={room.id}
                              p={3}
                              cursor="pointer"
                              bg={isSelected ? 'blue.50' : 'white'}
                              borderLeft={isSelected ? '3px solid' : 'none'}
                              borderLeftColor={isSelected ? 'blue.500' : 'transparent'}
                              _hover={{ bg: isSelected ? 'blue.50' : 'gray.50' }}
                              onClick={() => {
                                setNewStudent({ ...newStudent, roomId: room.id.toString() });
                                setRoomSearchQuery(room.name);
                              }}
                            >
                              <HStack justify="space-between">
                                <VStack align="flex-start" spacing={0}>
                                  <Text fontSize="sm" fontWeight="600" color="gray.900">
                                    {room.name}
                                  </Text>
                                  <HStack spacing={3} fontSize="xs" color="gray.600">
                                    <Text>{formatCurrency(Number(room.price))}</Text>
                                    <Text>•</Text>
                                    <Text>Capacity: {room.capacity}</Text>
                                  </HStack>
                                </VStack>
                                {isSelected && (
                                  <Box
                                    w={5}
                                    h={5}
                                    borderRadius="full"
                                    bg="blue.500"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Text fontSize="xs" color="white">✓</Text>
                                  </Box>
                                )}
                              </HStack>
                            </Box>
                          );
                        })
                      )}
                    </Box>
                  )}
                </FormControl>

                {newStudent.roomId && (
                  <Box p={4} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="600" color="blue.900" mb={2}>
                      Room Details
                    </Text>
                    <VStack align="flex-start" spacing={1}>
                      {(() => {
                        const selectedRoom = rooms.find((r) => r.id === Number(newStudent.roomId));
                        return selectedRoom ? (
                          <>
                            <Text fontSize="sm" color="gray.700">
                              <strong>Room:</strong> {selectedRoom.name}
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              <strong>Actual Price:</strong> {formatCurrency(Number(selectedRoom.price))}
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

                {canSetDisplayPrice && newStudent.roomId && (
                  <FormControl>
                    <FormLabel>Display Price (Optional)</FormLabel>
                    <Text fontSize="xs" color="gray.500" mb={2}>
                      Enter the price to show the student. This must be equal to or greater than the actual room price. 
                      The owner will see the actual price, but the student will receive receipts with this display price.
                    </Text>
                    <ChakraInput
                      type="number"
                      step="0.01"
                      min={(() => {
                        const selectedRoom = rooms.find((r) => r.id === Number(newStudent.roomId));
                        return selectedRoom ? Number(selectedRoom.price) : 0;
                      })()}
                      value={newStudent.displayPrice}
                      onChange={(e) => setNewStudent({ ...newStudent, displayPrice: e.target.value })}
                      placeholder="Enter display price (e.g., 1200000)"
                      bg="white"
                    />
                    {newStudent.displayPrice && (() => {
                      const selectedRoom = rooms.find((r) => r.id === Number(newStudent.roomId));
                      const displayPrice = parseFloat(newStudent.displayPrice);
                      const actualPrice = selectedRoom ? Number(selectedRoom.price) : 0;
                      if (selectedRoom && !isNaN(displayPrice)) {
                        if (displayPrice < actualPrice) {
                          return (
                            <Text fontSize="xs" color="red.500" mt={1}>
                              Display price must be at least {formatCurrency(actualPrice)}
                            </Text>
                          );
                        }
                        const markup = displayPrice - actualPrice;
                        return (
                          <Text fontSize="xs" color="green.600" mt={1}>
                            Markup: {formatCurrency(markup)} ({((markup / actualPrice) * 100).toFixed(1)}%)
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </FormControl>
                )}

                <FormControl>
                  <FormLabel>Initial Payment Amount (Optional)</FormLabel>
                  <ChakraInput
                    type="number"
                    step="0.01"
                    min="0"
                    value={newStudent.initialPayment}
                    onChange={(e) => setNewStudent({ ...newStudent, initialPayment: e.target.value })}
                    placeholder="Enter initial payment amount"
                    bg="white"
                    disabled={!newStudent.roomId}
                  />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    {newStudent.roomId 
                      ? 'Enter the amount the student has already paid. This will be recorded after room assignment.'
                      : 'Please select a room first to record payment'}
                  </Text>
                </FormControl>

                <Divider />

                <HStack justify="flex-end" spacing={3}>
                  <Button type="button" variant="outline" onClick={onRegisterClose} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={submitting} loadingText="Registering...">
                    Register Student
                  </Button>
                </HStack>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Assign Room Modal */}
      <Modal isOpen={isAssignRoomOpen} onClose={onAssignRoomClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Assign Room to Student</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmitAssignRoom}>
              <VStack spacing={4} align="stretch">
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
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Select Room</FormLabel>
                  <Select
                    placeholder="Choose a room"
                    value={assignRoomForm.roomId}
                    onChange={(e) => setAssignRoomForm({ ...assignRoomForm, roomId: e.target.value })}
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

                {assignRoomForm.roomId && (
                  <Box p={4} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" fontWeight="600" color="blue.900" mb={2}>
                      Room Details
                    </Text>
                    <VStack align="flex-start" spacing={1}>
                      {(() => {
                        const selectedRoom = rooms.find((r) => r.id === Number(assignRoomForm.roomId));
                        return selectedRoom ? (
                          <>
                            <Text fontSize="sm" color="gray.700">
                              <strong>Room:</strong> {selectedRoom.name}
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                              <strong>Actual Price:</strong> {formatCurrency(Number(selectedRoom.price))}
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

                {canSetDisplayPrice && assignRoomForm.roomId && (
                  <FormControl>
                    <FormLabel>Display Price (Optional)</FormLabel>
                    <Text fontSize="xs" color="gray.500" mb={2}>
                      Enter the price to show the student. This must be equal to or greater than the actual room price. 
                      The owner will see the actual price, but the student will receive receipts with this display price.
                    </Text>
                    <ChakraInput
                      type="number"
                      step="0.01"
                      min={(() => {
                        const selectedRoom = rooms.find((r) => r.id === Number(assignRoomForm.roomId));
                        return selectedRoom ? Number(selectedRoom.price) : 0;
                      })()}
                      value={assignRoomForm.displayPrice}
                      onChange={(e) => setAssignRoomForm({ ...assignRoomForm, displayPrice: e.target.value })}
                      placeholder="Enter display price (e.g., 1200000)"
                      bg="white"
                    />
                    {assignRoomForm.displayPrice && (() => {
                      const selectedRoom = rooms.find((r) => r.id === Number(assignRoomForm.roomId));
                      const displayPrice = parseFloat(assignRoomForm.displayPrice);
                      const actualPrice = selectedRoom ? Number(selectedRoom.price) : 0;
                      if (selectedRoom && !isNaN(displayPrice)) {
                        if (displayPrice < actualPrice) {
                          return (
                            <Text fontSize="xs" color="red.500" mt={1}>
                              Display price must be at least {formatCurrency(actualPrice)}
                            </Text>
                          );
                        }
                        const markup = displayPrice - actualPrice;
                        return (
                          <Text fontSize="xs" color="green.600" mt={1}>
                            Markup: {formatCurrency(markup)} ({((markup / actualPrice) * 100).toFixed(1)}%)
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </FormControl>
                )}

                <Divider />

                <HStack justify="flex-end" spacing={3}>
                  <Button type="button" variant="outline" onClick={onAssignRoomClose} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={submitting}
                    loadingText="Assigning..."
                    disabled={!assignRoomForm.roomId || availableRooms.length === 0}
                  >
                    Assign Room
                  </Button>
                </HStack>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={onPaymentClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Record Payment</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleSubmitPayment}>
              <VStack spacing={4} align="stretch">
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
                  {selectedStudent?.room && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Room: {selectedStudent.room.name}
                    </Text>
                  )}
                </FormControl>

                {selectedStudent?.paymentSummary && (
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <VStack align="flex-start" spacing={1}>
                      <Text fontSize="sm" color="gray.700">
                        <strong>Total Required:</strong> {formatCurrency(selectedStudent.paymentSummary.totalRequired)}
                      </Text>
                      <Text fontSize="sm" color="gray.700">
                        <strong>Total Paid:</strong> {formatCurrency(selectedStudent.paymentSummary.totalPaid)}
                      </Text>
                      <Text fontSize="sm" color="red.600" fontWeight="600">
                        <strong>Balance:</strong> {formatCurrency(selectedStudent.paymentSummary.balance)}
                      </Text>
                    </VStack>
                  </Box>
                )}

                <FormControl isRequired>
                  <FormLabel>Payment Amount</FormLabel>
                  <ChakraInput
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    placeholder="Enter payment amount"
                    bg="white"
                  />
                </FormControl>

                <Divider />

                <HStack justify="flex-end" spacing={3}>
                  <Button type="button" variant="outline" onClick={onPaymentClose} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={submitting}
                    loadingText="Recording..."
                    disabled={!paymentForm.amount}
                  >
                    Record Payment
                  </Button>
                </HStack>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
        </Modal>

        {/* SMS History Modal */}
        <Modal isOpen={isSMSHistoryOpen} onClose={onSMSHistoryClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              <HStack spacing={2}>
                <Phone className="w-5 h-5" />
                <Text>SMS History - {selectedStudent?.full_name}</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {loadingSMSHistory ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">Loading SMS history...</Text>
                </Box>
              ) : smsHistory.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500">No SMS history found for this student.</Text>
                </Box>
              ) : (
                <VStack align="stretch" spacing={4}>
                  {smsHistory.map((sms) => (
                    <Box
                      key={sms.id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      bg={sms.message_status === 'sent' ? 'green.50' : 'red.50'}
                      borderColor={sms.message_status === 'sent' ? 'green.200' : 'red.200'}
                    >
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Badge
                            colorScheme={sms.message_status === 'sent' ? 'green' : 'red'}
                            fontSize="xs"
                          >
                            {sms.message_status === 'sent' ? 'Sent' : 'Failed'}
                          </Badge>
                          <Badge colorScheme="blue" fontSize="xs">
                            {sms.message_type.replace('_', ' ')}
                          </Badge>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(sms.sent_at).toLocaleString()}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" fontWeight="500" color="gray.900">
                          {sms.message_content}
                        </Text>
                        <HStack spacing={2} fontSize="xs" color="gray.600">
                          <Text>To: {sms.phone}</Text>
                          {sms.sent_by_username && (
                            <>
                              <Text>•</Text>
                              <Text>By: {sms.sent_by_username}</Text>
                            </>
                          )}
                        </HStack>
                        {sms.error_message && (
                          <Text fontSize="xs" color="red.600" fontStyle="italic">
                            Error: {sms.error_message}
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  ))}
                </VStack>
              )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* SMS History Modal */}
      <Modal isOpen={isSMSHistoryOpen} onClose={onSMSHistoryClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <Phone className="w-5 h-5" />
              <Text>SMS History - {selectedStudent?.full_name}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {loadingSMSHistory ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">Loading SMS history...</Text>
              </Box>
            ) : smsHistory.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">No SMS history found for this student.</Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={4}>
                {smsHistory.map((sms) => (
                  <Box
                    key={sms.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="md"
                    bg={sms.message_status === 'sent' ? 'green.50' : 'red.50'}
                    borderColor={sms.message_status === 'sent' ? 'green.200' : 'red.200'}
                  >
                    <VStack align="stretch" spacing={2}>
                      <HStack justify="space-between">
                        <Badge
                          colorScheme={sms.message_status === 'sent' ? 'green' : 'red'}
                          fontSize="xs"
                        >
                          {sms.message_status === 'sent' ? 'Sent' : 'Failed'}
                        </Badge>
                        <Badge colorScheme="blue" fontSize="xs">
                          {sms.message_type.replace('_', ' ')}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(sms.sent_at).toLocaleString()}
                        </Text>
                      </HStack>
                      <Text fontSize="sm" fontWeight="500" color="gray.900">
                        {sms.message_content}
                      </Text>
                      <HStack spacing={2} fontSize="xs" color="gray.600">
                        <Text>To: {sms.phone}</Text>
                        {sms.sent_by_username && (
                          <>
                            <Text>•</Text>
                            <Text>By: {sms.sent_by_username}</Text>
                          </>
                        )}
                      </HStack>
                      {sms.error_message && (
                        <Text fontSize="xs" color="red.600" fontStyle="italic">
                          Error: {sms.error_message}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Receipt Preview Modal */}
      <ReceiptPreview
        paymentId={selectedPaymentId}
        isOpen={isReceiptPreviewOpen}
        onClose={() => {
          onReceiptPreviewClose();
          setSelectedPaymentId(null);
        }}
      />
    </Box>
  );
}
