import React, { useEffect, useState } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Eye,
  User,
  Users,
  Award,
  Phone,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { registrationService } from '../../services/registrationService';
import { roomService } from '../../services/roomService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { DormRegistration, RegistrationStatus, Room } from '../../types';

export const DormRegistrationPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [registrations, setRegistrations] = useState<DormRegistration[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  // View detail modal
  const [viewDetailReg, setViewDetailReg] = useState<DormRegistration | null>(null);

  // Assign Room Modal
  const [selectedReg, setSelectedReg] = useState<DormRegistration | null>(null);
  const [assignRoomId, setAssignRoomId] = useState('');
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regList, roomList] = await Promise.all([
        registrationService.getAllRegistrations(statusFilter ? (statusFilter as RegistrationStatus) : undefined),
        roomService.getRooms(),
      ]);
      setRegistrations(regList);
      setRooms(roomList);
    } catch (err) {
      console.error('Error loading registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleApprove = async (id: string) => {
    try {
      await registrationService.approveRegistration(
        id,
        userProfile?.uid || 'manager',
        userProfile?.email
      );
      toast.success('Đã duyệt hồ sơ đăng ký!');
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi khi duyệt: ' + err.message);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Nhập lý do từ chối hồ sơ:');
    if (!reason) return;
    try {
      await registrationService.rejectRegistration(
        id,
        reason,
        userProfile?.uid || 'manager',
        userProfile?.email
      );
      toast.success('Đã từ chối đơn đăng ký.');
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi khi từ chối: ' + err.message);
    }
  };

  const handleAssignRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg || !assignRoomId) return;

    setProcessing(true);
    try {
      await registrationService.assignRoomToRegistration(
        selectedReg.id,
        assignRoomId,
        userProfile?.uid || 'manager',
        userProfile?.email
      );
      toast.success(`Đã xếp phòng ${assignRoomId} cho sinh viên ${selectedReg.fullName}!`);
      setSelectedReg(null);
      setAssignRoomId('');
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi xếp phòng: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">Chờ duyệt</span>;
      case 'approved':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">Đã duyệt (Chờ xếp)</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">Đã xếp phòng</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200">Từ chối</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
            Tiếp Nhận Hồ Sơ Sinh Viên
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Xét Duyệt Đăng Ký Ký Túc Xá
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Đơn đăng ký được sinh viên nộp từ trang công khai. Quản lý tiến hành duyệt và xếp vào phòng còn trống.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-wrap gap-2 text-xs font-bold">
        {[
          { key: '', label: 'Tất cả' },
          { key: 'pending', label: 'Chờ xét duyệt' },
          { key: 'approved', label: 'Đã duyệt (Chờ xếp phòng)' },
          { key: 'completed', label: 'Đã xếp phòng hoàn tất' },
          { key: 'rejected', label: 'Bị từ chối' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl transition ${
              statusFilter === tab.key
                ? 'bg-campus-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Registrations List */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : registrations.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Không có hồ sơ nào"
          description="Hiện tại không có đơn đăng ký KTX nào thuộc mục này."
        />
      ) : (
        <Card title={`Danh Sách Đơn Đăng Ký (${registrations.length})`} subtitle="Cập nhật tự động theo thời gian thực">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Thời Gian Nộp</th>
                  <th className="py-3 px-4">Sinh Viên</th>
                  <th className="py-3 px-4">Mã HSSV / CCCD</th>
                  <th className="py-3 px-4">Liên Hệ</th>
                  <th className="py-3 px-4">Khoa / Ngành / Lớp</th>
                  <th className="py-3 px-4">Thời Gian Ở</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{r.fullName}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{r.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-800">{r.hssv}</div>
                      <div className="text-[10px] font-mono text-slate-500">CCCD: {r.cccd || '---'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700">{r.phone}</div>
                      <div className="text-[11px] text-slate-400">{r.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{r.className || 'Chưa lớp'} • {r.major || ''}</div>
                      <div className="text-[10px] text-slate-400">{r.faculty}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{r.desiredStayDuration}</td>
                    <td className="py-3 px-4">
                      {getStatusBadge(r.status)}
                      {r.assignedRoomId && (
                        <span className="block font-bold text-campus-600 mt-0.5">
                          Phòng {r.assignedRoomId}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setViewDetailReg(r)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          title="Xem toàn bộ hồ sơ đăng ký"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>

                        {r.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id)}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold transition flex items-center gap-1"
                              title="Duyệt đơn"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Duyệt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(r.id)}
                              className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold transition flex items-center gap-1"
                              title="Từ chối"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Từ chối</span>
                            </button>
                          </>
                        )}

                        {(r.status === 'approved' || r.status === 'pending') && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReg(r);
                              setAssignRoomId('');
                            }}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold transition flex items-center gap-1"
                            title="Xếp phòng ngay"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Xếp Phòng</span>
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

      {/* Modal: View Full Details of Dorm Registration */}
      {viewDetailReg && (
        <Modal
          isOpen={Boolean(viewDetailReg)}
          onClose={() => setViewDetailReg(null)}
          title={`Hồ Sơ Đơn Xin Vào KTX: ${viewDetailReg.fullName}`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {/* Status overview banner */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-semibold">Mã hồ sơ tiếp nhận:</span>
                <span className="font-mono font-bold text-campus-600 text-sm">{viewDetailReg.id}</span>
              </div>
              <div>{getStatusBadge(viewDetailReg.status)}</div>
            </div>

            {/* I. HSSV */}
            <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-white">
              <h4 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5 text-campus-700">
                <User className="w-4 h-4" />
                <span>I. Thông Tin Học Sinh Sinh Viên</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block">Họ và tên:</span>
                  <span className="font-bold text-slate-800 text-sm">{viewDetailReg.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Mã HSSV:</span>
                  <span className="font-mono font-bold text-slate-800">{viewDetailReg.hssv}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Giới tính:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngày sinh:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dân tộc:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.ethnicity || 'Kinh'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tôn giáo:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.religion || 'Không'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Số CCCD / CMND:</span>
                  <span className="font-mono font-bold text-campus-600">{viewDetailReg.cccd}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngày cấp CCCD:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.cccdDate || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Nơi cấp:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.cccdPlace || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Khoa:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.faculty}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Ngành học:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.major || '---'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Lớp:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.className || '---'}</span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 block">Hộ khẩu thường trú:</span>
                  <span className="font-bold text-slate-800">{viewDetailReg.permanentAddress || viewDetailReg.address}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Điện thoại:</span>
                  <span className="font-mono font-bold text-slate-800">{viewDetailReg.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block">Email:</span>
                  <span className="font-mono font-bold text-slate-800">{viewDetailReg.email}</span>
                </div>
              </div>
            </div>

            {/* II. Gia Đình */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cha */}
              <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                <h4 className="font-black text-xs text-blue-900 border-b border-slate-200 pb-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Thông Tin Cha</span>
                </h4>
                <div className="space-y-1.5">
                  <p><span className="text-slate-400">Họ tên:</span> <strong className="text-slate-800">{viewDetailReg.fatherName || 'Chưa cung cấp'}</strong> ({viewDetailReg.fatherAge ? `${viewDetailReg.fatherAge} tuổi` : ''})</p>
                  <p><span className="text-slate-400">Nghề nghiệp:</span> <strong className="text-slate-800">{viewDetailReg.fatherJob || '---'}</strong></p>
                  <p><span className="text-slate-400">Điện thoại:</span> <strong className="text-slate-800 font-mono">{viewDetailReg.fatherPhone || '---'}</strong></p>
                  <p><span className="text-slate-400">Thường trú:</span> <span className="text-slate-700">{viewDetailReg.fatherPermanentAddress || '---'}</span></p>
                  <p><span className="text-slate-400">Liên hệ:</span> <span className="text-slate-700">{viewDetailReg.fatherContactAddress || '---'}</span></p>
                </div>
              </div>

              {/* Mẹ */}
              <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                <h4 className="font-black text-xs text-rose-900 border-b border-slate-200 pb-1.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-rose-600" />
                  <span>Thông Tin Mẹ</span>
                </h4>
                <div className="space-y-1.5">
                  <p><span className="text-slate-400">Họ tên:</span> <strong className="text-slate-800">{viewDetailReg.motherName || 'Chưa cung cấp'}</strong> ({viewDetailReg.motherAge ? `${viewDetailReg.motherAge} tuổi` : ''})</p>
                  <p><span className="text-slate-400">Nghề nghiệp:</span> <strong className="text-slate-800">{viewDetailReg.motherJob || '---'}</strong></p>
                  <p><span className="text-slate-400">Điện thoại:</span> <strong className="text-slate-800 font-mono">{viewDetailReg.motherPhone || '---'}</strong></p>
                  <p><span className="text-slate-400">Thường trú:</span> <span className="text-slate-700">{viewDetailReg.motherPermanentAddress || '---'}</span></p>
                  <p><span className="text-slate-400">Liên hệ:</span> <span className="text-slate-700">{viewDetailReg.motherContactAddress || '---'}</span></p>
                </div>
              </div>
            </div>

            {/* III. Ưu tiên & Nguyện vọng */}
            <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-white">
              <h4 className="font-black text-xs text-purple-900 border-b border-slate-100 pb-1.5 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <span>Giấy Chứng Nhận Ưu Tiên & Nguyện Vọng</span>
              </h4>
              <div className="space-y-2">
                <p>
                  <span className="text-slate-400 block font-semibold">Các giấy chứng nhận ưu tiên:</span>
                  <span className="font-bold text-slate-800 block bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                    {viewDetailReg.priorityCertificates || 'Không có đối tượng ưu tiên đặc biệt'}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 block">Thời gian mong muốn ở:</span>
                    <span className="font-bold text-slate-800">{viewDetailReg.desiredStayDuration || '1 Năm Học'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Ghi chú nguyện vọng:</span>
                    <span className="font-bold text-slate-800">{viewDetailReg.note || 'Không có'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewDetailReg(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              {viewDetailReg.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => {
                    handleApprove(viewDetailReg.id);
                    setViewDetailReg(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
                >
                  Duyệt Hồ Sơ
                </button>
              )}
              {(viewDetailReg.status === 'pending' || viewDetailReg.status === 'approved') && (
                <button
                  type="button"
                  onClick={() => {
                    const target = viewDetailReg;
                    setViewDetailReg(null);
                    setSelectedReg(target);
                  }}
                  className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs"
                >
                  Xếp Phòng Ngay
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Assign Room to Registration */}
      {selectedReg && (
        <Modal
          isOpen={Boolean(selectedReg)}
          onClose={() => setSelectedReg(null)}
          title={`Phân Phòng Cho Sinh Viên: ${selectedReg.fullName}`}
          maxWidth="md"
        >
          <form onSubmit={handleAssignRoom} className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <p>Họ tên: <strong className="text-slate-900">{selectedReg.fullName}</strong></p>
              <p>Mã HSSV: <strong className="text-slate-900">{selectedReg.hssv}</strong> • CCCD: <strong className="text-slate-900 font-mono">{selectedReg.cccd || '---'}</strong></p>
              <p>Khoa/Ngành: <strong className="text-slate-900">{selectedReg.faculty} - {selectedReg.major || ''}</strong> ({selectedReg.className || 'Chưa lớp'})</p>
              <p>Giới tính: <strong className="text-slate-900">{selectedReg.gender === 'male' ? 'Nam' : 'Nữ'}</strong></p>
              {selectedReg.priorityCertificates && (
                <p className="text-purple-700 font-semibold">Ưu tiên: {selectedReg.priorityCertificates}</p>
              )}
              {selectedReg.note && <p className="text-slate-500 italic">Nguyện vọng: "{selectedReg.note}"</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Chọn Phòng KTX Tiếp Nhận *
              </label>
              <select
                required
                value={assignRoomId}
                onChange={e => setAssignRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              >
                <option value="">-- Chọn phòng còn chỗ --</option>
                {rooms
                  .filter(r => r.availableSlots > 0 && r.status !== 'locked')
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
                onClick={() => setSelectedReg(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={processing || !assignRoomId}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang hoàn tất...</span>
                  </>
                ) : (
                  <span>Xác Nhận Xếp Phòng</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
