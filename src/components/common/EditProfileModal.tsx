import React, { useState, useEffect } from 'react';
import { User, Phone, Lock, Mail, ShieldCheck, CheckCircle2, Save, KeyRound } from 'lucide-react';
import { Modal } from './Modal';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { studentService } from '../../services/studentService';
import { toast } from 'sonner';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, studentData, role, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  // Basic Info state
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || studentData?.fullName || '');
      setPhone(userProfile.phone || studentData?.phone || '');
    }
  }, [userProfile, studentData, isOpen]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUid = userProfile?.uid || currentUser?.uid;
    if (!targetUid) {
      toast.error('Không tìm thấy thông tin phiên đăng nhập.');
      return;
    }
    if (!displayName.trim()) {
      toast.error('Vui lòng nhập họ và tên.');
      return;
    }

    setSavingInfo(true);
    try {
      // Update users/{uid} (tự động tạo nếu chưa có document)
      await authService.updateUserProfile(targetUid, {
        displayName: displayName.trim(),
        phone: phone.trim(),
      });

      // Nếu là sinh viên và có hồ sơ sinh viên, đồng bộ cập nhật
      if (studentData && studentData.uid) {
        try {
          await studentService.updateStudent(
            studentData.uid,
            {
              fullName: displayName.trim(),
              phone: phone.trim(),
            },
            targetUid,
            userProfile?.email || currentUser?.email || '',
            role || 'student'
          );
        } catch (sErr) {
          console.warn('Could not sync to student record:', sErr);
        }
      }

      await refreshProfile();
      toast.success('Đã cập nhật thông tin tài khoản thành công!');
      onClose();
    } catch (err: any) {
      console.error('Error updating profile:', err);
      toast.error('Lỗi cập nhật thông tin: ' + err.message);
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setSavingPassword(true);
    try {
      await authService.changeCurrentUserPassword(newPassword);
      toast.success('Đã đổi mật khẩu thành công!');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      console.error('Error changing password:', err);
      let msg = err.message || 'Không thể đổi mật khẩu.';
      if (err.code === 'auth/requires-recent-login') {
        msg = 'Phiên đăng nhập đã cũ. Vui lòng đăng xuất và đăng nhập lại để đổi mật khẩu.';
      }
      toast.error('Lỗi đổi mật khẩu: ' + msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const getRoleLabel = (r: string | null) => {
    switch (r) {
      case 'superAdmin':
        return 'Quản Trị Viên Cấp Cao (Super Admin)';
      case 'truongPhong':
        return 'Trưởng Phòng KTX Nam Sài Gòn';
      case 'manager':
        return 'Cán Bộ Quản Lý KTX';
      case 'student':
        return 'Sinh Viên KTX';
      default:
        return 'Người Dùng';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh Sửa Thông Tin Tài Khoản" maxWidth="md">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'info'
                ? 'bg-white text-campus-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Thông Tin Cá Nhân</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 rounded-lg transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'password'
                ? 'bg-white text-campus-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Đổi Mật Khẩu</span>
          </button>
        </div>

        {activeTab === 'info' ? (
          <form onSubmit={handleSaveInfo} className="space-y-4">
            {/* Account Role & Email badge */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Email Đăng Nhập</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                  {getRoleLabel(role)}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-800 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {userProfile?.email || 'Chưa cập nhật'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Họ và tên hiển thị *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Số điện thoại liên hệ
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingInfo}
                className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingInfo ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-800">
              Mật khẩu mới yêu cầu tối thiểu 6 ký tự. Sau khi đổi mật khẩu, bạn có thể dùng mật khẩu này cho các lần đăng nhập tiếp theo.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Mật khẩu mới *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Xác nhận mật khẩu mới *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/30 transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{savingPassword ? 'Đang đổi...' : 'Cập Nhật Mật Khẩu'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
