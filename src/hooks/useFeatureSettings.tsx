import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { fetchMyHostelFeatureSettings, MyHostelFeatureSettings } from '../api/admin';
import { useAuth } from './useAuth';

interface FeatureSettingsContextValue {
  features: Map<string, boolean>;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  isFeatureEnabled: (featureName: string) => boolean;
}

const FeatureSettingsContext = createContext<FeatureSettingsContextValue | undefined>(undefined);

export function FeatureSettingsProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [features, setFeatures] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  // Only fetch for HOSTEL_OWNER and CUSTODIAN
  const shouldFetchSettings = user && (user.role === 'HOSTEL_OWNER' || user.role === 'CUSTODIAN');

  const refreshSettings = useCallback(async () => {
    if (authLoading || !shouldFetchSettings || !user) {
      setFeatures(new Map());
      return;
    }

    try {
      const settings = await fetchMyHostelFeatureSettings();
      const featuresMap = new Map<string, boolean>();
      settings.features.forEach((f) => {
        featuresMap.set(f.featureName, f.enabled);
      });
      setFeatures(featuresMap);
    } catch (error: any) {
      console.error('Error fetching feature settings:', error);
      // On error, default to all features enabled
      const defaultFeatures = ['students', 'rooms', 'payments', 'checkin_checkout', 'semesters', 'receipts'];
      const featuresMap = new Map<string, boolean>();
      defaultFeatures.forEach((f) => featuresMap.set(f, true));
      setFeatures(featuresMap);
    }
  }, [shouldFetchSettings, user, authLoading]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user || (user.role !== 'HOSTEL_OWNER' && user.role !== 'CUSTODIAN')) {
      setLoading(false);
      setFeatures(new Map());
      return;
    }

    const loadSettings = async () => {
      setLoading(true);
      await refreshSettings();
      setLoading(false);
    };

    loadSettings();
  }, [user?.id, user?.role, authLoading, refreshSettings]);

  const isFeatureEnabled = useCallback(
    (featureName: string): boolean => {
      // Super Admin always has access (but they shouldn't use this hook)
      if (!user || (user.role !== 'HOSTEL_OWNER' && user.role !== 'CUSTODIAN')) {
        return true;
      }

      // Custodians always have access (backend enforces this, but we check here too)
      if (user.role === 'CUSTODIAN') {
        return true;
      }

      // For owners, check the feature map (defaults to true if not set)
      return features.get(featureName) ?? true;
    },
    [features, user],
  );

  return (
    <FeatureSettingsContext.Provider
      value={{
        features,
        loading,
        refreshSettings,
        isFeatureEnabled,
      }}
    >
      {children}
    </FeatureSettingsContext.Provider>
  );
}

export function useFeatureSettings(): FeatureSettingsContextValue {
  const context = useContext(FeatureSettingsContext);
  if (context === undefined) {
    // If not in provider, return default (all features enabled)
    return {
      features: new Map(),
      loading: false,
      refreshSettings: async () => {},
      isFeatureEnabled: () => true,
    };
  }
  return context;
}
