import React, { FormEvent, useEffect, useState } from 'react';
import { 
  Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, Badge, Stack, VStack, HStack, 
  Input as ChakraInput, Select, FormLabel, FormControl, InputGroup, InputLeftElement, SimpleGrid,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Divider
} from '@chakra-ui/react';
import { BedDouble, Plus, DollarSign, Users, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Room, Hostel, createRoom, fetchHostels, fetchRooms } from '../../api/admin';
import { useToast } from '../../components/ui/toaster';

export function RoomsPage() {
  const { toast } = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hostelSearchQuery, setHostelSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [formHostelId, setFormHostelId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [newRoom, setNewRoom] = useState({
    name: '',
    price: '',
    capacity: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [rooms, searchQuery, selectedHostelId, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [r, h] = await Promise.all([fetchRooms(), fetchHostels()]);
      setRooms(r);
      setHostels(h);
      // Don't auto-select hostel - user must select first
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load rooms', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterRooms = () => {
    let filtered = [...rooms];

    // Must filter by selected hostel
    if (selectedHostelId) {
      filtered = filtered.filter((r) => r.hostel_id === Number(selectedHostelId));
    } else {
      // If no hostel selected, show no rooms
      setFilteredRooms([]);
      return;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(query));
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((r) => r.is_active !== 0);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((r) => r.is_active === 0);
    }

    setFilteredRooms(filtered);
  };

  const filteredHostels = hostels.filter((h) => 
    h.name.toLowerCase().includes(hostelSearchQuery.toLowerCase()) ||
    (h.location && h.location.toLowerCase().includes(hostelSearchQuery.toLowerCase()))
  );

  const selectedHostel = hostels.find((h) => h.id === Number(selectedHostelId));
  
  // Stats for selected hostel only
  const hostelRooms = selectedHostelId ? rooms.filter((r) => r.hostel_id === Number(selectedHostelId)) : [];
  const totalRooms = hostelRooms.length;
  const activeRooms = hostelRooms.filter((r) => r.is_active !== 0).length;
  const totalCapacity = hostelRooms.reduce((sum, r) => sum + Number(r.capacity), 0);
  const avgPrice = hostelRooms.length > 0 ? hostelRooms.reduce((sum, r) => sum + Number(r.price), 0) / hostelRooms.length : 0;

  const handleCreateRoom = async (e: FormEvent) => {
    e.preventDefault();
    if (!newRoom.name || !newRoom.price || !newRoom.capacity) {
      toast({ title: 'Error', description: 'Please fill all required fields', status: 'error' });
      return;
    }
    if (!formHostelId) {
      toast({ title: 'Error', description: 'Please select a hostel first', status: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      await createRoom({
        name: newRoom.name,
        price: Number(newRoom.price),
        capacity: Number(newRoom.capacity),
        hostelId: Number(formHostelId),
        isActive: true,
      });
      const hostelName = hostels.find((h) => h.id === Number(formHostelId))?.name || 'hostel';
      toast({ 
        title: 'Success', 
        description: `Room "${newRoom.name}" created for ${hostelName}`, 
        status: 'success' 
      });
      // Clear only room fields, keep hostel selected
      setNewRoom({ name: '', price: '', capacity: '' });
      // Refresh data to show new room
      await loadData();
      // Optionally filter table to show rooms for the selected hostel
      if (!selectedHostelId) {
        setSelectedHostelId(formHostelId);
      }
      // Keep modal open for creating another room
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.error || 'Failed to create room', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    if (!selectedHostelId) {
      toast({ title: 'Error', description: 'Please select a hostel first', status: 'error' });
      return;
    }
    setFormHostelId(selectedHostelId);
    onOpen();
  };

  const handleCloseModal = () => {
    onClose();
    setNewRoom({ name: '', price: '', capacity: '' });
    // Keep the form hostel as the selected hostel
    if (selectedHostelId) {
      setFormHostelId(selectedHostelId);
    }
  };

  const handleSelectHostel = (hostelId: string) => {
    setSelectedHostelId(hostelId);
    setFormHostelId(hostelId);
    setHostelSearchQuery('');
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" mb={1} color="gray.900" fontWeight="700">
            Rooms
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Select a hostel to manage its rooms. Search and select a hostel to get started.
          </Text>
        </Box>
        {selectedHostelId && (
          <Button
            bg="brand.600"
            color="white"
            _hover={{ bg: 'brand.700' }}
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenModal}
            size="md"
            fontWeight="600"
          >
            Add Room
          </Button>
        )}
      </Flex>

      {/* Step 1: Hostel Selection */}
      <Card p={6} mb={6} bg="brand.50" borderColor="brand.200">
        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="xs" fontWeight="700" color="brand.700" mb={2} textTransform="uppercase" letterSpacing="0.5px">
              Step 1: Search & Select Hostel
            </Text>
            <Text fontSize="sm" color="gray.600">
              Search for a hostel by name or location, then select it to view and manage its rooms.
            </Text>
          </Box>
          
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none">
              <Search className="w-5 h-5 text-gray-400" />
            </InputLeftElement>
            <ChakraInput
              placeholder="Search hostels by name or location..."
              value={hostelSearchQuery}
              onChange={(e) => setHostelSearchQuery(e.target.value)}
              borderColor="brand.300"
              bg="white"
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
            />
          </InputGroup>

          {hostelSearchQuery && filteredHostels.length > 0 && (
            <Box bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200" maxH="300px" overflowY="auto">
              <VStack align="stretch" spacing={0} divider={<Box borderColor="gray.100" />}>
                {filteredHostels.map((h) => (
                  <Box
                    key={h.id}
                    p={4}
                    cursor="pointer"
                    _hover={{ bg: 'gray.50' }}
                    onClick={() => handleSelectHostel(String(h.id))}
                    borderLeft={selectedHostelId === String(h.id) ? '3px solid' : '3px solid transparent'}
                    borderColor={selectedHostelId === String(h.id) ? 'brand.500' : 'transparent'}
                    bg={selectedHostelId === String(h.id) ? 'brand.50' : 'white'}
                  >
                    <Flex justify="space-between" align="center">
                      <Box>
                        <Text fontWeight="600" color="gray.900" mb={1}>
                          {h.name}
                        </Text>
                        {h.location && (
                          <Text fontSize="sm" color="gray.500">
                            {h.location}
                          </Text>
                        )}
                      </Box>
                      {selectedHostelId === String(h.id) && (
                        <Badge colorScheme="brand" px={3} py={1} borderRadius="full">
                          Selected
                        </Badge>
                      )}
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {hostelSearchQuery && filteredHostels.length === 0 && (
            <Box p={6} textAlign="center" bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200">
              <Text color="gray.500">No hostels found matching "{hostelSearchQuery}"</Text>
            </Box>
          )}

          {!hostelSearchQuery && (
            <Box p={6} textAlign="center" bg="white" borderRadius="lg" border="1px solid" borderColor="gray.200">
              <Text color="gray.500">Start typing to search for hostels...</Text>
            </Box>
          )}

          {selectedHostel && (
            <Box p={4} bg="white" borderRadius="lg" border="2px solid" borderColor="brand.500">
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontSize="sm" fontWeight="600" color="brand.700" mb={1}>
                    Selected Hostel
                  </Text>
                  <Text fontSize="lg" fontWeight="700" color="gray.900" mb={1}>
                    {selectedHostel.name}
                  </Text>
                  {selectedHostel.location && (
                    <Text fontSize="sm" color="gray.600">
                      📍 {selectedHostel.location}
                    </Text>
                  )}
                </Box>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedHostelId('');
                    setHostelSearchQuery('');
                    setSearchQuery('');
                  }}
                >
                  Change Hostel
                </Button>
              </Flex>
            </Box>
          )}
        </VStack>
      </Card>

      {/* Step 2: Rooms Management (only shown when hostel is selected) */}
      {selectedHostelId ? (
        <>
          {/* Compact Stats for Selected Hostel */}
          <SimpleGrid columns={{ base: 2, sm: 4 }} gap={3} mb={6}>
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
                Active
              </Text>
              <Heading size="lg" color="gray.900" fontWeight="700">
                {activeRooms}
              </Heading>
            </Box>
            <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
              <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
                Total Capacity
              </Text>
              <Heading size="lg" color="gray.900" fontWeight="700">
                {totalCapacity}
              </Heading>
            </Box>
            <Box bg="white" p={4} borderRadius="lg" border="1px solid" borderColor="gray.200">
              <Text fontSize="xs" color="gray.500" mb={1} fontWeight="500">
                Avg Price
              </Text>
              <Heading size="lg" color="gray.900" fontWeight="700">
                UGX {avgPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </Heading>
            </Box>
          </SimpleGrid>

          {/* Rooms Table - Hero Section */}
          <Card p={0} overflow="hidden">
            <Box p={5} borderBottom="1px solid" borderColor="gray.100" bg="white">
              <Flex justify="space-between" align="center" mb={4}>
                <Box>
                  <Text fontSize="xs" fontWeight="700" color="brand.700" mb={1} textTransform="uppercase" letterSpacing="0.5px">
                    Step 2: Manage Rooms
                  </Text>
                  <Heading size="md" color="gray.900" fontWeight="700">
                    Rooms for {selectedHostel?.name}
                  </Heading>
                </Box>
                <Text fontSize="sm" color="gray.500">
                  {filteredRooms.length} of {hostelRooms.length}
                </Text>
              </Flex>
              <Flex gap={3} flexWrap="wrap" align="center">
                <InputGroup size="md" maxW="300px">
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
                  variant={statusFilter === 'active' ? 'solid' : 'ghost'}
                  colorScheme={statusFilter === 'active' ? 'green' : 'gray'}
                  onClick={() => setStatusFilter('active')}
                  fontSize="sm"
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'inactive' ? 'solid' : 'ghost'}
                  colorScheme={statusFilter === 'inactive' ? 'red' : 'gray'}
                  onClick={() => setStatusFilter('inactive')}
                  fontSize="sm"
                >
                  Inactive
                </Button>
              </HStack>
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
                    Hostel
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                    Status
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={5} py={12} textAlign="center" color="gray.500">
                      Loading rooms...
                    </Td>
                  </Tr>
                ) : filteredRooms.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} py={12} textAlign="center" color="gray.500">
                      <VStack spacing={3}>
                        <BedDouble className="w-12 h-12 text-gray-300" />
                        <Box>
                          <Text fontWeight="600" color="gray.700" mb={1}>
                            {searchQuery || statusFilter !== 'all'
                              ? 'No rooms match your filters'
                              : 'No rooms found for this hostel'}
                          </Text>
                          {!searchQuery && statusFilter === 'all' && (
                            <Text fontSize="sm" color="gray.500">
                              Click "Add Room" to create the first room for {selectedHostel?.name}
                            </Text>
                          )}
                        </Box>
                      </VStack>
                    </Td>
                  </Tr>
                ) : (
                  filteredRooms.map((r) => (
                    <Tr key={r.id} _hover={{ bg: 'gray.50' }} transition="background 0.15s">
                      <Td py={3}>
                        <Text fontSize="sm" fontWeight="500" color="gray.900">
                          {r.name}
                        </Text>
                      </Td>
                      <Td py={3} isNumeric>
                        <Text fontSize="sm" fontWeight="500" color="gray.900">
                          UGX {Number(r.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Text>
                      </Td>
                      <Td py={3} isNumeric>
                        <Text fontSize="sm" fontWeight="500" color="gray.900">
                          {r.capacity}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Text fontSize="sm" color="gray.600">
                          {r.hostel_id ? hostels.find((h) => h.id === r.hostel_id)?.name || `#${r.hostel_id}` : '-'}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Badge
                          colorScheme={r.is_active === 0 ? 'red' : 'green'}
                          fontSize="xs"
                          px={2.5}
                          py={0.5}
                          borderRadius="md"
                          fontWeight="500"
                          variant="subtle"
                        >
                          {r.is_active === 0 ? 'Inactive' : 'Active'}
                        </Badge>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>
        </>
      ) : (
        <Card p={12} textAlign="center">
          <VStack spacing={4}>
            <Box
              w={16}
              h={16}
              bg="brand.100"
              borderRadius="full"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Search className="w-8 h-8 text-brand-600" />
            </Box>
            <Box>
              <Heading size="md" color="gray.900" mb={2}>
                Select a Hostel to Get Started
              </Heading>
              <Text color="gray.500">
                Search and select a hostel above to view and manage its rooms.
              </Text>
            </Box>
          </VStack>
        </Card>
      )}

        {/* Create Room Modal */}
        <Modal isOpen={isOpen} onClose={handleCloseModal} size="lg">
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
                <Stack spacing={5}>
                  {/* Selected Hostel Display */}
                  {selectedHostel && (
                    <Box p={4} bg="brand.50" borderRadius="lg" border="1px solid" borderColor="brand.200">
                      <Text fontSize="xs" fontWeight="700" color="brand.700" mb={2} textTransform="uppercase" letterSpacing="0.5px">
                        Selected Hostel
                      </Text>
                      <Text fontSize="lg" fontWeight="700" color="gray.900" mb={1}>
                        {selectedHostel.name}
                      </Text>
                      {selectedHostel.location && (
                        <Text fontSize="sm" color="gray.600">
                          📍 {selectedHostel.location}
                        </Text>
                      )}
                    </Box>
                  )}

                  <Divider />

                  {/* Room Details */}
                  <Box>
                    <Text fontSize="xs" fontWeight="700" color="gray.600" mb={3} textTransform="uppercase" letterSpacing="0.5px">
                      Room Details
                    </Text>
                    <Stack spacing={4}>
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
                    </Stack>
                  </Box>

                  <Flex gap={3} pt={2}>
                    <Button
                      variant="ghost"
                      onClick={handleCloseModal}
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
                      disabled={!newRoom.name || !newRoom.price || !newRoom.capacity || !formHostelId}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      Create Room
                    </Button>
                  </Flex>
                  
                  {formHostelId && (
                    <Text fontSize="xs" color="gray.500" textAlign="center">
                      After saving, you can create another room for the same hostel
                    </Text>
                  )}
                </Stack>
              </form>
            </ModalBody>
          </ModalContent>
        </Modal>
    </Box>
  );
}
