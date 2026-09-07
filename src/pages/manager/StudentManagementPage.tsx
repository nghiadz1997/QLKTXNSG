import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Building2,
  ArrowRightLeft,
  LogOut,
  CheckCircle,
  Eye,
  AlertTriangle,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Check,
  Trash2
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { studentService } from '../../services/studentService';
import { roomService } from '../../services/roomService';
import { authService } from '../../services/authService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog, TableSkeleton } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import type { Student, Room, UserProfile } from '../../types';

export const StudentManagementPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [targetRoomId, setTargetRoomId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Quick Grant Account Modal
  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [grantingStudent, setGrantingStudent] = useState<Student | null>(null);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPassword, setGrantPassword] = useState('');
  const [grantLoading, setGrantLoading] = useState(false);

  // Delete student dialog (SUPER ADMIN ONLY)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Check out dialog
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);

  // Create Student form state
  const [autoCreateAccount, setAutoCreateAccount] = useState(true);
  const [initialPassword, setInitialPassword] = useState('');
  const [newStudent, setNewStudent] = useState({
    hssv: '',
    cccd: '',
    fullName: '',
    dateOfBirth: '',
    gender: 'male' as const,
    phone: '',
    email: '',
    faculty: 'Công Nghệ Thông Tin',
    major: 'Kỹ Thuật Phần Mềm',
    className: '',
    course: 'Khóa 2026',
    roomId: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentList, roomList, userSnap] = await Promise.all([
        studentService.getStudents({
          searchQuery,
          buildingId: buildingFilter,
          dormStatus: statusFilter,
        }),
        roomService.getRooms(),
        getDocs(collection(db, 'users'))
      ]);
      setStudents(studentList);
      setRooms(roomList);
      setUsers(userSnap.docs.map(d => ({ uid: d.id, ...d.data() })) as UserProfile[]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchQuery, buildingFilter, statusFilter]);

  // Helper: check if a student has an account
  const isStudentLinked = (s: Student) => {
    return users.some(u =>
      (u.studentId && (u.studentId === s.uid || u.studentId === `student_${s.hssv}`)) ||
      (u.hssv && u.hssv.toLowerCase() === s.hssv.toLowerCase()) ||
      (s.authUid && u.uid === s.authUid) ||
      (s.email && u.email?.toLowerCase() === s.email.toLowerCase())
    );
  };

  const getLinkedAccount = (s: Student) => {
    return users.find(u =>
      (u.studentId && (u.studentId === s.uid || u.studentId === `student_${s.hssv}`)) ||
      (u.hssv && u.hssv.toLowerCase() === s.hssv.toLowerCase()) ||
      (s.authUid && u.uid === s.authUid) ||
      (s.email && u.email?.toLowerCase() === s.email.toLowerCase())
    );
  };

  const handleOpenGrantModal = (s: Student) => {
    setGrantingStudent(s);
    const suggestedEmail = s.email && s.email.includes('@')
      ? s.email
      : `${s.hssv.toLowerCase()}@caothang.edu.vn`;
    setGrantEmail(suggestedEmail);
    setGrantPassword(`nsg@${s.hssv}`);
    setGrantModalOpen(true);
  };

  const handleGrantAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantingStudent) return;
    if (grantPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setGrantLoading(true);
    try {
      const res = await authService.createAccountInFirebaseAuth(
        grantEmail,
        grantPassword,
        grantingStudent.fullName,
        'student',
        {
          studentId: grantingStudent.uid,
          hssv: grantingStudent.hssv,
          phone: grantingStudent.phone,
        }
      );
      if (res.isLinkedExisting) {
        toast.success(
          `Đã liên kết thành công tài khoản "${res.email}" với SV ${grantingStudent.fullName}! Đăng nhập bằng Email hoặc Mã HSSV (${grantingStudent.hssv}).`
        );
      } else {
        toast.success(
          `Đã cấp tài khoản cho SV ${grantingStudent.fullName}! Đăng nhập bằng Email (${res.email}) hoặc Mã HSSV (${grantingStudent.hssv}).`
        );
      }
      setGrantModalOpen(false);
      setGrantingStudent(null);
      await loadData();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use' || err.message?.includes('auth/email-already-in-use')) {
        toast.error(`Email "${grantEmail}" đã tồn tại trên Firebase Authentication. Vui lòng bấm một trong các email gợi ý bên dưới để chọn email mới!`);
      } else {
        toast.error('Lỗi khi cấp tài khoản: ' + (err.message || 'Thất bại.'));
      }
    } finally {
      setGrantLoading(false);
    }
  };

  // CHỈ SUPER ADMIN MỚI CÓ QUYỀN XÓA SINH VIÊN
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    if (role !== 'superAdmin') {
      toast.error('Chỉ Quản trị viên cấp cao (Super Admin) mới có quyền xóa sinh viên khỏi hệ thống.');
      return;
    }

    setDeleteLoading(true);
    try {
      await studentService.deleteStudent(
        studentToDelete.uid,
        userProfile?.uid || 'superAdmin',
        userProfile?.email,
        role
      );
      toast.success(`Đã xóa vĩnh viễn sinh viên ${studentToDelete.fullName} (${studentToDelete.hssv}) khỏi KTX!`);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi xóa sinh viên: ' + (err.message || 'Thất bại.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.hssv || !newStudent.fullName || !newStudent.phone) {
      toast.error('Vui lòng nhập các thông tin bắt buộc.');
      return;
    }

    setActionLoading(true);
    try {
      const uid = `student_${newStudent.hssv}`;
      const studentCreated = await studentService.createStudent(
        {
          uid,
          ...newStudent,
          status: 'active',
          dormStatus: newStudent.roomId ? 'living' : 'waiting',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        userProfile?.uid || 'manager',
        userProfile?.email,
        role || 'manager'
      );

      // If room was selected during creation, assign atomically
      if (newStudent.roomId) {
        await roomService.assignStudentToRoom(
          uid,
          newStudent.roomId,
          userProfile?.uid || 'manager',
          userProfile?.email,
          role || 'manager'
        );
      }

      // Auto create Firebase Auth account if enabled
      if (autoCreateAccount) {
        const studentEmail = newStudent.email && newStudent.email.includes('@')
          ? newStudent.email
          : `${newStudent.hssv.toLowerCase()}@caothang.edu.vn`;
        const pwd = initialPassword.trim() || `nsg@${newStudent.hssv}`;
        try {
          const authRes = await authService.createAccountInFirebaseAuth(
            studentEmail,
            pwd,
            newStudent.fullName,
            'student',
            {
              studentId: uid,
              hssv: newStudent.hssv,
              phone: newStudent.phone,
            }
          );
          if (authRes.isLinkedExisting) {
            toast.success(`Đã thêm SV ${newStudent.fullName} và liên kết tài khoản (${authRes.email}) thành công!`);
          } else {
            toast.success(
              `Đã thêm SV ${newStudent.fullName} và tự động cấp tài khoản (${authRes.email}) thành công! SV có thể đăng nhập bằng Email hoặc Mã HSSV.`
            );
          }
        } catch (authErr: any) {
          console.warn('Lỗi tự động tạo auth user:', authErr);
          toast.warning(`Đã lưu hồ sơ sinh viên. Để cấp tài khoản, vui lòng bấm "Cấp TK" ở bảng danh sách để chọn email phù hợp.`);
        }
      } else {
        toast.success(`Đã thêm sinh viên ${newStudent.fullName} thành công!`);
      }

      setCreateModalOpen(false);
      setInitialPassword('');
      setAutoCreateAccount(true);
      setNewStudent({
        hssv: '',
        cccd: '',
        fullName: '',
        dateOfBirth: '',
        gender: 'male',
        phone: '',
        email: '',
        faculty: 'Công Nghệ Thông Tin',
        major: 'Kỹ Thuật Phần Mềm',
        className: '',
        course: 'Khóa 2026',
        roomId: '',
      });
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Lỗi khi tạo sinh viên.');
    } finally {
      setActionLoading(false);
    }
  };

  // ATOMIC TRANSACTION: Room Transfer / Assignment
  const handleRoomTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !targetRoomId) return;

    setActionLoading(true);
    try {
      if (!selectedStudent.roomId) {
        // First time room assignment
        await roomService.assignStudentToRoom(
          selectedStudent.uid,
          targetRoomId,
          userProfile?.uid || 'manager',
          userProfile?.email,
          role || 'manager'
        );
        toast.success(`Đã xếp sinh viên ${selectedStudent.fullName} vào phòng ${targetRoomId}!`);
      } else {
        // Room transfer
        await roomService.transferStudentRoom(
          selectedStudent.uid,
          selectedStudent.roomId,
          targetRoomId,
          userProfile?.uid || 'manager',
          userProfile?.email,
          role || 'manager'
        );
        toast.success(`✓ Đã chuyển sinh viên ${selectedStudent.fullName} từ ${selectedStudent.roomId} sang ${targetRoomId} thành công!`);
      }

      setTransferModalOpen(false);
      setSelectedStudent(null);
      setTargetRoomId('');
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi chuyển phòng: ' + (err.message || 'Vui lòng kiểm tra sức chứa phòng.'));
    } finally {
      setActionLoading(false);
    }
  };

  // ATOMIC TRANSACTION: Check out student
  const handleCheckOut = async () => {
    if (!selectedStudent || !selectedStudent.roomId) return;

    setActionLoading(true);
    try {
      await roomService.checkOutStudent(
        selectedStudent.uid,
        selectedStudent.roomId,
        userProfile?.uid || 'manager',
        userProfile?.email,
        role || 'manager'
      );

      toast.success(`✓ Đã hoàn tất thủ tục trả phòng cho sinh viên ${selectedStudent.fullName}!`);
      setCheckOutDialogOpen(false);
      setSelectedStudent(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi trả phòng: ' + (err.message || 'Thao tác thất bại.'));
    } finally {
      setActionLoading(false);
    }
  };

  const getDormStatusBadge = (status: string) => {
    switch (status) {
      case 'living':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Đang ở KTX</span>;
      case 'waiting':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Chờ xếp phòng</span>;
      case 'checkedOut':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Đã trả phòng</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Chưa ở KTX</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
            Hồ Sơ Cư Trú KTX
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản Lý Sinh Viên KTX
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tra cứu, thêm mới, phân phòng và chuyển phòng thông qua giao dịch Firestore an toàn (Atomic Transaction).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Sinh Viên Mới</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Mã HSSV, Họ tên, Lớp, Phòng..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={buildingFilter}
            onChange={e => setBuildingFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            <option value="">Tất cả Tòa nhà</option>
            <option value="TOA_A">Tòa Nhà A</option>
            <option value="TOA_B">Tòa Nhà B</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            <option value="">Tất cả Trạng thái</option>
            <option value="living">Đang ở KTX</option>
            <option value="waiting">Chờ xếp phòng</option>
            <option value="checkedOut">Đã trả phòng</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      {loading ? (
        <TableSkeleton rows={5} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Không tìm thấy sinh viên nào"
          description="Thử thay đổi từ khóa tìm kiếm hoặc bấm 'Thêm Sinh Viên Mới'."
        />
      ) : (
        <Card title={`Danh Sách Sinh Viên (${students.length})`} subtitle="Cập nhật trực tiếp từ Firestore">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Mã HSSV / CCCD</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Lớp / Ngành / Khoa</th>
                  <th className="py-3 px-4">Phòng Hiện Tại</th>
                  <th className="py-3 px-4">Số Điện Thoại</th>
                  <th className="py-3 px-4">Trạng Thái KTX</th>
                  <th className="py-3 px-4">Tài Khoản Login</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s.uid} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{s.hssv}</span>
                      <span className="font-mono text-[11px] text-slate-500">CCCD: {s.cccd || '---'}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{s.fullName}</td>
                    <td className="py-3 px-4 text-xs">
                      <span className="font-semibold text-slate-800 block">{s.className} • {s.major || 'KTPM'}</span>
                      <span className="text-slate-400">{s.faculty}</span>
                    </td>
                    <td className="py-3 px-4">
                      {s.roomId ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-campus-50 text-campus-700 border border-campus-200">
                          <Building2 className="w-3.5 h-3.5 mr-1" /> Phòng {s.roomId}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Chưa xếp phòng</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs">{s.phone}</td>
                    <td className="py-3 px-4">{getDormStatusBadge(s.dormStatus)}</td>
                    <td className="py-3 px-4">
                      {isStudentLinked(s) ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                          title={getLinkedAccount(s)?.email ? `Email: ${getLinkedAccount(s)?.email}` : 'Đã liên kết tài khoản'}
                        >
                          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600 shrink-0" />
                          <span>Đã có TK</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenGrantModal(s)}
                          className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition"
                          title="Cấp tài khoản đăng nhập Firebase cho sinh viên này"
                        >
                          <KeyRound className="w-3 h-3 mr-1" />
                          <span>Cấp TK</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(s);
                            setTargetRoomId('');
                            setTransferModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-campus-50 hover:bg-campus-100 text-campus-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          title={s.roomId ? 'Chuyển phòng' : 'Phân phòng'}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>{s.roomId ? 'Chuyển' : 'Xếp phòng'}</span>
                        </button>

                        {s.roomId && s.dormStatus === 'living' && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(s);
                              setCheckOutDialogOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            title="Trả phòng / Check-out"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Trả</span>
                          </button>
                        )}

                        {/* NÚT XÓA SINH VIÊN: CHỈ HIỂN THỊ VÀ CHO PHÉP SUPER ADMIN */}
                        {role === 'superAdmin' && (
                          <button
                            type="button"
                            onClick={() => {
                              setStudentToDelete(s);
                              setDeleteDialogOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-rose-200"
                            title="Chỉ Super Admin: Xóa sinh viên này khỏi hệ thống"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Transfer / Assign Room */}
      {transferModalOpen && selectedStudent && (
        <Modal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          title={selectedStudent.roomId ? `Chuyển Phòng Cho Sinh Viên: ${selectedStudent.fullName}` : `Phân Phòng Cho Sinh Viên: ${selectedStudent.fullName}`}
          maxWidth="md"
        >
          <form onSubmit={handleRoomTransfer} className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p>Mã HSSV: <strong className="text-slate-900">{selectedStudent.hssv}</strong></p>
              <p>Phòng hiện tại: <strong className="text-campus-600">{selectedStudent.roomId || 'Chưa có'}</strong></p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Chọn Phòng Mới (Chỉ hiển thị phòng còn chỗ) *
              </label>
              <select
                required
                value={targetRoomId}
                onChange={e => setTargetRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              >
                <option value="">-- Chọn phòng tiếp nhận --</option>
                {rooms
                  .filter(r => r.roomId !== selectedStudent.roomId && r.availableSlots > 0 && r.status !== 'locked')
                  .map(r => (
                    <option key={r.roomId} value={r.roomId}>
                      {r.roomName} ({r.currentOccupants}/{r.capacity} chỗ - Còn trống {r.availableSlots})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={actionLoading || !targetRoomId}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang giao dịch...</span>
                  </>
                ) : (
                  <span>Xác Nhận {selectedStudent.roomId ? 'Chuyển Phòng' : 'Phân Phòng'}</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation Dialog: Check out student */}
      {checkOutDialogOpen && selectedStudent && (
        <ConfirmDialog
          isOpen={checkOutDialogOpen}
          onClose={() => setCheckOutDialogOpen(false)}
          onConfirm={handleCheckOut}
          title="Xác Nhận Check-out / Trả Phòng"
          message={`Bạn có chắc chắn muốn làm thủ tục trả phòng ${selectedStudent.roomId} cho sinh viên ${selectedStudent.fullName} (${selectedStudent.hssv})? Thao tác này sẽ giải phóng 1 chỗ trống và lưu vào lịch sử cư trú.`}
          confirmText="Đồng ý trả phòng"
          cancelText="Hủy bỏ"
          isDestructive={true}
          loading={actionLoading}
        />
      )}

      {/* Create Student Modal */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Thêm Hồ Sơ Sinh Viên Mới"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Mã HSSV *
                </label>
                <input
                  type="text"
                  required
                  value={newStudent.hssv}
                  onChange={e => setNewStudent({ ...newStudent, hssv: e.target.value.trim() })}
                  placeholder="Ví dụ: 22004"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Số CCCD / CMND *
                </label>
                <input
                  type="text"
                  required
                  value={newStudent.cccd}
                  onChange={e => setNewStudent({ ...newStudent, cccd: e.target.value.trim() })}
                  placeholder="00120300xxxx"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={newStudent.fullName}
                  onChange={e => setNewStudent({ ...newStudent, fullName: e.target.value })}
                  placeholder="Nguyễn Văn B"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  value={newStudent.dateOfBirth}
                  onChange={e => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Giới tính
                </label>
                <select
                  value={newStudent.gender}
                  onChange={e => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                >
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  required
                  value={newStudent.phone}
                  onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                  placeholder="0912345678"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={newStudent.email}
                  onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Khoa / Viện
                </label>
                <input
                  type="text"
                  value={newStudent.faculty}
                  onChange={e => setNewStudent({ ...newStudent, faculty: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Chuyên ngành
                </label>
                <input
                  type="text"
                  value={newStudent.major}
                  onChange={e => setNewStudent({ ...newStudent, major: e.target.value })}
                  placeholder="Kỹ Thuật Phần Mềm"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Lớp sinh hoạt
                </label>
                <input
                  type="text"
                  value={newStudent.className}
                  onChange={e => setNewStudent({ ...newStudent, className: e.target.value })}
                  placeholder="CNTT-K22A"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Phân phòng ngay (Tùy chọn)
                </label>
                <select
                  value={newStudent.roomId}
                  onChange={e => setNewStudent({ ...newStudent, roomId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                >
                  <option value="">-- Chưa xếp phòng (Chờ xếp) --</option>
                  {rooms
                    .filter(r => r.availableSlots > 0 && r.status !== 'locked')
                    .map(r => (
                      <option key={r.roomId} value={r.roomId}>
                        {r.roomName} ({r.currentOccupants}/{r.capacity} - Còn trống {r.availableSlots})
                      </option>
                    ))}
                </select>
              </div>

              {/* Option to automatically create and link Firebase Auth account */}
              <div className="sm:col-span-2 bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200/80 space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-bold text-purple-950 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoCreateAccount}
                    onChange={e => setAutoCreateAccount(e.target.checked)}
                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span>Tự động cấp tài khoản đăng nhập Firebase cho sinh viên này</span>
                </label>
                {autoCreateAccount && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Email đăng nhập dự kiến
                      </label>
                      <input
                        type="text"
                        disabled
                        value={newStudent.email || (newStudent.hssv ? `${newStudent.hssv.toLowerCase()}@caothang.edu.vn` : 'Tự tạo theo Mã HSSV')}
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs text-slate-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Mật khẩu khởi tạo
                      </label>
                      <input
                        type="text"
                        value={initialPassword}
                        onChange={e => setInitialPassword(e.target.value)}
                        placeholder={`nsg@${newStudent.hssv || '123'}`}
                        className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-purple-700">
                  Sinh viên có thể đăng nhập bằng Email hoặc trực tiếp bằng Mã HSSV cùng mật khẩu này.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Tạo Hồ Sơ Sinh Viên</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Grant Account Modal */}
      {grantModalOpen && grantingStudent && (
        <Modal
          isOpen={grantModalOpen}
          onClose={() => {
            setGrantModalOpen(false);
            setGrantingStudent(null);
          }}
          title={`Cấp Tài Khoản Cho: ${grantingStudent.fullName}`}
          maxWidth="md"
        >
          <form onSubmit={handleGrantAccount} className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80 text-xs text-purple-900 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-purple-950 font-bold">Đồng bộ tài khoản & Phân quyền Sinh viên</strong>
                Tài khoản sẽ được tạo trên Firebase Authentication và tự động liên kết với hồ sơ ký túc xá của sinh viên <strong>{grantingStudent.fullName}</strong> ({grantingStudent.hssv}).
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Email đăng nhập *
              </label>
              <input
                type="email"
                required
                value={grantEmail}
                onChange={e => setGrantEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] font-semibold text-slate-500">Gợi ý nhanh:</span>
                <button
                  type="button"
                  onClick={() => setGrantEmail(`${grantingStudent.hssv.toLowerCase()}@caothang.edu.vn`)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition border ${
                    grantEmail === `${grantingStudent.hssv.toLowerCase()}@caothang.edu.vn`
                      ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {grantingStudent.hssv.toLowerCase()}@caothang.edu.vn
                </button>
                <button
                  type="button"
                  onClick={() => setGrantEmail(`${grantingStudent.hssv.toLowerCase()}.sv@caothang.edu.vn`)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition border ${
                    grantEmail === `${grantingStudent.hssv.toLowerCase()}.sv@caothang.edu.vn`
                      ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {grantingStudent.hssv.toLowerCase()}.sv@caothang.edu.vn
                </button>
                <button
                  type="button"
                  onClick={() => setGrantEmail(`${grantingStudent.hssv.toLowerCase()}.ktx@caothang.edu.vn`)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition border ${
                    grantEmail === `${grantingStudent.hssv.toLowerCase()}.ktx@caothang.edu.vn`
                      ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {grantingStudent.hssv.toLowerCase()}.ktx@caothang.edu.vn
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mật khẩu khởi tạo * (Tối thiểu 6 ký tự)
              </label>
              <input
                type="text"
                required
                value={grantPassword}
                onChange={e => setGrantPassword(e.target.value)}
                placeholder="nsg@22001"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Sinh viên có thể đăng nhập bằng Email hoặc trực tiếp bằng Mã HSSV: <span className="font-mono font-bold text-slate-700">{grantingStudent.hssv}</span>
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setGrantModalOpen(false);
                  setGrantingStudent(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={grantLoading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{grantLoading ? 'Đang cấp tài khoản...' : 'Xác Nhận & Cấp Tài Khoản'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm Dialog: Xóa sinh viên vĩnh viễn (SUPER ADMIN ONLY) */}
      {deleteDialogOpen && studentToDelete && (
        <ConfirmDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setStudentToDelete(null);
          }}
          onConfirm={handleDeleteStudent}
          title={`Xác Nhận Xóa Sinh Viên: ${studentToDelete.fullName}`}
          message={`CẢNH BÁO QUẢN TRỊ: Bạn có chắc chắn muốn xóa vĩnh viễn sinh viên ${studentToDelete.fullName} (MSSV: ${studentToDelete.hssv}) khỏi Ký Túc Xá? Thao tác này sẽ tự động giải phóng chỗ ở trong phòng (nếu đang ở), dọn dẹp tài khoản người dùng và lưu lại nhật ký kiểm toán.`}
          confirmText="Xác nhận xóa vĩnh viễn"
          cancelText="Hủy bỏ"
          isDestructive={true}
          loading={deleteLoading}
        />
      )}
    </div>
  );
};
