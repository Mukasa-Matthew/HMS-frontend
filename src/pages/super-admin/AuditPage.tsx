import React, { useEffect, useState } from 'react';
import { Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, Badge, HStack, VStack, IconButton, InputGroup, InputLeftElement, Input as ChakraInput, Select, SimpleGrid } from '@chakra-ui/react';
import { ScrollText, RefreshCw, Shield, Building2, UserCheck, Calendar, Search, Filter } from 'lucide-react';
import { Card, MetricCard } from '../../components/ui/card';
import { AuditLog, Hostel, fetchAuditLogs, fetchHostels } from '../../api/admin';
import { useToast } from '../../components/ui/toaster';

export function AuditPage() {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [auditLogs, searchQuery, roleFilter, actionFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [a, h] = await Promise.all([fetchAuditLogs({ limit: 500, offset: 0 }), fetchHostels()]);
      setAuditLogs(a);
      setHostels(h);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load audit logs', status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...auditLogs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.action.toLowerCase().includes(query) ||
          l.actor_role?.toLowerCase().includes(query) ||
          l.entity_type?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((l) => l.actor_role === roleFilter);
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((l) => {
        if (actionFilter === 'login') return l.action.includes('LOGIN');
        if (actionFilter === 'create') return l.action.includes('CREATE') || l.action.includes('CREATED');
        if (actionFilter === 'update') return l.action.includes('UPDATE');
        if (actionFilter === 'delete') return l.action.includes('DELETE');
        return true;
      });
    }

    setFilteredLogs(filtered);
  };

  const getRoleIcon = (role: string | null) => {
    if (!role) return null;
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

  const getRoleColor = (role: string | null) => {
    if (!role) return 'gray';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('LOGIN')) return 'green';
    if (action.includes('DELETE') || action.includes('LOGOUT')) return 'red';
    if (action.includes('UPDATE')) return 'blue';
    return 'gray';
  };

  const todayLogs = auditLogs.filter((l) => {
    const logDate = new Date(l.created_at);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  }).length;

  const uniqueRoles = [...new Set(auditLogs.map((l) => l.actor_role).filter(Boolean))];
  const uniqueActions = [...new Set(auditLogs.map((l) => l.action))];

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" mb={2} color="gray.900" fontWeight="700">
            Audit Logs
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Complete activity history of all system actions and user activities.
          </Text>
        </Box>
        <IconButton
          aria-label="Refresh logs"
          icon={<RefreshCw className="w-5 h-5" />}
          onClick={loadData}
          isLoading={loading}
          variant="outline"
          borderColor="gray.300"
          color="gray.700"
          _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
        />
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, sm: 4 }} gap={4} mb={6}>
        <MetricCard
          label="Total Logs"
          value={auditLogs.length}
          icon={<ScrollText className="w-5 h-5" />}
          color="brand.500"
        />
        <MetricCard
          label="Today"
          value={todayLogs}
          subtitle="activities"
          color="blue.500"
        />
        <MetricCard
          label="Unique Roles"
          value={uniqueRoles.length}
          subtitle="user types"
          color="purple.500"
        />
        <MetricCard
          label="Action Types"
          value={uniqueActions.length}
          subtitle="different actions"
          color="green.500"
        />
      </SimpleGrid>

      <Card p={0} overflow="hidden">
        <Box p={6} borderBottom="1px solid" borderColor="gray.100" bg="gray.50">
          <HStack spacing={4} mb={4}>
            <Box
              w={10}
              h={10}
              bg="brand.50"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <ScrollText className="w-5 h-5 text-brand-600" />
            </Box>
            <Box flex="1">
              <Heading size="md" color="gray.900" fontWeight="700">
                Activity Log
              </Heading>
              <Text fontSize="xs" color="gray.500" mt={0.5}>
                {filteredLogs.length} of {auditLogs.length} entries
              </Text>
            </Box>
          </HStack>
          <Flex gap={3} flexWrap="wrap">
            <InputGroup maxW="300px" size="sm">
              <InputLeftElement pointerEvents="none">
                <Search className="w-4 h-4 text-gray-400" />
              </InputLeftElement>
              <ChakraInput
                placeholder="Search actions, roles..."
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
              onChange={(e) => setRoleFilter(e.target.value)}
              borderColor="gray.300"
              bg="white"
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
            >
              <option value="all">All Roles</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role?.replace('_', ' ')}
                </option>
              ))}
            </Select>
            <Select
              size="sm"
              maxW="150px"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              borderColor="gray.300"
              bg="white"
              _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
            >
              <option value="all">All Actions</option>
              <option value="login">Login/Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
            </Select>
          </Flex>
        </Box>

        <Box overflowX="auto" maxH="70vh" overflowY="auto">
          <Table variant="simple" size="sm">
            <Thead bg="gray.50" position="sticky" top={0} zIndex={1}>
              <Tr>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                  ID
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                  Action
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                  Actor
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                  Hostel
                </Th>
                <Th fontSize="xs" fontWeight="600" color="gray.600" textTransform="uppercase" letterSpacing="0.5px" py={4}>
                  Date & Time
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={5} py={12} textAlign="center" color="gray.500">
                    Loading audit logs...
                  </Td>
                </Tr>
              ) : filteredLogs.length === 0 ? (
                <Tr>
                  <Td colSpan={5} py={12} textAlign="center" color="gray.500">
                    <VStack spacing={2}>
                      <ScrollText className="w-8 h-8 text-gray-400" />
                      <Text>
                        {searchQuery || roleFilter !== 'all' || actionFilter !== 'all'
                          ? 'No logs match your filters'
                          : 'No audit logs found'}
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                filteredLogs.map((l) => {
                  const { date, time } = formatDate(l.created_at);
                  return (
                    <Tr key={l.id} _hover={{ bg: 'gray.50' }} transition="background 0.2s">
                      <Td py={3}>
                        <Text fontSize="sm" fontWeight="600" color="gray.700">
                          #{l.id}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <Badge
                          colorScheme={getActionColor(l.action)}
                          fontSize="xs"
                          px={3}
                          py={1}
                          borderRadius="md"
                          fontWeight="600"
                        >
                          {l.action}
                        </Badge>
                      </Td>
                      <Td py={3}>
                        <HStack spacing={2}>
                          {getRoleIcon(l.actor_role)}
                          <Badge
                            colorScheme={getRoleColor(l.actor_role)}
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontWeight="600"
                          >
                            {l.actor_role || 'System'}
                          </Badge>
                        </HStack>
                      </Td>
                      <Td py={3}>
                        <Text fontSize="sm" color="gray.600">
                          {l.actor_hostel_id
                            ? hostels.find((h) => h.id === l.actor_hostel_id)?.name || `#${l.actor_hostel_id}`
                            : '-'}
                        </Text>
                      </Td>
                      <Td py={3}>
                        <VStack align="flex-start" spacing={0}>
                          <HStack spacing={1}>
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <Text fontSize="sm" color="gray.600">
                              {date}
                            </Text>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            {time}
                          </Text>
                        </VStack>
                      </Td>
                    </Tr>
                  );
                })
              )}
            </Tbody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
