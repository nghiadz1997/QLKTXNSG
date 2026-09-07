import React, { useEffect, useState } from 'react';
import { MessageSquare, Pin, Trash2, ShieldCheck, Heart, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { communityService } from '../../services/communityService';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { CommunityPost } from '../../types';

export const CommunityModerationPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const list = await communityService.getPosts();
      setPosts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleTogglePin = async (postId: string) => {
    try {
      await communityService.togglePin(
        postId,
        userProfile?.uid || 'manager',
        userProfile?.email,
        role || 'manager'
      );
      toast.success('Đã cập nhật trạng thái ghim bài viết!');
      await loadPosts();
    } catch (err: any) {
      toast.error('Lỗi: ' + err.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết vi phạm này?')) return;
    try {
      await communityService.deletePost(
        postId,
        userProfile?.uid || 'manager',
        role || 'manager',
        userProfile?.email
      );
      toast.success('Đã xóa bài viết và ghi nhận vào Audit Log.');
      await loadPosts();
    } catch (err: any) {
      toast.error('Lỗi khi xóa bài: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Kiểm Duyệt Cộng Đồng</h1>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Quản Lý Nội Dung Trao Đổi
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Kiểm Duyệt Diễn Đàn & Cộng Đồng KTX
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quản lý KTX và Super Admin có thẩm quyền ghim các bài viết thông báo quan trọng lên đầu và gỡ bỏ các nội dung vi phạm quy chế KTX.
        </p>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Chưa có bài viết nào trong diễn đàn"
          description="Các bài đăng trao đổi của sinh viên sẽ hiển thị tại đây để kiểm duyệt."
        />
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div
              key={post.id}
              className={`bg-white rounded-3xl border p-6 shadow-sm transition space-y-3 ${
                post.isPinned ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-900 text-sm">{post.authorName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    post.authorRole === 'superAdmin'
                      ? 'bg-purple-100 text-purple-800'
                      : post.authorRole === 'manager'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {post.authorRole === 'superAdmin' ? 'Super Admin' : post.authorRole === 'manager' ? 'Quản lý KTX' : 'Sinh viên'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(post.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePin(post.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      post.isPinned
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{post.isPinned ? 'Đang Ghim (Bấm bỏ)' : 'Ghim bài'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition"
                    title="Xóa bài viết vi phạm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-900">{post.title}</h4>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                  {post.content}
                </p>
              </div>

              <div className="flex items-center space-x-4 text-xs text-slate-400 pt-2">
                <span>{post.likesCount || 0} lượt thích</span>
                <span>•</span>
                <span>{post.commentsCount || 0} bình luận</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
