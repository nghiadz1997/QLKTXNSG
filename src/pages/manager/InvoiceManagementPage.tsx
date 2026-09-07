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
  Droplets
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { invoiceService } from '../../services/invoiceService';
import { roomService } from '../../services/roomService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import type { Invoice, Room, InvoiceStatus } from '../../types';

export const InvoiceManagementPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterMonth, setFilterMonth] = useState<number>(9);
  const [filterYear, setFilterYear] = useState<number>(2026);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal: Generate Room Invoices
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [roomFeePerStudent, setRoomFeePerStudent] = useState<number>(650000);
  const [otherFeePerStudent, setOtherFeePerStudent] = useState<number>(50000);
  const [dueDate, setDueDate] = useState('2026-09-30');
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invList, roomList] = await Promise.all([
        invoiceService.getAllInvoices({
          month: filterMonth,
          year: filterYear,
          status: statusFilter || undefined,
        }),
        roomService.getRooms(),
      ]);
      setInvoices(invList);
      setRooms(roomList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterMonth, filterYear, statusFilter]);

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error('Vui lòng chọn phòng cần lập hóa đơn.');
      return;
    }

    setGenerating(true);
    try {
      const created = await invoiceService.generateRoomInvoices({
        roomId: selectedRoomId,
        semesterId: 'SEM-2026-1',
        year: filterYear,
        month: filterMonth,
        roomFeePerStudent,
        otherFeePerStudent,
        dueDate,
        createdByUid: userProfile?.uid || 'manager',
        createdByEmail: userProfile?.email,
        role: role || 'manager',
      });

      toast.success(`Đã xuất thành công ${created.length} hóa đơn cho phòng ${selectedRoomId}!`);
      setModalOpen(false);
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

  const totalBilled = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalUnpaid = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
            Tài Chính & Kế Toán KTX
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản Lý Hóa Đơn & Tiền KTX
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lập hóa đơn tự động kèm snapshot đơn giá. Tự động kiểm tra quá hạn và phân chia điện nước cho sinh viên trong phòng.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedRoomId(rooms[0]?.roomId || 'A101');
            setModalOpen(true);
          }}
          className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Lập Hóa Đơn Theo Phòng</span>
        </button>
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
        <span className="text-slate-500 uppercase">Kỳ Hóa Đơn:</span>
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
          <option value="pending">Chờ duyệt</option>
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
          title={`Chưa có hóa đơn tháng ${filterMonth}/${filterYear}`}
          description="Bấm 'Lập Hóa Đơn Theo Phòng' để tạo hóa đơn KTX cho sinh viên lưu trú."
        />
      ) : (
        <Card title={`Danh Sách Hóa Đơn KTX (${invoices.length})`} subtitle="Snapshot đơn giá phòng, điện, nước">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Mã Hóa Đơn</th>
                  <th className="py-3 px-4">Sinh Viên</th>
                  <th className="py-3 px-4">Mã HSSV</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4">Tiền Phòng</th>
                  <th className="py-3 px-4">Tiền Điện</th>
                  <th className="py-3 px-4">Tiền Nước</th>
                  <th className="py-3 px-4">Phí Khác</th>
                  <th className="py-3 px-4 font-extrabold text-slate-900">Tổng Tiền (VNĐ)</th>
                  <th className="py-3 px-4">Hạn Đóng</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{inv.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{inv.studentName || 'Sinh viên'}</td>
                    <td className="py-3 px-4 font-mono">{inv.hssv}</td>
                    <td className="py-3 px-4 font-bold text-campus-600">{inv.roomId}</td>
                    <td className="py-3 px-4 font-mono">{inv.roomFee.toLocaleString('vi-VN')} đ</td>
                    <td className="py-3 px-4 font-mono text-amber-700">
                      {inv.electricityFee.toLocaleString('vi-VN')} đ ({inv.electricityUsage} kWh)
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-700">
                      {inv.waterFee.toLocaleString('vi-VN')} đ ({inv.waterUsage} m³)
                    </td>
                    <td className="py-3 px-4 font-mono">{inv.otherFee.toLocaleString('vi-VN')} đ</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-sm">
                      {inv.totalAmount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{inv.dueDate}</td>
                    <td className="py-3 px-4">{getStatusBadge(inv.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal: Generate Invoices */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Lập Hóa Đơn KTX Tháng ${filterMonth}/${filterYear}`}
          maxWidth="md"
        >
          <form onSubmit={handleGenerateInvoices} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Tiền phòng / sinh viên *
                </label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  required
                  value={roomFeePerStudent}
                  onChange={e => setRoomFeePerStudent(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Phí dịch vụ khác / SV
                </label>
                <input
                  type="number"
                  min={0}
                  step={5000}
                  required
                  value={otherFeePerStudent}
                  onChange={e => setOtherFeePerStudent(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Hạn chót thanh toán (Due Date) *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong>Lưu ý quan trọng:</strong>
              <p>
                - Phòng phải đã được nhập chỉ số điện nước tháng {filterMonth}/{filterYear}.
                <br />
                - Tiền điện nước phòng sẽ tự động chia đều cho các sinh viên đang ở phòng đó.
                <br />
                - Đơn giá điện và nước sẽ được snapshot vào từng hóa đơn.
              </p>
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
                disabled={generating}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang tính toán & xuất HĐ...</span>
                  </>
                ) : (
                  <span>Xuất Hóa Đơn Cho Phòng</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
