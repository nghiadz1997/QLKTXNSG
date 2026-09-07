import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/guards/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { Toaster } from 'sonner';

// Auth & Public Pages
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterDormPublicPage } from './pages/auth/RegisterDormPublicPage';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';
import { MyRoomPage } from './pages/student/MyRoomPage';
import { StudentUtilitiesPage } from './pages/student/StudentUtilitiesPage';
import { StudentInvoicesPage } from './pages/student/StudentInvoicesPage';
import { StudentSupportPage } from './pages/student/StudentSupportPage';
import { StudentCommunityPage } from './pages/student/StudentCommunityPage';
import { StudentNotificationsPage } from './pages/student/StudentNotificationsPage';

// Manager Pages
import { ManagerDashboardPage } from './pages/manager/ManagerDashboardPage';
import { StudentManagementPage } from './pages/manager/StudentManagementPage';
import { RoomManagementPage } from './pages/manager/RoomManagementPage';
import { DormRegistrationPage } from './pages/manager/DormRegistrationPage';
import { ElectricityManagementPage } from './pages/manager/ElectricityManagementPage';
import { WaterManagementPage } from './pages/manager/WaterManagementPage';
import { InvoiceManagementPage } from './pages/manager/InvoiceManagementPage';
import { PaymentApprovalPage } from './pages/manager/PaymentApprovalPage';
import { SupportManagementPage } from './pages/manager/SupportManagementPage';
import { AnnouncementsManagementPage } from './pages/manager/AnnouncementsManagementPage';
import { CommunityModerationPage } from './pages/manager/CommunityModerationPage';
import { ManagerReportsPage } from './pages/manager/ManagerReportsPage';

// Super Admin Pages
import { AdminDashboardPage } from './pages/superadmin/AdminDashboardPage';
import { UserRoleManagementPage } from './pages/superadmin/UserRoleManagementPage';
import { BuildingManagementPage } from './pages/superadmin/BuildingManagementPage';
import { PricingManagementPage } from './pages/superadmin/PricingManagementPage';
import { SemesterManagementPage } from './pages/superadmin/SemesterManagementPage';
import { AuditLogsPage } from './pages/superadmin/AuditLogsPage';
import { SystemSettingsPage } from './pages/superadmin/SystemSettingsPage';

// Root redirect handler based on current user role
const RootRedirect: React.FC = () => {
  const { role, loading } = useAuth();
  if (loading) return null;
  if (role === 'superAdmin') return <Navigate to="/admin" replace />;
  if (role === 'manager' || role === 'truongPhong') return <Navigate to="/manager" replace />;
  if (role === 'student') return <Navigate to="/student" replace />;
  return <Navigate to="/login" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-dorm" element={<RegisterDormPublicPage />} />

          {/* Student Routes */}
          <Route
            path="/student"
            element={
              <ProtectedRoute allowedRoles={['student', 'manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <StudentDashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={['student', 'manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <StudentProfilePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/room"
            element={
              <ProtectedRoute allowedRoles={['student', 'manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <MyRoomPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/utilities"
            element={
              <ProtectedRoute allowedRoles={['student', 'manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <StudentUtilitiesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/invoices"
            element={
              <ProtectedRoute allowedRoles={['student', 'manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <StudentInvoicesPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/support"
            element={
              <ProtectedRoute allowedRoles={['student', 'manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <StudentSupportPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/community"
            element={
              <ProtectedRoute allowedRoles={['student', 'manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <StudentCommunityPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute allowedRoles={['student', 'manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <StudentNotificationsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Manager Routes */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <ManagerDashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/students"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <StudentManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/rooms"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <RoomManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/registrations"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <DormRegistrationPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/electricity"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <ElectricityManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/water"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <WaterManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/invoices"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <InvoiceManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/payments"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <PaymentApprovalPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/support"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <SupportManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/announcements"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <AnnouncementsManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/community"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <CommunityModerationPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <ManagerReportsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['manager', 'truongPhong', 'superAdmin']}>
                <MainLayout>
                  <AuditLogsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Super Admin Exclusive Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['superAdmin']}>
                <MainLayout>
                  <AdminDashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['superAdmin']}>
                <MainLayout>
                  <UserRoleManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/buildings"
            element={
              <ProtectedRoute allowedRoles={['superAdmin']}>
                <MainLayout>
                  <BuildingManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pricing"
            element={
              <ProtectedRoute allowedRoles={['superAdmin']}>
                <MainLayout>
                  <PricingManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/semesters"
            element={
              <ProtectedRoute allowedRoles={['superAdmin']}>
                <MainLayout>
                  <SemesterManagementPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['superAdmin']}>
                <MainLayout>
                  <AuditLogsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['superAdmin']}>
                <MainLayout>
                  <SystemSettingsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
