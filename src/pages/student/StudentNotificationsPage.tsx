import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Clock, FileText, Wrench, CreditCard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { Notification } from '../../types';

export const StudentNotificationsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = userProfile?.uid || '';

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const list = await notificationService.getUserNotifications(uid);
      setNotifications(list);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [uid]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      toast.success('Đã đánh dấu đã đọc');
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'invoice':
      case 'payment':
        return <CreditCard className="w-5 h-5 text-amber-500" />;
      case 'support':
        return <Wrench className="w-5 h-5 text-rose-500" />;
      default:
        return <Bell className="w-5 h-5 text-campus-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Thông Báo Của Tôi</h1>
        <TableSkeleton rows={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-campus-600 text-white flex items-center justify-center shadow-md shadow-campus-600/20">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
              Hộp Thư Thông Báo
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Thông Báo Ký Túc Xá
            </h1>
          </div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Không có thông báo mới"
          description="Tất cả các thông báo tiền phòng, hạn đóng và tin tức KTX sẽ hiển thị tại đây."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map(item => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition flex items-start justify-between gap-4 ${
                item.isRead
                  ? 'bg-white border-slate-200/80 text-slate-600'
                  : 'bg-campus-50/40 border-campus-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-100 shrink-0">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.message}</p>
                  <span className="text-[11px] text-slate-400 mt-2 block flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(item.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              </div>

              {!item.isRead && (
                <button
                  type="button"
                  onClick={() => handleMarkAsRead(item.id)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-campus-700 border border-campus-200 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Đã đọc</span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
