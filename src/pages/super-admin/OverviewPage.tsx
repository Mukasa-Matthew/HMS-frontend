import React, { useEffect, useState } from 'react';
import { Box, Flex, Heading, HStack, Text, Table, Thead, Tr, Th, Tbody, Td, Badge, VStack, SimpleGrid } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Plus, Building2, Users, BedDouble, Activity, Clock, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, MetricCard } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { AuditLog, fetchAuditLogs, fetchHostels, fetchRooms, fetchUsers } from '../../api/admin';

const MotionBox = motion.create(Box);

export function OverviewPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [hostels, setHostels] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, r, h, a] = await Promise.all([
          fetchUsers(),
          fetchRooms(),
          fetchHostels(),
          fetchAuditLogs({ limit: 200, offset: 0 }),
        ]);
        setUsers(u);
        setRooms(r);
        setHostels(h);
        setAuditLogs(a);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Calculate time-based metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  const thisMonth = new Date(today);
  thisMonth.setMonth(thisMonth.getMonth() - 1);

  const todayAudits = auditLogs.filter((log) => new Date(log.created_at) >= today).length;
  const yesterdayAudits = auditLogs.filter(
    (log) => new Date(log.created_at) >= yesterday && new Date(log.created_at) < today
  ).length;
  const thisWeekAudits = auditLogs.filter((log) => new Date(log.created_at) >= thisWeek).length;
  const thisMonthAudits = auditLogs.filter((log) => new Date(log.created_at) >= thisMonth).length;

  const weekChange = yesterdayAudits > 0 ? ((todayAudits - yesterdayAudits) / yesterdayAudits) * 100 : 0;
  const monthChange = thisMonthAudits > 0 ? ((thisWeekAudits - thisMonthAudits) / thisMonthAudits) * 100 : 0;

  const activeHostels = hostels.filter((h) => h.is_active !== 0).length;
  const activeUsers = users.filter((u) => u.is_active !== 0).length;
  const owners = users.filter((u) => u.role === 'HOSTEL_OWNER').length;
  const custodians = users.filter((u) => u.role === 'CUSTODIAN').length;

  return (
    <Box>
      {/* Quick Actions */}
      <Flex gap={3} mb={6} flexWrap="wrap">
        <Button
          bg="brand.600"
          color="white"
          _hover={{ bg: 'brand.700' }}
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/super-admin/hostels')}
          size="md"
          fontWeight="600"
        >
          Create Hostel
        </Button>
        <Button
          bg="green.600"
          color="white"
          _hover={{ bg: 'green.700' }}
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/super-admin/users')}
          size="md"
          fontWeight="600"
        >
          Add User
        </Button>
        <Button
          variant="outline"
          borderColor="gray.300"
          color="gray.700"
          _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/super-admin/rooms')}
          size="md"
          fontWeight="600"
        >
          Add Room
        </Button>
        <Button
          variant="outline"
          borderColor="gray.300"
          color="gray.700"
          _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
          onClick={() => navigate('/super-admin/audit')}
          size="md"
          fontWeight="600"
        >
          View Logs
        </Button>
      </Flex>

      {/* Activity Metrics - Enhanced with Colors */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={6}>
        {/* Today Card - Blue Gradient */}
        <MotionBox
          bgGradient="linear(to-br, blue.500, blue.600)"
          borderRadius="xl"
          p={6}
          color="white"
          boxShadow="lg"
          whileHover={{ y: -2, boxShadow: 'xl' }}
          transition={{ duration: 0.2 }}
        >
          <Flex justify="space-between" align="flex-start" mb={3}>
            <Box>
              <Text fontSize="xs" fontWeight="600" opacity={0.9} mb={2} textTransform="uppercase" letterSpacing="0.5px">
                Today
              </Text>
              <Heading size="3xl" fontWeight="700" mb={1}>
                {loading ? '...' : todayAudits}
              </Heading>
              <Text fontSize="sm" opacity={0.8}>
                activities
              </Text>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              opacity={0.9}
            >
              <Activity className="w-8 h-8 text-white" strokeWidth={2} />
            </Box>
          </Flex>
        </MotionBox>

        {/* Yesterday Card - Purple Gradient */}
        <MotionBox
          bgGradient="linear(to-br, purple.500, purple.600)"
          borderRadius="xl"
          p={6}
          color="white"
          boxShadow="lg"
          whileHover={{ y: -2, boxShadow: 'xl' }}
          transition={{ duration: 0.2 }}
        >
          <Flex justify="space-between" align="flex-start" mb={3}>
            <Box>
              <Text fontSize="xs" fontWeight="600" opacity={0.9} mb={2} textTransform="uppercase" letterSpacing="0.5px">
                Yesterday
              </Text>
              <Heading size="3xl" fontWeight="700" mb={1}>
                {loading ? '...' : yesterdayAudits}
              </Heading>
              <Text fontSize="sm" opacity={0.8}>
                activities
              </Text>
            </Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              opacity={0.9}
            >
              <Clock className="w-8 h-8 text-white" strokeWidth={2} />
            </Box>
          </Flex>
        </MotionBox>

        {/* This Week Card - Green Gradient */}
        <MotionBox
          bgGradient="linear(to-br, green.500, green.600)"
          borderRadius="xl"
          p={6}
          color="white"
          boxShadow="lg"
          whileHover={{ y: -2, boxShadow: 'xl' }}
          transition={{ duration: 0.2 }}
        >
          <Flex justify="space-between" align="flex-start" mb={3}>
            <Box flex="1">
              <Text fontSize="xs" fontWeight="600" opacity={0.9} mb={2} textTransform="uppercase" letterSpacing="0.5px">
                This Week
              </Text>
              <Heading size="3xl" fontWeight="700" mb={1}>
                {loading ? '...' : thisWeekAudits}
              </Heading>
              <Text fontSize="sm" opacity={0.8} mb={2}>
                activities
              </Text>
              {weekChange !== 0 && (
                <HStack spacing={1} mt={2}>
                  {weekChange >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <Text fontSize="xs" fontWeight="600" opacity={0.9}>
                    {Math.abs(weekChange).toFixed(1)}% vs last period
                  </Text>
                </HStack>
              )}
            </Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              opacity={0.9}
            >
              <BarChart3 className="w-8 h-8 text-white" strokeWidth={2} />
            </Box>
          </Flex>
        </MotionBox>

        {/* This Month Card - Orange Gradient */}
        <MotionBox
          bgGradient="linear(to-br, orange.500, orange.600)"
          borderRadius="xl"
          p={6}
          color="white"
          boxShadow="lg"
          whileHover={{ y: -2, boxShadow: 'xl' }}
          transition={{ duration: 0.2 }}
        >
          <Flex justify="space-between" align="flex-start" mb={3}>
            <Box flex="1">
              <Text fontSize="xs" fontWeight="600" opacity={0.9} mb={2} textTransform="uppercase" letterSpacing="0.5px">
                This Month
              </Text>
              <Heading size="3xl" fontWeight="700" mb={1}>
                {loading ? '...' : thisMonthAudits}
              </Heading>
              <Text fontSize="sm" opacity={0.8} mb={2}>
                activities
              </Text>
              {monthChange !== 0 && (
                <HStack spacing={1} mt={2}>
                  {monthChange >= 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <Text fontSize="xs" fontWeight="600" opacity={0.9}>
                    {Math.abs(monthChange).toFixed(1)}% vs last period
                  </Text>
                </HStack>
              )}
            </Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              opacity={0.9}
            >
              <TrendingUp className="w-8 h-8 text-white" strokeWidth={2} />
            </Box>
          </Flex>
        </MotionBox>
      </SimpleGrid>

      {/* System Overview */}
      <Flex gap={6} mb={6} flexDirection={{ base: 'column', lg: 'row' }}>
        <Card flex="2" p={6} bg="white" boxShadow="md" borderColor="gray.200">
          <Flex align="center" gap={3} mb={6}>
            <Box
              bgGradient="linear(to-br, brand.500, brand.600)"
              borderRadius="lg"
              p={2.5}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Building2 className="w-5 h-5 text-white" />
            </Box>
            <Heading size="md" color="gray.900" fontWeight="700">
              System Overview
            </Heading>
          </Flex>
          
          {/* Key Metrics Grid - Enhanced with Colors */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
            {/* Hostels Card */}
            <MotionBox
              bgGradient="linear(to-br, brand.50, brand.100)"
              borderRadius="xl"
              p={5}
              border="2px solid"
              borderColor="brand.200"
              whileHover={{ scale: 1.02, borderColor: 'brand.400' }}
              transition={{ duration: 0.2 }}
              minW={0}
            >
              <HStack spacing={2} mb={3} flexWrap="nowrap">
                <Box
                  bg="brand.500"
                  borderRadius="lg"
                  p={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Building2 className="w-5 h-5 text-white" />
                </Box>
                <Text 
                  fontSize="xs" 
                  fontWeight="700" 
                  color="brand.700" 
                  textTransform="uppercase" 
                  letterSpacing="0.5px"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  Hostels
                </Text>
              </HStack>
              <Heading size="2xl" color="brand.700" fontWeight="700" mb={1} lineHeight="1.2">
                {loading ? '...' : hostels.length}
              </Heading>
              <Text fontSize="sm" color="brand.600" fontWeight="600" whiteSpace="nowrap">
                {activeHostels} active
              </Text>
            </MotionBox>
            
            {/* Owners Card */}
            <MotionBox
              bgGradient="linear(to-br, purple.50, purple.100)"
              borderRadius="xl"
              p={5}
              border="2px solid"
              borderColor="purple.200"
              whileHover={{ scale: 1.02, borderColor: 'purple.400' }}
              transition={{ duration: 0.2 }}
              minW={0}
            >
              <HStack spacing={2} mb={3} flexWrap="nowrap">
                <Box
                  bg="purple.500"
                  borderRadius="lg"
                  p={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Users className="w-5 h-5 text-white" />
                </Box>
                <Text 
                  fontSize="xs" 
                  fontWeight="700" 
                  color="purple.700" 
                  textTransform="uppercase" 
                  letterSpacing="0.5px"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  Owners
                </Text>
              </HStack>
              <Heading size="2xl" color="purple.700" fontWeight="700" mb={1} lineHeight="1.2">
                {loading ? '...' : owners}
              </Heading>
              <Text fontSize="sm" color="purple.600" fontWeight="600" whiteSpace="nowrap">
                Registered
              </Text>
            </MotionBox>
            
            {/* Custodians Card */}
            <MotionBox
              bgGradient="linear(to-br, blue.50, blue.100)"
              borderRadius="xl"
              p={5}
              border="2px solid"
              borderColor="blue.200"
              whileHover={{ scale: 1.02, borderColor: 'blue.400' }}
              transition={{ duration: 0.2 }}
              minW={0}
            >
              <HStack spacing={2} mb={3} flexWrap="nowrap">
                <Box
                  bg="blue.500"
                  borderRadius="lg"
                  p={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Users className="w-5 h-5 text-white" />
                </Box>
                <Text 
                  fontSize="xs" 
                  fontWeight="700" 
                  color="blue.700" 
                  textTransform="uppercase" 
                  letterSpacing="0.5px"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  Custodians
                </Text>
              </HStack>
              <Heading size="2xl" color="blue.700" fontWeight="700" mb={1} lineHeight="1.2">
                {loading ? '...' : custodians}
              </Heading>
              <Text fontSize="sm" color="blue.600" fontWeight="600" whiteSpace="nowrap">
                Active
              </Text>
            </MotionBox>
            
            {/* Rooms Card */}
            <MotionBox
              bgGradient="linear(to-br, green.50, green.100)"
              borderRadius="xl"
              p={5}
              border="2px solid"
              borderColor="green.200"
              whileHover={{ scale: 1.02, borderColor: 'green.400' }}
              transition={{ duration: 0.2 }}
              minW={0}
            >
              <HStack spacing={2} mb={3} flexWrap="nowrap">
                <Box
                  bg="green.500"
                  borderRadius="lg"
                  p={2}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <BedDouble className="w-5 h-5 text-white" />
                </Box>
                <Text 
                  fontSize="xs" 
                  fontWeight="700" 
                  color="green.700" 
                  textTransform="uppercase" 
                  letterSpacing="0.5px"
                  whiteSpace="nowrap"
                  overflow="hidden"
                  textOverflow="ellipsis"
                >
                  Rooms
                </Text>
              </HStack>
              <Heading size="2xl" color="green.700" fontWeight="700" mb={1} lineHeight="1.2">
                {loading ? '...' : rooms.length}
              </Heading>
              <Text fontSize="sm" color="green.600" fontWeight="600" whiteSpace="nowrap">
                Total
              </Text>
            </MotionBox>
          </SimpleGrid>

          {/* Recent Activity */}
          <Box>
            <HStack spacing={2} mb={4}>
              <Box
                bgGradient="linear(to-br, brand.500, brand.600)"
                borderRadius="md"
                p={1.5}
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Activity className="w-4 h-4 text-white" />
              </Box>
              <Text fontSize="sm" fontWeight="700" color="gray.700">
                Recent Activity
              </Text>
            </HStack>
            <Box overflowX="auto" borderRadius="lg" border="1px solid" borderColor="gray.200" bg="white" boxShadow="sm">
              <Table size="sm" variant="simple">
                <Thead bgGradient="linear(to-r, gray.50, gray.100)">
                  <Tr>
                    <Th fontSize="xs" fontWeight="700" color="gray.700" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                      Action
                    </Th>
                    <Th fontSize="xs" fontWeight="700" color="gray.700" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                      Role
                    </Th>
                    <Th fontSize="xs" fontWeight="700" color="gray.700" textTransform="uppercase" letterSpacing="0.5px" py={3}>
                      Time
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {loading ? (
                    <Tr>
                      <Td colSpan={3} py={8} textAlign="center" color="gray.500">
                        Loading activity...
                      </Td>
                    </Tr>
                  ) : auditLogs.length === 0 ? (
                    <Tr>
                      <Td colSpan={3} py={8} textAlign="center" color="gray.500">
                        No activity yet.
                      </Td>
                    </Tr>
                  ) : (
                    auditLogs.slice(0, 5).map((l) => (
                      <Tr key={l.id} _hover={{ bg: 'gray.50' }} transition="background 0.2s">
                        <Td py={3}>
                          <HStack spacing={2}>
                            <Box
                              w={2}
                              h={2}
                              borderRadius="full"
                              bg={l.action.includes('CREATE') ? 'green.500' : l.action.includes('LOGIN') ? 'blue.500' : 'gray.500'}
                            />
                            <Text fontSize="sm" fontWeight="600" color="gray.900">
                              {l.action}
                            </Text>
                          </HStack>
                        </Td>
                        <Td py={3}>
                          <Badge
                            colorScheme={l.actor_role === 'SUPER_ADMIN' ? 'purple' : l.actor_role === 'HOSTEL_OWNER' ? 'blue' : 'green'}
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontWeight="600"
                            variant="subtle"
                          >
                            {l.actor_role || '-'}
                          </Badge>
                        </Td>
                        <Td py={3}>
                          <Text fontSize="sm" color="gray.600" fontWeight="500">
                            {new Date(l.created_at).toLocaleTimeString()}
                          </Text>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </Box>
        </Card>

        {/* Quick Stats Sidebar - Enhanced */}
        <Card flex="1" p={6} bgGradient="linear(to-b, gray.50, white)" borderColor="gray.200">
          <Heading size="md" mb={6} color="gray.900" fontWeight="700">
            Quick Stats
          </Heading>
          <VStack align="stretch" spacing={4}>
            {/* Total Activities */}
            <MotionBox
              bg="white"
              borderRadius="lg"
              p={5}
              border="1px solid"
              borderColor="gray.200"
              boxShadow="sm"
              whileHover={{ boxShadow: 'md', y: -1 }}
              transition={{ duration: 0.2 }}
            >
              <HStack spacing={3} mb={3}>
                <Box
                  bgGradient="linear(to-br, brand.500, brand.600)"
                  borderRadius="lg"
                  p={2.5}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Activity className="w-5 h-5 text-white" />
                </Box>
                <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px">
                  Total Activities
                </Text>
              </HStack>
              <Heading size="2xl" color="brand.600" fontWeight="700">
                {loading ? '...' : auditLogs.length}
              </Heading>
            </MotionBox>

            {/* Active Hostels */}
            <MotionBox
              bg="white"
              borderRadius="lg"
              p={5}
              border="1px solid"
              borderColor="gray.200"
              boxShadow="sm"
              whileHover={{ boxShadow: 'md', y: -1 }}
              transition={{ duration: 0.2 }}
            >
              <HStack spacing={3} mb={3}>
                <Box
                  bgGradient="linear(to-br, green.500, green.600)"
                  borderRadius="lg"
                  p={2.5}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Building2 className="w-5 h-5 text-white" />
                </Box>
                <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px">
                  Active Hostels
                </Text>
              </HStack>
              <Heading size="2xl" color="green.600" fontWeight="700">
                {loading ? '...' : activeHostels}
              </Heading>
            </MotionBox>

            {/* Active Users */}
            <MotionBox
              bg="white"
              borderRadius="lg"
              p={5}
              border="1px solid"
              borderColor="gray.200"
              boxShadow="sm"
              whileHover={{ boxShadow: 'md', y: -1 }}
              transition={{ duration: 0.2 }}
            >
              <HStack spacing={3} mb={3}>
                <Box
                  bgGradient="linear(to-br, blue.500, blue.600)"
                  borderRadius="lg"
                  p={2.5}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Users className="w-5 h-5 text-white" />
                </Box>
                <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase" letterSpacing="0.5px">
                  Active Users
                </Text>
              </HStack>
              <Heading size="2xl" color="blue.600" fontWeight="700">
                {loading ? '...' : activeUsers}
              </Heading>
            </MotionBox>
          </VStack>
        </Card>
      </Flex>
    </Box>
  );
}
