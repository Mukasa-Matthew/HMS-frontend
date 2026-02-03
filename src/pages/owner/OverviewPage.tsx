import React, { useEffect, useState } from 'react';
import { 
  Box, Flex, Heading, HStack, Text, VStack, SimpleGrid, 
  Badge, Button, Progress, Spinner, Divider
} from '@chakra-ui/react';
import { 
  DollarSign, Users, BedDouble, 
  AlertCircle, Clock, TrendingDown
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { DashboardStats, Payment, fetchPayments, fetchAllocations, fetchRooms, fetchStudents, fetchExpenseStats } from '../../api/owner';
import { useSemester } from '../../hooks/useSemester';

export function OverviewPage() {
  const { activeSemester } = useSemester();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeSemester]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [payments, rooms, students, allocations, expenseStats] = await Promise.all([
        fetchPayments({ limit: 1000, offset: 0 }).catch(() => []),
        fetchRooms().catch(() => []),
        fetchStudents().catch(() => []),
        fetchAllocations().catch(() => []),
        fetchExpenseStats({ semesterId: activeSemester?.id }).catch(() => ({ total: 0, byCategory: [] })),
      ]);

      setRecentPayments(payments.slice(0, 10));
      
      const semesterRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const totalRooms = rooms.length;
      const occupiedRooms = allocations.length;
      const availableRooms = totalRooms - occupiedRooms;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      const totalStudents = students.length;
      const activeStudents = allocations.length;
      
      let totalOutstanding = 0;
      let outstandingCount = 0;
      
      for (const allocation of allocations) {
        const allocationPayments = payments.filter((p) => p.allocation_id === allocation.id);
        const totalPaid = allocationPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
        const balance = Number(allocation.room_price_at_allocation || 0) - totalPaid;
        if (balance > 0) {
          totalOutstanding += balance;
          outstandingCount++;
        }
      }

      setStats({
        thisSemester: { revenue: semesterRevenue },
        occupancy: { totalRooms, occupiedRooms, availableRooms, occupancyRate },
        students: { total: totalStudents, active: activeStudents, checkedOut: totalStudents - activeStudents },
        outstanding: { total: totalOutstanding, count: outstandingCount },
      });
      
      setTotalExpenses(expenseStats.total || 0);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats({
        thisSemester: { revenue: 0 },
        occupancy: { totalRooms: 0, occupiedRooms: 0, availableRooms: 0, occupancyRate: 0 },
        students: { total: 0, active: 0, checkedOut: 0 },
        outstanding: { total: 0, count: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `UGX ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Show loading state
  if (loading && !stats) {
    return (
      <Box>
        <Flex justify="center" align="center" minH="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
            <Text color="gray.600" fontSize="lg">Loading dashboard...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box>

      {/* Main Metrics - Simple and Clear */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} gap={4} mb={8}>
        {/* Total Money Collected */}
        <Card p={6} hover>
          <VStack align="flex-start" spacing={3}>
            <HStack spacing={2}>
              <Box
                p={2}
                borderRadius="lg"
                bg="green.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <DollarSign className="w-5 h-5 text-green-600" />
              </Box>
              <Text fontSize="sm" fontWeight="700" color="gray.600" letterSpacing="0.3px">
                Money Collected
              </Text>
            </HStack>
            <Heading 
              size="xl" 
              color="green.600"
              fontWeight="800"
              letterSpacing="-1px"
            >
              {loading ? <Spinner size="sm" /> : formatCurrency(stats?.thisSemester.revenue || 0)}
            </Heading>
            <Text fontSize="xs" color="gray.500" fontWeight="500">
              Total payments received
            </Text>
          </VStack>
        </Card>

        {/* Money Still Owed */}
        <Card p={6} hover>
          <VStack align="flex-start" spacing={3}>
            <HStack spacing={2}>
              <Box
                p={2}
                borderRadius="lg"
                bg="orange.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </Box>
              <Text fontSize="sm" fontWeight="700" color="gray.600" letterSpacing="0.3px">
                Money Still Owed
              </Text>
            </HStack>
            <Heading 
              size="xl" 
              color="orange.600"
              fontWeight="800"
              letterSpacing="-1px"
            >
              {loading ? <Spinner size="sm" /> : formatCurrency(stats?.outstanding.total || 0)}
            </Heading>
            <Text fontSize="xs" color="gray.500" fontWeight="500">
              {stats?.outstanding.count || 0} {stats?.outstanding.count === 1 ? 'student' : 'students'} haven't paid
            </Text>
          </VStack>
        </Card>

        {/* Total Students */}
        <Card p={6} hover>
          <VStack align="flex-start" spacing={3}>
            <HStack spacing={2}>
              <Box
                p={2}
                borderRadius="lg"
                bg="blue.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Users className="w-5 h-5 text-blue-600" />
              </Box>
              <Text fontSize="sm" fontWeight="700" color="gray.600" letterSpacing="0.3px">
                Total Students
              </Text>
            </HStack>
            <Heading 
              size="xl" 
              color="blue.600"
              fontWeight="800"
              letterSpacing="-1px"
            >
              {loading ? <Spinner size="sm" /> : stats?.students.total || 0}
            </Heading>
            <Text fontSize="xs" color="gray.500" fontWeight="500">
              {stats?.students.active || 0} currently staying in hostel
            </Text>
          </VStack>
        </Card>

        {/* Room Occupancy */}
        <Card p={6} hover>
          <VStack align="flex-start" spacing={3}>
            <HStack spacing={2}>
              <Box
                p={2}
                borderRadius="lg"
                bg="purple.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <BedDouble className="w-5 h-5 text-purple-600" />
              </Box>
              <Text fontSize="sm" fontWeight="700" color="gray.600" letterSpacing="0.3px">
                Rooms Filled
              </Text>
            </HStack>
            <Heading 
              size="xl" 
              color="purple.600"
              fontWeight="800"
              letterSpacing="-1px"
            >
              {loading ? <Spinner size="sm" /> : `${stats?.occupancy.occupiedRooms || 0} / ${stats?.occupancy.totalRooms || 0}`}
            </Heading>
            <VStack align="flex-start" spacing={1} w="100%">
              <Progress 
                value={stats?.occupancy.occupancyRate || 0} 
                colorScheme="purple" 
                size="md" 
                w="100%" 
                borderRadius="full"
              />
              <Text fontSize="xs" color="gray.500" fontWeight="500">
                {stats?.occupancy.occupancyRate.toFixed(1) || 0}% full • {stats?.occupancy.availableRooms || 0} rooms available
              </Text>
            </VStack>
          </VStack>
        </Card>

        {/* Total Expenses */}
        <Card p={6} hover>
          <VStack align="flex-start" spacing={3}>
            <HStack spacing={2}>
              <Box
                p={2}
                borderRadius="lg"
                bg="red.50"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <TrendingDown className="w-5 h-5 text-red-600" />
              </Box>
              <Text fontSize="sm" fontWeight="700" color="gray.600" letterSpacing="0.3px">
                Total Expenses
              </Text>
            </HStack>
            <Heading 
              size="xl" 
              color="red.600"
              fontWeight="800"
              letterSpacing="-1px"
            >
              {loading ? <Spinner size="sm" /> : formatCurrency(totalExpenses)}
            </Heading>
            <Text fontSize="xs" color="gray.500" fontWeight="500">
              This semester expenses
            </Text>
          </VStack>
        </Card>
      </SimpleGrid>


      {/* Recent Payments - Simple List */}
      <Card p={6}>
        <Heading size="md" color="gray.900" fontWeight="700" mb={4}>
          Recent Payments
        </Heading>
        
        {loading ? (
          <Flex justify="center" py={8}>
            <Spinner size="md" color="brand.500" />
          </Flex>
        ) : recentPayments.length === 0 ? (
          <VStack py={8} spacing={2}>
            <DollarSign className="w-12 h-12 text-gray-300" />
            <Text color="gray.500" fontSize="sm">No payments recorded yet</Text>
          </VStack>
        ) : (
          <VStack spacing={0} align="stretch" divider={<Divider />}>
            {recentPayments.slice(0, 5).map((payment) => (
              <Flex
                key={payment.id}
                align="center"
                justify="space-between"
                p={4}
                _hover={{ bg: 'gray.50' }}
                borderRadius="md"
              >
                <HStack spacing={4}>
                  <Box
                    w={10}
                    h={10}
                    bg="green.100"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </Box>
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="600" color="gray.900" fontSize="md">
                      {formatCurrency(Number(payment.amount))}
                    </Text>
                    <HStack spacing={2} fontSize="xs" color="gray.500">
                      <Clock className="w-3 h-3" />
                      <Text>
                        {new Date(payment.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
                <Badge colorScheme="green" fontSize="xs" px={2} py={1} borderRadius="md">
                  PAID
                </Badge>
              </Flex>
            ))}
          </VStack>
        )}
      </Card>

    </Box>
  );
}
