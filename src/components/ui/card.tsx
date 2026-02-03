import { Box, BoxProps, Flex, Heading, HStack, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const MotionBox = motion.create(Box);

interface CardProps extends BoxProps {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ children, hover = false, ...props }: CardProps) {
  const baseProps = {
    bg: 'white',
    borderRadius: 'xl',
    border: '1px solid',
    borderColor: 'gray.200',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    ...props,
  };

  if (hover) {
    return (
      <MotionBox
        {...baseProps}
        whileHover={{ 
          y: -4, 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          scale: 1.01,
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {children}
      </MotionBox>
    );
  }

  return <Box {...baseProps}>{children}</Box>;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: ReactNode;
  color?: string;
}

export function MetricCard({ label, value, subtitle, trend, icon, color = 'brand.600' }: MetricCardProps) {
  return (
    <Card hover>
      <Box 
        p={6}
        position="relative"
        bg="white"
        _hover={{
          bg: 'gradient-to-br from-white to-gray.50',
        }}
      >
        <Flex align="flex-start" justify="space-between" mb={3}>
          <Box flex="1">
            <Text 
              fontSize="xs" 
              fontWeight="700" 
              color="gray.500" 
              letterSpacing="0.5px" 
              mb={2} 
              textTransform="uppercase"
            >
              {label}
            </Text>
            <HStack align="baseline" spacing={3} mb={1}>
              <Heading 
                size="2xl" 
                color="gray.900"
                fontWeight="800" 
                letterSpacing="-1.5px"
              >
                {value}
              </Heading>
              {icon && (
                <Box 
                  color={color} 
                  mt={1}
                  p={2}
                  borderRadius="lg"
                  bg={`${color.replace('.600', '.50')}`}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {icon}
                </Box>
              )}
            </HStack>
            {subtitle && (
              <Text fontSize="sm" color="gray.600" mt={1} fontWeight="500">
                {subtitle}
              </Text>
            )}
          </Box>
        </Flex>
        {trend && (
          <HStack 
            spacing={2} 
            mt={4} 
            pt={4} 
            borderTop="1px solid" 
            borderColor="gray.100"
            position="relative"
            zIndex={1}
          >
            <Box
              p={1.5}
              borderRadius="md"
              bg={trend.isPositive ? 'green.50' : 'red.50'}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4 text-green-600" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-600" />
              )}
            </Box>
            <Text
              fontSize="xs"
              fontWeight="700"
              color={trend.isPositive ? 'green.600' : 'red.600'}
              letterSpacing="0.3px"
            >
              {Math.abs(trend.value).toFixed(1)}% vs last period
            </Text>
          </HStack>
        )}
      </Box>
    </Card>
  );
}
