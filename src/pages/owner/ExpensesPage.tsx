import React, { useEffect, useState } from 'react';
import { 
  Box, Flex, Heading, Text, Table, Thead, Tr, Th, Tbody, Td, Badge, 
  Input as ChakraInput, InputGroup, InputLeftElement, HStack, VStack, SimpleGrid,
  Select, Spinner
} from '@chakra-ui/react';
import { DollarSign, Search, Calendar, TrendingDown, Receipt, User } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { fetchExpenses, Expense, ExpenseStats, fetchExpenseStats } from '../../api/owner';
import { useSemester } from '../../hooks/useSemester';

const EXPENSE_CATEGORIES = [
  'Maintenance',
  'Utilities',
  'Cleaning Supplies',
  'Food & Catering',
  'Security',
  'Repairs',
  'Equipment',
  'Other',
];

export function ExpensesPage() {
  const { activeSemester } = useSemester();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [activeSemester]);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchQuery, categoryFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, statsData] = await Promise.all([
        fetchExpenses({ 
          limit: 1000, 
          offset: 0,
          semesterId: activeSemester?.id,
        }).catch(() => ({ expenses: [], total: 0, limit: 0, offset: 0 })),
        fetchExpenseStats({
          semesterId: activeSemester?.id,
        }).catch(() => ({ total: 0, byCategory: [] })),
      ]);

      setExpenses(expensesData.expenses);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.description.toLowerCase().includes(query) ||
          e.category?.toLowerCase().includes(query) ||
          e.recorded_by_username?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((e) => e.category === categoryFilter);
    }

    setFilteredExpenses(filtered);
  };

  const formatCurrency = (amount: number) => 
    `UGX ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" mb={6} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
        <Box>
          <Heading size="lg" mb={1} color="gray.900" fontWeight="700">
            Expenses
          </Heading>
          <Text color="gray.600" fontSize="sm">
            View expenses recorded by custodians for {activeSemester ? activeSemester.name : 'active semester'}
          </Text>
        </Box>
      </Flex>

      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={4} mb={6}>
        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Total Expenses
              </Text>
              <Box p={2} bg="red.100" borderRadius="md">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </Box>
            </HStack>
            <Box fontSize="2xl" fontWeight="700" color="gray.900">
              {loading ? <Spinner size="sm" /> : formatCurrency(stats?.total || 0)}
            </Box>
            <Text fontSize="xs" color="gray.500">
              {activeSemester ? `This semester (${activeSemester.name})` : 'All time'}
            </Text>
          </VStack>
        </Card>

        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Total Records
              </Text>
              <Box p={2} bg="blue.100" borderRadius="md">
                <Receipt className="w-4 h-4 text-blue-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {expenses.length}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Expense entries
            </Text>
          </VStack>
        </Card>

        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Categories
              </Text>
              <Box p={2} bg="purple.100" borderRadius="md">
                <Receipt className="w-4 h-4 text-purple-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {stats?.byCategory.length || 0}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Different categories
            </Text>
          </VStack>
        </Card>

        <Card p={6}>
          <VStack align="flex-start" spacing={2}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Custodians
              </Text>
              <Box p={2} bg="green.100" borderRadius="md">
                <User className="w-4 h-4 text-green-600" />
              </Box>
            </HStack>
            <Text fontSize="2xl" fontWeight="700" color="gray.900">
              {new Set(expenses.map(e => e.recorded_by_user_id)).size}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Custodians who recorded expenses
            </Text>
          </VStack>
        </Card>
      </SimpleGrid>

      {/* Expenses by Category */}
      {stats && stats.byCategory.length > 0 && (
        <Card p={6} mb={6}>
          <Heading size="md" color="gray.900" mb={4}>
            Expenses by Category
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={4}>
            {stats.byCategory.map((item) => (
              <Box key={item.category || 'Uncategorized'} p={4} bg="gray.50" borderRadius="md">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="600" color="gray.700">
                    {item.category || 'Uncategorized'}
                  </Text>
                  <Badge colorScheme="blue" fontSize="xs">
                    {expenses.filter(e => e.category === item.category).length} records
                  </Badge>
                </HStack>
                <Text fontSize="lg" fontWeight="700" color="red.600">
                  {formatCurrency(item.total)}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Card>
      )}

      {/* Expenses Table */}
      <Card p={6}>
        <Flex justify="space-between" align="center" mb={4} flexDirection={{ base: 'column', md: 'row' }} gap={4}>
          <Heading size="md" color="gray.900">
            Expense Records
          </Heading>
          <HStack spacing={4} w={{ base: 'full', md: 'auto' }}>
            <InputGroup maxW={{ base: 'full', md: '200px' }}>
              <InputLeftElement pointerEvents="none">
                <Search className="w-4 h-4 text-gray-400" />
              </InputLeftElement>
              <ChakraInput
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
              />
            </InputGroup>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              maxW={{ base: 'full', md: '200px' }}
              bg="white"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </HStack>
        </Flex>

        {loading ? (
          <Flex justify="center" py={8}>
            <Spinner size="md" color="brand.500" />
          </Flex>
        ) : filteredExpenses.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <Text color="gray.500" fontSize="lg" fontWeight="500" mb={2}>
              {searchQuery || categoryFilter !== 'all' ? 'No expenses found' : 'No expenses recorded yet'}
            </Text>
            <Text color="gray.400" fontSize="sm">
              {searchQuery || categoryFilter !== 'all'
                ? 'Try adjusting your search criteria'
                : 'Expenses will appear here once custodians record them'}
            </Text>
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>EXPENSE DATE</Th>
                  <Th>DESCRIPTION</Th>
                  <Th>CATEGORY</Th>
                  <Th>AMOUNT</Th>
                  <Th>RECORDED BY</Th>
                  <Th>RECORDED AT</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredExpenses.map((expense) => (
                  <Tr key={expense.id} _hover={{ bg: 'gray.50' }}>
                    <Td>
                      <VStack align="flex-start" spacing={0}>
                        <HStack spacing={2}>
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <Text fontSize="sm" color="gray.700" fontWeight="500">
                            {formatDate(expense.expense_date)}
                          </Text>
                        </HStack>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm" color="gray.900" fontWeight="500">
                        {expense.description}
                      </Text>
                    </Td>
                    <Td>
                      {expense.category ? (
                        <Badge colorScheme="blue" fontSize="xs" px={2} py={1} borderRadius="md">
                          {expense.category}
                        </Badge>
                      ) : (
                        <Text fontSize="sm" color="gray.400">
                          N/A
                        </Text>
                      )}
                    </Td>
                    <Td>
                      <Text fontSize="sm" fontWeight="700" color="red.600">
                        {formatCurrency(expense.amount)}
                      </Text>
                    </Td>
                    <Td>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" color="gray.700">
                          {expense.recorded_by_username || 'Unknown'}
                        </Text>
                        {expense.recorded_by_phone && (
                          <Text fontSize="xs" color="gray.500">
                            {expense.recorded_by_phone}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="flex-start" spacing={0}>
                        <Text fontSize="sm" color="gray.700">
                          {formatDateTime(expense.created_at)}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Created
                        </Text>
                      </VStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  );
}
