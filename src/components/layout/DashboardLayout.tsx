import { Box, Flex, Heading, HStack, Text, VStack, IconButton, Tooltip, Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent, DrawerCloseButton, useDisclosure, Avatar, Menu, MenuButton, MenuList, MenuItem, Badge, Button } from '@chakra-ui/react';
import { User, ChevronLeft, ChevronRight, LogOut, Menu as MenuIcon, Bell, Calendar, Settings } from 'lucide-react';
import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useSemester } from '../../hooks/useSemester';
import { useHostel } from '../../hooks/useHostel';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
  subtitle: string;
  userRole: string;
}

// Create motion component for Chakra Box - using forwardRef pattern for v11 compatibility
const MotionBox = motion.create(Box);

export function DashboardLayout({ children, navItems, title, subtitle, userRole }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { activeSemester, loading: semesterLoading } = useSemester();
  const { hostel, loading: hostelLoading } = useHostel();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (path: string) => {
    if (path === '/super-admin' || path === '/owner' || path === '/custodian') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (path: string) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
      <Box
        as="nav"
        w="full"
        h="full"
        bg="white"
        display="flex"
        flexDirection="column"
        borderRight="1px solid"
        borderColor="gray.200"
        boxShadow="2px 0 8px rgba(0, 0, 0, 0.04)"
        className="hms-sidebar"
      >
      {/* Logo Section */}
      <Box px={4} py={6} borderBottom="1px solid" borderColor="gray.100">
        <Flex align="center" justify="space-between">
          <HStack spacing={3}>
            <Box
              w={sidebarCollapsed && !isMobile ? 10 : 16}
              h={sidebarCollapsed && !isMobile ? 10 : 16}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              borderRadius="lg"
              overflow="hidden"
              bg="white"
              p={sidebarCollapsed && !isMobile ? 1 : 2}
              borderWidth="1px"
              borderColor="gray.100"
              boxShadow="sm"
            >
              <img 
                src="/WhatsApp Image 2026-02-01 at 1.11.06 PM (1).jpeg" 
                alt="HMS Logo" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </Box>
            {(!sidebarCollapsed || isMobile) && (
              <VStack align="flex-start" spacing={0}>
                <Heading size="md" color="gray.900" fontWeight="700" letterSpacing="-0.5px">
                  HMS
                </Heading>
                {(userRole === 'Hostel Owner' || userRole === 'Custodian') && hostel && (
                  <Text fontSize="xs" color="green.600" fontWeight="600" mt={-1}>
                    {hostel.name}
                  </Text>
                )}
              </VStack>
            )}
          </HStack>
          {!isMobile && (
            <Tooltip label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
              <IconButton
                aria-label="Toggle sidebar"
                size="xs"
                variant="ghost"
                icon={sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                onClick={() => setSidebarCollapsed((v) => !v)}
                color="gray.500"
                _hover={{ bg: 'gray.50', color: 'gray.700' }}
              />
            </Tooltip>
          )}
          {isMobile && onClose && <DrawerCloseButton />}
        </Flex>
      </Box>

      {/* Navigation Menu */}
      <Box flex="1" p={3} overflowY="auto">
        <VStack align="stretch" spacing={1}>
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <MotionBox
                key={item.path}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
              >
                <Box
                  as="button"
                  w="full"
                  px={3}
                  py={2.5}
                  borderRadius="lg"
                  bg={active ? 'brand.50' : 'transparent'}
                  color={active ? 'brand.700' : 'gray.700'}
                  fontWeight={active ? '700' : '500'}
                  fontSize="sm"
                  display="flex"
                  alignItems="center"
                  gap={3}
                  onClick={() => handleNavClick(item.path)}
                  _hover={{
                    bg: active ? 'brand.50' : 'gray.50',
                    color: active ? 'brand.700' : 'brand.600',
                    transform: 'translateX(2px)',
                  }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  position="relative"
                >
                  {active && (
                    <Box
                      position="absolute"
                      left={0}
                      top="50%"
                      transform="translateY(-50%)"
                      w="4px"
                      h="70%"
                      bg="brand.600"
                      borderRadius="0 4px 4px 0"
                    />
                  )}
                  <Box
                    color={active ? 'brand.600' : 'gray.500'}
                    _groupHover={{ color: 'brand.600' }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w={5}
                    h={5}
                    transition="all 0.2s"
                    transform={active ? 'scale(1.1)' : 'scale(1)'}
                  >
                    {item.icon}
                  </Box>
                  {(!sidebarCollapsed || isMobile) && (
                    <Text flex="1" textAlign="left">
                      {item.label}
                    </Text>
                  )}
                </Box>
              </MotionBox>
            );
          })}
        </VStack>
      </Box>

      {/* User Profile at Bottom */}
      {(!sidebarCollapsed || isMobile) && (
        <Box p={4} borderTop="1px solid" borderColor="gray.100" bg="gray.50">
          <HStack spacing={3} mb={3}>
            <Avatar
              size="sm"
              bg="brand.500"
              name={user?.username || 'User'}
              color="white"
              fontWeight="600"
            />
            <Box flex="1" minW={0}>
              <Text fontSize="sm" fontWeight="600" color="gray.900" isTruncated>
                {user?.username || 'User'}
              </Text>
              <Text fontSize="xs" color="gray.500" isTruncated>
                {userRole}
              </Text>
            </Box>
          </HStack>
          {/* Logout Button */}
          <Button
            w="full"
            size="sm"
            colorScheme="red"
            variant="outline"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={handleLogout}
            fontWeight="semibold"
            _hover={{
              bg: 'red.50',
              borderColor: 'red.300',
              color: 'red.700'
            }}
          >
            Logout
          </Button>
        </Box>
      )}
      {/* Logout Button for Collapsed Sidebar */}
      {sidebarCollapsed && !isMobile && (
        <Box p={3} borderTop="1px solid" borderColor="gray.100">
          <Tooltip label="Logout" placement="right">
            <IconButton
              aria-label="Logout"
              icon={<LogOut className="w-5 h-5" />}
              colorScheme="red"
              variant="outline"
              w="full"
              onClick={handleLogout}
              _hover={{
                bg: 'red.50',
                borderColor: 'red.300',
                color: 'red.700'
              }}
            />
          </Tooltip>
        </Box>
      )}
      
    </Box>
  );

  return (
    <Box minH="100vh" bg="gray.50" color="gray.900" w="100%" maxW="100%" overflowX="hidden">
      <Flex w="100%" maxW="100%">
        {/* Desktop Sidebar */}
        <Box
          as="nav"
          w={{ base: '0', md: sidebarCollapsed ? '80px' : '260px' }}
          bg="white"
          h="100vh"
          position="fixed"
          top={0}
          left={0}
          display={{ base: 'none', md: 'flex' }}
          flexDirection="column"
          transition="width 0.3s ease"
          boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.05)"
          zIndex={10}
          overflowY="auto"
        >
          <SidebarContent />
        </Box>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose} size="xs">
          <DrawerOverlay bg="blackAlpha.300" backdropFilter="blur(4px)" />
          <DrawerContent maxW="280px">
            <DrawerHeader px={4} py={4} borderBottom="1px solid" borderColor="gray.100">
              <Flex justify="flex-end">
                <DrawerCloseButton />
              </Flex>
            </DrawerHeader>
            <DrawerBody p={0}>
              <SidebarContent onClose={onClose} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main Content Area */}
        <Box 
          flex="1" 
          bg="#fafbfc" 
          minW={0}
          w="100%"
          maxW="100%"
          display="flex" 
          flexDirection="column"
          ml={{ base: 0, md: sidebarCollapsed ? '80px' : '260px' }}
          transition="margin-left 0.3s ease"
          overflowX="hidden"
        >
          {/* Top Header */}
          <Box
            bg="white"
            borderBottom="1px solid"
            borderColor="gray.200"
            px={{ base: 4, md: 8 }}
            py={{ base: 4, md: 5 }}
            position="sticky"
            top={0}
            zIndex={5}
            boxShadow="0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
            bg="white"
          >
            <Flex justify="space-between" align="center" gap={4}>
              <Flex align="center" gap={4} flex="1" minW={0}>
                {isMobile && (
                  <IconButton
                    aria-label="Open menu"
                    icon={<MenuIcon className="w-5 h-5" />}
                    variant="ghost"
                    onClick={onOpen}
                    color="gray.600"
                    _hover={{ bg: 'gray.50' }}
                  />
                )}
                <Box flex="1" minW={0}>
                  <Heading
                    size={{ base: 'md', md: 'lg' }}
                    color="gray.900"
                    fontWeight="700"
                    mb={1.5}
                    isTruncated
                    letterSpacing="-0.3px"
                  >
                    {(userRole === 'Hostel Owner' || userRole === 'Custodian') && hostel ? (
                      <>
                        <Text as="span" color="green.600">{hostel.name}</Text>
                        <Text as="span" color="gray.900"> Overview</Text>
                      </>
                    ) : (
                      title
                    )}
                  </Heading>
                  {(userRole === 'Hostel Owner' || userRole === 'Custodian') && activeSemester ? (
                    <Text
                      fontSize={{ base: 'sm', md: 'md' }}
                      color="gray.700"
                      fontWeight="500"
                      isTruncated
                    >
                      Current Semester: <Text as="span" fontWeight="700" color="gray.900">{activeSemester.name}</Text>
                    </Text>
                  ) : (
                    <Text
                      fontSize={{ base: 'xs', md: 'sm' }}
                      color="gray.500"
                      isTruncated
                    >
                      {subtitle}
                    </Text>
                  )}
                </Box>
              </Flex>
              <HStack spacing={3}>
                {/* Semester Selector - Show for Owner and Custodian */}
                {(userRole === 'Hostel Owner' || userRole === 'Custodian') && (
                  <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                    {semesterLoading ? (
                      <Text fontSize="sm" color="gray.400">Loading...</Text>
                    ) : activeSemester ? (
                      <Tooltip label={`Active Semester: ${activeSemester.name}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Calendar className="w-4 h-4" />}
                          onClick={() => navigate(userRole === 'Hostel Owner' ? '/owner/semesters' : '/custodian/semesters')}
                          colorScheme="blue"
                        >
                          <Text fontSize="sm" fontWeight="500" isTruncated maxW="150px">
                            {activeSemester.name}
                          </Text>
                          <Badge ml={2} colorScheme="green" fontSize="xs">
                            Active
                          </Badge>
                        </Button>
                      </Tooltip>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Calendar className="w-4 h-4" />}
                        onClick={() => navigate(userRole === 'Hostel Owner' ? '/owner/semesters' : '/custodian/semesters')}
                        colorScheme="orange"
                      >
                        No Active Semester
                      </Button>
                    )}
                  </HStack>
                )}
                <Tooltip label="Notifications">
                  <IconButton
                    aria-label="Notifications"
                    icon={<Bell className="w-5 h-5" />}
                    variant="ghost"
                    color="gray.600"
                    _hover={{ bg: 'gray.50', color: 'gray.900' }}
                    size="sm"
                  />
                </Tooltip>
                {/* Logout Button - Prominently Visible */}
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  leftIcon={<LogOut className="w-4 h-4" />}
                  onClick={handleLogout}
                  fontWeight="semibold"
                  _hover={{
                    bg: 'red.50',
                    borderColor: 'red.300',
                    color: 'red.700'
                  }}
                  display={{ base: 'none', md: 'flex' }}
                >
                  Logout
                </Button>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    aria-label="User menu"
                    icon={<User className="w-5 h-5" />}
                    variant="ghost"
                    color="gray.600"
                    _hover={{ bg: 'gray.50', color: 'gray.900' }}
                    size="sm"
                  />
                  <MenuList>
                    {(userRole === 'Hostel Owner' || userRole === 'Custodian') && (
                      <MenuItem 
                        icon={<Settings className="w-4 h-4" />} 
                        onClick={() => navigate(userRole === 'Hostel Owner' ? '/owner/semesters' : '/custodian/semesters')}
                      >
                        Manage Semesters
                      </MenuItem>
                    )}
                    {/* Logout also available in menu for mobile */}
                    <MenuItem 
                      icon={<LogOut className="w-4 h-4" />} 
                      onClick={handleLogout}
                      display={{ base: 'flex', md: 'none' }}
                    >
                      Logout
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
          </Box>

          {/* Main Content */}
          <Box 
            flex="1" 
            w="100%" 
            maxW="100%"
            px={{ base: 4, md: 8 }} 
            py={{ base: 5, md: 6 }} 
            overflowX="hidden"
          >
            {children}
          </Box>
        </Box>
        
      </Flex>
    </Box>
  );
}
