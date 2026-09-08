import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  Building,
  Zap,
  Droplet,
  FileText,
  Send,
  HelpCircle,
  ShieldCheck,
  Check
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { paymentService } from '../../services/paymentService';
import { toast } from 'sonner';
import type { Invoice, InvoiceStatus } from '../../types';

export const StudentInvoicesPage: React.FC = () => {
  const { studentData, userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal payment confirmation
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'banking' | 'cash' | 'momo'>('banking');
  const [transactionCode, setTransactionCode] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const studentUid = studentData?.uid || userProfile?.uid || '';
  const authUid = userProfile?.uid || '';

  useEffect(() => {
    if (!studentUid && !authUid) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const invoiceMap = new Map<string, Invoice>();

    // Listen by studentUid or studentId
    const targetUids = Array.from(new Set([studentUid, authUid].filter(Boolean)));
    const unsubs: (() => void)[] = [];

    targetUids.forEach(uid => {
      // 1. Where studentUid == uid
      const unsub1 = onSnapshot(
        query(collection(db, 'invoices'), where('studentUid', '==', uid)),
        snap => {
          snap.docs.forEach(d => invoiceMap.set(d.id, { id: d.id, ...d.data() } as Invoice));
          updateSortedList();
        },
        err => console.warn('Realtime studentUid invoices error:', err)
      );
      unsubs.push(unsub1);

      // 2. Where studentId == uid
      const unsub2 = onSnapshot(
        query(collection(db, 'invoices'), where('studentId', '==', uid)),
        snap => {
          snap.docs.forEach(d => invoiceMap.set(d.id, { id: d.id, ...d.data() } as Invoice));
          updateSortedList();
        },
        err => console.warn('Realtime studentId invoices error:', err)
      );
      unsubs.push(unsub2);
    });

    const updateSortedList = () => {
      const list = Array.from(invoiceMap.values());
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setInvoices(list);
      setLoading(false);
    };

    // Safety timeout in case no documents returned
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
      unsubs.forEach(u => u());
    };
  }, [studentUid, authUid]);

  const openConfirmPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod('banking');
    setTransactionCode('');
    setNote('');
    setPaymentModalOpen(true);
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    if (!transactionCode.trim()) {
      toast.error('Vui lòng nhập mã giao dịch hoặc thông tin biên lai.');
      return;
    }

    setSubmitting(true);
    try {
      await paymentService.submitPayment({
        invoiceId: selectedInvoice.id,
        studentUid: studentUid || authUid,
        roomId: selectedInvoice.roomId,
        amount: selectedInvoice.totalAmount,
        paymentMethod: paymentMethod,
        transactionCode: transactionCode.trim() + (note ? ` (${note.trim()})` : ''),
        studentEmail: userProfile?.email,
      });

      toast.success('Đã gửi thông báo xác nhận đã đóng tiền! KTX sẽ đối soát và duyệt cho bạn.');
      setPaymentModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi gửi thông báo: ' + (err.message || 'Vui lòng thử lại sau.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Đã hoàn tất đóng tiền
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Clock className="w-3.5 h-3.5 mr-1" /> Đang đối soát (Chờ KTX duyệt)
        </span>
      );
    }
    if (status === 'overdue') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 mr-1" /> Quá hạn nộp
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 mr-1" /> Chưa đóng tiền
      </span>
    );
  };

  const isSemesterRoomInvoice = (inv: Invoice) => {
    return (
      inv.invoiceType === 'semester_room' ||
      inv.id.includes('ROOM') ||
      (inv.roomFee > 0 && inv.electricityFee === 0 && inv.waterFee === 0)
    );
  };

  const isMonthlyUtilityInvoice = (inv: Invoice) => {
    return (
      inv.invoiceType === 'monthly_utility' ||
      inv.id.includes('UTIL') ||
      inv.roomFee === 0
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Tra Cứu Tiền KTX & Hóa Đơn</h1>
        <TableSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
              Ký Túc Xá • {studentData?.roomId ? `Phòng ${studentData.roomId}` : 'Chưa phân phòng'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Tra Cứu & Xác Nhận Đóng Tiền KTX
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Tiền phòng cố định đóng theo học kỳ. Tiền điện & nước thu hàng tháng theo chỉ số công tơ thực tế của phòng.
            </p>
          </div>
        </div>

        {/* Informational Guidance Note */}
        <div className="mt-4 p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start space-x-3 text-blue-900">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold block text-blue-950 mb-0.5">Quy trình đóng tiền & xác nhận:</span>
            Sinh viên thực hiện nộp tiền phòng (theo kỳ) và điện nước (hàng tháng) qua hình thức chuyển khoản KTX hoặc nộp trực tiếp tại Văn phòng KTX. Sau khi nộp, bấm nút <strong className="text-campus-700">"Xác nhận đã đóng tiền"</strong> bên dưới hóa đơn và điền mã giao dịch / thông tin biên lai. Cán bộ quản lý KTX sẽ đối soát sao kê và duyệt gạch nợ chính thức trên hệ thống.
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Chưa có thông tin hóa đơn nào"
          description="Hiện tại phòng của bạn chưa có thông báo hóa đơn KTX nào cần thanh toán."
        />
      ) : (
        <div className="space-y-5">
          {invoices.map(inv => {
            const isRoomOnly = isSemesterRoomInvoice(inv);
            const isUtilityOnly = isMonthlyUtilityInvoice(inv);

            return (
              <div
                key={inv.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-campus-300 transition space-y-4"
              >
                {/* Header card */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                        isRoomOnly
                          ? 'bg-blue-50 text-blue-600'
                          : isUtilityOnly
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-campus-50 text-campus-600'
                      }`}
                    >
                      {isRoomOnly ? (
                        <Building className="w-6 h-6" />
                      ) : isUtilityOnly ? (
                        <Zap className="w-6 h-6" />
                      ) : (
                        <FileText className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900">
                          {inv.title ||
                            (isRoomOnly
                              ? `Hóa Đơn Tiền Phòng Học Kỳ (${inv.semesterId || 'Kỳ này'})`
                              : isUtilityOnly
                              ? `Hóa Đơn Điện & Nước Tháng ${inv.month}/${inv.year}`
                              : `Hóa Đơn Tiền KTX Tháng ${inv.month}/${inv.year}`)}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isRoomOnly
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isRoomOnly ? 'Đóng theo Học kỳ' : 'Thu hàng tháng'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                        <span className="font-mono">Mã HĐ: {inv.id}</span>
                        <span>•</span>
                        <span>
                          Phòng: <strong className="text-slate-700">{inv.roomId}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-left lg:text-right">
                      <span className="text-xs text-slate-400 block">Hạn đóng tiền:</span>
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {inv.dueDate}
                      </span>
                    </div>
                    <div>{getStatusBadge(inv.status)}</div>
                  </div>
                </div>

                {/* Fee Breakdown Details */}
                {isRoomOnly ? (
                  /* Semester Room Fee Details */
                  <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-blue-100/80 rounded-xl text-blue-700">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">
                          Tiền Phòng KTX Cố Định Học Kỳ ({inv.semesterId || 'Trọn kỳ'})
                        </span>
                        <span className="text-slate-500">
                          Khoản thu cố định theo định mức kỳ của loại phòng đang lưu trú.
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-400 block">Số tiền phòng:</span>
                      <span className="text-base font-bold text-blue-800 font-mono">
                        {inv.roomFee.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Monthly Utility Fee Details (Electricity & Water) */
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-medium">Tiền điện ({inv.electricityUsage} kWh)</span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {inv.electricityFee.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Đơn giá: {inv.electricityUnitPrice?.toLocaleString('vi-VN')} đ/kWh
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                        <Droplet className="w-3.5 h-3.5 text-cyan-500" />
                        <span className="font-medium">Tiền nước ({inv.waterUsage} m³)</span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {inv.waterFee.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Đơn giá: {inv.waterUnitPrice?.toLocaleString('vi-VN')} đ/m³
                      </span>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                        <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                        <span className="font-medium">Phí dịch vụ khác</span>
                      </div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {inv.otherFee.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Vệ sinh, an ninh, rác thải
                      </span>
                    </div>
                  </div>
                )}

                {/* Total Row & Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Tổng tiền cần nộp:
                    </span>
                    <span className="text-2xl font-extrabold text-campus-700 font-mono">
                      {inv.totalAmount.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {inv.status === 'paid' ? (
                      <div className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <Check className="w-4 h-4 mr-1.5" /> Đã hoàn tất đóng tiền
                      </div>
                    ) : inv.status === 'pending' ? (
                      <div className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                        <Clock className="w-4 h-4 mr-1.5 animate-pulse" /> Đã gửi thông báo đóng tiền (Đang chờ duyệt)
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openConfirmPaymentModal(inv)}
                        className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
                      >
                        <Send className="w-4 h-4" />
                        <span>Xác Nhận Đã Đóng Tiền</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Confirm Payment */}
      {paymentModalOpen && selectedInvoice && (
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title="Xác Nhận Đã Đóng Tiền KTX"
          maxWidth="md"
        >
          <form onSubmit={handleSubmitPaymentProof} className="space-y-4 text-xs">
            {/* Invoice summary */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Hóa đơn:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedInvoice.id}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Khoản thu:</span>
                <span className="font-bold text-slate-900">
                  {isSemesterRoomInvoice(selectedInvoice)
                    ? `Tiền phòng học kỳ (${selectedInvoice.semesterId || ''})`
                    : `Tiền điện & nước tháng ${selectedInvoice.month}/${selectedInvoice.year}`}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-600 font-bold uppercase">Số tiền thanh toán:</span>
                <span className="text-xl font-extrabold text-campus-700 font-mono">
                  {selectedInvoice.totalAmount.toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            {/* Dormitory Account Details */}
            <div className="p-3.5 bg-campus-50/70 rounded-2xl border border-campus-200 text-campus-900 space-y-1.5">
              <div className="flex items-center space-x-1.5 font-bold text-campus-950">
                <ShieldCheck className="w-4 h-4 text-campus-600" />
                <span>Thông tin chuyển khoản KTX Trường Cao Thắng / NSG:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Ngân hàng thụ hưởng:</span>
                  <span className="font-bold text-slate-800">Agribank / Vietcombank</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Số tài khoản KTX:</span>
                  <span className="font-bold text-campus-700 font-mono text-xs">1600205268888</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 block">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-800 uppercase">KÝ TÚC XÁ CAO ĐẲNG KỸ THUẬT CAO THẮNG</span>
                </div>
                <div className="sm:col-span-2 bg-white/70 p-2 rounded-xl border border-campus-200/60">
                  <span className="text-slate-500 block text-[10px]">Cú pháp chuyển khoản khuyến nghị:</span>
                  <span className="font-mono font-bold text-campus-800">
                    {studentData?.hssv || 'MSSV'} {selectedInvoice.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Select */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Phương Thức Bạn Đã Đóng *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('banking')}
                  className={`py-2 px-2.5 rounded-xl border text-center font-bold transition text-xs ${
                    paymentMethod === 'banking'
                      ? 'bg-campus-600 text-white border-campus-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Chuyển khoản
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`py-2 px-2.5 rounded-xl border text-center font-bold transition text-xs ${
                    paymentMethod === 'momo'
                      ? 'bg-campus-600 text-white border-campus-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Ví MoMo/QR
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-2 px-2.5 rounded-xl border text-center font-bold transition text-xs ${
                    paymentMethod === 'cash'
                      ? 'bg-campus-600 text-white border-campus-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tiền mặt tại VP
                </button>
              </div>
            </div>

            {/* Transaction Reference / Code */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mã Giao Dịch / Số Bút Toán / Tên Người Nộp *
              </label>
              <input
                type="text"
                required
                placeholder={
                  paymentMethod === 'cash'
                    ? 'Ví dụ: Đã nộp tiền mặt tại VP KTX cho thầy/cô...'
                    : 'Ví dụ: FT2609088899 hoặc mã giao dịch trên app ngân hàng'
                }
                value={transactionCode}
                onChange={e => setTransactionCode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Ghi Chú Thêm (Không bắt buộc)
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú thêm số tài khoản người gửi hoặc thời gian chuyển tiền..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi xác nhận...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Xác Nhận Đã Đóng</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
