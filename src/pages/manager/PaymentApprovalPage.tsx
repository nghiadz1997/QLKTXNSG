import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  Eye,
  Image as ImageIcon,
  Building
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { toast } from 'sonner';
import type { Payment } from '../../types';

export const PaymentApprovalPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  // Modal preview bill image
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    const reason = prompt('Nhập lý do từ chối (ví dụ: Ảnh bill không khớp số tiền, không tìm thấy sao kê...):');
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
          Kế Toán KTX & Đối Soát Thanh Toán
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Duyệt & Xác Nhận Tiền KTX
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kiểm tra ảnh chụp màn hình bill chuyển khoản hoặc phiếu thu tiền mặt do sinh viên gửi lên, sau đó bấm Xác nhận để gạch nợ.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center space-x-2 bg-white p-1.5 rounded-2xl border border-slate-200/80 w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 rounded-xl transition ${
            statusFilter === 'pending'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Chờ đối soát ({payments.filter(p => p.status === 'pending').length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('confirmed')}
          className={`px-4 py-2 rounded-xl transition ${
            statusFilter === 'confirmed'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đã xác nhận
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter('')}
          className={`px-4 py-2 rounded-xl transition ${
            statusFilter === ''
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Không có yêu cầu thanh toán nào"
          description="Hiện tại không có giao dịch nào cần xử lý."
        />
      ) : (
        <Card title={`Danh Sách Giao Dịch (${payments.length})`} subtitle="Bấm vào ảnh bill để phóng to đối soát">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Mã Hóa Đơn</th>
                  <th className="py-3 px-4">Phòng</th>
                  <th className="py-3 px-4 font-extrabold text-slate-900">Số Tiền</th>
                  <th className="py-3 px-4">Hình Thức</th>
                  <th className="py-3 px-4">Ảnh Bill / Screenshot</th>
                  <th className="py-3 px-4">Ghi Chú</th>
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
                    <td className="py-3 px-4">
                      {p.paymentMethod === 'cash' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          <Building className="w-3 h-3" /> Tại văn phòng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-campus-700 bg-campus-50 px-2 py-0.5 rounded">
                          <CreditCard className="w-3 h-3" /> Chuyển khoản
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {p.billImage ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(p.billImage || null)}
                          className="flex items-center space-x-1.5 text-campus-700 hover:text-campus-900 font-bold group"
                        >
                          <img
                            src={p.billImage}
                            alt="Bill"
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 group-hover:scale-105 transition"
                          />
                          <span className="text-[11px] underline">Xem ảnh bill</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Không đính kèm ảnh</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                      {p.note || p.transactionCode || '—'}
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
                            <span>Duyệt Tiền</span>
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
                        <span className="text-emerald-600 font-bold text-[11px]">✓ Đã gạch nợ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Preview Bill Image */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title="Ảnh Chụp Màn Hình Bill / Biên Lai Thanh Toán"
          maxWidth="md"
        >
          <div className="space-y-4 text-center">
            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
              <img
                src={previewImage}
                alt="Chi tiết bill"
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-sm"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
