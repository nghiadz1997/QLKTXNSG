import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { Payment } from '../../types';

export const PaymentApprovalPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    setLoading(true);
    try {
      const list = await paymentService.getPayments({
        status: statusFilter || undefined,
      });
      setPayments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const handleConfirm = async (p: Payment) => {
    try {
      await paymentService.confirmPayment(
        p.id,
        userProfile?.uid || 'manager',
        userProfile?.email,
        role || 'manager'
      );
      toast.success(`Đã xác nhận thanh toán cho hóa đơn ${p.invoiceId}! Gạch nợ thành công.`);
      await loadPayments();
    } catch (err: any) {
      toast.error('Lỗi khi xác nhận: ' + err.message);
    }
  };

  const handleReject = async (p: Payment) => {
    const reason = prompt('Nhập lý do từ chối (ví dụ: Không tìm thấy giao dịch sao kê):');
    if (!reason) return;
    try {
      await paymentService.rejectPayment(
        p.id,
        reason,
        userProfile?.uid || 'manager',
        userProfile?.email,
        role || 'manager'
      );
      toast.success('Đã từ chối giao dịch.');
      await loadPayments();
    } catch (err: any) {
      toast.error('Lỗi khi từ chối: ' + err.message);
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">Đã xác nhận</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200">Đã từ chối</span>;
      default:
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">Chờ đối soát</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
          Kế Toán KTX & Đối Soát Ngân Hàng
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Duyệt & Xác Nhận Thanh Toán KTX
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Sinh viên không có quyền tự ý chuyển hóa đơn sang Đã đóng. Chỉ Quản lý KTX mới có thẩm quyền xác nhận thanh toán sau khi đối soát sao kê.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex gap-2 text-xs font-bold">
        {[
          { key: 'pending', label: 'Chờ đối soát' },
          { key: 'confirmed', label: 'Đã xác nhận gạch nợ' },
          { key: 'rejected', label: 'Giao dịch bị từ chối' },
          { key: '', label: 'Tất cả' },
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

      {loading ? (
        <TableSkeleton rows={4} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Không có yêu cầu thanh toán nào"
          description="Hiện tại không có giao dịch nào cần xử lý."
        />
      ) : (
        <Card title={`Danh Sách Giao Dịch (${payments.length})`} subtitle="Kiểm tra mã tham chiếu ngân hàng trước khi bấm Duyệt">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Mã Hóa Đơn</th>
                  <th className="py-3 px-4">Phòng KTX</th>
                  <th className="py-3 px-4 font-extrabold text-slate-900">Số Tiền Nộp</th>
                  <th className="py-3 px-4">Phương Thức</th>
                  <th className="py-3 px-4 font-mono font-bold text-campus-700">Mã Giao Dịch Ngân Hàng</th>
                  <th className="py-3 px-4">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(p.paidAt || p.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.invoiceId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.roomId}</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-sm">
                      {p.amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 uppercase font-semibold text-slate-500">
                      {p.paymentMethod}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-campus-700 bg-campus-50/50 rounded-lg">
                      {p.transactionCode}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'pending' && (
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleConfirm(p)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xác Nhận Đã Nhận</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(p)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold transition flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                        </div>
                      )}
                      {p.status === 'confirmed' && (
                        <span className="text-emerald-600 font-bold text-[11px]">✓ Đã đối soát</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
