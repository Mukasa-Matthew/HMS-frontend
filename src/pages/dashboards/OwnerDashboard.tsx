import React, { useMemo } from 'react';
import { LayoutDashboard, Users, BedDouble, DollarSign, LogIn, LogOut, Receipt, BarChart3, Calendar, TrendingDown, User } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { OverviewPage } from '../owner/OverviewPage';
import { StudentsPage } from '../owner/StudentsPage';
import { RoomsPage } from '../owner/RoomsPage';
import { PaymentsPage } from '../owner/PaymentsPage';
import { CheckInPage } from '../owner/CheckInPage';
import { CheckOutPage } from '../owner/CheckOutPage';
import { ReportsPage } from '../owner/ReportsPage';
import { SemestersPage } from '../owner/SemestersPage';
import { ExpensesPage as OwnerExpensesPage } from '../owner/ExpensesPage';
import { ProfilePage } from '../owner/ProfilePage';
import { useFeatureSettings } from '../../hooks/useFeatureSettings';

const allNavItems = [
  { label: 'Dashboard', path: '/owner', icon: <LayoutDashboard className="w-4 h-4" />, feature: null }, // Always visible
  { label: 'Students', path: '/owner/students', icon: <Users className="w-4 h-4" />, feature: 'students' },
  { label: 'Rooms', path: '/owner/rooms', icon: <BedDouble className="w-4 h-4" />, feature: 'rooms' },
  { label: 'Payments', path: '/owner/payments', icon: <DollarSign className="w-4 h-4" />, feature: 'payments' },
  { label: 'Expenses', path: '/owner/expenses', icon: <TrendingDown className="w-4 h-4" />, feature: null }, // Always visible
  { label: 'Check-in', path: '/owner/check-in', icon: <LogIn className="w-4 h-4" />, feature: 'checkin_checkout' },
  { label: 'Check-out', path: '/owner/check-out', icon: <LogOut className="w-4 h-4" />, feature: 'checkin_checkout' },
  { label: 'Reports', path: '/owner/reports', icon: <BarChart3 className="w-4 h-4" />, feature: null }, // Always visible
  { label: 'Semesters', path: '/owner/semesters', icon: <Calendar className="w-4 h-4" />, feature: 'semesters' },
  { label: 'Receipts', path: '/owner/receipts', icon: <Receipt className="w-4 h-4" />, feature: 'receipts' },
  { label: 'Profile', path: '/owner/profile', icon: <User className="w-4 h-4" />, feature: null }, // Always visible
];

export function OwnerDashboard() {
  const { isFeatureEnabled } = useFeatureSettings();

  // Filter nav items based on feature settings
  const navItems = useMemo(() => {
    return allNavItems.filter((item) => {
      // Dashboard and Reports are always visible
      if (!item.feature) return true;
      // Check if feature is enabled
      return isFeatureEnabled(item.feature);
    });
  }, [isFeatureEnabled]);

  return (
    <DashboardLayout
      navItems={navItems}
      title="Hostel Overview"
      subtitle="Manage students, rooms, payments, and monitor your hostel operations."
      userRole="Hostel Owner"
    >
      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="expenses" element={<OwnerExpensesPage />} />
        <Route path="check-in" element={<CheckInPage />} />
        <Route path="check-out" element={<CheckOutPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="semesters" element={<SemestersPage />} />
        <Route path="receipts" element={<div>Receipts Page - Coming Soon</div>} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/owner" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
