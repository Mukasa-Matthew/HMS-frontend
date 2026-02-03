import React, { FormEvent, useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, Badge, Stack, VStack, HStack, Input as ChakraInput, Select, FormLabel, FormControl, Divider, InputGroup, InputLeftElement, SimpleGrid } from '@chakra-ui/react';
import { Users, Plus, Shield, UserCheck, Building2, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, MetricCard } from '../../components/ui/card';
import { AdminUser, Hostel, createUser, fetchHostels, fetchUsers } from '../../api/admin';
import { useToast } from '../../components/ui/toaster';

export function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminUser['role']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'CUSTODIAN' as AdminUser['role'],
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, h] = await Promise.all([fetchUsers(), fetchHostels()]);
      setUsers(u);
      setHostels(h);
      if (!selectedHostelId && h.length) setSelectedHostelId(String(h[0].id));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load users', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((u) => u.username.toLowerCase().includes(query));
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((u) => u.is_active !== 0);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((u) => u.is_active === 0);
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.password) {
      toast({ title: 'Error', description: 'Please fill all required fields', status: 'error' });
      return;
    }
    if ((newUser.role === 'CUSTODIAN' || newUser.role === 'HOSTEL_OWNER') && !selectedHostelId) {
      toast({ title: 'Error', description: 'Please select a hostel', status: 'error' });
      return;
    }
    try {
      setSubmitting(true);
      await createUser({
        username: newUser.username,
        password: newUser.password,
        role: newUser.role,
        hostelId:
          newUser.role === 'CUSTODIAN' || newUser.role === 'HOSTEL_OWNER' ? Number(selectedHostelId) : undefined,
        isActive: true,
      });
      toast({ title: 'Success', description: 'User created successfully', status: 'success' });
      setNewUser({ username: '', password: '', role: 'CUSTODIAN' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Error', description: error?.response?.data?.error || 'Failed to create user', status: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Shield className="w-4 h-4" />;
      case 'HOSTEL_OWNER':
        return <Building2 className="w-4 h-4" />;
      case 'CUSTODIAN':
        return <UserCheck className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'purple';
      case 'HOSTEL_OWNER':
        return 'blue';
      case 'CUSTODIAN':
        return 'green';
      default:
        return 'gray';
    }
  };

  const superAdmins = users.filter((u) => u.role === 'SUPER_ADMIN').length;
  const owners = users.filter((u) => u.role === 'HOSTEL_OWNER').length;
  const custodians = users.filter((u) => u.role === 'CUSTODIAN').length;
  const activeUsers = users.filter((u) => u.is_active !== 0).length;

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2} color="gray.900" fontWeight="700">
            Users
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Manage system users: Super Admins, Hostel Owners, and Custodians.
          </Text>
        </Box>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, sm: 4 }} gap={4} mb={6}>
        <MetricCard
          label="Total Users"
          value={users.length}
          icon={<Users className="w-5 h-5" />}
          color="brand.500"
        />
        <MetricCard
          label="Super Admins"
          value={superAdmins}
          color="purple.500"
        />
        <MetricCard
          label="Owners"
          value={owners}
          color="blue.500"
        />
        <MetricCard
          label="Custodians"
          value={custodians}
          color="green.500"
        />
      </SimpleGrid>

      <Flex gap={6} align="flex-start" flexDirection={{ base: 'column', lg: 'row' }}>
        {/* Users Table */}
        <Card flex="2" p={0} overflow="hidden">
          <Box p={6} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md" color="gray.900" fontWeight="700">
                All Users
              </Heading>
              <Text fontSize="sm" color="gray.500">
                {filteredUsers.length} of {users.length}
              </Text>
            </Flex>
            <Flex gap={3} flexWrap="wrap">
              <InputGroup maxW="300px" size="sm">
                <InputLeftElement pointerEvents="none">
                  <Search className="w-4 h-4 text-gray-400" />
                </InputLeftElement>
                <ChakraInput
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  borderColor="gray.300"
                  bg="white"
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                />
              </InputGroup>
              <Select
                size="sm"
                maxW="150px"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as 'all' | AdminUser['role'])}
                borderColor="gray.300"
                bg="white"
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
              >
                <option value="all">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="HOSTEL_OWNER">Owner</option>
                <option value="CUSTODIAN">Custodian</option>
              </Select>
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
                    Username
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    Role
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    Status
                  </Th>
                  <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                    Hostel
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={5} py={12} textAlign="center" color="gray.500">
                      Loading users...
                    </Td>
                  </Tr>
                ) : filteredUsers.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} py={12} textAlign="center" color="gray.500">
                      <VStack spacing={2}>
                        <Users className="w-8 h-8 text-gray-400" />
                        <Text>
                          {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                            ? 'No users match your filters'
                            : 'No users found'}
                        </Text>
                      </VStack>
                    </Td>
                  </Tr>
                ) : (
                  filteredUsers.map((u) => (
                    <Tr key={u.id} _hover={{ bg: 'gray.50' }} transition="background 0.2s">
                      <Td py={4}>
                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                          #{u.id}
                        </Text>
                      </Td>
                      <Td py={4}>
                        <Text fontSize="sm" fontWeight="600" color="gray.900">
                          {u.username}
                        </Text>
                      </Td>
                      <Td py={4}>
                        <HStack spacing={2}>
                          {getRoleIcon(u.role)}
                          <Badge
                            colorScheme={getRoleColor(u.role)}
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontWeight="600"
                          >
                            {u.role.replace('_', ' ')}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td py={4}>
                        <Badge
                          colorScheme={u.is_active ? 'green' : 'red'}
                          fontSize="xs"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontWeight="600"
                        >
                          {u.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </Td>
                      <Td py={4}>
                        <Text fontSize="sm" color="gray.600">
                          {u.hostel_id ? hostels.find((h) => h.id === u.hostel_id)?.name || `#${u.hostel_id}` : '-'}
                        </Text>
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
              Create User
            </Heading>
          </Flex>

          <form onSubmit={handleCreateUser}>
            <Stack spacing={5}>
              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                  Username
                </FormLabel>
                <ChakraInput
                  size="md"
                  placeholder="Username or phone"
                  value={newUser.username}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, username: e.target.value }))}
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
                  value={newUser.password}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
                  borderColor="gray.300"
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                  Role
                </FormLabel>
                <Select
                  size="md"
                  value={newUser.role}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value as AdminUser['role'] }))}
                  borderColor="gray.300"
                  _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="HOSTEL_OWNER">Hostel Owner</option>
                  <option value="CUSTODIAN">Custodian</option>
                </Select>
              </FormControl>

              {(newUser.role === 'CUSTODIAN' || newUser.role === 'HOSTEL_OWNER') && (
                <>
                  <Divider />
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600" color="gray.700" mb={1.5}>
                      Assign to Hostel
                    </FormLabel>
                    <Select
                      size="md"
                      value={selectedHostelId}
                      onChange={(e) => setSelectedHostelId(e.target.value)}
                      placeholder="Select hostel"
                      borderColor="gray.300"
                      _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
                    >
                      {hostels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </Select>
                    <Text fontSize="xs" color="gray.500" mt={1.5}>
                      This user will be attached to the selected hostel.
                    </Text>
                  </FormControl>
                </>
              )}

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
                  !newUser.username ||
                  !newUser.password ||
                  ((newUser.role === 'CUSTODIAN' || newUser.role === 'HOSTEL_OWNER') && !selectedHostelId)
                }
              >
                Create User
              </Button>
            </Stack>
          </form>
        </Card>
      </Flex>
    </Box>
  );
}
