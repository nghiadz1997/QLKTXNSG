import React, { useEffect, useState } from 'react';
import { Droplets, Calendar, Plus, Building2, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { utilityService } from '../../services/utilityService';
import { roomService } from '../../services/roomService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import type { UtilityRecord, Room } from '../../types';

export const WaterManagementPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [utilities, setUtilities] = useState<UtilityRecord[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterYear, setFilterYear] = useState<number>(2026);
  const [filterMonth, setFilterMonth] = useState<number>(9);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [waterOld, setWaterOld] = useState<number>(0);
  const [waterNew, setWaterNew] = useState<number>(0);
  const [elecOld, setElecOld] = useState<number>(0);
  const [elecNew, setElecNew] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, rList] = await Promise.all([
        utilityService.getAllUtilities({ year: filterYear, month: filterMonth }),
        roomService.getRooms(),
      ]);
      setUtilities(uList);
      setRooms(rList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterYear, filterMonth]);

  const handleOpenRecordModal = (room?: Room) => {
    const targetId = room ? room.roomId : (rooms[0]?.roomId || '');
    setSelectedRoomId(targetId);

    const existing = utilities.find(u => u.roomId === targetId);
    if (existing) {
      setWaterOld(existing.water.oldIndex);
      setWaterNew(existing.water.newIndex);
      setElecOld(existing.electricity.oldIndex);
      setElecNew(existing.electricity.newIndex);
    } else {
      setWaterOld(500);
      setWaterNew(512);
      setElecOld(1250);
      setElecNew(1320);
    }
    setModalOpen(true);
  };

  const handleSubmitIndices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (waterNew < waterOld) {
      toast.error(`Chỉ số nước mới (${waterNew}) không được nhỏ hơn chỉ số cũ (${waterOld})!`);
      return;
    }

    const targetRoom = rooms.find(r => r.roomId === selectedRoomId);

    setSaving(true);
    try {
      await utilityService.recordUtilities({
        roomId: selectedRoomId,
        buildingId: targetRoom?.buildingId || 'TOA_A',
        year: filterYear,
        month: filterMonth,
        semesterId: 'SEM-2026-1',
        elecOldIndex: elecOld,
        elecNewIndex: elecNew,
        waterOldIndex: waterOld,
        waterNewIndex: waterNew,
        createdByUid: userProfile?.uid || 'manager',
        createdByEmail: userProfile?.email,
        role: role || 'manager',
      });

      toast.success(`Đã lưu chỉ số nước tháng ${filterMonth}/${filterYear} cho phòng ${selectedRoomId}!`);
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi khi lưu: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const calculatedUsage = Math.max(0, waterNew - waterOld);
  const calculatedAmount = calculatedUsage * 18000;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-600">
            Hệ Thống Quản Lý Cấp Nước
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản Lý & Nhập Chỉ Số Nước
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi khối lượng m³ tiêu thụ theo tháng. Tự động tính tiền theo đơn giá hiện hành (18.000 đ/m³).
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenRecordModal()}
          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/30 transition flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi Chỉ Số Nước</span>
        </button>
      </div>

      {/* Month Filter */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-4 text-xs font-bold">
        <span className="text-slate-500 uppercase">Kỳ Chốt Số:</span>
        <div className="flex items-center space-x-2">
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(parseInt(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={e => setFilterYear(parseInt(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-campus-500"
          >
            <option value={2026}>Năm 2026</option>
            <option value={2027}>Năm 2027</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : utilities.length === 0 ? (
        <EmptyState
          icon={Droplets}
          title={`Chưa có dữ liệu nước tháng ${filterMonth}/${filterYear}`}
          description="Bấm 'Ghi Chỉ Số Nước' để nhập chỉ số đồng hồ nước."
        />
      ) : (
        <Card title={`Bảng Chỉ Số Nước Tháng ${filterMonth}/${filterYear}`} subtitle="Đơn giá áp dụng: 18.000 VNĐ / m³">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Phòng KTX</th>
                  <th className="py-3 px-4">Tòa Nhà</th>
                  <th className="py-3 px-4">Chỉ Số Nước Cũ (m³)</th>
                  <th className="py-3 px-4">Chỉ Số Nước Mới (m³)</th>
                  <th className="py-3 px-4 font-extrabold text-cyan-800">Khối Lượng Dùng</th>
                  <th className="py-3 px-4">Đơn Giá</th>
                  <th className="py-3 px-4 font-extrabold text-slate-900">Thành Tiền (VNĐ)</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {utilities.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900 text-sm">
                      Phòng {u.roomId}
                    </td>
                    <td className="py-3 px-4">{u.buildingId === 'TOA_A' ? 'Tòa Nhà A' : 'Tòa Nhà B'}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-600">{u.water.oldIndex}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{u.water.newIndex}</td>
                    <td className="py-3 px-4 font-bold text-cyan-700 text-sm">
                      {u.water.usage} m³
                    </td>
                    <td className="py-3 px-4 font-mono">{u.water.unitPrice.toLocaleString('vi-VN')} đ</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-slate-900 text-sm">
                      {u.water.amount.toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const r = rooms.find(item => item.roomId === u.roomId);
                          handleOpenRecordModal(r);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                      >
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Record Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={`Ghi Nhận Chỉ Số Nước Tháng ${filterMonth}/${filterYear}`}
          maxWidth="md"
        >
          <form onSubmit={handleSubmitIndices} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Chọn Phòng KTX *
              </label>
              <select
                required
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              >
                {rooms.map(r => (
                  <option key={r.roomId} value={r.roomId}>
                    {r.roomName} ({r.currentOccupants}/{r.capacity} sinh viên)
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-cyan-50/50 rounded-2xl border border-cyan-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-cyan-900 uppercase flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-cyan-600" /> Chỉ Số Đồng Hồ Nước (m³)
                </h4>
                <span className="text-[11px] font-semibold text-cyan-700">Đơn giá: 18.000 đ/m³</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Chỉ số cũ *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={waterOld}
                    onChange={e => setWaterOld(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Chỉ số mới *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={waterNew}
                    onChange={e => setWaterNew(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-cyan-200/60">
                <span className="text-slate-600">Khối lượng: <strong className="text-cyan-800">{calculatedUsage} m³</strong></span>
                <span className="text-slate-600">Thành tiền: <strong className="text-slate-900 font-mono">{calculatedAmount.toLocaleString('vi-VN')} đ</strong></span>
              </div>
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
                disabled={saving}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/30 transition flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Chỉ Số Nước</span>
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
