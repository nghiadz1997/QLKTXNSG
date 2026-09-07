import React, { useEffect, useState } from 'react';
import {
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  ShieldAlert,
  Inbox
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supportService } from '../../services/supportService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { SupportRequest, SupportCategory, SupportPriority } from '../../types';

export const StudentSupportPage: React.FC = () => {
  const { studentData } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [category, setCategory] = useState<SupportCategory>('Điện');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<SupportPriority>('normal');
  const [submitting, setSubmitting] = useState(false);

  const isLiving = studentData?.dormStatus === 'living';

  const loadRequests = async () => {
    setLoading(true);
    try {
      if (studentData?.uid) {
        const list = await supportService.getRequestsByStudent(studentData.uid);
        setRequests(list);
      }
    } catch (err) {
      console.error('Error fetching support requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [studentData?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData) return;
    if (!title.trim() || !content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và mô tả sự cố.');
      return;
    }

    setSubmitting(true);
    try {
      await supportService.createRequest(studentData, {
        category,
        title: title.trim(),
        content: content.trim(),
        priority,
      });

      toast.success('Đã gửi yêu cầu hỗ trợ! Đội kỹ thuật KTX sẽ tiếp nhận xử lý.');
      setModalOpen(false);
      setTitle('');
      setContent('');
      setPriority('normal');
      await loadRequests();
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể gửi yêu cầu: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: SupportRequest['status']) => {
    const map = {
      new: { label: 'Chờ tiếp nhận', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      received: { label: 'Đã tiếp nhận', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      processing: { label: 'Đang xử lý', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      resolved: { label: 'Đã hoàn thành', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      closed: { label: 'Đã đóng', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    };
    const current = map[status] || map.new;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${current.color}`}>
        {current.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Yêu Cầu Hỗ Trợ KTX</h1>
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
              Kỹ Thuật & Cơ Sở Vật Chất • {studentData?.roomId ? `Phòng ${studentData.roomId}` : 'Chưa phân phòng'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Yêu Cầu Hỗ Trợ & Báo Hỏng
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Gửi yêu cầu sửa chữa điện, nước, bóng đèn, điều hòa hoặc các vấn đề an ninh phòng ký túc xá.
            </p>
          </div>

          <div>
            <button
              type="button"
              disabled={!isLiving}
              onClick={() => setModalOpen(true)}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center space-x-2 ${
                isLiving
                  ? 'bg-campus-600 hover:bg-campus-700 text-white shadow-campus-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Yêu Cầu Hỗ Trợ Mới</span>
            </button>
            {!isLiving && (
              <p className="text-[11px] text-rose-500 mt-1 text-right">
                * Chỉ sinh viên đang lưu trú mới có quyền gửi yêu cầu.
              </p>
            )}
          </div>
        </div>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Chưa có yêu cầu hỗ trợ nào"
          description="Phòng của bạn hiện không có sự cố nào cần xử lý. Bấm 'Tạo Yêu Cầu Hỗ Trợ Mới' khi phát hiện hỏng hóc."
          action={
            isLiving ? (
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-campus-600 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Gửi sự cố đầu tiên
              </button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div
              key={req.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-campus-300 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                    {req.category}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{req.title}</h3>
                  {req.priority === 'urgent' && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                      Khẩn cấp
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-400">
                    {new Date(req.createdAt).toLocaleString('vi-VN')}
                  </span>
                  <div>{getStatusBadge(req.status)}</div>
                </div>
              </div>

              <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
                {req.content}
              </p>

              {req.responseNote && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block">Phản hồi từ Ban Quản Lý KTX:</strong>
                    <span>{req.responseNote}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Support Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Gửi Yêu Cầu Hỗ Trợ Kỹ Thuật"
          maxWidth="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Auto-filled Student Details - Section XIII */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
              <div>
                <span className="text-slate-400 block font-medium">Họ tên:</span>
                <span className="font-bold text-slate-800">{studentData?.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Mã HSSV:</span>
                <span className="font-bold text-slate-800">{studentData?.hssv}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phòng KTX:</span>
                <span className="font-bold text-campus-600">{studentData?.roomId}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Số điện thoại:</span>
                <span className="font-bold text-slate-800">{studentData?.phone}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Loại sự cố *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
                >
                  <option value="Điện">Điện (Mất điện, cháy bóng, ổ cắm)</option>
                  <option value="Nước">Nước (Rò rỉ, mất nước, vòi hỏng)</option>
                  <option value="Điều hòa">Điều hòa / Quạt trần</option>
                  <option value="Internet">Internet / Wifi phòng</option>
                  <option value="Vệ sinh">Vệ sinh môi trường</option>
                  <option value="Cơ sở vật chất">Cơ sở vật chất (Giường, tủ, khóa cửa)</option>
                  <option value="An ninh">An ninh trật tự</option>
                  <option value="Phòng">Nội bộ phòng</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Mức độ ưu tiên
                </label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
                >
                  <option value="normal">Bình thường</option>
                  <option value="urgent">Khẩn cấp (Cần xử lý ngay)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Tiêu đề ngắn gọn *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Bóng đèn huỳnh quang phòng tắm bị chập"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Mô tả chi tiết sự cố *
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Mô tả cụ thể hiện tượng, vị trí trong phòng và thời điểm xảy ra sự cố..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi Yêu Cầu Hỗ Trợ</span>
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
