import React, { useEffect, useState } from 'react';
import { Building2, Plus, Layers, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { roomService } from '../../services/roomService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { Building } from '../../types';

export const BuildingManagementPage: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newBuilding, setNewBuilding] = useState({
    buildingId: '',
    name: '',
    totalFloors: 4,
    totalRooms: 16,
    genderAllowed: 'male' as const,
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const loadBuildings = async () => {
    setLoading(true);
    try {
      const list = await roomService.getBuildings();
      setBuildings(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBuildings();
  }, []);

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuilding.buildingId.trim() || !newBuilding.name.trim()) {
      toast.error('Vui lòng điền mã và tên tòa nhà.');
      return;
    }

    setSaving(true);
    try {
      await roomService.createBuilding(
        {
          ...newBuilding,
          buildingId: newBuilding.buildingId.trim().toUpperCase(),
          name: newBuilding.name.trim(),
        },
        userProfile?.uid || currentUser?.uid || 'admin',
        userProfile?.email || currentUser?.email || ''
      );
      toast.success(`Đã thêm tòa nhà ${newBuilding.name} thành công!`);
      setModalOpen(false);
      setNewBuilding({
        buildingId: '',
        name: '',
        totalFloors: 4,
        totalRooms: 16,
        genderAllowed: 'male',
        description: '',
      });
      await loadBuildings();
    } catch (err: any) {
      toast.error('Lỗi khi thêm tòa nhà: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản Lý Tòa Nhà</h1>
        <TableSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
            Hạ Tầng Khu Lưu Trú
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản Lý Tòa Nhà Ký Túc Xá
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập danh mục các khu nhà, số tầng, số phòng và phân chia khu nam/nữ.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Tòa Nhà Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {buildings.map(b => (
          <div
            key={b.buildingId}
            className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-campus-300 transition space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900">{b.name}</h3>
                  <span className="font-mono text-xs text-slate-400">Mã tòa: {b.buildingId}</span>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                b.genderAllowed === 'male'
                  ? 'bg-blue-100 text-blue-800'
                  : b.genderAllowed === 'female'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {b.genderAllowed === 'male' ? 'Khu Nam' : b.genderAllowed === 'female' ? 'Khu Nữ' : 'Khu Chung'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {b.description || 'Chưa có mô tả chi tiết cho khu nhà này.'}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Số tầng:</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{b.totalFloors} Tầng</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-medium">Quy mô phòng:</span>
                <span className="font-bold text-slate-900 text-sm mt-0.5 block">{b.totalRooms} Phòng</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Thêm Tòa Nhà Ký Túc Xá Mới"
          maxWidth="md"
        >
          <form onSubmit={handleCreateBuilding} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mã tòa nhà (Duy nhất) *
              </label>
              <input
                type="text"
                required
                value={newBuilding.buildingId}
                onChange={e => setNewBuilding({ ...newBuilding, buildingId: e.target.value.trim().toUpperCase() })}
                placeholder="Ví dụ: TOA_C"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Tên hiển thị tòa nhà *
              </label>
              <input
                type="text"
                required
                value={newBuilding.name}
                onChange={e => setNewBuilding({ ...newBuilding, name: e.target.value })}
                placeholder="Ví dụ: Tòa Nhà C (Khu Dịch Vụ)"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Số tầng *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={newBuilding.totalFloors}
                  onChange={e => setNewBuilding({ ...newBuilding, totalFloors: parseInt(e.target.value) || 1 })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Phân khu đối tượng *
                </label>
                <select
                  value={newBuilding.genderAllowed}
                  onChange={e => setNewBuilding({ ...newBuilding, genderAllowed: e.target.value as any })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                >
                  <option value="male">Khu Nam</option>
                  <option value="female">Khu Nữ</option>
                  <option value="mixed">Khu Hỗn Hợp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mô tả chi tiết
              </label>
              <textarea
                rows={3}
                value={newBuilding.description}
                onChange={e => setNewBuilding({ ...newBuilding, description: e.target.value })}
                placeholder="Mô tả cơ sở vật chất, vị trí trong khuôn viên trường..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
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
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition"
              >
                Lưu Tòa Nhà
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
