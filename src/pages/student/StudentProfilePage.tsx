import React, { useEffect, useState } from 'react';
import { User, Building2, Calendar, Phone, Mail, BookOpen, Clock, ShieldCheck, History, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/studentService';
import { Card } from '../../components/common/Card';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { EditProfileModal } from '../../components/common/EditProfileModal';
import type { StudentRoomHistory } from '../../types';

export const StudentProfilePage: React.FC = () => {
  const { studentData, userProfile } = useAuth();
  const [history, setHistory] = useState<StudentRoomHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const student = studentData || {
    uid: userProfile?.uid || '',
    hssv: 'Chưa cập nhật',
    cccd: 'Chưa cập nhật',
    fullName: userProfile?.displayName || 'Sinh viên KTX',
    dateOfBirth: '',
    gender: 'male' as const,
    phone: '',
    email: userProfile?.email || '',
    faculty: 'Chưa cập nhật',
    major: 'Chưa cập nhật',
    className: 'Chưa cập nhật',
    course: 'Khóa 2026',
    roomId: 'Chưa xếp phòng',
    buildingId: '',
    status: 'active' as const,
    dormStatus: 'waiting' as const,
    checkInDate: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  useEffect(() => {
    if (student.uid) {
      setLoadingHistory(true);
      studentService
        .getStudentRoomHistory(student.uid)
        .then(setHistory)
        .finally(() => setLoadingHistory(false));
    }
  }, [student.uid]);

  const getDormStatusBadge = (status: string) => {
    switch (status) {
      case 'living':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">🟢 Đang ở KTX</span>;
      case 'waiting':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">🟡 Chờ xếp phòng</span>;
      case 'checkedOut':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">⚪ Đã trả phòng</span>;
      default:
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200">🔴 Chưa ở KTX</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-campus-600 to-cyan-500 text-white flex items-center justify-center text-2xl font-extrabold shadow-lg shadow-campus-600/30 ring-4 ring-slate-50">
            {student.fullName ? student.fullName.charAt(0) : 'S'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{student.fullName}</h1>
              {getDormStatusBadge(student.dormStatus)}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span>Mã HSSV: <strong className="text-slate-800">{student.hssv}</strong></span>
              <span>•</span>
              <span>CCCD: <strong className="text-slate-800 font-mono">{student.cccd || '001203001234'}</strong></span>
              <span>•</span>
              <span>Lớp: <strong className="text-slate-800">{student.className}</strong></span>
              <span>•</span>
              <span>Phòng hiện tại: <strong className="text-campus-600">{student.roomId || 'Chưa xếp'}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
            className="px-4 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Chỉnh Sửa Thông Tin</span>
          </button>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal details */}
        <Card title="Thông Tin Cá Nhân & Liên Hệ" subtitle="Dữ liệu đồng bộ với hệ thống quản lý đào tạo">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Họ và tên:</span>
              <span className="font-bold text-slate-900">{student.fullName}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Mã định danh HSSV:</span>
              <span className="font-mono font-bold text-slate-900">{student.hssv}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Số CCCD / CMND:</span>
              <span className="font-mono font-bold text-campus-600">{student.cccd || '001203001234'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Ngày sinh:</span>
              <span className="font-medium text-slate-800">{student.dateOfBirth}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Giới tính:</span>
              <span className="font-medium text-slate-800">{student.gender === 'male' ? 'Nam' : 'Nữ'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Số điện thoại:</span>
              <span className="font-mono font-medium text-slate-800">{student.phone}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 text-xs">Email nhà trường:</span>
              <span className="font-medium text-slate-800">{student.email}</span>
            </div>
          </div>
        </Card>

        {/* Academic and Dorm Info */}
        <Card title="Hồ Sơ Ký Túc Xá & Đào Tạo" subtitle="Thông tin ngành học, lớp sinh hoạt và phòng ở">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Khoa / Viện:</span>
              <span className="font-bold text-slate-900">{student.faculty}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Ngành học:</span>
              <span className="font-bold text-slate-900">{student.major || 'Kỹ Thuật Phần Mềm'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Lớp sinh hoạt:</span>
              <span className="font-bold text-campus-600">{student.className}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Phòng lưu trú:</span>
              <span className="font-bold text-campus-600">{student.roomId || 'Chưa xếp'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Khu nhà:</span>
              <span className="font-medium text-slate-800">{student.buildingId === 'TOA_A' ? 'Tòa Nhà A (Nam)' : 'Tòa Nhà B (Nữ)'}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 text-xs">Ngày nhận phòng:</span>
              <span className="font-medium text-slate-800">
                {student.checkInDate ? new Date(student.checkInDate).toLocaleDateString('vi-VN') : '01/09/2026'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-500 text-xs">Trạng thái hồ sơ:</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-xs">
                Hoạt động bình thường
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Section XXXIII: Student Room History */}
      <Card
        title="Lịch Sử Lưu Trú KTX"
        subtitle="Toàn bộ lịch sử các phòng sinh viên đã từng ở (không bao giờ bị xóa)"
      >
        {loadingHistory ? (
          <TableSkeleton rows={2} />
        ) : history.length === 0 ? (
          <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-2xl">
            <p className="font-semibold text-slate-700">Phòng hiện tại: {student.roomId || 'Chưa phân phòng'}</p>
            <p className="text-xs text-slate-400 mt-1">
              Thời gian bắt đầu: {student.checkInDate ? new Date(student.checkInDate).toLocaleDateString('vi-VN') : 'Chưa ghi nhận'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-campus-100 text-campus-700 flex items-center justify-center font-bold">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">Phòng {item.roomId}</span>
                    <span className="text-slate-500">
                      Hành động: {item.action === 'checkIn' ? 'Nhận phòng' : item.action === 'transfer' ? 'Chuyển phòng' : 'Trả phòng'}
                    </span>
                  </div>
                </div>
                <span className="text-slate-400">
                  {new Date(item.checkInDate).toLocaleDateString('vi-VN')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  );
};
