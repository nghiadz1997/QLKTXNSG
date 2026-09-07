import React, { useEffect, useState } from 'react';
import { Bell, Plus, Send, Megaphone, Calendar } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { toast } from 'sonner';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  createdBy: string;
  createdAt: string;
}

export const AnnouncementsManagementPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState('Toàn thể sinh viên KTX');
  const [sending, setSending] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Announcement[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        createdBy: userProfile?.displayName || 'Ban Quản Lý KTX',
        createdAt: new Date().toISOString(),
      });

      toast.success('Đã phát hành thông báo KTX thành công!');
      setModalOpen(false);
      setTitle('');
      setContent('');
      await loadAnnouncements();
    } catch (err: any) {
      toast.error('Lỗi khi phát thông báo: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản Lý Thông Báo KTX</h1>
        <TableSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
            <Megaphone className="w-4 h-4" /> Bảng Tin Thông Báo
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Thông Báo Ban Quản Lý KTX
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gửi thông báo về lịch chốt điện nước, hạn nộp tiền phòng, vệ sinh môi trường đến toàn thể sinh viên.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Thông Báo Mới</span>
        </button>
      </div>

      {announcements.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Chưa có thông báo nào"
          description="Bấm 'Tạo Thông Báo Mới' để phát hành tin tức đến sinh viên."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-campus-600 bg-campus-50 px-2.5 py-0.5 rounded-full">
                  {a.targetAudience}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(a.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
              <h3 className="font-extrabold text-base text-slate-900">{a.title}</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {a.content}
              </p>
              <div className="text-[11px] text-slate-400 pt-1">
                Người phát hành: <strong className="text-slate-600">{a.createdBy}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Phát Hành Thông Báo KTX Mới"
          maxWidth="md"
        >
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Đối tượng tiếp nhận *
              </label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              >
                <option value="Toàn thể sinh viên KTX">Toàn thể sinh viên KTX</option>
                <option value="Sinh viên Tòa Nhà A">Sinh viên Tòa Nhà A (Nam)</option>
                <option value="Sinh viên Tòa Nhà B">Sinh viên Tòa Nhà B (Nữ)</option>
                <option value="Sinh viên nợ phí KTX">Sinh viên chưa đóng tiền KTX</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Tiêu đề thông báo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ví dụ: Nhắc nhở hạn nộp tiền điện nước Tháng 09/2026"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Nội dung thông báo chi tiết *
              </label>
              <textarea
                rows={4}
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Nội dung gửi đến sinh viên..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
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
                disabled={sending}
                className="px-5 py-2 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Phát Hành Thông Báo</span>
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
