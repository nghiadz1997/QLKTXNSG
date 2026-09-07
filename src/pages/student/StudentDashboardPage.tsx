import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  CreditCard,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Radio,
  Zap
} from 'lucide-react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card, StatCard } from '../../components/common/Card';
import type { Room, Invoice, RoomMember } from '../../types';

export const StudentDashboardPage: React.FC = () => {
  const { studentData, userProfile } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [latestInvoice, setLatestInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const studentName = studentData?.fullName || userProfile?.displayName || 'Sinh viên';
  const roomId = studentData?.roomId;
  const currentUid = studentData?.uid || userProfile?.uid;

  useEffect(() => {
    setLoading(true);
    const unsubs: (() => void)[] = [];

    // Realtime listener for room and members if assigned
    if (roomId) {
      const unsubRoom = onSnapshot(
        doc(db, 'rooms', roomId),
        docSnap => {
          if (docSnap.exists()) {
            setRoom({ roomId: docSnap.id, ...docSnap.data() } as Room);
          } else {
            setRoom(null);
          }
        },
        err => console.warn('Realtime room listener:', err)
      );
      unsubs.push(unsubRoom);

      const unsubMembers = onSnapshot(
        query(collection(db, 'students'), where('roomId', '==', roomId)),
        snap => {
          const list: RoomMember[] = snap.docs.map(d => {
            const data = d.data();
            return {
              studentId: d.id,
              fullName: data.fullName || '',
              hssv: data.hssv || '',
              className: data.className || '',
              phone: data.phone || '',
              checkInDate: data.checkInDate || data.createdAt || '',
              bedNumber: data.bedNumber,
            };
          });
          setMembers(list);
        },
        err => console.warn('Realtime room members listener:', err)
      );
      unsubs.push(unsubMembers);
    } else {
      setRoom(null);
      setMembers([]);
    }

    // Realtime listener for student invoices
    if (currentUid) {
      const unsubInvoices = onSnapshot(
        query(collection(db, 'invoices'), where('studentId', '==', currentUid)),
        snap => {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice));
          // Sort descending by createdAt or semester
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setLatestInvoice(list[0] || null);
          setLoading(false);
        },
        err => {
          console.warn('Realtime invoices listener:', err);
          setLoading(false);
        }
      );
      unsubs.push(unsubInvoices);
    } else {
      setLoading(false);
    }

    return () => {
      unsubs.forEach(u => u());
    };
  }, [roomId, currentUid]);

  const getInvoiceStatusBadge = (status?: string) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 🟢 ĐÃ ĐÓNG
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <Clock className="w-3.5 h-3.5 mr-1" /> 🔵 ĐANG CHỜ DUYỆT
        </span>
      );
    }
    if (status === 'overdue') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 mr-1" /> 🔴 QUÁ HẠN
        </span>
      );
    }
    if (status === 'unpaid') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 mr-1" /> 🟡 CHƯA ĐÓNG
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> 🟢 KHÔNG CÓ DƯ NỢ
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-campus-700 via-campus-600 to-cyan-600 p-6 sm:p-8 text-white shadow-lg shadow-campus-600/20">
        <div className="relative z-10">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/20 backdrop-blur-md mb-3">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Cổng Thông Tin KTX Sinh Viên NSG
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Xin chào, {studentName}!
          </h1>
          <p className="text-cyan-100 text-sm mt-1 max-w-xl">
            Theo dõi tình trạng phòng ở, thành viên phòng và kiểm tra chi phí sinh hoạt KTX theo thời gian thực.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
          <Building2 className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Primary KPI Stats - Section XXVIII */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="PHÒNG CỦA TÔI"
          value={room?.roomName || (roomId ? `Phòng ${roomId}` : 'Chưa phân phòng')}
          icon={Building2}
          color="blue"
          subtitle={roomId ? (room?.buildingId === 'TOA_A' ? 'Tòa Nhà A (Nam)' : 'Tòa Nhà B (Nữ)') : 'Vui lòng liên hệ BQL'}
        />
        <StatCard
          title="SỐ NGƯỜI TRONG PHÒNG"
          value={roomId ? `${members.length}/${room?.capacity ?? 0}` : '0/0'}
          icon={Users}
          color="cyan"
          subtitle={roomId ? `Còn trống: ${Math.max(0, (room?.capacity ?? 0) - members.length)} chỗ` : 'Chưa xếp phòng'}
        />
        <StatCard
          title="TIỀN KTX THÁNG NÀY"
          value={latestInvoice ? `${(latestInvoice.totalAmount ?? 0).toLocaleString('vi-VN')} đ` : '0 đ'}
          icon={CreditCard}
          color={latestInvoice && latestInvoice.status !== 'paid' ? 'amber' : 'emerald'}
          subtitle={latestInvoice ? `Hóa đơn: ${latestInvoice.id}` : 'Không có dư nợ'}
        />
        <StatCard
          title="HẠN ĐÓNG TIỀN"
          value={latestInvoice?.dueDate || 'Không có'}
          icon={Calendar}
          color={latestInvoice?.status === 'paid' ? 'emerald' : 'rose'}
          subtitle={latestInvoice?.status === 'paid' ? 'Đã thanh toán' : (latestInvoice ? 'Chờ thanh toán' : 'Đã hoàn thành')}
        />
      </div>

      {/* Billing & Room Status Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Summary Box */}
        <div className="lg:col-span-2">
          <Card
            title="Tình Trạng Hóa Đơn & Tài Chính KTX"
            subtitle="Chi tiết chi phí phòng, điện nước tháng hiện tại"
            action={
              <Link
                to="/student/invoices"
                className="text-xs font-bold text-campus-600 hover:text-campus-700 flex items-center gap-1"
              >
                Xem tất cả hóa đơn <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Trạng thái thanh toán</p>
                  <div className="mt-1.5">{getInvoiceStatusBadge(latestInvoice?.status)}</div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Tổng cần thanh toán</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {(latestInvoice?.totalAmount ?? 0).toLocaleString('vi-VN')}{' '}
                    <span className="text-sm font-semibold text-slate-500">VNĐ</span>
                  </p>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Tiền phòng</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {(latestInvoice?.roomFee ?? 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Tiền điện ({latestInvoice?.electricityUsage ?? 0} kWh)</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {(latestInvoice?.electricityFee ?? 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Tiền nước ({latestInvoice?.waterUsage ?? 0} m³)</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {(latestInvoice?.waterFee ?? 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-medium">Phí dịch vụ khác</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {(latestInvoice?.otherFee ?? 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* Informational Footer */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100">
                <p className="text-xs text-slate-500 italic">
                  * Sinh viên theo dõi số tiền và nộp theo thông báo trực tiếp từ Ban Quản Lý KTX.
                </p>
                <Link
                  to="/student/invoices"
                  className="inline-flex items-center text-xs font-bold text-campus-600 hover:text-campus-700 hover:underline"
                >
                  Chi tiết các khoản phí →
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Room Members Preview - Section XI */}
        <div>
          <Card
            title={roomId ? `Thành Viên Phòng ${room?.roomName || roomId}` : 'Thành Viên Phòng'}
            subtitle="Danh sách các sinh viên ở cùng phòng"
            action={
              roomId ? (
                <Link to="/student/room" className="text-xs font-bold text-campus-600 hover:text-campus-700">
                  Chi tiết →
                </Link>
              ) : undefined
            }
          >
            <div className="space-y-3">
              {!roomId ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Bạn chưa được xếp phòng KTX.
                </div>
              ) : members.length > 0 ? (
                members.map((member, idx) => (
                  <div key={member.studentId} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-campus-100 text-campus-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{member.fullName}</p>
                        <p className="text-[11px] text-slate-400">{member.hssv} • {member.className}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">{member.phone}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Chưa có sinh viên nào trong phòng.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/student/support"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-campus-400 hover:shadow-md transition flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Gửi Yêu Cầu Hỗ Trợ</h4>
            <p className="text-xs text-slate-500 mt-0.5">Báo hỏng điện, nước, điều hòa, wifi</p>
          </div>
        </Link>

        <Link
          to="/student/utilities"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-campus-400 hover:shadow-md transition flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Tra Cứu Điện & Nước</h4>
            <p className="text-xs text-slate-500 mt-0.5">Theo dõi chỉ số tiêu thụ theo tháng</p>
          </div>
        </Link>

        <Link
          to="/student/community"
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-campus-400 hover:shadow-md transition flex items-center space-x-4"
        >
          <div className="w-12 h-12 rounded-xl bg-cyanAccent-50 text-cyanAccent-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Cộng Đồng KTX</h4>
            <p className="text-xs text-slate-500 mt-0.5">Thảo luận, chia sẻ tin tức sinh viên</p>
          </div>
        </Link>
      </div>
    </div>
  );
};
