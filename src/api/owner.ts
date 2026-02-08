import { apiClient } from './client';

export interface Student {
  id: number;
  hostel_id: number;
  full_name: string;
  registration_number: string;
  phone: string | null;
  email: string | null;
  access_number?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  gender?: 'male' | 'female' | null;
}

export interface StudentWithDetails extends Student {
  room?: {
    id: number;
    name: string;
  } | null;
  allocation?: {
    id: number;
    room_price_at_allocation: number;
    allocated_at: string;
  } | null;
  paymentSummary?: {
    totalPaid: number;
    totalRequired: number;
    balance: number;
  };
}

export interface Room {
  id: number;
  name: string;
  price: number;
  capacity: number;
  is_active: 0 | 1;
  hostel_id: number;
}

export interface Payment {
  id: number;
  allocation_id: number;
  amount: number;
  recorded_by_user_id: number;
  created_at: string;
}

export interface Allocation {
  id: number;
  hostel_id: number;
  student_id: number;
  room_id: number;
  room_price_at_allocation: number;
  created_at: string;
}

export interface PaymentSummary {
  allocationId: number;
  student: {
    id: number;
    fullName: string;
    registrationNumber: string;
  };
  room: {
    id: number;
    name: string;
  };
  totalRequired: number;
  totalPaid: number;
  balance: number;
}

// Students
export async function fetchStudents(): Promise<Student[]> {
  try {
    const res = await apiClient.get<Student[]>('/students');
    return res.data;
  } catch (error: any) {
    // If 403, owner might not have access yet
    if (error?.response?.status === 403) {
      console.warn('Students endpoint not available for owner yet');
      return [];
    }
    throw error;
  }
}

export async function fetchStudentsWithDetails(): Promise<StudentWithDetails[]> {
  try {
    const res = await apiClient.get<StudentWithDetails[]>('/owner/students/details');
    return res.data;
  } catch (error) {
    // If endpoint doesn't exist, fetch separately and combine
    console.warn('Students details endpoint not available, fetching separately');
    const [students, allocations, rooms, payments] = await Promise.all([
      fetchStudents().catch(() => []),
      fetchAllocations().catch(() => []),
      fetchRooms().catch(() => []),
      fetchPayments({ limit: 1000, offset: 0 }).catch(() => []),
    ]);

    // Combine data
    return students.map((student) => {
      const allocation = allocations.find((a) => a.student_id === student.id);
      const room = allocation ? rooms.find((r) => r.id === allocation.room_id) : null;
      
      // Calculate payment summary
      let totalPaid = 0;
      let totalRequired = 0;
      if (allocation) {
        totalRequired = Number(allocation.room_price_at_allocation);
        const allocationPayments = payments.filter((p) => p.allocation_id === allocation.id);
        totalPaid = allocationPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      }

      return {
        ...student,
        room: room ? { id: room.id, name: room.name } : null,
        allocation: allocation ? {
          id: allocation.id,
          room_price_at_allocation: allocation.room_price_at_allocation,
          allocated_at: allocation.created_at || new Date().toISOString(),
        } : null,
        paymentSummary: {
          totalPaid,
          totalRequired,
          balance: totalRequired - totalPaid,
        },
      };
    });
  }
}

export async function createStudent(payload: {
  fullName: string;
  registrationNumber: string;
  phone?: string;
  email?: string;
  accessNumber?: string;
  address?: string;
  emergencyContact?: string;
  gender?: 'male' | 'female';
}): Promise<void> {
  await apiClient.post('/students', payload);
}

// Rooms
export async function fetchRooms(): Promise<Room[]> {
  try {
    const res = await apiClient.get<Room[]>('/rooms');
    return res.data;
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    if (error?.response?.status === 403) {
      console.warn('Rooms endpoint not available for owner yet');
      return [];
    }
    throw error;
  }
}

export async function createRoom(payload: {
  name: string;
  price: number;
  capacity: number;
  isActive: boolean;
}): Promise<void> {
  await apiClient.post('/rooms', payload);
}

export async function updateRoomPrice(roomId: number, price: number, effectiveDate?: string): Promise<void> {
  try {
    await apiClient.patch(`/rooms/${roomId}`, { price, effectiveDate });
  } catch (error: any) {
    // If endpoint doesn't exist, try PUT instead
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      await apiClient.put(`/rooms/${roomId}`, { price, effectiveDate });
    } else {
      throw error;
    }
  }
}

// Payments
export async function fetchPayments(params?: { limit?: number; offset?: number }): Promise<Payment[]> {
  try {
    const res = await apiClient.get<Payment[]>('/payments', { params });
    return res.data;
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    // Endpoint might not exist yet, return empty array
    if (error?.response?.status === 403 || error?.response?.status === 404) {
      console.warn('Payments endpoint not available:', error?.response?.status);
      return [];
    }
    // For other errors, still return empty array to prevent breaking the UI
    return [];
  }
}

export async function recordPayment(payload: {
  allocationId: number;
  amount: number;
}): Promise<PaymentSummary> {
  try {
    const res = await apiClient.post<PaymentSummary>('/payments', payload);
    return res.data;
  } catch (error: any) {
    // If 403, owner might not have access yet
    if (error?.response?.status === 403) {
      throw new Error('Payment recording not available for owner yet. Backend needs to be updated.');
    }
    throw error;
  }
}

export interface ReceiptData {
  receiptNumber: string;
  hostelName: string;
  hostelContactPhone: string | null;
  studentName: string;
  registrationNumber: string;
  studentPhone: string | null;
  roomNumber: string;
  amountPaid: number;
  totalRequired: number;
  balance: number;
  paymentDate: string;
  paymentId: number;
}

export async function getReceiptData(paymentId: number): Promise<ReceiptData> {
  const res = await apiClient.get<ReceiptData>(`/receipts/${paymentId}`);
  return res.data;
}

export function getReceiptPreviewURL(paymentId: number): string {
  const baseURL = apiClient.defaults.baseURL || 'https://hmsapi.martomor.xyz/api';
  return `${baseURL}/receipts/${paymentId}/preview`;
}

export async function getPaymentSummary(allocationId: number): Promise<PaymentSummary> {
  const res = await apiClient.get<PaymentSummary>(`/payments/summary/${allocationId}`);
  return res.data;
}

// Allocations
export async function fetchAllocations(): Promise<Allocation[]> {
  try {
    const res = await apiClient.get<Allocation[]>('/payments/allocations');
    return res.data;
  } catch (error) {
    // Endpoint might not exist yet, return empty array
    console.warn('Allocations endpoint not available:', error);
    return [];
  }
}

export async function allocateRoom(payload: {
  studentId: number;
  roomId: number;
  displayPrice?: number; // Optional display price (only for custodians when feature enabled)
}): Promise<{ allocationId: number; totalRequired: number; message?: string }> {
  try {
    const res = await apiClient.post<{ allocationId: number; totalRequired: number; message?: string }>('/payments/allocate', payload);
    return res.data;
  } catch (error: any) {
    // If 403, owner might not have access yet - backend needs to be updated
    if (error?.response?.status === 403) {
      throw new Error('Room allocation not available for owner yet. Backend needs to be updated to include HOSTEL_OWNER in authorizeRoles for /api/payments/allocate.');
    }
    throw error;
  }
}

export async function checkOutStudent(allocationId: number): Promise<void> {
  try {
    await apiClient.delete(`/payments/allocations/${allocationId}`);
  } catch (error: any) {
    // If 404, endpoint might not exist yet - backend needs to be created
    if (error?.response?.status === 404) {
      throw new Error('Check-out endpoint not available yet. Backend needs to create DELETE /api/payments/allocations/:allocationId endpoint with HOSTEL_OWNER authorization.');
    }
    // If 403, owner might not have access yet
    if (error?.response?.status === 403) {
      throw new Error('Check-out not available for owner yet. Backend needs to be updated to include HOSTEL_OWNER in authorizeRoles.');
    }
    throw error;
  }
}

// Dashboard Stats
export interface DashboardStats {
  thisSemester: {
    revenue: number;
    startDate?: string;
    endDate?: string;
  };
  occupancy: {
    totalRooms: number;
    occupiedRooms: number;
    availableRooms: number;
    occupancyRate: number;
  };
  students: {
    total: number;
    active: number;
    checkedOut: number;
  };
  outstanding: {
    total: number;
    count: number;
  };
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await apiClient.get<DashboardStats>('/owner/stats');
    return res.data;
  } catch (error) {
    // Endpoint might not exist yet, return default stats
    console.warn('Stats endpoint not available:', error);
    return {
      thisSemester: { revenue: 0 },
      occupancy: { totalRooms: 0, occupiedRooms: 0, availableRooms: 0, occupancyRate: 0 },
      students: { total: 0, active: 0, checkedOut: 0 },
      outstanding: { total: 0, count: 0 },
    };
  }
}

// Semester Management
export interface Semester {
  id: number;
  hostel_id: number;
  name: string;
  start_date: string;
  end_date: string | null;
  is_active: 0 | 1;
  created_at: string;
}

export async function fetchSemesters(): Promise<Semester[]> {
  try {
    const res = await apiClient.get<Semester[]>('/semesters', {
      // Suppress 401 errors from showing in console
      validateStatus: (status) => status < 500
    });
    
    // If we got a 401/403, the interceptor should have handled it, but check anyway
    if (res.status === 401 || res.status === 403) {
      return [];
    }
    
    return res.data || [];
  } catch (error: any) {
    // Handle all errors gracefully - never throw to prevent logout
    const status = error?.response?.status;
    
    // Don't log 401 errors - they're handled by the interceptor
    if (status !== 401) {
      console.warn('Error fetching semesters (status:', status, '):', error?.message || error);
    }
    
    // Always return empty array on error to prevent crashes
    return [];
  }
}

export async function fetchActiveSemester(): Promise<Semester | null> {
  try {
    const res = await apiClient.get<Semester>('/semesters/active', {
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    // If we got a 401/403, the interceptor should have handled it
    if (res.status === 401 || res.status === 403 || res.status === 404) {
      return null;
    }
    
    return res.data || null;
  } catch (error: any) {
    // Handle all errors gracefully - never throw to prevent logout
    // The interceptor should have caught 401/403, but handle any other errors
    return null;
  }
}

export async function createSemester(payload: {
  name: string;
  startDate: string;
  endDate?: string | null;
}): Promise<{ semesterId: number; message: string }> {
  const res = await apiClient.post<{ semesterId: number; message: string }>('/semesters', payload);
  return res.data;
}

export async function activateSemester(semesterId: number): Promise<void> {
  await apiClient.post(`/semesters/${semesterId}/activate`);
}

export async function deactivateSemester(semesterId: number): Promise<void> {
  await apiClient.post(`/semesters/${semesterId}/deactivate`);
}

export async function updateSemester(
  semesterId: number,
  payload: {
    name: string;
    startDate: string;
    endDate?: string | null;
  }
): Promise<void> {
  await apiClient.put(`/semesters/${semesterId}`, payload);
}

export async function deleteSemester(semesterId: number): Promise<void> {
  // Let errors propagate - component will handle them
  // The interceptor will handle token refresh if needed
  await apiClient.delete(`/api/semesters/${semesterId}`);
}

// Profile Management
export interface UserProfile {
  id: number;
  username: string;
  phone: string | null;
  role: string;
  hostel_id: number | null;
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const res = await apiClient.get<UserProfile>('/api/users/me');
  return res.data;
}

export interface UpdateProfileData {
  username?: string;
  phone?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

export async function updateUserProfile(data: UpdateProfileData): Promise<{ message: string; user: UserProfile }> {
  const res = await apiClient.put<{ message: string; user: UserProfile }>('/api/users/me', data);
  return res.data;
}

// Hostel Information
export interface HostelInfo {
  id: number;
  name: string;
  location: string | null;
  contact_phone: string | null;
  is_active: 0 | 1;
  created_at: string;
}

export async function fetchMyHostel(): Promise<HostelInfo | null> {
  try {
    const res = await apiClient.get<HostelInfo[]>('/api/hostels');
    return res.data && res.data.length > 0 ? res.data[0] : null;
  } catch (error) {
    console.error('Error fetching hostel:', error);
    return null;
  }
}

// Check-in/Check-out Management
export interface CheckIn {
  id: number;
  student_id: number;
  hostel_id: number;
  semester_id: number;
  checked_in_at: string;
  checked_out_at: string | null;
  checked_in_by_user_id: number;
  checked_out_by_user_id: number | null;
  full_name?: string;
  registration_number?: string;
}

export async function fetchCheckIns(): Promise<CheckIn[]> {
  try {
    const res = await apiClient.get<CheckIn[]>('/api/check-ins');
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 400 || error?.response?.status === 404) {
      return [];
    }
    console.error('Error fetching check-ins:', error);
    return [];
  }
}

export async function checkInStudent(payload: {
  studentId: number;
  hostelId?: number;
}): Promise<{ checkInId: number; message: string }> {
  const res = await apiClient.post<{ checkInId: number; message: string }>('/api/check-ins', payload);
  return res.data;
}

export async function checkOutStudentFromCheckIn(payload: {
  studentId: number;
  hostelId?: number;
}): Promise<void> {
  await apiClient.post('/api/check-ins/checkout', payload);
}

// Expenses
export interface Expense {
  id: number;
  hostel_id: number;
  semester_id: number | null;
  amount: number;
  description: string;
  category: string | null;
  expense_date: string;
  created_at: string;
  recorded_by_user_id: number;
  recorded_by_username?: string;
  recorded_by_phone?: string;
}

export interface ExpenseStats {
  total: number;
  byCategory: Array<{
    category: string | null;
    total: number;
  }>;
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  limit: number;
  offset: number;
}

export async function createExpense(payload: {
  amount: number;
  description: string;
  category?: string | null;
  expenseDate: string;
  semesterId?: number | null;
  hostelId?: number;
}): Promise<{ expenseId: number; message: string }> {
  const res = await apiClient.post<{ expenseId: number; message: string }>('/api/expenses', payload);
  return res.data;
}

export async function fetchExpenses(params?: {
  limit?: number;
  offset?: number;
  semesterId?: number;
  startDate?: string;
  endDate?: string;
  category?: string;
  hostelId?: number;
}): Promise<ExpenseListResponse> {
  const res = await apiClient.get<ExpenseListResponse>('/api/expenses', { params });
  return res.data;
}

export async function fetchExpenseStats(params?: {
  semesterId?: number;
  startDate?: string;
  endDate?: string;
  hostelId?: number;
}): Promise<ExpenseStats> {
  const res = await apiClient.get<ExpenseStats>('/api/expenses/stats', { params });
  return res.data;
}

// SMS History
export interface SMSHistory {
  id: number;
  student_id: number;
  phone: string;
  message_type: 'REGISTRATION' | 'CHECK_IN' | 'CHECK_OUT';
  message_content: string;
  message_status: 'sent' | 'failed';
  error_message: string | null;
  sent_at: string;
  sent_by_user_id: number | null;
  sent_by_username: string | null;
}

export async function fetchStudentSMSHistory(studentId: number): Promise<SMSHistory[]> {
  const res = await apiClient.get<SMSHistory[]>(`/api/students/${studentId}/sms-history`);
  return res.data;
}