import React from 'react';
import { motion } from 'framer-motion';
import { Box, VStack, Heading, Text, Button, Container } from '@chakra-ui/react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsAndConditionsPage() {
  const navigate = useNavigate();

  return (
    <Box
      position="relative"
      minH="100vh"
      w="100%"
    >
      {/* Fixed background layer */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={0}
        style={{
          backgroundImage:
            'linear-gradient(to bottom right, rgba(15,23,42,0.65), rgba(15,23,42,0.45)), url("https://images.unsplash.com/photo-1596276020587-8044fe049813?w=1600&auto=format&fit=crop&q=80&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8aG9zdGVsc3xlbnwwfHwwfHx8MA%3D%3D")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      />
      
      {/* Fixed decorative overlay */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={1}
        bgGradient="linear(to-br, blue.600/10, transparent, indigo.600/10)"
        pointerEvents="none"
      />
      
      {/* Scrollable content container */}
      <Box
        position="relative"
        zIndex={10}
        minH="100vh"
        py={8}
        px={4}
      >
        <Container maxW="4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            variant="ghost"
            mb={6}
            onClick={() => navigate('/login')}
            colorScheme="green"
            color="white"
            _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
          >
            Back to Login
          </Button>

          <Box
            bg="white"
            borderRadius="xl"
            p={8}
            shadow="2xl"
            borderWidth="1px"
            borderColor="whiteAlpha.300"
            className="backdrop-blur-xl bg-white/98"
          >
            <VStack align="stretch" spacing={6}>
              <Heading size="xl" color="gray.900" mb={2}>
                Terms and Conditions
              </Heading>
              <Text color="gray.600" fontSize="sm">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>

              <Box pt={4}>
                <Heading size="md" color="gray.800" mb={3}>
                  1. Acceptance of Terms
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={4}>
                  By accessing and using the Martmor Hostel Management System, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </Text>
              </Box>

              <Box>
                <Heading size="md" color="gray.800" mb={3}>
                  2. User Accounts and Access
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={2}>
                  Access to the system is restricted to authorized users only:
                </Text>
                <Box as="ul" pl={6} mb={4}>
                  <Text as="li" color="gray.700" lineHeight="tall" mb={1}>
                    <strong>Super Administrators:</strong> Full system access and management capabilities
                  </Text>
                  <Text as="li" color="gray.700" lineHeight="tall" mb={1}>
                    <strong>Hostel Owners:</strong> Access to manage their hostel operations, students, and finances
                  </Text>
                  <Text as="li" color="gray.700" lineHeight="tall">
                    <strong>Custodians:</strong> Access to manage daily operations and record transactions
                  </Text>
                </Box>
                <Text color="gray.700" lineHeight="tall">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </Text>
              </Box>

              <Box>
                <Heading size="md" color="gray.800" mb={3}>
                  3. System Usage
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={2}>
                  You agree to use the system only for lawful purposes and in accordance with these Terms. You agree not to:
                </Text>
                <Box as="ul" pl={6} mb={4}>
                  <Text as="li" color="gray.700" lineHeight="tall" mb={1}>
                    Attempt to gain unauthorized access to any portion of the system
                  </Text>
                  <Text as="li" color="gray.700" lineHeight="tall" mb={1}>
                    Interfere with or disrupt the system or servers connected to the system
                  </Text>
                  <Text as="li" color="gray.700" lineHeight="tall" mb={1}>
                    Use the system to transmit any malicious code, viruses, or harmful data
                  </Text>
                  <Text as="li" color="gray.700" lineHeight="tall">
                    Manipulate or falsify any data or records within the system
                  </Text>
                </Box>
              </Box>

              <Box>
                <Heading size="md" color="gray.800" mb={3}>
                  4. Data Privacy and Security
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={4}>
                  All user activities within the system are logged and audited for security and compliance purposes. Personal and financial data are handled in accordance with applicable data protection laws. You acknowledge that the system stores sensitive information and agree to handle such data responsibly.
                </Text>
              </Box>

              <Box>
                <Heading size="md" color="gray.800" mb={3}>
                  5. Financial Transactions
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={4}>
                  All financial transactions recorded in the system are final and binding. Users are responsible for verifying the accuracy of all transactions they process. The system maintains an audit trail of all financial activities for accountability and transparency.
                </Text>
              </Box>

              <Box>
                <Heading size="md" color="gray.800" mb={3}>
                  6. Intellectual Property
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={4}>
                  The Martmor Hostel Management System, including its design, functionality, and content, is the property of Martmor Hostel and is protected by copyright and other intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the system without explicit written permission.
                </Text>
              </Box>

              <Box>
                <Heading size="md" color="gray.800" mb={3}>
                  7. Limitation of Liability
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={4}>
                  Martmor Hostel shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the system. While we strive to ensure system availability and data accuracy, we do not guarantee uninterrupted access or error-free operation.
                </Text>
              </Box>

              <Box>
                <Heading size="md" color="gray.800" mb={3}>
                  8. Account Termination
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={4}>
                  We reserve the right to suspend or terminate your account at any time for violation of these Terms, unauthorized access attempts, or any activity that compromises system security or integrity.
                </Text>
              </Box>

              <Box>
                <Heading size="md" color="gray.800" mb={3}>
                  9. Changes to Terms
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={4}>
                  We reserve the right to modify these Terms at any time. Continued use of the system after such modifications constitutes acceptance of the updated Terms. Users will be notified of significant changes.
                </Text>
              </Box>

              <Box>
                <Heading size="md" color="gray.800" mb={3}>
                  10. Contact Information
                </Heading>
                <Text color="gray.700" lineHeight="tall" mb={4}>
                  For questions or concerns regarding these Terms and Conditions, please contact the system administrator or Martmor Hostel management.
                </Text>
              </Box>

              <Box pt={4} borderTopWidth="1px" borderColor="gray.200">
                <Text color="gray.600" fontSize="sm" textAlign="center" mb={3}>
                  By using the Martmor Hostel Management System, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                </Text>
                <Text color="gray.500" fontSize="xs" textAlign="center" fontWeight="medium">
                  ©2026, a product of <Text as="span" fontWeight="bold">MARTMOR TECHNOLOGIES</Text>
                </Text>
              </Box>
            </VStack>
          </Box>
        </motion.div>
      </Container>
      </Box>
    </Box>
  );
}
