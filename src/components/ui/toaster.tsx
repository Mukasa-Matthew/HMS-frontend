import { useToast as useChakraToast } from '@chakra-ui/react';
import { useCallback } from 'react';

export function Toaster() {
  // Chakra renders its own portal; nothing needed here.
  return null;
}

export function useToast() {
  const chakraToast = useChakraToast();

  const toast = useCallback(
    (opts: { title?: string; description?: string; status?: 'info' | 'success' | 'error' }) => {
      chakraToast({
        title: opts.title,
        description: opts.description,
        status: opts.status ?? 'info',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
    },
    [chakraToast],
  );

  return { toast };
}

