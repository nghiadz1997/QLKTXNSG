import React, { useEffect, useState } from 'react';
import { Building2, Users, Phone, Calendar, ShieldCheck, CheckCircle } from 'lucide-react';
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import type { Room, RoomMember } from '../../types';

export const MyRoomPage: React.FC = () => {
  const { studentData } = useAuth();
  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loading, setLoading] = useState(true);

  const roomId = studentData?.roomId;

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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
        setLoading(false);
      },
      err => {
        console.warn('Realtime room members listener:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubRoom();
      unsubMembers();
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Phòng KTX Của Tôi</h1>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Building2}
          title="Chưa được xếp phòng KTX"
          description="Hồ sơ của bạn hiện chưa được phân bổ vào phòng cụ thể. Vui lòng liên hệ Ban Quản Lý KTX để được hỗ trợ."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-campus-600 text-white flex items-center justify-center shadow-md shadow-campus-600/20">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
                Ký Túc Xá Đại Học NSG • {room?.buildingId === 'TOA_A' ? 'Tòa A (Nam)' : 'Tòa B (Nữ)'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                Phòng {room?.roomName || room?.roomId || roomId}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Loại phòng: {room?.roomType || 'Phòng tiêu chuẩn'} • Tầng {room?.floor ?? 1}
              </p>
            </div>
          </div>

          {/* Quick Slot Stats */}
          <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="text-center px-3 border-r border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Sức chứa</span>
              <span className="text-lg font-bold text-slate-900">{room?.capacity ?? 0} chỗ</span>
            </div>
            <div className="text-center px-3 border-r border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Đang ở</span>
              <span className="text-lg font-bold text-campus-600">{members.length}</span>
            </div>
            <div className="text-center px-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase block">Còn trống</span>
              <span className="text-lg font-bold text-emerald-600">
                {Math.max(0, (room?.capacity ?? 0) - members.length)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section XI: Room Members Table */}
      <Card
        title="Danh Sách Thành Viên Cùng Phòng"
        subtitle="Thông tin sinh viên đang cùng lưu trú tại phòng của bạn"
      >
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Chưa có thông tin thành viên"
            description="Phòng hiện chưa có danh sách thành viên cập nhật."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">STT</th>
                  <th className="py-3 px-4">Họ và Tên</th>
                  <th className="py-3 px-4">Mã HSSV</th>
                  <th className="py-3 px-4">Lớp</th>
                  <th className="py-3 px-4">Số Điện Thoại</th>
                  <th className="py-3 px-4">Ngày Nhận Phòng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members.map((m, index) => (
                  <tr key={m.studentId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                      <span>{m.fullName}</span>
                      {m.studentId === studentData?.uid && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-campus-50 text-campus-700 rounded-full border border-campus-200">
                          Bạn
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">{m.hssv}</td>
                    <td className="py-3 px-4">{m.className || 'N/A'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <a href={`tel:${m.phone}`} className="hover:text-campus-600 hover:underline flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {m.phone}
                      </a>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {m.checkInDate ? new Date(m.checkInDate).toLocaleDateString('vi-VN') : '01/09/2026'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Dormitory Guidelines Note */}
      <div className="bg-campus-50/60 rounded-3xl p-6 border border-campus-100 flex items-start space-x-4">
        <div className="p-3 bg-white text-campus-600 rounded-2xl shadow-sm border border-campus-100 shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-campus-950">Quy Định Sinh Hoạt Ký Túc Xá</h4>
          <p className="text-xs text-campus-800 leading-relaxed">
            - Tắt thiết bị điện, khóa vòi nước khi ra khỏi phòng để tiết kiệm năng lượng.
            <br />
            - Giữ gìn vệ sinh chung, không làm ồn sau 22h00.
            <br />
            - Mọi sự cố kỹ thuật vui lòng gửi yêu cầu qua chức năng <strong>Yêu cầu hỗ trợ</strong> trên hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};
