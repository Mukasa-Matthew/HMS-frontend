import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { HostelInfo, fetchMyHostel } from '../api/owner';
import { useAuth } from './useAuth';

interface HostelContextValue {
  hostel: HostelInfo | null;
  loading: boolean;
  refreshHostel: () => Promise<void>;
}

const HostelContext = createContext<HostelContextValue | undefined>(undefined);

export function HostelProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [hostel, setHostel] = useState<HostelInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Only fetch hostel data for users who have a hostel (HOSTEL_OWNER and CUSTODIAN)
  const shouldFetchHostel = user && (user.role === 'HOSTEL_OWNER' || user.role === 'CUSTODIAN') && user.hostelId;

  const refreshHostel = useCallback(async () => {
    if (authLoading || !shouldFetchHostel || !user) {
      setHostel(null);
      setLoading(false);
      return;
    }
    try {
      const hostelData = await fetchMyHostel();
      setHostel(hostelData);
    } catch (error) {
      console.error('Error fetching hostel:', error);
      setHostel(null);
    } finally {
      setLoading(false);
    }
  }, [shouldFetchHostel, user, authLoading]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || (user.role !== 'HOSTEL_OWNER' && user.role !== 'CUSTODIAN') || !user.hostelId) {
      setLoading(false);
      setHostel(null);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;
      setLoading(true);
      await refreshHostel();
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role, user?.hostelId, authLoading, refreshHostel]);

  return (
    <HostelContext.Provider
      value={{
        hostel,
        loading,
        refreshHostel,
      }}
    >
      {children}
    </HostelContext.Provider>
  );
}

export function useHostel() {
  const context = useContext(HostelContext);
  if (context === undefined) {
    throw new Error('useHostel must be used within a HostelProvider');
  }
  return context;
}
