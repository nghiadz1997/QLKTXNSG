import React, { useEffect, useState } from 'react';
import { Zap, Droplets, ShieldAlert, History, Plus, CheckCircle2, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { pricingService } from '../../services/pricingService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { PricingRule, RoomRate, PricingType } from '../../types';

export const PricingManagementPage: React.FC = () => {
  const { userProfile, currentUser, role } = useAuth();
  const [activeElec, setActiveElec] = useState<PricingRule | null>(null);
  const [activeWater, setActiveWater] = useState<PricingRule | null>(null);
  const [rulesHistory, setRulesHistory] = useState<PricingRule[]>([]);
  const [roomRates, setRoomRates] = useState<RoomRate[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: Update Utility Pricing
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [targetType, setTargetType] = useState<PricingType>('electricity');
  const [newPrice, setNewPrice] = useState<number>(3500);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modal: Create Room Rate
  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [newRoomType, setNewRoomType] = useState('Phòng 4 Người Tiêu Chuẩn');
  const [newRatePrice, setNewRatePrice] = useState<number>(650000);

  const loadData = async () => {
    setLoading(true);
    try {
      const [elec, water, history, rates] = await Promise.all([
        pricingService.getActivePricingRule('electricity'),
        pricingService.getActivePricingRule('water'),
        pricingService.getAllPricingRules(),
        pricingService.getAllRoomRates(),
      ]);
      setActiveElec(elec);
      setActiveWater(water);
      setRulesHistory(history);
      setRoomRates(rates);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenUpdate = (type: PricingType) => {
    setTargetType(type);
    setNewPrice(type === 'electricity' ? (activeElec?.unitPrice || 3500) : (activeWater?.unitPrice || 18000));
    setReason('');
    setUpdateModalOpen(true);
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPrice <= 0) {
      toast.error('Đơn giá phải lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    try {
      await pricingService.updatePricingRule(
        targetType,
        newPrice,
        userProfile?.uid || currentUser?.uid || 'admin',
        userProfile?.email || currentUser?.email || '',
        reason.trim()
      );
      toast.success(`Đã cập nhật đơn giá ${targetType === 'electricity' ? 'Điện' : 'Nước'} thành công! Bản ghi mới đã được tạo và đóng phiên bản cũ.`);
      setUpdateModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi khi lưu đơn giá: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateRoomRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRatePrice <= 0) {
      toast.error('Đơn giá phòng phải lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    try {
      await pricingService.createRoomRate(
        {
          roomType: newRoomType.trim(),
          price: newRatePrice,
          semesterId: 'SEM-2026-1',
        },
        userProfile?.uid || currentUser?.uid || 'admin',
        userProfile?.email || currentUser?.email || ''
      );
      toast.success('Đã thêm mức giá phòng mới!');
      setRateModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản Lý Đơn Giá</h1>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Thẩm Quyền Độc Quyền Của Super Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Bảng Đơn Giá Điện, Nước & Tiền Phòng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quy tắc bất biến: Không ghi đè bản ghi cũ khi thay đổi giá. Hóa đơn đã lập luôn lưu giữ snapshot đơn giá tại thời điểm xuất.
          </p>
        </div>
      </div>

      {/* Active Prices Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Electricity */}
        <div className="bg-white rounded-3xl border border-amber-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                activeElec
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {activeElec ? 'Đang áp dụng' : 'Chưa cấu hình'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">Đơn Giá Điện Sinh Hoạt</h3>
            <p className="text-3xl font-extrabold text-amber-600 font-mono mt-2">
              {activeElec ? activeElec.unitPrice.toLocaleString('vi-VN') : '0'}{' '}
              <span className="text-sm font-semibold text-slate-500">VNĐ / kWh</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Hiệu lực từ: {activeElec?.effectiveFrom ? new Date(activeElec.effectiveFrom).toLocaleDateString('vi-VN') : 'Chưa kích hoạt'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenUpdate('electricity')}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-amber-600/30 transition"
          >
            Điều Chỉnh Giá Điện (Tạo Phiên Bản Mới)
          </button>
        </div>

        {/* Water */}
        <div className="bg-white rounded-3xl border border-cyan-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Droplets className="w-6 h-6" />
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                activeWater
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {activeWater ? 'Đang áp dụng' : 'Chưa cấu hình'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">Đơn Giá Nước Sinh Hoạt</h3>
            <p className="text-3xl font-extrabold text-cyan-600 font-mono mt-2">
              {activeWater ? activeWater.unitPrice.toLocaleString('vi-VN') : '0'}{' '}
              <span className="text-sm font-semibold text-slate-500">VNĐ / m³</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Hiệu lực từ: {activeWater?.effectiveFrom ? new Date(activeWater.effectiveFrom).toLocaleDateString('vi-VN') : 'Chưa kích hoạt'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenUpdate('water')}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/30 transition"
          >
            Điều Chỉnh Giá Nước (Tạo Phiên Bản Mới)
          </button>
        </div>
      </div>

      {/* Room Rates Table */}
      <Card
        title="Bảng Giá Thu Tiền Phòng KTX"
        subtitle="Mức thu tiền phòng áp dụng theo loại hình phòng lưu trú"
        action={
          <button
            type="button"
            onClick={() => setRateModalOpen(true)}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm Mức Giá
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Mã Định Mức</th>
                <th className="py-2.5 px-3">Loại Phòng</th>
                <th className="py-2.5 px-3 font-extrabold text-slate-900">Mức Thu (VNĐ / SV / Tháng)</th>
                <th className="py-2.5 px-3">Thời Điểm Bắt Đầu</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roomRates.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{r.id}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">{r.roomType}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-purple-700 text-sm">
                    {r.price.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {new Date(r.effectiveFrom).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                      {r.status === 'active' ? 'Đang áp dụng' : 'Lưu trữ'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Section XX: Immutable Pricing Rules History */}
      <Card
        title="Lịch Sử Thay Đổi Đơn Giá Điện & Nước"
        subtitle="Mỗi lần điều chỉnh giá sẽ tự động đóng phiên bản cũ và ghi lại phiên bản mới kèm Audit Log"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Loại Dịch Vụ</th>
                <th className="py-2.5 px-3 font-extrabold text-slate-900">Đơn Giá Quy Định</th>
                <th className="py-2.5 px-3">Ngày Bắt Đầu Áp Dụng</th>
                <th className="py-2.5 px-3">Ngày Kết Thúc</th>
                <th className="py-2.5 px-3">Tình Trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rulesHistory.map(rule => (
                <tr key={rule.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-bold flex items-center space-x-1.5">
                    {rule.type === 'electricity' ? (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-amber-800">Điện sinh hoạt</span>
                      </>
                    ) : (
                      <>
                        <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                        <span className="text-cyan-800">Nước sinh hoạt</span>
                      </>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-sm">
                    {rule.unitPrice.toLocaleString('vi-VN')} VNĐ / {rule.type === 'electricity' ? 'kWh' : 'm³'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">
                    {new Date(rule.effectiveFrom).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                    {rule.effectiveTo ? new Date(rule.effectiveTo).toLocaleDateString('vi-VN') : 'Hiện tại (Vô thời hạn)'}
                  </td>
                  <td className="py-2.5 px-3">
                    {rule.effectiveTo === null ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium text-[10px]">
                        Đã kết thúc
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Update Pricing Rule */}
      {updateModalOpen && (
        <Modal
          isOpen={updateModalOpen}
          onClose={() => setUpdateModalOpen(false)}
          title={`Điều Chỉnh Đơn Giá ${targetType === 'electricity' ? 'Điện' : 'Nước'}`}
          maxWidth="md"
        >
          <form onSubmit={handleSavePrice} className="space-y-4">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
              <strong>Nguyên tắc toàn vẹn tài chính:</strong>
              <p className="mt-1">
                Hệ thống sẽ giữ nguyên mức giá cũ cho toàn bộ các hóa đơn đã lập. Mức giá mới này chỉ áp dụng cho các lần chốt số và xuất hóa đơn từ thời điểm này trở đi.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mức Đơn Giá Mới ({targetType === 'electricity' ? 'VNĐ / kWh' : 'VNĐ / m³'}) *
              </label>
              <input
                type="number"
                min={1}
                required
                value={newPrice}
                onChange={e => setNewPrice(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Lý do điều chỉnh (Ghi nhận Audit Log) *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ví dụ: Điều chỉnh theo Quyết định biểu giá điện mới của Bộ Công Thương / EVN..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUpdateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang ghi nhận...</span>
                  </>
                ) : (
                  <span>Áp Dụng Đơn Giá Mới</span>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Create Room Rate */}
      {rateModalOpen && (
        <Modal
          isOpen={rateModalOpen}
          onClose={() => setRateModalOpen(false)}
          title="Thêm Mức Giá Phòng Mới"
          maxWidth="md"
        >
          <form onSubmit={handleCreateRoomRate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Loại hình phòng *
              </label>
              <input
                type="text"
                required
                value={newRoomType}
                onChange={e => setNewRoomType(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mức thu (VNĐ / Sinh viên / Tháng) *
              </label>
              <input
                type="number"
                min={1}
                step={10000}
                required
                value={newRatePrice}
                onChange={e => setNewRatePrice(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition"
              >
                Lưu Mức Giá Phòng
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
