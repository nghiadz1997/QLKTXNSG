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
  FileText
} from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import type { Invoice } from '../../types';

export const StudentInvoicesPage: React.FC = () => {
  const { studentData, userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const studentUid = studentData?.uid || userProfile?.uid || '';

  useEffect(() => {
    if (!studentUid) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      query(collection(db, 'invoices'), where('studentId', '==', studentUid)),
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setInvoices(list);
        setLoading(false);
      },
      err => {
        console.warn('Realtime student invoices error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [studentUid]);

  const getStatusBadge = (status: string) => {
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
          <Clock className="w-3.5 h-3.5 mr-1" /> Đang đối soát
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
        <Clock className="w-3.5 h-3.5 mr-1" /> Chưa nộp
      </span>
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
              Tra Cứu Chi Phí • {studentData?.roomId ? `Phòng ${studentData.roomId}` : 'Chưa phân phòng'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Thông Tin Tiền Ký Túc Xá
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Hiển thị thông tin chi tiết các khoản chi phí phòng, điện, nước và dịch vụ hàng tháng để sinh viên nắm rõ.
            </p>
          </div>
        </div>

        {/* Informational Guidance Note */}
        <div className="mt-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start space-x-3 text-amber-900">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <span className="font-bold block text-amber-950 mb-0.5">Quy định nộp tiền KTX:</span>
            Mục này chỉ hiển thị thông tin tra cứu số tiền cần nộp. Hệ thống không thu tiền hoặc chuyển khoản trực tiếp trong ứng dụng. Sinh viên theo dõi số tiền và thực hiện nộp theo kênh quy định của Nhà trường / Văn phòng KTX (tiền mặt tại văn phòng hoặc tài khoản chính thức của trường). Cán bộ quản lý sẽ đối soát và cập nhật gạch nợ trên hệ thống sau khi nhận tiền.
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Chưa có thông tin hóa đơn nào"
          description="Hiện tại phòng của bạn chưa có hóa đơn tiền KTX mới nào được phát hành."
        />
      ) : (
        <div className="space-y-4">
          {invoices.map(inv => (
            <div
              key={inv.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-campus-300 transition space-y-4"
            >
              {/* Header card */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-campus-50 text-campus-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Thông Báo Tiền KTX Tháng {inv.month}/{inv.year}
                    </h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono">Mã HĐ: {inv.id}</span>
                      <span>•</span>
                      <span>Phòng: <strong className="text-slate-700">{inv.roomId}</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center space-x-1.5 text-slate-500 mb-1">
                    <Building className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium">Tiền phòng / người</span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm block">
                    {inv.roomFee.toLocaleString('vi-VN')} đ
                  </span>
                </div>

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
                    Vệ sinh, an ninh, rác
                  </span>
                </div>
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-baseline space-x-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Tổng số tiền cần nộp:</span>
                  <span className="text-2xl font-extrabold text-campus-700 font-mono">
                    {inv.totalAmount.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                <div className="text-xs text-slate-500">
                  {inv.status === 'paid' ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Đã hoàn thành đóng tiền theo biên nhận của KTX
                    </span>
                  ) : (
                    <span className="text-slate-600 font-medium">
                      * Vui lòng hoàn tất nộp tiền trước hạn ngày <strong>{inv.dueDate}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
