import React, { useEffect, useState } from 'react';
import { Zap, Droplets, Calendar, TrendingUp } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import type { UtilityRecord } from '../../types';

export const StudentUtilitiesPage: React.FC = () => {
  const { studentData } = useAuth();
  const [utilities, setUtilities] = useState<UtilityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const roomId = studentData?.roomId;

  useEffect(() => {
    if (!roomId) {
      setUtilities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = onSnapshot(
      query(collection(db, 'utilities'), where('roomId', '==', roomId)),
      snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as UtilityRecord));
        list.sort((a, b) => b.year - a.year || b.month - a.month);
        setUtilities(list);
        setLoading(false);
      },
      err => {
        console.warn('Realtime student utilities listener:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [roomId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Điện & Nước Phòng KTX</h1>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  if (!roomId) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Zap}
          title="Chưa được xếp phòng KTX"
          description="Hồ sơ của bạn hiện chưa được phân bổ vào phòng cụ thể nên chưa có dữ liệu chỉ số điện nước."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
              Chỉ Số Công Tơ • Phòng {roomId}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Tra Cứu Tiêu Thụ Điện & Nước
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Dữ liệu được lưu trữ độc lập theo từng tháng, không ghi đè lịch sử. Đơn giá áp dụng theo quy định hiện hành.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="px-3 py-2 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-xs font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              Điện: 3.500 đ/kWh
            </div>
            <div className="px-3 py-2 bg-cyan-50 text-cyan-800 rounded-xl border border-cyan-200 text-xs font-bold flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-600" />
              Nước: 18.000 đ/m³
            </div>
          </div>
        </div>
      </div>

      {utilities.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Chưa có dữ liệu điện nước"
          description={`Chưa có ghi nhận chỉ số điện nước cho phòng ${roomId}. Quản lý KTX sẽ chốt chỉ số vào cuối mỗi tháng.`}
        />
      ) : (
        <Card
          title="Lịch Sử Tiêu Thụ Điện & Nước Theo Tháng"
          subtitle="Hiển thị chỉ số cũ, chỉ số mới và thành tiền tương ứng"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Kỳ Tiêu Thụ</th>
                  <th className="py-3 px-4 text-amber-700 bg-amber-50/50">Điện Cũ → Mới</th>
                  <th className="py-3 px-4 text-amber-700 bg-amber-50/50">Tiêu Thụ (kWh)</th>
                  <th className="py-3 px-4 text-amber-700 bg-amber-50/50">Tiền Điện (VNĐ)</th>
                  <th className="py-3 px-4 text-cyan-700 bg-cyan-50/50">Nước Cũ → Mới</th>
                  <th className="py-3 px-4 text-cyan-700 bg-cyan-50/50">Tiêu Thụ (m³)</th>
                  <th className="py-3 px-4 text-cyan-700 bg-cyan-50/50">Tiền Nước (VNĐ)</th>
                  <th className="py-3 px-4 font-extrabold text-slate-900">Tổng Điện Nước</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {utilities.map(u => {
                  const totalUtil = u.electricity.amount + u.water.amount;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>Tháng {u.month}/{u.year}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 bg-amber-50/30">
                        {u.electricity.oldIndex} → {u.electricity.newIndex}
                      </td>
                      <td className="py-3 px-4 font-bold text-amber-700 bg-amber-50/30">
                        {u.electricity.usage} kWh
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 bg-amber-50/30">
                        {u.electricity.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 bg-cyan-50/30">
                        {u.water.oldIndex} → {u.water.newIndex}
                      </td>
                      <td className="py-3 px-4 font-bold text-cyan-700 bg-cyan-50/30">
                        {u.water.usage} m³
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800 bg-cyan-50/30">
                        {u.water.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-4 font-extrabold text-campus-700 font-mono text-base">
                        {totalUtil.toLocaleString('vi-VN')} đ
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
