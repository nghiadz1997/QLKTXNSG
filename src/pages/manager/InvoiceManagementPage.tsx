import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Calendar,
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Zap,
  Droplets,
  Building,
  Layers,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { invoiceService } from '../../services/invoiceService';
import { roomService } from '../../services/roomService';
import { semesterService } from '../../services/semesterService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import type { Invoice, Room, InvoiceStatus, Semester, InvoiceType } from '../../types';

export const InvoiceManagementPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMonth, setFilterMonth] = useState<number>(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  // Modal: Mode ('utility' for monthly electricity/water, 'room' for semester room fee)
  const [modalType, setModalType] = useState<'utility' | 'room' | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('SEM-2026-1');
  const [roomFeePerStudent, setRoomFeePerStudent] = useState<number>(650000);
  const [otherFeePerStudent, setOtherFeePerStudent] = useState<number>(0);
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, roomList, semList] = await Promise.all([
        invoiceService.getAllInvoices({
          year: filterYear,
          status: statusFilter || undefined,
        }),
        roomService.getRooms(),
        semesterService.getSemesters(),
      ]);

      // Filter by month (if utility or combined)
      let filtered = invList;
      if (filterMonth) {
        filtered = filtered.filter(i => {
          // If semester_room without specific month, keep if year matches
          if (i.invoiceType === 'semester_room' && i.month === 0) return true;
          return i.month === filterMonth;
        });
      }
      if (typeFilter) {
        filtered = filtered.filter(i => {
          if (typeFilter === 'semester_room') {
            return i.invoiceType === 'semester_room' || i.id.includes('ROOM');
          }
          if (typeFilter === 'monthly_utility') {
            return i.invoiceType === 'monthly_utility' || i.id.includes('UTIL');
          }
          return true;
        });
      }

      setInvoices(filtered);
      setRooms(roomList);
      setSemesters(semList);
      if (semList.length > 0 && !selectedSemesterId) {
        setSelectedSemesterId(semList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMonth, filterYear, statusFilter, typeFilter]);

  const handleOpenUtilityModal = () => {
    setSelectedRoomId(rooms[0]?.roomId || '');
    setOtherFeePerStudent(0);
    setDueDate(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setModalType('utility');
  };

  const handleOpenRoomModal = () => {
    setSelectedRoomId(rooms[0]?.roomId || '');
    setRoomFeePerStudent(650000);
    setDueDate(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setModalType('room');
  };

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error('Vui lòng chọn phòng cần lập hóa đơn.');
      return;
    }

    setGenerating(true);
    try {
      if (modalType === 'utility') {
        // Generate monthly electricity & water invoice (roomFee = 0)
        const created = await invoiceService.generateRoomUtilityInvoices({
          roomId: selectedRoomId,
          semesterId: selectedSemesterId || 'SEM-2026-1',
          year: filterYear,
          month: filterMonth,
          otherFeePerStudent,
          dueDate,
          createdByUid: userProfile?.uid || 'manager',
          createdByEmail: userProfile?.email,
          role: role || 'manager',
        });

        toast.success(`Đã xuất thành công ${created.length} hóa đơn điện nước tháng ${filterMonth}/${filterYear} cho phòng ${selectedRoomId}!`);
      } else if (modalType === 'room') {
        // Generate fixed semester room fee invoice
        const sem = semesters.find(s => s.id === selectedSemesterId);
        const semName = sem ? `${sem.semesterName} (${sem.academicYear})` : selectedSemesterId;

        const created = await invoiceService.generateSemesterRoomInvoices({
          roomId: selectedRoomId,
          semesterId: selectedSemesterId || 'SEM-2026-1',
          semesterName: semName,
          year: filterYear,
          roomFeePerStudent,
          dueDate,
          createdByUid: userProfile?.uid || 'manager',
          createdByEmail: userProfile?.email,
          role: role || 'manager',
        });

        toast.success(`Đã xuất thành công ${created.length} hóa đơn tiền phòng ${semName} cho phòng ${selectedRoomId}!`);
      }

      setModalType(null);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể lập hóa đơn: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">Đã đóng</span>;
      case 'pending':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">Chờ duyệt TT</span>;
      case 'overdue':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200">Quá hạn</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">Chưa đóng</span>;
    }
  };

  const isSemesterRoomInvoice = (inv: Invoice) => {
    return (
      inv.invoiceType === 'semester_room' ||
      inv.id.includes('ROOM') ||
      (inv.roomFee > 0 && inv.electricityFee === 0 && inv.waterFee === 0)
    );
  };

  const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalUnpaid = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
            Tài Chính & Kế Toán KTX
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản Lý Hóa Đơn & Tiền KTX
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quy định KTX: <strong>Tiền phòng cố định thu theo học kỳ</strong>. <strong>Điện nước tính theo số công tơ thu hàng tháng</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenRoomModal}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 transition flex items-center space-x-2"
          >
            <Building className="w-4 h-4" />
            <span>Lập Tiền Phòng Học Kỳ</span>
          </button>

          <button
            type="button"
            onClick={handleOpenUtilityModal}
            className="px-4 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Lập Điện Nước Hàng Tháng</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold block uppercase">Tổng tiền hóa đơn</span>
            <span className="text-lg font-extrabold text-slate-900 mt-0.5 block font-mono">
              {totalBilled.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <CreditCard className="w-8 h-8 text-campus-500" />
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold block uppercase">Đã thu (Thực tế)</span>
            <span className="text-lg font-extrabold text-emerald-600 mt-0.5 block font-mono">
              {totalPaid.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-bold block uppercase">Công nợ chưa thu</span>
            <span className="text-lg font-extrabold text-amber-600 mt-0.5 block font-mono">
              {totalUnpaid.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-wrap items-center gap-3 text-xs font-bold">
        <span className="text-slate-500 uppercase">Loại Thu:</span>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">Tất cả loại hóa đơn</option>
          <option value="semester_room">Tiền phòng Học kỳ</option>
          <option value="monthly_utility">Điện nước hàng tháng</option>
        </select>

        <span className="text-slate-500 uppercase ml-2">Kỳ Tháng:</span>
        <select
          value={filterMonth}
          onChange={e => setFilterMonth(parseInt(e.target.value))}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>Tháng {m}</option>
          ))}
        </select>
        <select
          value={filterYear}
          onChange={e => setFilterYear(parseInt(e.target.value))}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value={2026}>Năm 2026</option>
          <option value={2027}>Năm 2027</option>
        </select>

        <span className="text-slate-500 uppercase ml-2">Trạng Thái:</span>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="unpaid">Chưa đóng</option>
          <option value="pending">Chờ duyệt TT</option>
          <option value="paid">Đã đóng</option>
          <option value="overdue">Quá hạn</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={`Chưa có hóa đơn nào phù hợp bộ lọc`}
          description="Bấm 'Lập Tiền Phòng Học Kỳ' hoặc 'Lập Điện Nước Hàng Tháng' để tạo hóa đơn KTX cho sinh viên."
        />
      ) : (
        <Card title={`Danh Sách Hóa Đơn KTX (${invoices.length})`} subtitle="Phân chia rõ ràng: Tiền phòng học kỳ & Điện nước tháng">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Loại HĐ</th>
                  <th className="py-3 px-4">Mã Hóa Đơn</th>
                  <th className="py-3 px-4">Sinh Viên</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4">Tiền Phòng (Kỳ)</th>
                  <th className="py-3 px-4">Tiền Điện</th>
                  <th className="py-3 px-4">Tiền Nước</th>
                  <th className="py-3 px-4">Phí Khác</th>
                  <th className="py-3 px-4 font-extrabold text-slate-900">Tổng Tiền</th>
                  <th className="py-3 px-4">Hạn Đóng</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => {
                  const isRoom = isSemesterRoomInvoice(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        {isRoom ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800">
                            Tiền Phòng Kỳ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                            Điện Nước Tháng
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{inv.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inv.studentName || 'Sinh viên'}</div>
                        <div className="font-mono text-[10px] text-slate-400">{inv.hssv}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-campus-600">{inv.roomId}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-blue-700">
                        {inv.roomFee > 0 ? `${inv.roomFee.toLocaleString('vi-VN')} đ` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-amber-700">
                        {inv.electricityFee > 0 ? (
                          <>
                            {inv.electricityFee.toLocaleString('vi-VN')} đ
                            <span className="text-[10px] text-slate-400 block font-normal">({inv.electricityUsage} kWh)</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-700">
                        {inv.waterFee > 0 ? (
                          <>
                            {inv.waterFee.toLocaleString('vi-VN')} đ
                            <span className="text-[10px] text-slate-400 block font-normal">({inv.waterUsage} m³)</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {inv.otherFee > 0 ? `${inv.otherFee.toLocaleString('vi-VN')} đ` : '—'}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-sm">
                        {inv.totalAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-medium">{inv.dueDate}</td>
                      <td className="py-3 px-4">{getStatusBadge(inv.status)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Generate Invoices */}
      {modalType && (
        <Modal
          isOpen={!!modalType}
          onClose={() => setModalType(null)}
          title={
            modalType === 'utility'
              ? `Lập Hóa Đơn Điện Nước Hàng Tháng (${filterMonth}/${filterYear})`
              : 'Lập Hóa Đơn Tiền Phòng Cố Định Theo Học Kỳ'
          }
          maxWidth="md"
        >
          <form onSubmit={handleGenerateInvoices} className="space-y-4 text-xs">
            {/* Room selection */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Chọn Phòng Cần Lập Hóa Đơn *
              </label>
              <select
                required
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              >
                {rooms.map(r => (
                  <option key={r.roomId} value={r.roomId}>
                    {r.roomName} ({r.currentOccupants} sinh viên đang ở)
                  </option>
                ))}
              </select>
            </div>

            {/* Semester selector */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Học Kỳ Áp Dụng *
              </label>
              <select
                value={selectedSemesterId}
                onChange={e => setSelectedSemesterId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                {semesters.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.semesterName} - Năm học {s.academicYear} ({s.status})
                  </option>
                ))}
                {semesters.length === 0 && (
                  <option value="SEM-2026-1">Học kỳ 1 (2026-2027)</option>
                )}
              </select>
            </div>

            {modalType === 'room' ? (
              /* Fields for Semester Room Fee */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                    Mức Tiền Phòng Cố Định Cả Kỳ / Sinh Viên (VNĐ) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    required
                    value={roomFeePerStudent}
                    onChange={e => setRoomFeePerStudent(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-blue-700"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    * Khoản phí này sinh viên chỉ đóng 1 lần cố định cho trọn học kỳ.
                  </span>
                </div>
              </div>
            ) : (
              /* Fields for Monthly Electricity & Water */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Tháng Thu Điện Nước
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`Tháng ${filterMonth} / ${filterYear}`}
                      className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Phí Vệ Sinh/Rác/SV (VNĐ)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={5000}
                      value={otherFeePerStudent}
                      onChange={e => setOtherFeePerStudent(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <strong>Cơ chế tính điện nước tháng:</strong>
                  <p>
                    - Tiền điện nước được tính tự động từ số công tơ tháng {filterMonth}/{filterYear} đã nhập của phòng.
                    <br />
                    - Tiền điện và nước sẽ được chia đều cho các sinh viên đang ở trong phòng.
                    <br />
                    - Hóa đơn này <strong>không bao gồm tiền phòng</strong> (vì tiền phòng đóng cố định theo học kỳ).
                  </p>
                </div>
              </div>
            )}

            {/* Due date */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Hạn Chót Thanh Toán *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={generating}
                className={`px-5 py-2 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-2 ${
                  modalType === 'room'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
                    : 'bg-campus-600 hover:bg-campus-700 shadow-campus-600/30'
                }`}
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xuất HĐ...</span>
                  </>
                ) : (
                  <span>
                    {modalType === 'room' ? 'Xuất HĐ Tiền Phòng Kỳ' : 'Xuất HĐ Điện Nước Tháng'}
                  </span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
