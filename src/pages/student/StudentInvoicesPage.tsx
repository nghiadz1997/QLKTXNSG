import React, { useEffect, useState, useRef } from 'react';
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
  ShieldCheck,
  Check,
  Copy,
  Upload,
  Camera,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { Modal } from '../../components/common/Modal';
import { paymentService } from '../../services/paymentService';
import { settingsService, DEFAULT_BANK_INFO, type DormBankInfo } from '../../services/settingsService';
import { toast } from 'sonner';
import type { Invoice, InvoiceStatus } from '../../types';

export const StudentInvoicesPage: React.FC = () => {
  const { studentData, userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankInfo, setBankInfo] = useState<DormBankInfo>(DEFAULT_BANK_INFO);

  // Modal payment confirmation
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentType, setPaymentType] = useState<'office' | 'banking'>('banking');
  const [billImage, setBillImage] = useState<string>('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authUid = userProfile?.uid || '';
  const studentDocId = studentData?.uid || '';

  // Real-time Bank Info listener from settings/bankInfo
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'bankInfo'),
      docSnap => {
        if (docSnap.exists()) {
          setBankInfo({ ...DEFAULT_BANK_INFO, ...docSnap.data() } as DormBankInfo);
        }
      },
      err => {
        console.warn('Bank info snapshot error:', err);
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!authUid && !studentDocId) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const invoiceMap = new Map<string, Invoice>();

    const targetUids = Array.from(new Set([authUid, studentDocId].filter(Boolean)));
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

    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timeoutId);
      unsubs.forEach(u => u());
    };
  }, [authUid, studentDocId]);

  const openConfirmPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentType('banking');
    setBillImage('');
    setNote('');
    setPaymentModalOpen(true);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}: ${text}`);
  };

  // Compress and handle image upload to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh (JPEG, PNG, ảnh chụp màn hình).');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 900;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setBillImage(dataUrl);
        toast.success('Đã đính kèm ảnh chụp màn hình bill thành công!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setSubmitting(true);
    const method = paymentType === 'office' ? 'cash' : 'banking';
    const txDescription =
      paymentType === 'office'
        ? 'Đã nộp trực tiếp tại Văn phòng KTX'
        : 'Chuyển khoản KTX (có kèm ảnh chụp màn hình)';

    try {
      await paymentService.submitPayment({
        invoiceId: selectedInvoice.id,
        studentUid: authUid || studentDocId,
        roomId: selectedInvoice.roomId,
        amount: selectedInvoice.totalAmount,
        paymentMethod: method,
        transactionCode: txDescription,
        billImage: billImage,
        note: note.trim(),
        studentEmail: userProfile?.email,
      });

      // Optimistically update invoice status locally
      setInvoices(prev =>
        prev.map(inv =>
          inv.id === selectedInvoice.id ? { ...inv, status: 'pending' as InvoiceStatus } : inv
        )
      );

      toast.success('Đã gửi xác nhận thành công! KTX sẽ đối soát và gạch nợ cho bạn.');
      setPaymentModalOpen(false);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Missing or insufficient permissions') || err.code === 'permission-denied') {
        toast.error(
          'Lỗi quyền hạn (Missing or insufficient permissions). Bạn cần xuất bản (Publish) file firestore.rules lên Firebase Console.'
        );
      } else {
        toast.error('Lỗi khi gửi thông báo: ' + (err.message || 'Vui lòng thử lại sau.'));
      }
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
              Ký Túc Xá Nam Sài Gòn • {studentData?.roomId ? `Phòng ${studentData.roomId}` : 'Chưa phân phòng'}
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
            <span className="font-bold block text-blue-950 mb-0.5">Hướng dẫn đóng tiền:</span>
            Sinh viên đóng tiền trực tiếp tại Văn phòng KTX hoặc chuyển khoản theo thông tin KTX Nam Sài Gòn. Sau khi đóng hoặc chuyển khoản, bấm nút <strong className="text-campus-700">"Xác nhận đã đóng tiền"</strong> bên dưới, chụp màn hình bill tải lên để KTX đối soát và gạch nợ.
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
                        <Clock className="w-4 h-4 mr-1.5 animate-pulse" /> Đã gửi xác nhận (Đang chờ duyệt)
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
            {/* 1. Large Invoice & Total Amount Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase">
                  {isSemesterRoomInvoice(selectedInvoice)
                    ? `Tiền phòng học kỳ (${selectedInvoice.semesterId || 'Trọn kỳ'})`
                    : `Tiền điện nước tháng ${selectedInvoice.month}/${selectedInvoice.year}`}
                </span>
                <span className="font-mono text-xs text-slate-500 mt-0.5 block">
                  Mã HĐ: {selectedInvoice.id}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Số tiền cần đóng:
                </span>
                <span className="text-2xl font-extrabold text-campus-700 font-mono">
                  {selectedInvoice.totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* 2. Choose Payment Method: Simple 2 options */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chọn hình thức bạn đã đóng *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentType('banking')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                    paymentType === 'banking'
                      ? 'bg-campus-50/80 border-campus-500 ring-2 ring-campus-500/20 text-campus-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      paymentType === 'banking'
                        ? 'bg-campus-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold block text-xs">Chuyển Khoản Ngân Hàng</span>
                    <span className="text-[10px] text-slate-500">Chụp màn hình bill gửi lên</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('office')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center space-x-3 ${
                    paymentType === 'office'
                      ? 'bg-campus-50/80 border-campus-500 ring-2 ring-campus-500/20 text-campus-900'
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      paymentType === 'office'
                        ? 'bg-campus-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold block text-xs">Đã Đóng Tại Văn Phòng</span>
                    <span className="text-[10px] text-slate-500">Nộp tiền mặt tại VP KTX</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Details depending on chosen method */}
            {paymentType === 'banking' ? (
              <div className="space-y-3">
                {/* Dormitory Bank Info */}
                <div className="p-3.5 bg-campus-50/70 rounded-2xl border border-campus-200/80 text-campus-950 space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-campus-600" />
                    <span>Thông tin chuyển khoản KÝ TÚC XÁ NAM SÀI GÒN:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Ngân hàng thụ hưởng:</span>
                      <span className="font-bold text-slate-800">{bankInfo.bankName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Số tài khoản:</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-campus-700 text-xs">
                          {bankInfo.accountNumber}
                        </span>
                        {bankInfo.accountNumber &&
                          bankInfo.accountNumber !== 'Liên hệ Văn phòng KTX' && (
                            <button
                              type="button"
                              onClick={() => handleCopyText(bankInfo.accountNumber, 'Số tài khoản')}
                              className="text-slate-400 hover:text-campus-600"
                              title="Sao chép STK"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Tên chủ tài khoản:</span>
                      <span className="font-bold text-slate-800 uppercase">
                        {bankInfo.accountHolder}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upload Bill Screenshot / Photo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chụp Màn Hình Bill Chuyển Khoản Gửi Lên *
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {billImage ? (
                    <div className="relative border border-slate-200 rounded-2xl p-2 bg-slate-50 flex items-center space-x-3">
                      <img
                        src={billImage}
                        alt="Ảnh bill chuyển khoản"
                        className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Đã đính kèm ảnh bill
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Ban quản lý sẽ kiểm tra ảnh này để duyệt hóa đơn cho bạn.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBillImage('')}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                        title="Xóa ảnh"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-campus-300 hover:border-campus-500 bg-campus-50/40 hover:bg-campus-50 rounded-2xl text-center transition space-y-1"
                    >
                      <div className="w-9 h-9 mx-auto rounded-full bg-campus-100 text-campus-600 flex items-center justify-center">
                        <Camera className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-xs text-campus-800 block">
                        Bấm để tải ảnh bill / screenshot chụp màn hình
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Hỗ trợ ảnh chụp màn hình điện thoại hoặc ảnh chụp biên lai
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Office / Cash Payment */
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 text-blue-950 space-y-2">
                <div className="flex items-center space-x-1.5 font-bold text-xs text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Xác nhận đã nộp tiền mặt trực tiếp tại Văn phòng KTX</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Sau khi bạn nộp tiền mặt tại Văn phòng Ban Quản lý KTX Nam Sài Gòn, bấm nút gửi xác nhận bên dưới. Ban Quản lý sẽ đối chiếu với sổ thu tiền mặt và duyệt hóa đơn cho bạn.
                </p>

                {/* Optional receipt upload */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {billImage ? (
                    <div className="relative border border-slate-200 rounded-2xl p-2 bg-white flex items-center space-x-3 mt-1">
                      <img
                        src={billImage}
                        alt="Phiếu thu"
                        className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-bold text-emerald-700">Đã đính kèm ảnh phiếu thu</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBillImage('')}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-1 pt-1"
                    >
                      <Camera className="w-3.5 h-3.5" /> (Tùy chọn) Đính kèm ảnh chụp phiếu thu nếu có
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Note (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                Ghi Chú Thêm (Không bắt buộc)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Đã nộp cho cô Lan / Chuyển từ tài khoản mẹ..."
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
                className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi xác nhận...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Xác Nhận Đã Đóng Tiền</span>
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
