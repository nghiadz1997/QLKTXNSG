import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  User,
  Building2,
  Zap,
  Droplets,
  CreditCard,
  Wrench,
  MessageSquare,
  Bell,
  BarChart3,
  ClipboardList,
  Users,
  ShieldAlert,
  Settings,
  Calendar,
  Layers,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { EditProfileModal } from '../components/common/EditProfileModal';
import type { Role } from '../types';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number;
}

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (userProfile?.uid) {
      notificationService.getUserNotifications(userProfile.uid).then(notifs => {
        setUnreadCount(notifs.filter(n => !n.isRead).length);
      });
    }
  }, [userProfile?.uid, location.pathname]);

  // Section XLIV: Student Sidebar
  const studentNavItems: NavItem[] = [
    { label: 'Trang chủ', path: '/student', icon: Home },
    { label: 'Thông tin cá nhân', path: '/student/profile', icon: User },
    { label: 'Phòng KTX của tôi', path: '/student/room', icon: Building2 },
    { label: 'Điện & Nước', path: '/student/utilities', icon: Zap },
    { label: 'Tiền KTX', path: '/student/invoices', icon: CreditCard },
    { label: 'Yêu cầu hỗ trợ', path: '/student/support', icon: Wrench },
    { label: 'Trao đổi chung', path: '/student/community', icon: MessageSquare },
    { label: 'Thông báo', path: '/student/notifications', icon: Bell, badge: unreadCount },
  ];

  // Section XLV: Manager Sidebar
  const managerNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/manager', icon: BarChart3 },
    { label: 'Sinh viên', path: '/manager/students', icon: Users },
    { label: 'Phòng KTX', path: '/manager/rooms', icon: Building2 },
    { label: 'Đăng ký KTX', path: '/manager/registrations', icon: FileText },
    { label: 'Điện', path: '/manager/electricity', icon: Zap },
    { label: 'Nước', path: '/manager/water', icon: Droplets },
    { label: 'Tiền KTX', path: '/manager/invoices', icon: CreditCard },
    { label: 'Thanh toán', path: '/manager/payments', icon: Layers },
    { label: 'Yêu cầu hỗ trợ', path: '/manager/support', icon: Wrench },
    { label: 'Thông báo', path: '/manager/announcements', icon: Bell },
    { label: 'Cộng đồng', path: '/manager/community', icon: MessageSquare },
    { label: 'Báo cáo', path: '/manager/reports', icon: BarChart3 },
    { label: 'Nhật ký hoạt động', path: '/manager/audit-logs', icon: ClipboardList },
  ];

  // Section XLVI: Super Admin Sidebar
  const adminNavItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin', icon: BarChart3 },
    { label: 'Người dùng & Quyền', path: '/admin/users', icon: Users },
    { label: 'Sinh viên', path: '/manager/students', icon: Users },
    { label: 'Tòa nhà', path: '/admin/buildings', icon: Building2 },
    { label: 'Phòng', path: '/manager/rooms', icon: Layers },
    { label: 'Đơn giá & Bảng giá', path: '/admin/pricing', icon: Zap },
    { label: 'Học kỳ', path: '/admin/semesters', icon: Calendar },
    { label: 'Công nợ & Hóa đơn', path: '/manager/invoices', icon: CreditCard },
    { label: 'Thanh toán', path: '/manager/payments', icon: Layers },
    { label: 'Đăng ký KTX', path: '/manager/registrations', icon: FileText },
    { label: 'Yêu cầu hỗ trợ', path: '/manager/support', icon: Wrench },
    { label: 'Cộng đồng', path: '/manager/community', icon: MessageSquare },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: ShieldAlert },
    { label: 'Cấu hình hệ thống', path: '/admin/settings', icon: Settings },
  ];

  let currentNavItems = studentNavItems;
  if (role === 'manager' || role === 'truongPhong') currentNavItems = managerNavItems;
  if (role === 'superAdmin') currentNavItems = adminNavItems;

  const getRoleBadge = (r: Role | null) => {
    switch (r) {
      case 'student':
        return <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">Sinh viên</span>;
      case 'manager':
        return <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">Quản lý KTX</span>;
      case 'truongPhong':
        return <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-indigo-200">Trưởng phòng KTX</span>;
      case 'superAdmin':
        return <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-200">Super Admin</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 focus:outline-none"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-campus-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-campus-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 tracking-tight leading-none block">
                  SMART DORMITORY
                </span>
                <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                  KTX NAM SÀI GÒN
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header actions */}
          <div className="flex items-center space-x-3">

            {/* Notification Bell */}
            <Link
              to={role === 'student' ? '/student/notifications' : '/manager/announcements'}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              title="Thông báo"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* User Info & Profile Trigger & Logout */}
            <div className="flex items-center pl-2 border-l border-slate-200 space-x-2">
              <button
                type="button"
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition group text-left cursor-pointer"
                title="Bấm để chỉnh sửa thông tin tài khoản & đổi mật khẩu"
              >
                <div className="w-8 h-8 rounded-xl bg-campus-100 text-campus-700 flex items-center justify-center font-bold text-xs border border-campus-200 shadow-xs group-hover:scale-105 transition">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-slate-900 truncate max-w-[140px] group-hover:text-campus-600 transition">
                    {userProfile?.displayName || 'Người dùng KTX'}
                  </p>
                  <div className="mt-0.5">{getRoleBadge(role)}</div>
                </div>
              </button>
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Đăng xuất"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0 p-4 border-r border-slate-200 bg-white">
          <nav className="space-y-1">
            {currentNavItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-campus-600 text-white shadow-sm shadow-campus-600/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'}`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative w-72 max-w-full bg-white h-full shadow-2xl flex flex-col z-10 p-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-slate-800">Menu chức năng</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-3 space-y-1">
                {currentNavItems.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-campus-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 text-sm font-semibold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>

      {/* Account Profile Edit Modal */}
      <EditProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};
