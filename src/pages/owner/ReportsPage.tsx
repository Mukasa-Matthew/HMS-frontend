import React, { useEffect, useState } from 'react';
import { 
  Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, 
  HStack, VStack, SimpleGrid, Select, Button, Tabs, TabList, TabPanels, Tab, TabPanel,
  Divider, Badge
} from '@chakra-ui/react';
import { BarChart3, Download, TrendingUp, Users, BedDouble, DollarSign, Calendar, FileText } from 'lucide-react';
import { Card } from '../../components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { 
  StudentWithDetails, fetchStudentsWithDetails, 
  Payment, fetchPayments, 
  Allocation, fetchAllocations, 
  Room, fetchRooms,
  CheckIn, fetchCheckIns
} from '../../api/owner';

interface RevenueBySemester {
  semester: string;
  revenue: number;
  paymentCount: number;
  startDate: string;
  endDate: string;
}

interface RoomUtilization {
  roomName: string;
  capacity: number;
  occupied: number;
  utilizationRate: number;
  revenue: number;
}

export function ReportsPage() {
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'semester' | 'all'>('semester');

  useEffect(() => {
    loadData();
    loadCheckIns();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, paymentsData, allocationsData, roomsData] = await Promise.all([
        fetchStudentsWithDetails().catch(() => []),
        fetchPayments().catch(() => []),
        fetchAllocations().catch(() => []),
        fetchRooms().catch(() => []),
      ]);

      setStudents(studentsData);
      setPayments(paymentsData);
      setAllocations(allocationsData);
      setRooms(roomsData);
    } catch (error) {
      console.error('Failed to load data:', error);
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

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(numAmount) || !isFinite(numAmount)) {
      return 'UGX 0.00';
    }
    return `UGX ${numAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate semester start (4 months ago)
  const getSemesterStart = () => {
    const now = new Date();
    const semesterStart = new Date(now);
    semesterStart.setMonth(now.getMonth() - 4);
    return semesterStart;
  };

  // Filter payments by period
  const getFilteredPayments = () => {
    if (periodFilter === 'all') return payments;
    const semesterStart = getSemesterStart();
    return payments.filter((p) => new Date(p.created_at) >= semesterStart);
  };

  // Revenue Analytics
  const filteredPayments = getFilteredPayments();
  const totalRevenue = filteredPayments.reduce((sum, p) => {
    const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount) || 0;
    return sum + amount;
  }, 0);
  const paymentCount = filteredPayments.length;
  const averagePayment = paymentCount > 0 ? totalRevenue / paymentCount : 0;

  // Revenue by semester (4-month periods)
  const getRevenueBySemester = (): RevenueBySemester[] => {
    const filtered = getFilteredPayments();
    const semesters: { [key: string]: { revenue: number; count: number; startDate: Date; endDate: Date } } = {};

    filtered.forEach((payment) => {
      const date = new Date(payment.created_at);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      
      // Determine semester: Jan-Apr (0-3), May-Aug (4-7), Sep-Dec (8-11)
      let semesterNum: number;
      let semesterStartMonth: number;
      let semesterEndMonth: number;
      
      if (month >= 0 && month <= 3) {
        // Semester 1: Jan-Apr
        semesterNum = 1;
        semesterStartMonth = 0;
        semesterEndMonth = 3;
      } else if (month >= 4 && month <= 7) {
        // Semester 2: May-Aug
        semesterNum = 2;
        semesterStartMonth = 4;
        semesterEndMonth = 7;
      } else {
        // Semester 3: Sep-Dec
        semesterNum = 3;
        semesterStartMonth = 8;
        semesterEndMonth = 11;
      }

      const semesterKey = `${year}-S${semesterNum}`;
      const semesterStart = new Date(year, semesterStartMonth, 1);
      const semesterEnd = new Date(year, semesterEndMonth + 1, 0); // Last day of the month

      if (!semesters[semesterKey]) {
        semesters[semesterKey] = { 
          revenue: 0, 
          count: 0, 
          startDate: semesterStart,
          endDate: semesterEnd
        };
      }
      const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : Number(payment.amount) || 0;
      semesters[semesterKey].revenue += amount;
      semesters[semesterKey].count += 1;
    });

    return Object.entries(semesters)
      .map(([key, data]) => {
        const [year, semesterPart] = key.split('-');
        const semesterNum = semesterPart.replace('S', '');
        const semesterNames: { [key: string]: string } = {
          '1': 'Jan-Apr',
          '2': 'May-Aug',
          '3': 'Sep-Dec'
        };
        
        return {
          semester: `${semesterNames[semesterNum]} ${year}`,
          revenue: data.revenue,
          paymentCount: data.count,
          startDate: data.startDate.toISOString().split('T')[0],
          endDate: data.endDate.toISOString().split('T')[0],
        };
      })
      .sort((a, b) => {
        // Sort by year and semester number
        const [aSem, aYear] = a.semester.split(' ');
        const [bSem, bYear] = b.semester.split(' ');
        if (aYear !== bYear) return bYear.localeCompare(aYear); // Descending year
        const semOrder: { [key: string]: number } = { 'Jan-Apr': 1, 'May-Aug': 2, 'Sep-Dec': 3 };
        return (semOrder[bSem] || 0) - (semOrder[aSem] || 0); // Descending semester
      });
  };

  // Occupancy Analytics
  const totalRooms = rooms.length;
  const occupiedRooms = allocations.length;
  const availableRooms = totalRooms - occupiedRooms;
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  // Room Utilization
  const getRoomUtilization = (): RoomUtilization[] => {
    return rooms.map((room) => {
      const roomAllocations = allocations.filter((a) => a.room_id === room.id);
      const occupied = roomAllocations.length;
      const utilizationRate = room.capacity > 0 ? (occupied / room.capacity) * 100 : 0;
      
      // Calculate revenue for this room
      const roomPayments = getFilteredPayments().filter((p) => {
        const alloc = allocations.find((a) => a.id === p.allocation_id);
        return alloc && alloc.room_id === room.id;
      });
      const revenue = roomPayments.reduce((sum, p) => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount) || 0;
        return sum + amount;
      }, 0);

      return {
        roomName: room.name,
        capacity: room.capacity,
        occupied,
        utilizationRate,
        revenue,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  // Student Analytics - use backend check-ins data
  const totalStudents = students.length;
  // Only count students who are checked in AND not checked out AND still exist in current student list
  const currentStudentIds = new Set(students.map(s => s.id));
  const checkedInStudents = checkIns.filter(
    (ci) => !ci.checked_out_at && currentStudentIds.has(ci.student_id)
  ).length;
  const pendingCheckIn = totalStudents - checkedInStudents;
  const studentsWithOutstanding = students.filter((s) => {
    return s.paymentSummary && s.paymentSummary.balance > 0;
  }).length;

  // Outstanding Debtors
  const getOutstandingDebtors = () => {
    return students
      .filter((s) => s.paymentSummary && s.paymentSummary.balance > 0)
      .map((s) => ({
        name: s.full_name,
        registrationNumber: s.registration_number,
        room: s.room?.name || 'N/A',
        totalRequired: s.paymentSummary!.totalRequired,
        totalPaid: s.paymentSummary!.totalPaid,
        balance: s.paymentSummary!.balance,
      }))
      .sort((a, b) => b.balance - a.balance);
  };

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) => headers.map((header) => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportRevenueReport = () => {
    const revenueBySemester = getRevenueBySemester();
    exportToCSV(revenueBySemester, 'revenue_report');
  };

  const exportOccupancyReport = () => {
    const utilization = getRoomUtilization();
    exportToCSV(utilization, 'occupancy_report');
  };

  const exportOutstandingDebtors = () => {
    const debtors = getOutstandingDebtors();
    exportToCSV(debtors, 'outstanding_debtors');
  };

  const exportStudentReport = () => {
    const studentData = students.map((s) => ({
      name: s.full_name,
      registrationNumber: s.registration_number,
      phone: s.phone || 'N/A',
      email: s.email || 'N/A',
      room: s.room?.name || 'Not Assigned',
      checkedIn: s.allocation ? 'Yes' : 'No',
      totalRequired: s.paymentSummary?.totalRequired || 0,
      totalPaid: s.paymentSummary?.totalPaid || 0,
      balance: s.paymentSummary?.balance || 0,
    }));
    exportToCSV(studentData, 'student_report');
  };

  const revenueBySemester = getRevenueBySemester();
  const roomUtilization = getRoomUtilization();
  const outstandingDebtors = getOutstandingDebtors();

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" mb={1} color="gray.900" fontWeight="700">
            Reports & Analytics
          </Heading>
          <Text color="gray.600" fontSize="sm">
            View detailed analytics, generate reports, and export data for your hostel.
          </Text>
        </Box>
        <HStack spacing={3}>
          <Select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value as 'semester' | 'all')}
            maxW="200px"
            bg="white"
          >
            <option value="semester">This Semester</option>
            <option value="all">All Time</option>
          </Select>
        </HStack>
      </Flex>

      <Tabs colorScheme="blue" defaultIndex={0}>
        <TabList>
          <Tab>Revenue Analytics</Tab>
          <Tab>Occupancy Analytics</Tab>
          <Tab>Student Analytics</Tab>
          <Tab>Outstanding Debtors</Tab>
        </TabList>

        <TabPanels>
          {/* Revenue Analytics Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* Revenue Summary Cards */}
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Total Revenue
                      </Text>
                      <Box p={2} bg="green.100" borderRadius="md">
                        <DollarSign className="w-4 h-4 text-green-600" />
                      </Box>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color="gray.900">
                      {formatCurrency(totalRevenue)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {periodFilter === 'semester' ? 'This Semester' : 'All Time'}
                    </Text>
                  </VStack>
                </Card>

                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Payment Count
                      </Text>
                      <Box p={2} bg="blue.100" borderRadius="md">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </Box>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color="gray.900">
                      {paymentCount}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Total transactions
                    </Text>
                  </VStack>
                </Card>

                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Export
                      </Text>
                      <Box p={2} bg="orange.100" borderRadius="md">
                        <Download className="w-4 h-4 text-orange-600" />
                      </Box>
                    </HStack>
                    <Button
                      size="sm"
                      leftIcon={<Download className="w-4 h-4" />}
                      onClick={exportRevenueReport}
                      w="full"
                    >
                      Export CSV
                    </Button>
                  </VStack>
                </Card>
              </SimpleGrid>

              {/* Revenue by Semester Chart */}
              <Card p={6}>
                <Heading size="md" mb={4} color="gray.900">
                  Revenue by Semester
                </Heading>
                {revenueBySemester.length === 0 ? (
                  <Text textAlign="center" py={8} color="gray.500">
                    No revenue data available
                  </Text>
                ) : (
                  <VStack spacing={6} align="stretch">
                    {/* Bar Chart */}
                    <Box w="100%" h="400px">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueBySemester}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="semester" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            fontSize={12}
                          />
                          <YAxis 
                            tickFormatter={(value) => `UGX ${(value / 1000).toFixed(0)}K`}
                            fontSize={12}
                          />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
                          />
                          <Legend />
                          <Bar dataKey="revenue" fill="#3182CE" name="Revenue" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Pie Chart */}
                    <Box w="100%" h="350px">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={revenueBySemester}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ semester, percent }) => `${semester}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="revenue"
                            nameKey="semester"
                          >
                            {revenueBySemester.map((entry, index) => {
                              const colors = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5', '#DD6B20'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Table */}
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>SEMESTER</Th>
                            <Th>PERIOD</Th>
                            <Th isNumeric>REVENUE</Th>
                            <Th isNumeric>PAYMENTS</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {revenueBySemester.map((semester, idx) => (
                            <Tr key={idx}>
                              <Td fontWeight="600">{semester.semester}</Td>
                              <Td fontSize="sm" color="gray.600">
                                {formatDate(semester.startDate)} - {formatDate(semester.endDate)}
                              </Td>
                              <Td isNumeric fontWeight="600" color="green.600">
                                {formatCurrency(semester.revenue)}
                              </Td>
                              <Td isNumeric>{semester.paymentCount}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </VStack>
                )}
              </Card>
            </VStack>
          </TabPanel>

          {/* Occupancy Analytics Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* Occupancy Summary Cards */}
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Total Rooms
                      </Text>
                      <Box p={2} bg="blue.100" borderRadius="md">
                        <BedDouble className="w-4 h-4 text-blue-600" />
                      </Box>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color="gray.900">
                      {totalRooms}
                    </Text>
                  </VStack>
                </Card>

                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Occupied
                      </Text>
                      <Box p={2} bg="green.100" borderRadius="md">
                        <Users className="w-4 h-4 text-green-600" />
                      </Box>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color="gray.900">
                      {occupiedRooms}
                    </Text>
                  </VStack>
                </Card>

                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Available
                      </Text>
                      <Box p={2} bg="orange.100" borderRadius="md">
                        <BedDouble className="w-4 h-4 text-orange-600" />
                      </Box>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color="gray.900">
                      {availableRooms}
                    </Text>
                  </VStack>
                </Card>

                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Occupancy Rate
                      </Text>
                      <Box p={2} bg="purple.100" borderRadius="md">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                      </Box>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color="gray.900">
                      {occupancyRate.toFixed(1)}%
                    </Text>
                  </VStack>
                </Card>
              </SimpleGrid>

              {/* Room Utilization Charts */}
              <Card p={6}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md" color="gray.900">
                    Room Utilization
                  </Heading>
                  <Button
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={exportOccupancyReport}
                  >
                    Export CSV
                  </Button>
                </Flex>
                {roomUtilization.length === 0 ? (
                  <Text textAlign="center" py={8} color="gray.500">
                    No room data available
                  </Text>
                ) : (
                  <VStack spacing={6} align="stretch">
                    {/* Bar Chart - Room Utilization */}
                    <Box w="100%" h="400px">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={roomUtilization}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="roomName" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                            fontSize={12}
                          />
                          <YAxis fontSize={12} />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              if (name === 'utilizationRate') return `${value.toFixed(1)}%`;
                              if (name === 'revenue') return formatCurrency(value);
                              return value;
                            }}
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
                          />
                          <Legend />
                          <Bar dataKey="utilizationRate" fill="#805AD5" name="Utilization %" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="occupied" fill="#38A169" name="Occupied" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Pie Chart - Room Revenue Distribution */}
                    <Box w="100%" h="350px">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={roomUtilization.filter(r => r.revenue > 0)}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ roomName, percent }) => `${roomName}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="revenue"
                            nameKey="roomName"
                          >
                            {roomUtilization.filter(r => r.revenue > 0).map((entry, index) => {
                              const colors = ['#3182CE', '#38A169', '#D69E2E', '#E53E3E', '#805AD5', '#DD6B20', '#319795', '#9F7AEA'];
                              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                            })}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Table */}
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>ROOM</Th>
                            <Th isNumeric>CAPACITY</Th>
                            <Th isNumeric>OCCUPIED</Th>
                            <Th isNumeric>UTILIZATION</Th>
                            <Th isNumeric>REVENUE</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {roomUtilization.map((room, idx) => (
                            <Tr key={idx}>
                              <Td fontWeight="600">{room.roomName}</Td>
                              <Td isNumeric>{room.capacity}</Td>
                              <Td isNumeric>{room.occupied}</Td>
                              <Td isNumeric>
                                <Badge colorScheme={room.utilizationRate >= 80 ? 'green' : room.utilizationRate >= 50 ? 'yellow' : 'red'}>
                                  {room.utilizationRate.toFixed(1)}%
                                </Badge>
                              </Td>
                              <Td isNumeric fontWeight="600" color="green.600">
                                {formatCurrency(room.revenue)}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </VStack>
                )}
              </Card>
            </VStack>
          </TabPanel>

          {/* Student Analytics Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              {/* Student Summary Cards */}
              <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4}>
                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Total Students
                      </Text>
                      <Box p={2} bg="blue.100" borderRadius="md">
                        <Users className="w-4 h-4 text-blue-600" />
                      </Box>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color="gray.900">
                      {totalStudents}
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
                      {checkedInStudents}
                    </Text>
                  </VStack>
                </Card>

                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Pending Check-in
                      </Text>
                      <Box p={2} bg="orange.100" borderRadius="md">
                        <Users className="w-4 h-4 text-orange-600" />
                      </Box>
                    </HStack>
                    <Text fontSize="2xl" fontWeight="700" color="gray.900">
                      {pendingCheckIn}
                    </Text>
                  </VStack>
                </Card>

                <Card p={6}>
                  <VStack align="flex-start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Text fontSize="sm" color="gray.600" fontWeight="500">
                        Export
                      </Text>
                      <Box p={2} bg="purple.100" borderRadius="md">
                        <Download className="w-4 h-4 text-purple-600" />
                      </Box>
                    </HStack>
                    <Button
                      size="sm"
                      leftIcon={<Download className="w-4 h-4" />}
                      onClick={exportStudentReport}
                      w="full"
                    >
                      Export CSV
                    </Button>
                  </VStack>
                </Card>
              </SimpleGrid>

              {/* Student Status Pie Chart */}
              <Card p={6}>
                <Heading size="md" mb={4} color="gray.900">
                  Student Status Distribution
                </Heading>
                {totalStudents === 0 ? (
                  <Text textAlign="center" py={8} color="gray.500">
                    No student data available
                  </Text>
                ) : (
                  <Box w="100%" h="400px">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Checked In', value: checkedInStudents, color: '#38A169' },
                            { name: 'Pending Check-in', value: pendingCheckIn, color: '#D69E2E' },
                            { name: 'With Outstanding Balance', value: studentsWithOutstanding, color: '#E53E3E' },
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                        >
                          {[
                            { name: 'Checked In', value: checkedInStudents, color: '#38A169' },
                            { name: 'Pending Check-in', value: pendingCheckIn, color: '#D69E2E' },
                            { name: 'With Outstanding Balance', value: studentsWithOutstanding, color: '#E53E3E' },
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Card>
            </VStack>
          </TabPanel>

          {/* Outstanding Debtors Tab */}
          <TabPanel px={0}>
            <VStack spacing={6} align="stretch">
              <Card p={6}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md" color="gray.900">
                    Outstanding Debtors
                  </Heading>
                  <Button
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={exportOutstandingDebtors}
                  >
                    Export CSV
                  </Button>
                </Flex>
                {outstandingDebtors.length === 0 ? (
                  <Text textAlign="center" py={8} color="gray.500">
                    No outstanding balances
                  </Text>
                ) : (
                  <VStack spacing={6} align="stretch">
                    {/* Outstanding Balance Bar Chart */}
                    <Box w="100%" h="400px">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={outstandingDebtors.slice(0, 10).map(d => ({
                            name: d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name,
                            balance: d.balance,
                            paid: d.totalPaid,
                            required: d.totalRequired,
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={120}
                            fontSize={11}
                          />
                          <YAxis 
                            tickFormatter={(value) => `UGX ${(value / 1000).toFixed(0)}K`}
                            fontSize={12}
                          />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px' }}
                          />
                          <Legend />
                          <Bar dataKey="balance" fill="#E53E3E" name="Outstanding Balance" radius={[8, 8, 0, 0]} />
                          <Bar dataKey="paid" fill="#38A169" name="Paid" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* Table */}
                    <Box overflowX="auto">
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>STUDENT</Th>
                            <Th>REGISTRATION</Th>
                            <Th>ROOM</Th>
                            <Th isNumeric>TOTAL REQUIRED</Th>
                            <Th isNumeric>PAID</Th>
                            <Th isNumeric>BALANCE</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {outstandingDebtors.map((debtor, idx) => (
                            <Tr key={idx}>
                              <Td fontWeight="600">{debtor.name}</Td>
                              <Td fontFamily="mono" fontSize="sm">{debtor.registrationNumber}</Td>
                              <Td>{debtor.room}</Td>
                              <Td isNumeric>{formatCurrency(debtor.totalRequired)}</Td>
                              <Td isNumeric color="green.600">{formatCurrency(debtor.totalPaid)}</Td>
                              <Td isNumeric fontWeight="700" color="red.600">
                                {formatCurrency(debtor.balance)}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </Box>
                  </VStack>
                )}
              </Card>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
