import React from 'react';
import { LayoutDashboard, Users, BedDouble, DollarSign, LogIn, LogOut, BarChart3, Calendar, TrendingDown, User } from 'lucide-react';
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
import { ExpensesPage } from '../custodian/ExpensesPage';
import { ProfilePage } from '../owner/ProfilePage';

const navItems = [
  { label: 'Dashboard', path: '/custodian', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Students', path: '/custodian/students', icon: <Users className="w-4 h-4" /> },
  { label: 'Rooms', path: '/custodian/rooms', icon: <BedDouble className="w-4 h-4" /> },
  { label: 'Payments', path: '/custodian/payments', icon: <DollarSign className="w-4 h-4" /> },
  { label: 'Expenses', path: '/custodian/expenses', icon: <TrendingDown className="w-4 h-4" /> },
  { label: 'Check-in', path: '/custodian/check-in', icon: <LogIn className="w-4 h-4" /> },
  { label: 'Check-out', path: '/custodian/check-out', icon: <LogOut className="w-4 h-4" /> },
  { label: 'Reports', path: '/custodian/reports', icon: <BarChart3 className="w-4 h-4" /> },
  { label: 'Semesters', path: '/custodian/semesters', icon: <Calendar className="w-4 h-4" /> },
  { label: 'Profile', path: '/custodian/profile', icon: <User className="w-4 h-4" /> },
];

export function CustodianDashboard() {
  return (
    <DashboardLayout
      navItems={navItems}
      title="Hostel Overview"
      subtitle="Manage students, rooms, payments, and monitor your hostel operations."
      userRole="Custodian"
    >
      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="check-in" element={<CheckInPage />} />
        <Route path="check-out" element={<CheckOutPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="semesters" element={<SemestersPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/custodian" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
