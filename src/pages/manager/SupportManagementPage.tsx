import React, { useEffect, useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Building2,
  Send,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supportService } from '../../services/supportService';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';
import type { SupportRequest, SupportStatus } from '../../types';

export const SupportManagementPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Handle modal
  const [selectedReq, setSelectedReq] = useState<SupportRequest | null>(null);
  const [newStatus, setNewStatus] = useState<SupportStatus>('processing');
  const [responseNote, setResponseNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const list = await supportService.getAllRequests({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setRequests(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, priorityFilter]);

  const handleOpenUpdate = (req: SupportRequest) => {
    setSelectedReq(req);
    setNewStatus(req.status === 'new' ? 'received' : req.status);
    setResponseNote(req.responseNote || '');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq) return;

    setUpdating(true);
    try {
      await supportService.updateRequestStatus(
        selectedReq.id,
        newStatus,
        responseNote.trim(),
        userProfile?.uid || 'manager',
        userProfile?.email
      );

      toast.success('Đã cập nhật tiến độ xử lý và gửi phản hồi đến sinh viên!');
      setSelectedReq(null);
      await loadRequests();
    } catch (err: any) {
      toast.error('Lỗi cập nhật: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: SupportStatus) => {
    const map = {
      new: { label: 'Mới gửi', color: 'bg-amber-100 text-amber-800 border-amber-200' },
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
          Kỹ Thuật & Sửa Chữa KTX
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Tiếp Nhận & Xử Lý Yêu Cầu Hỗ Trợ
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Theo dõi các sự cố kỹ thuật điện, nước, điều hòa, an ninh phòng. Phân công xử lý và phản hồi tiến độ cho sinh viên.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-wrap gap-2 text-xs font-bold">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="new">Mới gửi</option>
          <option value="received">Đã tiếp nhận</option>
          <option value="processing">Đang xử lý</option>
          <option value="resolved">Đã hoàn thành</option>
          <option value="closed">Đã đóng</option>
        </select>

        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">Tất cả mức độ</option>
          <option value="urgent">Khẩn cấp</option>
          <option value="normal">Bình thường</option>
        </select>
      </div>

      {loading ? (
        <TableSkeleton rows={4} />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Không có yêu cầu hỗ trợ nào"
          description="Hiện tại không có sự cố nào cần xử lý trong mục này."
        />
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div
              key={req.id}
              className={`bg-white rounded-3xl border p-6 shadow-sm transition space-y-4 ${
                req.priority === 'urgent' ? 'border-rose-300' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                    {req.category}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{req.title}</h3>
                  {req.priority === 'urgent' && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-extrabold rounded-md uppercase">
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

              {/* Student info box */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl">
                <span>Sinh viên: <strong className="text-slate-800">{req.fullName} ({req.hssv})</strong></span>
                <span>•</span>
                <span>Phòng: <strong className="text-campus-600">{req.roomId}</strong></span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <strong className="text-slate-800 font-mono">{req.phone}</strong>
                </span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {req.content}
              </p>

              {req.responseNote && (
                <div className="p-3 bg-slate-50 rounded-2xl text-xs text-slate-600 border border-slate-100">
                  <strong className="block text-slate-800 mb-0.5">Phản hồi hiện tại:</strong>
                  <span>{req.responseNote}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleOpenUpdate(req)}
                  className="px-4 py-2 bg-campus-600 hover:bg-campus-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Xử Lý & Phản Hồi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Process Support */}
      {selectedReq && (
        <Modal
          isOpen={Boolean(selectedReq)}
          onClose={() => setSelectedReq(null)}
          title={`Cập Nhật Xử Lý Yêu Cầu: ${selectedReq.title}`}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Cập nhật trạng thái tiến độ *
              </label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              >
                <option value="received">Đã tiếp nhận (Đang cử thợ/kỹ thuật)</option>
                <option value="processing">Đang sửa chữa / Thay thế thiết bị</option>
                <option value="resolved">Đã hoàn thành sửa chữa</option>
                <option value="closed">Đóng yêu cầu</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Nội dung phản hồi đến sinh viên *
              </label>
              <textarea
                rows={4}
                required
                value={responseNote}
                onChange={e => setResponseNote(e.target.value)}
                placeholder="Ví dụ: Đội kỹ thuật đã kiểm tra và thay thế bóng đèn mới lúc 14h00. Sinh viên kiểm tra lại hoạt động..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {updating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Lưu Trạng Thái & Gửi Phản Hồi</span>
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
