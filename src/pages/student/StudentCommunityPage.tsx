import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Heart,
  Pin,
  Send,
  Trash2,
  Share2,
  Sparkles,
  ShieldCheck,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { communityService } from '../../services/communityService';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';
import type { CommunityPost, CommunityComment } from '../../types';

export const StudentCommunityPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  // New post form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);

  // Active comments mapping
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommunityComment[]>>({});
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const currentUid = userProfile?.uid || '';
  const currentName = userProfile?.displayName || 'Sinh viên KTX';

  const loadPosts = async () => {
    setLoading(true);
    try {
      const list = await communityService.getPosts();
      setPosts(list);
    } catch (err) {
      console.error('Error loading community posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Vui lòng điền tiêu đề và nội dung bài viết.');
      return;
    }

    setPosting(true);
    try {
      await communityService.createPost({
        authorUid: currentUid,
        authorName: currentName,
        authorRole: role || 'student',
        title: newTitle.trim(),
        content: newContent.trim(),
      });

      toast.success('Đã đăng bài viết mới lên Diễn đàn KTX!');
      setNewTitle('');
      setNewContent('');
      await loadPosts();
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi đăng bài: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await communityService.toggleLike(postId, currentUid);
      setPosts(prev =>
        prev.map(p => {
          if (p.id !== postId) return p;
          const isLiked = p.likedBy?.includes(currentUid);
          return {
            ...p,
            likedBy: isLiked ? p.likedBy.filter(u => u !== currentUid) : [...(p.likedBy || []), currentUid],
            likesCount: isLiked ? p.likesCount - 1 : p.likesCount + 1,
          };
        })
      );
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      await communityService.deletePost(postId, currentUid, role || 'student', userProfile?.email);
      toast.success('Đã xóa bài viết.');
      await loadPosts();
    } catch (err: any) {
      toast.error(err.message || 'Không thể xóa bài.');
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }
    setActiveCommentsPostId(postId);
    if (!commentsMap[postId]) {
      const c = await communityService.getComments(postId);
      setCommentsMap(prev => ({ ...prev, [postId]: c }));
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    setSubmittingComment(true);
    try {
      const comment = await communityService.addComment({
        postId,
        authorUid: currentUid,
        authorName: currentName,
        authorRole: role || 'student',
        content: commentInput.trim(),
      });

      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment],
      }));
      setCommentInput('');

      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
      );
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-cyanAccent-600 text-white flex items-center justify-center shadow-md shadow-cyanAccent-600/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyanAccent-600">
              Kênh Trao Đổi Chung
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Cộng Đồng Sinh Viên KTX
            </h1>
          </div>
        </div>
      </div>

      {/* Create New Post Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Chia sẻ thông tin hoặc thảo luận
        </h3>
        <form onSubmit={handleCreatePost} className="space-y-3">
          <input
            type="text"
            required
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Tiêu đề thảo luận (Ví dụ: Tìm bạn cùng phòng học nhóm, tìm đồ thất lạc...)"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
          <textarea
            rows={3}
            required
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="Nội dung chi tiết..."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={posting}
              className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
            >
              {posting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang đăng...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Đăng bài</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Chưa có bài viết nào"
          description="Hãy là người đầu tiên đăng bài trao đổi trên cộng đồng ký túc xá!"
        />
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const isLiked = post.likedBy?.includes(currentUid);
            const canDelete = post.authorUid === currentUid || role === 'manager' || role === 'superAdmin';

            return (
              <div
                key={post.id}
                className={`bg-white rounded-3xl border p-6 shadow-sm transition space-y-3 ${
                  post.isPinned ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-campus-100 text-campus-700 font-bold flex items-center justify-center text-sm">
                      {post.authorName ? post.authorName.charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">{post.authorName}</span>
                        {post.authorRole !== 'student' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            {post.authorRole === 'superAdmin' ? 'Super Admin' : 'Quản lý KTX'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(post.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {post.isPinned && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Pin className="w-3.5 h-3.5 text-amber-600" /> Đã ghim
                      </span>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Xóa bài"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="font-extrabold text-base text-slate-900 mb-1">{post.title}</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Interaction Footer */}
                <div className="flex items-center space-x-6 pt-3 border-t border-slate-100 text-xs text-slate-500 font-semibold">
                  <button
                    type="button"
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center space-x-1.5 transition ${
                      isLiked ? 'text-rose-600 font-bold' : 'hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-rose-600' : ''}`} />
                    <span>{post.likesCount || 0} Thích</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center space-x-1.5 hover:text-campus-600 transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentsCount || 0} Bình luận</span>
                  </button>
                </div>

                {/* Comment Section */}
                {activeCommentsPostId === post.id && (
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="space-y-2">
                      {(commentsMap[post.id] || []).map(c => (
                        <div key={c.id} className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800">{c.authorName}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.createdAt).toLocaleTimeString('vi-VN')}
                            </span>
                          </div>
                          <p className="text-slate-600">{c.content}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        placeholder="Viết bình luận của bạn..."
                        className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddComment(post.id);
                        }}
                      />
                      <button
                        type="button"
                        disabled={submittingComment}
                        onClick={() => handleAddComment(post.id)}
                        className="p-2 bg-campus-600 text-white rounded-xl hover:bg-campus-700 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
