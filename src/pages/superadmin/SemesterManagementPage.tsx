import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { semesterService } from '../../services/semesterService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { Semester } from '../../types';

export const SemesterManagementPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newSemester, setNewSemester] = useState({
    academicYear: '2026-2027',
    semesterName: 'Học kỳ 1',
    startDate: '2026-09-01',
    endDate: '2027-01-15',
    paymentDueDate: '2026-09-30',
    status: 'active' as const,
  });
  const [saving, setSaving] = useState(false);

  const loadSemesters = async () => {
    setLoading(true);
    try {
      const list = await semesterService.getSemesters();
      setSemesters(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSemesters();
  }, []);

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await semesterService.createSemester(
        newSemester,
        userProfile?.uid || 'superAdmin',
        userProfile?.email
      );
      toast.success('Đã tạo học kỳ mới thành công!');
      setModalOpen(false);
      await loadSemesters();
    } catch (err: any) {
      toast.error('Lỗi khi tạo học kỳ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: Semester['status']) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">Đang diễn ra</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold border border-slate-200">Đã kết thúc</span>;
      default:
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-200">Sắp diễn ra</span>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản Lý Học Kỳ</h1>
        <TableSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
            Kế Hoạch Đào Tạo & Lưu Trú
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Quản Lý Niên Khóa & Học Kỳ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thiết lập các mốc thời gian học kỳ và hạn chót nộp tiền KTX tự động thông báo đến sinh viên.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Học Kỳ Mới</span>
        </button>
      </div>

      <Card title={`Danh Sách Học Kỳ (${semesters.length})`} subtitle="Các giai đoạn lưu trú trong năm học">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Năm Học</th>
                <th className="py-3 px-4">Tên Học Kỳ</th>
                <th className="py-3 px-4">Ngày Bắt Đầu</th>
                <th className="py-3 px-4">Ngày Kết Thúc</th>
                <th className="py-3 px-4 font-bold text-rose-700">Hạn Nộp Tiền KTX</th>
                <th className="py-3 px-4">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {semesters.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{s.academicYear}</td>
                  <td className="py-3 px-4 font-semibold text-purple-700">{s.semesterName}</td>
                  <td className="py-3 px-4 text-slate-600">{s.startDate}</td>
                  <td className="py-3 px-4 text-slate-600">{s.endDate}</td>
                  <td className="py-3 px-4 font-bold text-rose-600 font-mono">{s.paymentDueDate}</td>
                  <td className="py-3 px-4">{getStatusBadge(s.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Thêm Học Kỳ KTX Mới"
          maxWidth="md"
        >
          <form onSubmit={handleCreateSemester} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Năm học *
                </label>
                <input
                  type="text"
                  required
                  value={newSemester.academicYear}
                  onChange={e => setNewSemester({ ...newSemester, academicYear: e.target.value })}
                  placeholder="2026-2027"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Tên học kỳ *
                </label>
                <input
                  type="text"
                  required
                  value={newSemester.semesterName}
                  onChange={e => setNewSemester({ ...newSemester, semesterName: e.target.value })}
                  placeholder="Học kỳ 1"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  required
                  value={newSemester.startDate}
                  onChange={e => setNewSemester({ ...newSemester, startDate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Ngày kết thúc *
                </label>
                <input
                  type="date"
                  required
                  value={newSemester.endDate}
                  onChange={e => setNewSemester({ ...newSemester, endDate: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Hạn chót thanh toán tiền KTX (Due Date) *
              </label>
              <input
                type="date"
                required
                value={newSemester.paymentDueDate}
                onChange={e => setNewSemester({ ...newSemester, paymentDueDate: e.target.value })}
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
                Lưu Học Kỳ
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
