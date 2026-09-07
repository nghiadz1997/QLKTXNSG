import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  User,
  KeyRound,
  Terminal,
  CheckCircle2,
  Trash2,
  Edit,
  GraduationCap,
  Search,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  UserCheck,
  UserX
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { authService } from '../../services/authService';
import { studentService } from '../../services/studentService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { UserProfile, Role, Student } from '../../types';

export const UserRoleManagementPage: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Add / Edit user role
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('manager');
  const [saving, setSaving] = useState(false);

  // Student Account Provisioning Modal State
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [unlinkedOnly, setUnlinkedOnly] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentSaving, setStudentSaving] = useState(false);

  // Edit User Modal
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRole, setEditRole] = useState<Role>('manager');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'locked'>('active');
  const [editPhone, setEditPhone] = useState('');
  const [updatingUser, setUpdatingUser] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userSnap, studentList] = await Promise.all([
        getDocs(collection(db, 'users')),
        studentService.getStudents()
      ]);
      const list = userSnap.docs.map(d => ({ uid: d.id, ...d.data() })) as UserProfile[];
      setUsers(list);
      setStudents(studentList);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách người dùng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper: check if a student has an account
  const isStudentLinked = (s: Student) => {
    return users.some(u =>
      (u.studentId && (u.studentId === s.uid || u.studentId === `student_${s.hssv}`)) ||
      (u.hssv && u.hssv.toLowerCase() === s.hssv.toLowerCase()) ||
      (s.authUid && u.uid === s.authUid) ||
      (s.email && u.email?.toLowerCase() === s.email.toLowerCase())
    );
  };

  const getStudentLinkedAccount = (s: Student) => {
    return users.find(u =>
      (u.studentId && (u.studentId === s.uid || u.studentId === `student_${s.hssv}`)) ||
      (u.hssv && u.hssv.toLowerCase() === s.hssv.toLowerCase()) ||
      (s.authUid && u.uid === s.authUid) ||
      (s.email && u.email?.toLowerCase() === s.email.toLowerCase())
    );
  };

  // When clicking on a student to provision an account
  const handleSelectStudent = (s: Student) => {
    setSelectedStudent(s);
    const suggestedEmail = s.email && s.email.includes('@')
      ? s.email
      : `${s.hssv.toLowerCase()}@caothang.edu.vn`;
    setStudentEmail(suggestedEmail);
    setStudentPassword(`nsg@${s.hssv}`);
  };

  const handleCreateStudentAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (studentPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setStudentSaving(true);
    try {
      const res = await authService.createAccountInFirebaseAuth(
        studentEmail,
        studentPassword,
        selectedStudent.fullName,
        'student',
        {
          studentId: selectedStudent.uid,
          hssv: selectedStudent.hssv,
          phone: selectedStudent.phone
        }
      );

      if (res.isLinkedExisting) {
        toast.success(
          `Đã liên kết thành công tài khoản "${res.email}" với SV ${selectedStudent.fullName}! Sinh viên có thể đăng nhập bằng Email này hoặc Mã HSSV (${selectedStudent.hssv}).`
        );
      } else {
        toast.success(
          `Đã cấp tài khoản cho SV ${selectedStudent.fullName}! Email: ${res.email}. SV có thể đăng nhập bằng Email hoặc Mã HSSV (${selectedStudent.hssv}).`
        );
      }
      setStudentModalOpen(false);
      setSelectedStudent(null);
      await loadData();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use' || err.message?.includes('auth/email-already-in-use')) {
        toast.error(`Email "${studentEmail}" đã tồn tại trên Firebase Authentication. Vui lòng bấm một trong các email gợi ý bên dưới để chọn email mới!`);
      } else {
        toast.error('Lỗi khi cấp tài khoản: ' + (err.message || 'Thất bại.'));
      }
    } finally {
      setStudentSaving(false);
    }
  };

  const handleCreateRealAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setSaving(true);
    try {
      await authService.createAccountInFirebaseAuth(email, password, displayName, selectedRole);
      toast.success(`Đã tạo tài khoản "${email}" thành công trên Firebase Authentication! Phân quyền tự động áp dụng vào Firebase Rules.`);
      setModalOpen(false);
      setEmail('');
      setPassword('');
      setDisplayName('');
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi khi tạo tài khoản: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (u: UserProfile) => {
    setEditUser(u);
    setEditDisplayName(u.displayName || '');
    setEditRole(u.role);
    setEditStatus(u.status || 'active');
    setEditPhone(u.phone || '');
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    if (!editDisplayName.trim()) {
      toast.error('Vui lòng nhập họ và tên.');
      return;
    }

    setUpdatingUser(true);
    try {
      await authService.updateUserByAdmin(editUser.uid, {
        displayName: editDisplayName.trim(),
        role: editRole,
        status: editStatus,
        phone: editPhone.trim(),
      });
      toast.success(`Đã cập nhật thông tin và phân quyền cho "${editUser.email}"! Vai trò mới đã tự động vào Firebase Rules.`);
      setEditUser(null);
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi khi cập nhật tài khoản: ' + err.message);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản ${u.email} khỏi hệ thống không?`)) {
      return;
    }
    try {
      await authService.deleteUserProfile(u.uid);
      toast.success(`Đã xóa tài khoản ${u.email}`);
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi khi xóa: ' + err.message);
    }
  };

  const handleDeleteStudent = async (s: Student) => {
    if (!window.confirm(`CẢNH BÁO QUẢN TRỊ:\nBạn có chắc chắn muốn xóa vĩnh viễn sinh viên ${s.fullName} (MSSV: ${s.hssv}) khỏi Ký Túc Xá?\nThao tác này sẽ tự động giải phóng chỗ ở trong phòng (nếu có) và xóa tài khoản liên kết.`)) {
      return;
    }
    try {
      await studentService.deleteStudent(s.uid, 'superAdmin', undefined, 'superAdmin');
      toast.success(`Đã xóa vĩnh viễn sinh viên ${s.fullName} (${s.hssv})!`);
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi khi xóa sinh viên: ' + (err.message || 'Thất bại.'));
    }
  };

  const filteredStudents = students.filter(s => {
    const matchSearch =
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.hssv.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.className && s.className.toLowerCase().includes(studentSearch.toLowerCase())) ||
      (s.roomId && s.roomId.toLowerCase().includes(studentSearch.toLowerCase()));

    if (!matchSearch) return false;
    if (unlinkedOnly) {
      return !isStudentLinked(s);
    }
    return true;
  });

  const unlinkedCount = students.filter(s => !isStudentLinked(s)).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4" /> Firebase Authentication & Phân Quyền
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản Lý Phân Quyền Người Dùng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý tài khoản đăng nhập Firebase Authentication thật. Phân cấp: Super Admin, Trưởng phòng KTX, Quản lý KTX, Sinh viên.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setSelectedStudent(null);
              setStudentModalOpen(true);
            }}
            className="px-4 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center gap-1.5 shrink-0"
          >
            <GraduationCap className="w-4 h-4" />
            <span>+ Cấp TK Cho Sinh Viên</span>
            {unlinkedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-amber-400 text-amber-950 font-extrabold rounded-full text-[10px]">
                {unlinkedCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5 shrink-0"
          >
            <KeyRound className="w-4 h-4" />
            <span>+ Tạo Tài Khoản Mới</span>
          </button>
        </div>
      </div>

      <Card title={`Danh Sách Người Dùng Firebase (${users.length})`} subtitle="Tài khoản đăng nhập thật và phân quyền vai trò">
        {loading ? (
          <TableSkeleton rows={4} />
        ) : users.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-700">Chưa có tài khoản nào trên Firebase</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
              Hệ thống hiện đang trống dữ liệu tài khoản. Bấm nút bên dưới để tạo tài khoản người dùng hoặc cấp tài khoản từ danh sách sinh viên.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setStudentModalOpen(true)}
                className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-1.5"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Cấp TK Cho Sinh Viên</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-1.5"
              >
                <KeyRound className="w-4 h-4" />
                <span>Tạo Quản Trị Viên Mới</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Tên Hiển Thị / Sinh Viên</th>
                  <th className="py-3 px-4">Email Đăng Nhập</th>
                  <th className="py-3 px-4">Vai Trò Hệ Thống</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.uid} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        {u.role === 'student' ? (
                          <GraduationCap className="w-4 h-4 text-campus-600 shrink-0" />
                        ) : (
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">{u.displayName || 'Chưa đặt tên'}</span>
                        {(u.hssv || u.studentId) && (
                          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-mono font-bold shrink-0">
                            MSSV: {u.hssv || u.studentId?.replace('student_', '')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        u.role === 'superAdmin'
                          ? 'bg-purple-100 text-purple-800 border-purple-200'
                          : u.role === 'truongPhong'
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : u.role === 'manager'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {u.role === 'superAdmin'
                          ? 'Super Admin'
                          : u.role === 'truongPhong'
                          ? 'Trưởng phòng KTX'
                          : u.role === 'manager'
                          ? 'Quản lý KTX'
                          : 'Sinh viên'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-md text-[10px]">
                        Hoạt động
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(u)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition inline-flex items-center gap-1 text-[11px] font-semibold"
                        title="Chỉnh sửa thông tin và phân quyền"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition inline-flex items-center gap-1 text-[11px] font-semibold"
                        title="Xóa tài khoản khỏi Firestore"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal Cấp Tài Khoản Cho Sinh Viên */}
      {studentModalOpen && (
        <Modal
          isOpen={studentModalOpen}
          onClose={() => {
            setStudentModalOpen(false);
            setSelectedStudent(null);
          }}
          title={selectedStudent ? `Cấp Tài Khoản Cho: ${selectedStudent.fullName}` : "Cấp Tài Khoản Đăng Nhập Từ Danh Sách Sinh Viên"}
          maxWidth={selectedStudent ? "md" : "2xl"}
        >
          {!selectedStudent ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Tìm theo Mã HSSV, Họ tên, Lớp, Phòng..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 select-none cursor-pointer px-2">
                  <input
                    type="checkbox"
                    checked={unlinkedOnly}
                    onChange={e => setUnlinkedOnly(e.target.checked)}
                    className="rounded border-slate-300 text-campus-600 focus:ring-campus-500 w-4 h-4"
                  />
                  <span>Chỉ hiện SV chưa có TK ({unlinkedCount})</span>
                </label>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <GraduationCap className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">Không tìm thấy sinh viên phù hợp</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {unlinkedOnly
                      ? 'Tất cả sinh viên tìm thấy đã được cấp tài khoản, hoặc không có sinh viên nào khớp.'
                      : 'Chưa có sinh viên nào trong danh mục.'}
                  </p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-white">
                  {filteredStudents.map(s => {
                    const linked = isStudentLinked(s);
                    const linkedAcc = linked ? getStudentLinkedAccount(s) : null;
                    return (
                      <div
                        key={s.uid}
                        className={`p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition ${
                          linked ? 'bg-slate-50/40' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <strong className="text-xs font-bold text-slate-900 truncate">
                              {s.fullName}
                            </strong>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-mono font-bold">
                              MSSV: {s.hssv}
                            </span>
                            {s.roomId && (
                              <span className="px-2 py-0.5 bg-campus-50 text-campus-700 border border-campus-200 rounded text-[10px] font-bold">
                                P.{s.roomId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>Lớp: {s.className || 'Chưa rõ'}</span>
                            <span>•</span>
                            <span>{s.phone || 'Chưa có SĐT'}</span>
                            {linkedAcc?.email && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-purple-700">Email TK: {linkedAcc.email}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {linked ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Đã có tài khoản
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectStudent(s)}
                              className="px-3 py-1.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-lg text-xs shadow-sm transition flex items-center gap-1"
                            >
                              <span>Cấp Tài Khoản</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition border border-rose-100 hover:border-rose-200"
                            title="Xóa vĩnh viễn sinh viên này khỏi KTX"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateStudentAccount} className="space-y-4">
              {/* Selected Student Card */}
              <div className="p-3.5 bg-campus-50/70 border border-campus-200/80 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-campus-600 text-white flex items-center justify-center font-bold text-sm">
                    {selectedStudent.fullName.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      {selectedStudent.fullName}
                      <span className="font-mono text-[11px] font-bold text-campus-700 bg-white px-1.5 py-0.5 rounded border border-campus-200">
                        {selectedStudent.hssv}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Lớp: {selectedStudent.className || 'Chưa cập nhật'} • Phòng: {selectedStudent.roomId || 'Chưa xếp'} • SĐT: {selectedStudent.phone}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs text-campus-700 hover:text-campus-900 font-bold hover:underline shrink-0"
                >
                  Đổi SV khác
                </button>
              </div>

              {/* Login capability reminder */}
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80 text-xs text-purple-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-purple-950 font-bold">Đăng nhập linh hoạt: Email hoặc Mã HSSV</strong>
                  Sau khi cấp tài khoản, sinh viên có thể đăng nhập bằng Email bên dưới <strong>HOẶC</strong> nhập trực tiếp Mã HSSV <strong>{selectedStudent.hssv}</strong> tại ô đăng nhập.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email đăng nhập của Sinh viên *
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  placeholder="22001@caothang.edu.vn"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-semibold text-slate-500">Gợi ý nhanh:</span>
                  <button
                    type="button"
                    onClick={() => setStudentEmail(`${selectedStudent.hssv.toLowerCase()}@caothang.edu.vn`)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition border ${
                      studentEmail === `${selectedStudent.hssv.toLowerCase()}@caothang.edu.vn`
                        ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {selectedStudent.hssv.toLowerCase()}@caothang.edu.vn
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentEmail(`${selectedStudent.hssv.toLowerCase()}.sv@caothang.edu.vn`)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition border ${
                      studentEmail === `${selectedStudent.hssv.toLowerCase()}.sv@caothang.edu.vn`
                        ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {selectedStudent.hssv.toLowerCase()}.sv@caothang.edu.vn
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentEmail(`${selectedStudent.hssv.toLowerCase()}.ktx@caothang.edu.vn`)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition border ${
                      studentEmail === `${selectedStudent.hssv.toLowerCase()}.ktx@caothang.edu.vn`
                        ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {selectedStudent.hssv.toLowerCase()}.ktx@caothang.edu.vn
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
                  value={studentPassword}
                  onChange={e => setStudentPassword(e.target.value)}
                  placeholder="nsg@22001"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Mật khẩu ban đầu gợi ý: <span className="font-mono font-bold text-slate-600">nsg@{selectedStudent.hssv}</span>. Sinh viên có thể đổi sau khi đăng nhập.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Quay lại danh sách
                </button>
                <button
                  type="submit"
                  disabled={studentSaving}
                  className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{studentSaving ? 'Đang cấp tài khoản...' : 'Xác Nhận & Cấp Tài Khoản'}</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* Modal Tạo Tài Khoản Mới */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Tạo Tài Khoản Mới Trên Firebase Authentication"
          maxWidth="md"
        >
          <form onSubmit={handleCreateRealAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Họ và tên người dùng *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Thầy Lê Văn Quản Lý"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Email đăng nhập *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mật khẩu ban đầu * (Tối thiểu 6 ký tự)
              </label>
              <input
                type="text"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Phân quyền vai trò (Role) *
              </label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              >
                <option value="manager">Quản lý KTX (Manager)</option>
                <option value="truongPhong">Trưởng phòng KTX (Trưởng Ban Quản Lý)</option>
                <option value="superAdmin">Quản trị viên cấp cao (Super Admin)</option>
                <option value="student">Sinh viên (Student)</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition"
              >
                {saving ? 'Đang tạo trên Firebase...' : 'Tạo Tài Khoản & Phân Quyền'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Chỉnh Sửa Thông Tin & Phân Quyền */}
      {editUser && (
        <Modal
          isOpen={!!editUser}
          onClose={() => setEditUser(null)}
          title={`Chỉnh Sửa Tài Khoản: ${editUser.email}`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveUserEdit} className="space-y-4">
            {/* Auto Firebase Rules Alert */}
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200/80 text-xs text-purple-900 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-purple-950 font-bold">Tự động đồng bộ Firebase Rules</strong>
                Khi lưu thông tin hoặc vai trò mới, Firestore Security Rules sẽ tự động nhận diện quyền của tài khoản này ngay lập tức.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Họ và tên hiển thị *
              </label>
              <input
                type="text"
                required
                value={editDisplayName}
                onChange={e => setEditDisplayName(e.target.value)}
                placeholder="Nhập họ và tên"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="tel"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Vai trò (Phân quyền) *
                </label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="student">Sinh viên (Student)</option>
                  <option value="manager">Quản lý KTX (Manager)</option>
                  <option value="truongPhong">Trưởng phòng KTX (Trưởng Ban Quản Lý)</option>
                  <option value="superAdmin">Quản trị viên cấp cao (Super Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Trạng thái tài khoản *
                </label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="active">Hoạt động (Active)</option>
                  <option value="inactive">Tạm ngưng (Inactive)</option>
                  <option value="locked">Bị khóa (Locked)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updatingUser}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{updatingUser ? 'Đang lưu...' : 'Lưu Thay Đổi & Cập Nhật Quyền'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
