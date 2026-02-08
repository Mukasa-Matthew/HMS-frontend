import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Semester, fetchActiveSemester, fetchSemesters } from '../api/owner';
import { useToast } from '../components/ui/toaster';
import { useAuth } from './useAuth';

interface SemesterContextValue {
  activeSemester: Semester | null;
  allSemesters: Semester[];
  loading: boolean;
  refreshSemester: () => Promise<void>;
  refreshAllSemesters: () => Promise<void>;
}

const SemesterContext = createContext<SemesterContextValue | undefined>(undefined);

export function SemesterProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);
  const [allSemesters, setAllSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  // Only fetch semester data for users who need it (HOSTEL_OWNER and CUSTODIAN)
  const shouldFetchSemesters = user && (user.role === 'HOSTEL_OWNER' || user.role === 'CUSTODIAN');

  const refreshSemester = useCallback(async () => {
    // Don't fetch if auth is still loading or user doesn't exist
    if (authLoading || !shouldFetchSemesters || !user) {
      setActiveSemester(null);
      return;
    }
    try {
      const semester = await fetchActiveSemester();
      setActiveSemester(semester);
    } catch (error: any) {
      // All errors are handled in fetchActiveSemester - it returns null on error
      setActiveSemester(null);
    }
  }, [shouldFetchSemesters, user, authLoading]);

  const refreshAllSemesters = useCallback(async () => {
    // Don't fetch if auth is still loading or user doesn't exist
    if (authLoading || !shouldFetchSemesters || !user) {
      setAllSemesters([]);
      return;
    }
    try {
      const semesters = await fetchSemesters();
      const semesterArray = Array.isArray(semesters) ? semesters : [];
      setAllSemesters(semesterArray);
    } catch (error: any) {
      // All errors are handled in fetchSemesters - it returns [] on error
      console.error('Error in refreshAllSemesters:', error);
      setAllSemesters([]);
      // Don't show toast for expected errors (400/404/401/403) - these are handled gracefully
      const status = error?.response?.status;
      if (status && status !== 400 && status !== 404 && status !== 401 && status !== 403) {
        // Only show error for unexpected server errors (500, etc.)
        toast({ title: 'Error', description: 'Failed to load semesters. Please try again.', status: 'error' });
      }
    }
  }, [shouldFetchSemesters, user, authLoading, toast]);

  useEffect(() => {
    // Wait for auth to finish loading before attempting to fetch
    if (authLoading) {
      return;
    }

    // Only load data if user is authenticated and has the right role
    if (!user || (user.role !== 'HOSTEL_OWNER' && user.role !== 'CUSTODIAN')) {
      setLoading(false);
      setActiveSemester(null);
      setAllSemesters([]);
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      if (!isMounted) return;

      // Add a small delay to ensure token is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isMounted) return;

      setLoading(true);
      try {
        // Load data in parallel
        const [semesterResult, semestersResult] = await Promise.allSettled([
          refreshSemester(),
          refreshAllSemesters()
        ]);

        if (!isMounted) return;

        // Silently handle errors - they're already handled in the functions
        if (semesterResult.status === 'rejected') {
          // Error already handled in fetchActiveSemester
        }
        if (semestersResult.status === 'rejected') {
          // Error already handled in fetchSemesters
        }
      } catch (error) {
        // Silently handle - errors are already handled in the functions
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    // Load data with a small delay to ensure auth is ready
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.role, authLoading, refreshSemester, refreshAllSemesters]); // Include callbacks

  return (
    <SemesterContext.Provider
      value={{
        activeSemester,
        allSemesters,
        loading,
        refreshSemester,
        refreshAllSemesters,
      }}
    >
      {children}
    </SemesterContext.Provider>
  );
}

export function useSemester() {
  const context = useContext(SemesterContext);
  if (context === undefined) {
    throw new Error('useSemester must be used within a SemesterProvider');
  }
  return context;
}
