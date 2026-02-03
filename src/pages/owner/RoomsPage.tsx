import React, { FormEvent, useEffect, useState } from 'react';
import { 
  Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, Badge, 
  Input as ChakraInput, InputGroup, InputLeftElement, HStack, VStack, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure,
  FormLabel, FormControl, Divider
} from '@chakra-ui/react';
import { BedDouble, DollarSign, Users, Search, Plus, Edit, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Room, fetchRooms, createRoom, updateRoomPrice, Allocation, fetchAllocations, StudentWithDetails, fetchStudentsWithDetails } from '../../api/owner';
import { useToast } from '../../components/ui/toaster';

interface RoomWithDetails extends Room {
  isOccupied: boolean;
  currentStudent?: {
    id: number;
    name: string;
    registrationNumber: string;
  } | null;
}

export function RoomsPage() {
  const { toast } = useToast();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isPriceOpen, onOpen: onPriceOpen, onClose: onPriceClose } = useDisclosure();
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'occupied' | 'available'>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [newRoom, setNewRoom] = useState({
    name: '',
    price: '',
    capacity: '',
  });
  const [priceUpdate, setPriceUpdate] = useState({
    price: '',
    effectiveDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [rooms, searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [roomsData, allocations, students] = await Promise.all([
        fetchRooms().catch(() => []),
        fetchAllocations().catch(() => []),
        fetchStudentsWithDetails().catch(() => []),
      ]);

      // Enrich rooms with occupancy info
      const roomsWithDetails: RoomWithDetails[] = roomsData.map((room) => {
        const allocation = allocations.find((a) => a.room_id === room.id);
        const student = allocation ? students.find((s) => s.id === allocation.student_id) : null;
        
        return {
          ...room,
          isOccupied: !!allocation,
          currentStudent: student ? {
            id: student.id,
            name: student.full_name,
            registrationNumber: student.registration_number,
          } : null,
        };
      });

      setRooms(roomsWithDetails);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load rooms', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = [...rooms];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => 
        r.name.toLowerCase().includes(query) ||
        r.price.toString().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'occupied') {
      filtered = filtered.filter((r) => r.isOccupied);
    } else if (statusFilter === 'available') {
      filtered = filtered.filter((r) => !r.isOccupied);
    }

    setFilteredRooms(filtered);
  };

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoom.name || !newRoom.price || !newRoom.capacity) {
      toast({ title: 'Error', description: 'Please fill all required fields', status: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      await createRoom({
        name: newRoom.name,
        price: Number(newRoom.price),
        capacity: Number(newRoom.capacity),
        isActive: true,
      });
      toast({ title: 'Success', description: 'Room created successfully', status: 'success' });
      setNewRoom({ name: '', price: '', capacity: '' });
      onCreateClose();
      await loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.error || 'Failed to create room', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePrice = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !priceUpdate.price) {
      toast({ title: 'Error', description: 'Please enter a price', status: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      await updateRoomPrice(
        selectedRoom.id,
        Number(priceUpdate.price),
        priceUpdate.effectiveDate || undefined
      );
      toast({ title: 'Success', description: 'Room price updated successfully', status: 'success' });
      setPriceUpdate({ price: '', effectiveDate: '' });
      setSelectedRoom(null);
      onPriceClose();
      await loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.error || 'Failed to update price', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openPriceModal = (room: Room) => {
    setSelectedRoom(room);
    setPriceUpdate({ price: room.price.toString(), effectiveDate: '' });
    onPriceOpen();
  };

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.isOccupied).length;
  const availableRooms = rooms.filter((r) => !r.isOccupied).length;

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" mb={1} color="gray.900" fontWeight="700">
            Rooms
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Manage your hostel rooms. View occupancy, update prices, and create new rooms.
          </Text>
        </Box>
        <Button
          bg="brand.600"
          color="white"
          _hover={{ bg: 'brand.700' }}
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onCreateOpen}
          size="md"
          fontWeight="600"
        >
          Create Room
        </Button>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3} mb={6}>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            Total Rooms
          </Text>
          <Heading size="lg" color="gray.900" fontWeight="700">
            {totalRooms}
          </Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            Occupied
          </Text>
          <Heading size="lg" color="gray.900" fontWeight="700">
            {occupiedRooms}
          </Heading>
        </Box>
        <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
          <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
            Available
          </Text>
          <Heading size="lg" color="gray.900" fontWeight="700">
            {availableRooms}
          </Heading>
        </Box>
      </SimpleGrid>

      {/* Rooms Table */}
      <Card p={0} overflow="hidden">
        <Box p={5} borderBottom="1px solid" borderColor="gray.100" bg="white">
          <Flex gap={3} flexWrap="wrap" align="center">
            <InputGroup size="md" maxW="400px">
              <InputLeftElement pointerEvents="none">
                <Search className="w-4 h-4 text-gray-400" />
              </InputLeftElement>
              <ChakraInput
                placeholder="Search rooms..."
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
                variant={statusFilter === 'all' ? 'solid' : 'ghost'}
                colorScheme={statusFilter === 'all' ? 'brand' : 'gray'}
                onClick={() => setStatusFilter('all')}
                fontSize="sm"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'occupied' ? 'solid' : 'ghost'}
                colorScheme={statusFilter === 'occupied' ? 'blue' : 'gray'}
                onClick={() => setStatusFilter('occupied')}
                fontSize="sm"
              >
                Occupied
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'available' ? 'solid' : 'ghost'}
                colorScheme={statusFilter === 'available' ? 'green' : 'gray'}
                onClick={() => setStatusFilter('available')}
                fontSize="sm"
              >
                Available
              </Button>
            </HStack>
            <Box ml="auto">
              <Text fontSize="sm" color="gray.500">
                {filteredRooms.length} of {rooms.length}
              </Text>
            </Box>
          </Flex>
        </Box>
        <Box overflowX="auto">
          <Table variant="simple" size="md">
            <Thead bg="gray.50">
              <Tr>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Room Name
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3} isNumeric>
                  Price
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3} isNumeric>
                  Capacity
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Status
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Occupant
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                  Actions
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={6} py={12} textAlign="center" color="gray.500">
                    Loading rooms...
                  </Td>
                </Tr>
              ) : filteredRooms.length === 0 ? (
                <Tr>
                  <Td colSpan={6} py={12} textAlign="center" color="gray.500">
                    <VStack spacing={2}>
                      <BedDouble className="w-8 h-8 text-gray-300" />
                      <Text>
                        {searchQuery || statusFilter !== 'all'
                          ? 'No rooms match your filters'
                          : 'No rooms found'}
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                filteredRooms.map((room) => (
                  <Tr key={room.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                    <Td py={3}>
                      <HStack spacing={2}>
                        <BedDouble className="w-4 h-4 text-brand-600" />
                        <Text fontSize="sm" fontWeight="600" color="gray.900">
                          {room.name}
                        </Text>
                      </HStack>
                    </Td>
                    <Td py={3} isNumeric>
                      <VStack align="flex-end" spacing={0}>
                        <Text fontSize="sm" fontWeight="600" color="gray.900">
                          UGX {Number(room.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </VStack>
                    </Td>
                    <Td py={3} isNumeric>
                      <HStack spacing={1} justify="flex-end">
                        <Users className="w-4 h-4 text-gray-400" />
                        <Text fontSize="sm" fontWeight="500" color="gray.900">
                          {room.capacity}
                        </Text>
                      </HStack>
                    </Td>
                    <Td py={3}>
                      <Badge
                        colorScheme={room.isOccupied ? 'blue' : 'green'}
                        fontSize="xs"
                        px={2.5}
                        py={0.5}
                        borderRadius="md"
                        fontWeight="500"
                        variant="subtle"
                      >
                        {room.isOccupied ? 'Occupied' : 'Available'}
                      </Badge>
                    </Td>
                    <Td py={3}>
                      {room.currentStudent ? (
                        <VStack align="flex-start" spacing={0}>
                          <Text fontSize="sm" fontWeight="600" color="gray.900">
                            {room.currentStudent.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {room.currentStudent.registrationNumber}
                          </Text>
                        </VStack>
                      ) : (
                        <Text fontSize="sm" color="gray.400" fontStyle="italic">
                          Vacant
                        </Text>
                      )}
                    </Td>
                    <Td py={3}>
                      <Button
                        size="xs"
                        variant="outline"
                        leftIcon={<Edit className="w-3 h-3" />}
                        onClick={() => openPriceModal(room)}
                        borderColor="gray.300"
                        color="gray.700"
                        _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
                      >
                        Update Price
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </Box>
      </Card>

      {/* Create Room Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <Plus className="w-5 h-5 text-brand-600" />
              <Text>Create Room</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleCreateRoom}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                    Room Name
                  </FormLabel>
                  <ChakraInput
                    size="md"
                    placeholder="e.g., Room 101, Suite A"
                    value={newRoom.name}
                    onChange={(e) => setNewRoom((prev) => ({ ...prev, name: e.target.value }))}
                    borderColor="gray.300"
                    _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                    Price (UGX)
                  </FormLabel>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </InputLeftElement>
                    <ChakraInput
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newRoom.price}
                      onChange={(e) => setNewRoom((prev) => ({ ...prev, price: e.target.value }))}
                      borderColor="gray.300"
                      pl={10}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                    Capacity
                  </FormLabel>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <Users className="w-4 h-4 text-gray-400" />
                    </InputLeftElement>
                    <ChakraInput
                      type="number"
                      min="1"
                      placeholder="Number of beds"
                      value={newRoom.capacity}
                      onChange={(e) => setNewRoom((prev) => ({ ...prev, capacity: e.target.value }))}
                      borderColor="gray.300"
                      pl={10}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </InputGroup>
                </FormControl>

                <Flex gap={3} pt={2} w="full">
                  <Button
                    variant="ghost"
                    onClick={onCreateClose}
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
                    loadingText="Creating..."
                    disabled={!newRoom.name || !newRoom.price || !newRoom.capacity}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Create Room
                  </Button>
                </Flex>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Update Price Modal */}
      <Modal isOpen={isPriceOpen} onClose={onPriceClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <Edit className="w-5 h-5 text-brand-600" />
              <Text>Update Room Price</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRoom && (
              <Box mb={4} p={4} bg="brand.50" borderRadius="lg" border="1px solid" borderColor="brand.200">
                <Text fontSize="sm" fontWeight="600" color="brand.700" mb={1}>
                  Room: {selectedRoom.name}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Current Price: UGX {Number(selectedRoom.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
              </Box>
            )}
            <form onSubmit={handleUpdatePrice}>
              <VStack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                    New Price (UGX)
                  </FormLabel>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                    </InputLeftElement>
                    <ChakraInput
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={priceUpdate.price}
                      onChange={(e) => setPriceUpdate((prev) => ({ ...prev, price: e.target.value }))}
                      borderColor="gray.300"
                      pl={10}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </InputGroup>
                </FormControl>

                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                    Effective Date (Optional)
                  </FormLabel>
                  <InputGroup size="md">
                    <InputLeftElement pointerEvents="none">
                      <Calendar className="w-4 h-4 text-gray-400" />
                    </InputLeftElement>
                    <ChakraInput
                      type="date"
                      value={priceUpdate.effectiveDate}
                      onChange={(e) => setPriceUpdate((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                      borderColor="gray.300"
                      pl={10}
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </InputGroup>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Leave empty to apply immediately
                  </Text>
                </FormControl>

                <Flex gap={3} pt={2} w="full">
                  <Button
                    variant="ghost"
                    onClick={onPriceClose}
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
                    loadingText="Updating..."
                    disabled={!priceUpdate.price}
                    leftIcon={<Edit className="w-4 h-4" />}
                  >
                    Update Price
                  </Button>
                </Flex>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
