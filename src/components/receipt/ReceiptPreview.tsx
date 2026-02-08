import React, { useEffect, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  HStack,
  VStack,
  Spinner,
  Box,
  Alert,
  AlertIcon,
  Text,
} from '@chakra-ui/react';
import { Download, Printer, FileText } from 'lucide-react';
import { getReceiptData, getReceiptPreviewURL, ReceiptData } from '../../api/owner';
import { useToast } from '../ui/toaster';

interface ReceiptPreviewProps {
  paymentId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptPreview({ paymentId, isOpen, onClose }: ReceiptPreviewProps) {
  const { toast } = useToast();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (isOpen && paymentId) {
      loadReceipt();
    } else {
      setReceiptData(null);
      setError(null);
    }
  }, [isOpen, paymentId]);

  const loadReceipt = async () => {
    if (!paymentId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await getReceiptData(paymentId);
      setReceiptData(data);
      // Force iframe reload
      setIframeKey(prev => prev + 1);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load receipt');
      toast({
        title: 'Error',
        description: 'Failed to load receipt data',
        status: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!paymentId) return;
    const previewURL = getReceiptPreviewURL(paymentId);
    const printWindow = window.open(previewURL, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownload = () => {
    if (!paymentId) return;
    const previewURL = getReceiptPreviewURL(paymentId);
    
    // Open in new window and trigger print dialog (user can save as PDF)
    const downloadWindow = window.open(previewURL, '_blank');
    if (downloadWindow) {
      downloadWindow.onload = () => {
        // Small delay to ensure content is loaded
        setTimeout(() => {
          downloadWindow.print();
        }, 500);
      };
    }
  };

  if (!paymentId) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
      <ModalOverlay bg="blackAlpha.700" />
      <ModalContent maxW="6xl" h="90vh" m={4}>
        <ModalHeader>
          <HStack spacing={3}>
            <FileText className="w-5 h-5" />
            <Box>
              <Text fontSize="lg" fontWeight="700">
                Payment Receipt
              </Text>
              {receiptData && (
                <Text fontSize="sm" color="gray.500" fontWeight="normal">
                  {receiptData.receiptNumber}
                </Text>
              )}
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0} display="flex" flexDirection="column">
          {loading ? (
            <Box flex="1" display="flex" alignItems="center" justifyContent="center">
              <VStack spacing={4}>
                <Spinner size="xl" thickness="4px" speed="0.65s" color="brand.500" />
                <Text color="gray.600">Loading receipt...</Text>
              </VStack>
            </Box>
          ) : error ? (
            <Box p={6}>
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            </Box>
          ) : (
            <>
              <Box flex="1" overflow="auto" bg="gray.50">
                <iframe
                  key={iframeKey}
                  src={getReceiptPreviewURL(paymentId)}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    minHeight: '600px',
                  }}
                  title="Receipt Preview"
                />
              </Box>
              <Box p={4} borderTop="1px solid" borderColor="gray.200" bg="white">
                <HStack spacing={3} justify="flex-end">
                  <Button
                    leftIcon={<Printer className="w-4 h-4" />}
                    variant="outline"
                    onClick={handlePrint}
                  >
                    Print
                  </Button>
                  <Button
                    leftIcon={<Download className="w-4 h-4" />}
                    colorScheme="brand"
                    onClick={handleDownload}
                  >
                    Download PDF
                  </Button>
                </HStack>
              </Box>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
