import React, { FormEvent, useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, Badge, Stack, VStack, HStack, Input as ChakraInput, FormLabel, FormControl, Divider, InputGroup, InputLeftElement, IconButton, SimpleGrid } from '@chakra-ui/react';
import { Building2, Plus, Search, Filter, MoreVertical, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, MetricCard } from '../../components/ui/card';
import { Hostel, createHostel, fetchHostels } from '../../api/admin';
import { useToast } from '../../components/ui/toaster';

export function HostelsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [filteredHostels, setFilteredHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [newHostel, setNewHostel] = useState({
    name: '',
    location: '',
    contactPhone: '',
    ownerFullName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerUsername: '',
    ownerPassword: '',
  });

  useEffect(() => {
    loadHostels();
  }, []);

  useEffect(() => {
    filterHostels();
  }, [hostels, searchQuery, statusFilter]);

  const loadHostels = async () => {
    try {
      setLoading(true);
      const h = await fetchHostels();
      setHostels(h);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load hostels', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterHostels = () => {
    let filtered = [...hostels];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (h) =>
          h.name.toLowerCase().includes(query) ||
          h.location?.toLowerCase().includes(query) ||
          h.contact_phone?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((h) => h.is_active !== 0);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((h) => h.is_active === 0);
    }

    setFilteredHostels(filtered);
  };

  const handleCreateHostel = async (e: FormEvent) => {
    e.preventDefault();
    if (!newHostel.name || !newHostel.ownerFullName || !newHostel.ownerPhone || !newHostel.ownerUsername || !newHostel.ownerPassword) {
      toast({ title: 'Error', description: 'Please fill all required fields', status: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      await createHostel({
        name: newHostel.name,
        location: newHostel.location || undefined,
        contactPhone: newHostel.contactPhone || undefined,
        ownerFullName: newHostel.ownerFullName,
        ownerPhone: newHostel.ownerPhone,
        ownerEmail: newHostel.ownerEmail || undefined,
        ownerUsername: newHostel.ownerUsername,
        ownerPassword: newHostel.ownerPassword,
      });
      toast({ title: 'Success', description: 'Hostel and owner created successfully', status: 'success' });
      setNewHostel({
        name: '',
        location: '',
        contactPhone: '',
        ownerFullName: '',
        ownerPhone: '',
        ownerEmail: '',
        ownerUsername: '',
        ownerPassword: '',
      });
      await loadHostels();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.error || 'Failed to create hostel', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const activeHostels = hostels.filter((h) => h.is_active !== 0).length;
  const inactiveHostels = hostels.filter((h) => h.is_active === 0).length;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2} color="gray.900" fontWeight="700">
            Hostels
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Register hostels and assign owners. Each hostel can have multiple custodians.
          </Text>
        </Box>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap={4} mb={6}>
        <MetricCard
          label="Total Hostels"
          value={hostels.length}
          icon={<Building2 className="w-5 h-5" />}
          color="brand.500"
        />
        <MetricCard
          label="Active"
          value={activeHostels}
          subtitle="operational"
          color="green.500"
        />
        <MetricCard
          label="Inactive"
          value={inactiveHostels}
          subtitle="disabled"
          color="red.500"
        />
      </SimpleGrid>

      <Flex gap={6} align="flex-start" flexDirection={{ base: 'column', lg: 'row' }}>
        {/* Hostels Table */}
        <Card flex="2" p={0} overflow="hidden">
          <Box p={6} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md" color="gray.900" fontWeight="700">
                Registered Hostels
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {filteredHostels.length} of {hostels.length}
              </Text>
            </Flex>
            <Flex gap={3} flexWrap="wrap">
              <InputGroup maxW="300px" size="sm">
                <InputLeftElement pointerEvents="none">
                  <Search className="w-4 h-4 text-gray-400" />
                </InputLeftElement>
                <ChakraInput
                  placeholder="Search hostels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderColor="gray.300"
                  bg="white"
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                />
              </InputGroup>
              <HStack spacing={2}>
                <Button
                  size="sm"
                  variant={statusFilter === 'all' ? 'solid' : 'outline'}
                  colorScheme={statusFilter === 'all' ? 'brand' : 'gray'}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'active' ? 'solid' : 'outline'}
                  colorScheme={statusFilter === 'active' ? 'green' : 'gray'}
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant={statusFilter === 'inactive' ? 'solid' : 'outline'}
                  colorScheme={statusFilter === 'inactive' ? 'red' : 'gray'}
                  onClick={() => setStatusFilter('inactive')}
                >
                  Inactive
                </Button>
              </HStack>
            </Flex>
          </Box>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead bg="gray.50">
                <Tr>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    ID
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    Name
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    Location
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    Contact
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    Status
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    Created
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    Actions
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={7} py={12} textAlign="center" color="gray.500">
                      Loading hostels...
                    </Td>
                  </Tr>
                ) : filteredHostels.length === 0 ? (
                  <Tr>
                    <Td colSpan={7} py={12} textAlign="center" color="gray.500">
                      <VStack spacing={2}>
                        <Building2 className="w-8 h-8 text-gray-400" />
                        <Text>
                          {searchQuery || statusFilter !== 'all' ? 'No hostels match your filters' : 'No hostels registered yet'}
                        </Text>
                      </VStack>
                    </Td>
                  </Tr>
                ) : (
                  filteredHostels.map((h) => (
                    <Tr key={h.id} _hover={{ bg: 'gray.50' }} transition="background 0.2s">
                      <Td py={4}>
                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                          #{h.id}
                        </Text>
                      </Td>
                      <Td py={4}>
                        <HStack spacing={2}>
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <Text fontSize="sm" fontWeight="600" color="gray.900">
                            {h.name}
                          </Text>
                        </HStack>
                      </Td>
                      <Td py={4}>
                        <Text fontSize="sm" color="gray.600">
                          {h.location || '-'}
                        </Text>
                      </Td>
                      <Td py={4}>
                        <Text fontSize="sm" color="gray.600">
                          {h.contact_phone || '-'}
                        </Text>
                      </Td>
                      <Td py={4}>
                        <Badge
                          colorScheme={h.is_active === 0 ? 'red' : 'green'}
                          fontSize="xs"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontWeight="600"
                        >
                          {h.is_active === 0 ? 'Inactive' : 'Active'}
                        </Badge>
                      </Td>
                      <Td py={4}>
                        <Text fontSize="sm" color="gray.600">
                          {new Date(h.created_at).toLocaleDateString()}
                        </Text>
                      </Td>
                      <Td py={4}>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Settings className="w-4 h-4" />}
                          onClick={() => navigate(`/super-admin/hostels/${h.id}/features`)}
                          colorScheme="brand"
                        >
                          Manage Features
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </Box>
        </Card>

        {/* Create Form */}
        <Card flex="1" p={6} position="sticky" top={24}>
          <Flex align="center" gap={2} mb={6}>
            <Box
              w={8}
              h={8}
              bg="brand.50"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Plus className="w-4 h-4 text-brand-600" />
            </Box>
            <Heading size="md" color="gray.900" fontWeight="700">
              Create Hostel
            </Heading>
          </Flex>

          <form onSubmit={handleCreateHostel}>
            <Stack spacing={5}>
              {/* Hostel Details */}
              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.700" mb={3} textTransform="uppercase" letterSpacing="0.5px">
                  Hostel Details
                </Text>
                <Stack spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                      Hostel Name
                    </FormLabel>
                    <ChakraInput
                      size="md"
                      placeholder="Enter hostel name"
                      value={newHostel.name}
                      onChange={(e) => setNewHostel((p) => ({ ...p, name: e.target.value }))}
                      borderColor="gray.300"
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                      Location
                    </FormLabel>
                    <ChakraInput
                      size="md"
                      placeholder="Street, building"
                      value={newHostel.location}
                      onChange={(e) => setNewHostel((p) => ({ ...p, location: e.target.value }))}
                      borderColor="gray.300"
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                      Contact Phone
                    </FormLabel>
                    <ChakraInput
                      size="md"
                      placeholder="Optional"
                      value={newHostel.contactPhone}
                      onChange={(e) => setNewHostel((p) => ({ ...p, contactPhone: e.target.value }))}
                      borderColor="gray.300"
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </FormControl>
                </Stack>
              </Box>

              <Divider />

              {/* Owner Details */}
              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.700" mb={3} textTransform="uppercase" letterSpacing="0.5px">
                  Owner Details
                </Text>
                <Stack spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                      Full Name
                    </FormLabel>
                    <ChakraInput
                      size="md"
                      placeholder="Owner full name"
                      value={newHostel.ownerFullName}
                      onChange={(e) => setNewHostel((p) => ({ ...p, ownerFullName: e.target.value }))}
                      borderColor="gray.300"
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                      Phone Number
                    </FormLabel>
                    <ChakraInput
                      size="md"
                      placeholder="Owner phone"
                      value={newHostel.ownerPhone}
                      onChange={(e) => setNewHostel((p) => ({ ...p, ownerPhone: e.target.value }))}
                      borderColor="gray.300"
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                      Email
                    </FormLabel>
                    <ChakraInput
                      size="md"
                      type="email"
                      placeholder="Optional"
                      value={newHostel.ownerEmail}
                      onChange={(e) => setNewHostel((p) => ({ ...p, ownerEmail: e.target.value }))}
                      borderColor="gray.300"
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </FormControl>
                </Stack>
              </Box>

              <Divider />

              {/* Login Credentials */}
              <Box>
                <Text fontSize="xs" fontWeight="700" color="gray.700" mb={3} textTransform="uppercase" letterSpacing="0.5px">
                  Login Credentials
                </Text>
                <Stack spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                      Username
                    </FormLabel>
                    <ChakraInput
                      size="md"
                      placeholder="Login username"
                      value={newHostel.ownerUsername}
                      onChange={(e) => setNewHostel((p) => ({ ...p, ownerUsername: e.target.value }))}
                      borderColor="gray.300"
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                      Temporary Password
                    </FormLabel>
                    <ChakraInput
                      size="md"
                      type="password"
                      placeholder="Set initial password"
                      value={newHostel.ownerPassword}
                      onChange={(e) => setNewHostel((p) => ({ ...p, ownerPassword: e.target.value }))}
                      borderColor="gray.300"
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    />
                  </FormControl>
                  <Text fontSize="xs" color="gray.500" lineHeight="1.5">
                    Share these credentials securely. Owner can change password after first login.
                  </Text>
                </Stack>
              </Box>

              <Button
                type="submit"
                w="full"
                bg="brand.600"
                color="white"
                _hover={{ bg: 'brand.700' }}
                size="md"
                fontWeight="600"
                isLoading={submitting}
                loadingText="Creating..."
                disabled={
                  !newHostel.name ||
                  !newHostel.ownerFullName ||
                  !newHostel.ownerPhone ||
                  !newHostel.ownerUsername ||
                  !newHostel.ownerPassword
                }
              >
                Create Hostel & Owner
              </Button>
            </Stack>
          </form>
        </Card>
      </Flex>
    </Box>
  );
}
