import React from 'react';
import { LayoutDashboard, Building, Users, BedDouble, ScrollText } from 'lucide-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { OverviewPage } from '../super-admin/OverviewPage';
import { HostelsPage } from '../super-admin/HostelsPage';
import { UsersPage } from '../super-admin/UsersPage';
import { RoomsPage } from '../super-admin/RoomsPage';
import { AuditPage } from '../super-admin/AuditPage';
import { FeatureSettingsPage } from '../super-admin/FeatureSettingsPage';

const navItems = [
  { label: 'Dashboard', path: '/super-admin', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Hostels', path: '/super-admin/hostels', icon: <Building className="w-4 h-4" /> },
  { label: 'Users', path: '/super-admin/users', icon: <Users className="w-4 h-4" /> },
  { label: 'Rooms', path: '/super-admin/rooms', icon: <BedDouble className="w-4 h-4" /> },
  { label: 'Audit Logs', path: '/super-admin/audit', icon: <ScrollText className="w-4 h-4" /> },
];

export function SuperAdminDashboard() {
  return (
    <DashboardLayout
      navItems={navItems}
      title="Welcome back! Your comprehensive hostel management system."
      subtitle="Configure hostels, owners, custodians, rooms, and monitor activity."
      userRole="Super Admin"
    >
      <Routes>
        <Route index element={<OverviewPage />} />
        <Route path="hostels" element={<HostelsPage />} />
        <Route path="hostels/:hostelId/features" element={<FeatureSettingsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="*" element={<Navigate to="/super-admin" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
