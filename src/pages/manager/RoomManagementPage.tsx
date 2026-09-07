import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Plus,
  Eye,
  Lock,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Phone
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { roomService } from '../../services/roomService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import type { Room, RoomMember, Building } from '../../types';

export const RoomManagementPage: React.FC = () => {
  const { userProfile, currentUser, role } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal: View room members
  const [viewMembersRoom, setViewMembersRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Modal: Create room
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomId: '',
    roomName: '',
    buildingId: 'TOA_A',
    floor: 1,
    capacity: 4,
    roomType: 'Phòng 4 Người Tiêu Chuẩn',
  });
  const [savingRoom, setSavingRoom] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rList, bList] = await Promise.all([
        roomService.getRooms(selectedBuilding || undefined),
        roomService.getBuildings(),
      ]);
      setRooms(rList);
      setBuildings(bList);
    } catch (err) {
      console.error('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBuilding]);

  const handleOpenMembers = async (room: Room) => {
    setViewMembersRoom(room);
    setLoadingMembers(true);
    try {
      const list = await roomService.getRoomMembers(room.roomId);
      setMembers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom.roomId.trim() || !newRoom.roomName.trim() || newRoom.capacity <= 0) {
      toast.error('Vui lòng nhập đầy đủ thông tin phòng hợp lệ.');
      return;
    }

    setSavingRoom(true);
    try {
      await roomService.createRoom(
        {
          ...newRoom,
          roomId: newRoom.roomId.trim().toUpperCase(),
          roomName: newRoom.roomName.trim(),
        },
        userProfile?.uid || currentUser?.uid || 'manager',
        userProfile?.email || currentUser?.email || ''
      );
      toast.success(`Đã tạo phòng ${newRoom.roomId} thành công!`);
      setCreateModalOpen(false);
      setNewRoom({
        roomId: '',
        roomName: '',
        buildingId: 'TOA_A',
        floor: 1,
        capacity: 4,
        roomType: 'Phòng 4 Người Tiêu Chuẩn',
      });
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi khi tạo phòng: ' + err.message);
    } finally {
      setSavingRoom(false);
    }
  };

  const getStatusBadge = (status: Room['status'], available: number) => {
    if (status === 'full' || available === 0) {
      return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold border border-rose-200">Đã đầy</span>;
    }
    if (status === 'maintenance') {
      return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-200">Bảo trì</span>;
    }
    if (status === 'locked') {
      return <span className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-full text-xs font-bold border border-slate-200">Đang khóa</span>;
    }
    return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">Còn chỗ</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
            Cơ Sở Vật Chất & Sức Chứa
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản Lý Phòng Ký Túc Xá
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Hệ thống tự động tính số chỗ trống (availableSlots = capacity - currentOccupants). Chặn xếp phòng khi đã đầy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phòng Mới</span>
        </button>
      </div>

      {/* Building Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lọc Tòa:</span>
        <button
          type="button"
          onClick={() => setSelectedBuilding('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
            selectedBuilding === '' ? 'bg-campus-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Tất cả tòa
        </button>
        {buildings.map(b => (
          <button
            key={b.buildingId}
            type="button"
            onClick={() => setSelectedBuilding(b.buildingId)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedBuilding === b.buildingId ? 'bg-campus-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Chưa có phòng nào"
          description="Bấm 'Thêm Phòng Mới' hoặc kiểm tra bộ dữ liệu khởi tạo."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map(r => (
            <div
              key={r.roomId}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:border-campus-300 hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-campus-600 bg-campus-50 px-2 py-0.5 rounded-md">
                    Tầng {r.floor} • {r.buildingId === 'TOA_A' ? 'Tòa A' : 'Tòa B'}
                  </span>
                  {getStatusBadge(r.status, r.availableSlots)}
                </div>

                <h3 className="font-extrabold text-xl text-slate-900 mt-2">
                  Phòng {r.roomId}
                </h3>
                <p className="text-xs text-slate-400">{r.roomType}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Sĩ số hiện tại:</span>
                  <span className="font-bold text-slate-900">{r.currentOccupants} / {r.capacity}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      r.currentOccupants >= r.capacity ? 'bg-rose-500' : 'bg-campus-500'
                    }`}
                    style={{ width: `${Math.min(100, (r.currentOccupants / r.capacity) * 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Chỗ trống còn lại:</span>
                  <span className={`font-bold ${r.availableSlots > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {r.availableSlots} chỗ
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenMembers(r)}
                className="w-full py-2 bg-slate-50 hover:bg-campus-50 text-slate-700 hover:text-campus-700 font-bold text-xs rounded-xl border border-slate-200/80 transition flex items-center justify-center space-x-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Xem Thành Viên ({r.currentOccupants})</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: View Members */}
      {viewMembersRoom && (
        <Modal
          isOpen={Boolean(viewMembersRoom)}
          onClose={() => setViewMembersRoom(null)}
          title={`Danh Sách Sinh Viên Phòng ${viewMembersRoom.roomId}`}
          maxWidth="lg"
        >
          {loadingMembers ? (
            <TableSkeleton rows={3} />
          ) : members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Phòng đang trống"
              description="Hiện tại chưa có sinh viên nào lưu trú tại phòng này."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">STT</th>
                    <th className="py-2.5 px-3">Họ và Tên</th>
                    <th className="py-2.5 px-3">Mã HSSV</th>
                    <th className="py-2.5 px-3">Lớp</th>
                    <th className="py-2.5 px-3">Số Điện Thoại</th>
                    <th className="py-2.5 px-3">Ngày Vào</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m, i) => (
                    <tr key={m.studentId} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{m.fullName}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-700">{m.hssv}</td>
                      <td className="py-2.5 px-3">{m.className}</td>
                      <td className="py-2.5 px-3 font-mono">{m.phone}</td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {m.checkInDate ? new Date(m.checkInDate).toLocaleDateString('vi-VN') : '01/09/2026'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {/* Modal: Create Room */}
      {createModalOpen && (
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Thêm Phòng Ký Túc Xá Mới"
          maxWidth="md"
        >
          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mã phòng (Duy nhất) *
              </label>
              <input
                type="text"
                required
                value={newRoom.roomId}
                onChange={e => setNewRoom({ ...newRoom, roomId: e.target.value.trim().toUpperCase() })}
                placeholder="Ví dụ: A201"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Tên hiển thị phòng *
              </label>
              <input
                type="text"
                required
                value={newRoom.roomName}
                onChange={e => setNewRoom({ ...newRoom, roomName: e.target.value })}
                placeholder="Ví dụ: Phòng A201 (Tầng 2)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Tòa nhà *
                </label>
                <select
                  value={newRoom.buildingId}
                  onChange={e => setNewRoom({ ...newRoom, buildingId: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                >
                  <option value="TOA_A">Tòa Nhà A</option>
                  <option value="TOA_B">Tòa Nhà B</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Tầng *
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={newRoom.floor}
                  onChange={e => setNewRoom({ ...newRoom, floor: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Sức chứa (Chỗ ở) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  required
                  value={newRoom.capacity}
                  onChange={e => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 4 })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Loại phòng
                </label>
                <input
                  type="text"
                  value={newRoom.roomType}
                  onChange={e => setNewRoom({ ...newRoom, roomType: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingRoom}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {savingRoom ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang tạo...</span>
                  </>
                ) : (
                  <span>Tạo Phòng Mới</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
