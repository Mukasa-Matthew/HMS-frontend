import React, { FormEvent, useEffect, useState } from 'react';
import { 
  Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, Badge, 
  Input as ChakraInput, InputGroup, InputLeftElement, HStack, VStack, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  FormLabel, FormControl, Select, Divider
} from '@chakra-ui/react';
import { DollarSign, Search, Plus, Calendar, User, Receipt, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { 
  Payment, fetchPayments, recordPayment, getPaymentSummary, 
  Allocation, fetchAllocations, StudentWithDetails, fetchStudentsWithDetails,
  Room, fetchRooms
} from '../../api/owner';
import { useToast } from '../../components/ui/toaster';

interface PaymentWithDetails extends Payment {
  studentName?: string;
  studentRegNumber?: string;
  roomName?: string;
  allocationId?: number;
}

interface OutstandingBalance {
  allocationId: number;
  studentId: number;
  studentName: string;
  studentRegNumber: string;
  roomName: string;
  totalRequired: number;
  totalPaid: number;
  balance: number;
}

export function PaymentsPage() {
  const { toast } = useToast();
  const { isOpen: isRecordOpen, onOpen: onRecordOpen, onClose: onRecordClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithDetails[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalance[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'semester'>('all');
  const [selectedAllocation, setSelectedAllocation] = useState<number | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [newPayment, setNewPayment] = useState({
    allocationId: '',
    amount: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchQuery, dateFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, allocations, students, rooms] = await Promise.all([
        fetchPayments().catch(() => []),
        fetchAllocations().catch(() => []),
        fetchStudentsWithDetails().catch(() => []),
        fetchRooms().catch(() => []),
      ]);

      // Enrich payments with student and room info
      const enrichedPayments: PaymentWithDetails[] = paymentsData.map((payment) => {
        const allocation = allocations.find((a) => a.id === payment.allocation_id);
        const student = allocation ? students.find((s) => s.id === allocation.student_id) : null;
        const room = allocation ? rooms.find((r) => r.id === allocation.room_id) : null;
        
        return {
          ...payment,
          studentName: student?.full_name,
          studentRegNumber: student?.registration_number,
          roomName: room?.name,
          allocationId: allocation?.id,
        };
      });

      setPayments(enrichedPayments);
      setAllocations(allocations);

      // Calculate outstanding balances
      const outstanding: OutstandingBalance[] = [];
      allocations.forEach((alloc) => {
        const student = students.find((s) => s.id === alloc.student_id);
        if (!student) return;

        const allocPayments = paymentsData.filter((p) => p.allocation_id === alloc.id);
        const totalPaid = allocPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = Number(alloc.room_price_at_allocation) - totalPaid;
        const room = rooms.find((r) => r.id === alloc.room_id);

        if (balance > 0) {
          outstanding.push({
            allocationId: alloc.id,
            studentId: alloc.student_id,
            studentName: student.full_name,
            studentRegNumber: student.registration_number,
            roomName: room?.name || 'Unknown',
            totalRequired: alloc.room_price_at_allocation,
            totalPaid,
            balance,
          });
        }
      });

      setOutstandingBalances(outstanding);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load payments', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => 
        p.studentName?.toLowerCase().includes(query) ||
        p.studentRegNumber?.toLowerCase().includes(query) ||
        p.roomName?.toLowerCase().includes(query) ||
        p.amount.toString().includes(query)
      );
    }

    // Date filter
    if (dateFilter === 'semester') {
      // Calculate semester start date (typically 4 months ago, or start of current semester)
      // For now, using last 4 months as semester period
      const now = new Date();
      const semesterStart = new Date(now);
      semesterStart.setMonth(semesterStart.getMonth() - 4);

      filtered = filtered.filter((p) => {
        const paymentDate = new Date(p.created_at);
        return paymentDate >= semesterStart;
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredPayments(filtered);
  };

  const handleRecordPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPayment.allocationId || !newPayment.amount) {
      toast({ title: 'Error', description: 'Please fill all required fields', status: 'error' });
      return;
    }

    const paymentAmount = Number(newPayment.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid payment amount', status: 'error' });
      return;
    }

    // Check if payment would exceed the outstanding balance
    const outstanding = outstandingBalances.find((o) => o.allocationId === Number(newPayment.allocationId));
    if (outstanding) {
      if (paymentAmount > outstanding.balance) {
        toast({ 
          title: 'Error', 
          description: `Payment amount (UGX ${paymentAmount.toLocaleString()}) exceeds the outstanding balance (UGX ${outstanding.balance.toLocaleString()}). Maximum allowed: UGX ${outstanding.balance.toLocaleString()}`, 
          status: 'error' 
        });
        return;
      }
    } else {
      // If not in outstanding balances, check if already fully paid
      const allocation = allocations.find((a) => a.id === Number(newPayment.allocationId));
      if (allocation) {
        const allocPayments = payments.filter((p) => p.allocation_id === allocation.id);
        const totalPaid = allocPayments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balance = Number(allocation.room_price_at_allocation) - totalPaid;
        
        if (balance <= 0) {
          toast({ 
            title: 'Error', 
            description: 'This student has already completed their payment. No additional payments can be recorded.', 
            status: 'error' 
          });
          return;
        }
        
        if (paymentAmount > balance) {
          toast({ 
            title: 'Error', 
            description: `Payment amount (UGX ${paymentAmount.toLocaleString()}) exceeds the outstanding balance (UGX ${balance.toLocaleString()}). Maximum allowed: UGX ${balance.toLocaleString()}`, 
            status: 'error' 
          });
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      await recordPayment({
        allocationId: Number(newPayment.allocationId),
        amount: paymentAmount,
      });
      toast({ title: 'Success', description: 'Payment recorded successfully', status: 'success' });
      setNewPayment({ allocationId: '', amount: '' });
      onRecordClose();
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

  const handleViewSummary = async (allocationId: number) => {
    try {
      const summary = await getPaymentSummary(allocationId);
      setPaymentSummary(summary);
      setSelectedAllocation(allocationId);
      onViewOpen();
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error?.response?.data?.error || 'Failed to load payment summary', 
        status: 'error' 
      });
    }
  };

  // Calculate total revenue - ensure amounts are converted to numbers
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  // Calculate semester revenue (last 4 months)
  const now = new Date();
  const semesterStart = new Date(now);
  semesterStart.setMonth(semesterStart.getMonth() - 4);
  const semesterRevenue = payments
    .filter((p) => {
      const paymentDate = new Date(p.created_at);
      return paymentDate >= semesterStart;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);
  
  const totalOutstanding = outstandingBalances.reduce((sum, o) => sum + Number(o.balance), 0);
  const outstandingCount = outstandingBalances.length;

  const formatCurrency = (amount: number) => 
    `UGX ${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" mb={1} color="gray.900" fontWeight="700">
            Payments
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Record payments, view payment history, and track outstanding balances.
          </Text>
        </Box>
        <Button
          bg="brand.600"
          color="white"
          _hover={{ bg: 'brand.700' }}
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onRecordOpen}
          size="md"
          fontWeight="600"
        >
          Record Payment
        </Button>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 2, sm: 4 }} gap={3} mb={6}>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            Total Revenue
          </Text>
          <Heading size="lg" color="gray.900" fontWeight="700">
            {formatCurrency(totalRevenue)}
          </Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            This Semester
          </Text>
          <Heading size="lg" color="green.600" fontWeight="700">
            {formatCurrency(semesterRevenue)}
          </Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            Outstanding
          </Text>
          <Heading size="lg" color="red.600" fontWeight="700">
            {formatCurrency(totalOutstanding)}
          </Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            Outstanding Students
          </Text>
          <Heading size="lg" color="gray.900" fontWeight="700">
            {outstandingCount}
          </Heading>
        </Box>
      </SimpleGrid>

      {/* Outstanding Balances Section */}
      {outstandingBalances.length > 0 && (
        <Card p={6} mb={6} borderLeft="4px solid" borderLeftColor="red.500">
          <Flex align="center" gap={2} mb={4}>
            <AlertCircle className="w-5 h-5 text-red-600" />
            <Heading size="md" color="gray.900" fontWeight="700">
              Outstanding Balances
            </Heading>
          </Flex>
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={2}>
                    Student
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={2}>
                    Room
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={2} isNumeric>
                    Required
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={2} isNumeric>
                    Paid
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={2} isNumeric>
                    Balance
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={2}>
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {outstandingBalances.map((outstanding) => (
                  <Tr key={outstanding.allocationId} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                    <Td py={2}>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" fontWeight="600" color="gray.900">
                          {outstanding.studentName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {outstanding.studentRegNumber}
                        </Text>
                      </VStack>
                    </Td>
                    <Td py={2}>
                      <Text fontSize="sm" color="gray.600">
                        {outstanding.roomName}
                      </Text>
                    </Td>
                    <Td py={2} isNumeric>
                      <Text fontSize="sm" fontWeight="500" color="gray.900">
                        {formatCurrency(outstanding.totalRequired)}
                      </Text>
                    </Td>
                    <Td py={2} isNumeric>
                      <Text fontSize="sm" color="gray.600">
                        {formatCurrency(outstanding.totalPaid)}
                      </Text>
                    </Td>
                    <Td py={2} isNumeric>
                      <Text fontSize="sm" fontWeight="600" color="red.600">
                        {formatCurrency(outstanding.balance)}
                      </Text>
                    </Td>
                    <Td py={2}>
                      <HStack spacing={2}>
                        <Button
                          size="xs"
                          variant="outline"
                          leftIcon={<Receipt className="w-3 h-3" />}
                          onClick={() => handleViewSummary(outstanding.allocationId)}
                          borderColor="gray.300"
                          color="gray.700"
                          _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
                        >
                          View
                        </Button>
                        <Button
                          size="xs"
                          bg="brand.600"
                          color="white"
                          _hover={{ bg: 'brand.700' }}
                          leftIcon={<Plus className="w-3 h-3" />}
                          onClick={() => {
                            setNewPayment({ allocationId: String(outstanding.allocationId), amount: '' });
                            onRecordOpen();
                          }}
                        >
                          Pay
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </Card>
      )}

      {/* Payment History */}
      <Card p={0} overflow="hidden">
        <Box p={5} borderBottom="1px solid" borderColor="gray.100" bg="white">
          <Flex justify="space-between" align="center" mb={4}>
            <Heading size="md" color="gray.900" fontWeight="700">
              Payment History
            </Heading>
            <Text fontSize="sm" color="gray.500">
              {filteredPayments.length} of {payments.length}
            </Text>
          </Flex>
          <Flex gap={3} flexWrap="wrap" align="center">
            <InputGroup size="md" maxW="400px">
              <InputLeftElement pointerEvents="none">
                <Search className="w-4 h-4 text-gray-400" />
              </InputLeftElement>
              <ChakraInput
                placeholder="Search by student, room, or amount..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderColor="gray.300"
                bg="white"
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
              />
            </InputGroup>
            <HStack spacing={1}>
              <Button
                size="sm"
                variant={dateFilter === 'all' ? 'solid' : 'ghost'}
                colorScheme={dateFilter === 'all' ? 'brand' : 'gray'}
                onClick={() => setDateFilter('all')}
                fontSize="sm"
              >
                All Time
              </Button>
              <Button
                size="sm"
                variant={dateFilter === 'semester' ? 'solid' : 'ghost'}
                colorScheme={dateFilter === 'semester' ? 'brand' : 'gray'}
                onClick={() => setDateFilter('semester')}
                fontSize="sm"
              >
                This Semester
              </Button>
            </HStack>
          </Flex>
        </Box>
        <Box overflowX="auto">
          <Table variant="simple" size="md">
            <Thead bg="gray.50">
              <Tr>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Date
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Student
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Room
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3} isNumeric>
                  Amount
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Actions
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={5} py={12} textAlign="center" color="gray.500">
                    Loading payments...
                  </Td>
                </Tr>
              ) : filteredPayments.length === 0 ? (
                <Tr>
                  <Td colSpan={5} py={12} textAlign="center" color="gray.500">
                    <VStack spacing={2}>
                      <DollarSign className="w-8 h-8 text-gray-300" />
                      <Text>
                        {searchQuery || dateFilter !== 'all'
                          ? 'No payments match your filters'
                          : 'No payments found'}
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                filteredPayments.map((payment) => (
                  <Tr key={payment.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                    <Td py={3}>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" fontWeight="500" color="gray.900">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </Text>
                      </VStack>
                    </Td>
                    <Td py={3}>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" fontWeight="600" color="gray.900">
                          {payment.studentName || 'Unknown'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {payment.studentRegNumber || '-'}
                        </Text>
                      </VStack>
                    </Td>
                    <Td py={3}>
                      <Text fontSize="sm" color="gray.600">
                        {payment.roomName || '-'}
                      </Text>
                    </Td>
                    <Td py={3} isNumeric>
                      <Text fontSize="sm" fontWeight="600" color="green.600">
                        {formatCurrency(payment.amount)}
                      </Text>
                    </Td>
                    <Td py={3}>
                      {payment.allocationId && (
                        <Button
                          size="xs"
                          variant="outline"
                          leftIcon={<Receipt className="w-3 h-3" />}
                          onClick={() => handleViewSummary(payment.allocationId!)}
                          borderColor="gray.300"
                          color="gray.700"
                          _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
                        >
                          Summary
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </Card>

      {/* Record Payment Modal */}
      <Modal isOpen={isRecordOpen} onClose={onRecordClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <Plus className="w-5 h-5 text-brand-600" />
              <Text>Record Payment</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleRecordPayment}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                    Select Student Allocation
                  </FormLabel>
                  <Select
                    size="md"
                    value={newPayment.allocationId}
                    onChange={(e) => setNewPayment((prev) => ({ ...prev, allocationId: e.target.value }))}
                    placeholder="Select a student allocation"
                    borderColor="gray.300"
                    bg="white"
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  >
                    {outstandingBalances.map((outstanding) => (
                      <option key={outstanding.allocationId} value={outstanding.allocationId}>
                        {outstanding.studentName} ({outstanding.studentRegNumber}) - {outstanding.roomName} - Balance: {formatCurrency(outstanding.balance)}
                      </option>
                    ))}
                  </Select>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Only students with outstanding balances are shown
                  </Text>
                  {newPayment.allocationId && (() => {
                    const outstanding = outstandingBalances.find((o) => o.allocationId === Number(newPayment.allocationId));
                    return outstanding ? (
                      <Box mt={2} p={3} bg="blue.50" borderRadius="md">
                        <Text fontSize="xs" color="blue.700" fontWeight="500">
                          Outstanding Balance: {formatCurrency(outstanding.balance)}
                        </Text>
                        <Text fontSize="xs" color="blue.600" mt={1}>
                          Maximum payment allowed: {formatCurrency(outstanding.balance)}
                        </Text>
                      </Box>
                    ) : null;
                  })()}
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                    Payment Amount (UGX)
                  </FormLabel>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </InputLeftElement>
                    <ChakraInput
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={newPayment.allocationId ? (() => {
                        const outstanding = outstandingBalances.find((o) => o.allocationId === Number(newPayment.allocationId));
                        return outstanding ? outstanding.balance : undefined;
                      })() : undefined}
                      placeholder="0.00"
                      value={newPayment.amount}
                      onChange={(e) => setNewPayment((prev) => ({ ...prev, amount: e.target.value }))}
                      borderColor="gray.300"
                      pl={10}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </InputGroup>
                  {newPayment.allocationId && (() => {
                    const outstanding = outstandingBalances.find((o) => o.allocationId === Number(newPayment.allocationId));
                    if (outstanding && newPayment.amount) {
                      const amount = Number(newPayment.amount);
                      if (amount > outstanding.balance) {
                        return (
                          <Text fontSize="xs" color="red.500" mt={1}>
                            Amount exceeds outstanding balance. Maximum: {formatCurrency(outstanding.balance)}
                          </Text>
                        );
                      }
                    }
                    return null;
                  })()}
                </FormControl>

                <Flex gap={3} pt={2} w="full">
                  <Button
                    variant="ghost"
                    onClick={onRecordClose}
                    flex="1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    bg="brand.600"
                    color="white"
                    _hover={{ bg: 'brand.700' }}
                    flex="1"
                    isLoading={submitting}
                    loadingText="Recording..."
                    disabled={!newPayment.allocationId || !newPayment.amount}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Record Payment
                  </Button>
                </Flex>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Payment Summary Modal */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <Receipt className="w-5 h-5 text-brand-600" />
              <Text>Payment Summary</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {paymentSummary ? (
              <VStack spacing={4} align="stretch">
                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                    Student Information
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.900" mb={1}>
                    {paymentSummary.student.fullName}
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {paymentSummary.student.registrationNumber}
                  </Text>
                </Box>

                <Box p={4} bg="gray.50" borderRadius="lg">
                  <Text fontSize="xs" fontWeight="600" color="gray.500" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                    Room
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.900">
                    {paymentSummary.room.name}
                  </Text>
                </Box>

                <Divider />

                <VStack spacing={3} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.600">
                      Total Required:
                    </Text>
                    <Text fontSize="sm" fontWeight="600" color="gray.900">
                      {formatCurrency(paymentSummary.totalRequired)}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.600">
                      Total Paid:
                    </Text>
                    <Text fontSize="sm" fontWeight="600" color="green.600">
                      {formatCurrency(paymentSummary.totalPaid)}
                    </Text>
                  </Flex>
                  <Divider />
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" fontWeight="600" color="gray.900">
                      Balance:
                    </Text>
                    <Text fontSize="lg" fontWeight="700" color={paymentSummary.balance > 0 ? 'red.600' : 'green.600'}>
                      {formatCurrency(paymentSummary.balance)}
                    </Text>
                  </Flex>
                </VStack>
              </VStack>
            ) : (
              <Text color="gray.500">Loading summary...</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
