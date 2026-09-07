import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { CommunityPost, CommunityComment, Role } from '../types';
import { auditService } from './auditService';

const POSTS_COLLECTION = 'communityPosts';
const COMMENTS_COLLECTION = 'communityComments';

export const communityService = {
  async getPosts(): Promise<CommunityPost[]> {
    try {
      const q = query(collection(db, POSTS_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const posts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as CommunityPost[];
      // Sort pinned posts first, then by date
      return posts.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } catch (error) {
      console.error('Error fetching community posts:', error);
      return [];
    }
  },

  async createPost(params: {
    authorUid: string;
    authorName: string;
    authorRole: Role;
    title: string;
    content: string;
    imageUrls?: string[];
  }): Promise<CommunityPost> {
    const nowIso = new Date().toISOString();
    const postData: Omit<CommunityPost, 'id'> = {
      authorUid: params.authorUid,
      authorName: params.authorName,
      authorRole: params.authorRole,
      title: params.title,
      content: params.content,
      imageUrls: params.imageUrls || [],
      likesCount: 0,
      likedBy: [],
      commentsCount: 0,
      status: 'active',
      isPinned: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const docRef = await addDoc(collection(db, POSTS_COLLECTION), postData);
    return { id: docRef.id, ...postData };
  },

  async toggleLike(postId: string, userUid: string): Promise<boolean> {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return false;

    const data = snap.data() as CommunityPost;
    const isLiked = data.likedBy?.includes(userUid);

    if (isLiked) {
      await updateDoc(postRef, {
        likedBy: arrayRemove(userUid),
        likesCount: increment(-1),
      });
      return false;
    } else {
      await updateDoc(postRef, {
        likedBy: arrayUnion(userUid),
        likesCount: increment(1),
      });
      return true;
    }
  },

  async togglePin(postId: string, managerUid: string, managerEmail?: string, role: string = 'manager'): Promise<void> {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) throw new Error('Bài viết không tồn tại.');

    const newPinned = !snap.data().isPinned;
    await updateDoc(postRef, { isPinned: newPinned });

    await auditService.logAction(
      newPinned ? 'Ghim bài viết' : 'Bỏ ghim bài viết',
      managerUid,
      managerEmail,
      role,
      POSTS_COLLECTION,
      postId,
      { isPinned: !newPinned },
      { isPinned: newPinned }
    );
  },

  async deletePost(
    postId: string,
    performedByUid: string,
    performedByRole: Role,
    performedByEmail?: string
  ): Promise<void> {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return;

    const post = snap.data() as CommunityPost;
    // Only author or manager/admin can delete
    if (post.authorUid !== performedByUid && performedByRole === 'student') {
      throw new Error('Bạn không có quyền xóa bài viết này.');
    }

    await deleteDoc(postRef);

    if (performedByRole !== 'student') {
      await auditService.logAction(
        'Kiểm duyệt: Xóa bài viết cộng đồng',
        performedByUid,
        performedByEmail,
        performedByRole,
        POSTS_COLLECTION,
        postId,
        post,
        null,
        'Xóa bài viết vi phạm'
      );
    }
  },

  // Comments
  async getComments(postId: string): Promise<CommunityComment[]> {
    try {
      const q = query(
        collection(db, COMMENTS_COLLECTION),
        where('postId', '==', postId),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as CommunityComment[];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  async addComment(params: {
    postId: string;
    authorUid: string;
    authorName: string;
    authorRole: Role;
    content: string;
  }): Promise<CommunityComment> {
    const nowIso = new Date().toISOString();
    const commentData: Omit<CommunityComment, 'id'> = {
      postId: params.postId,
      authorUid: params.authorUid,
      authorName: params.authorName,
      authorRole: params.authorRole,
      content: params.content,
      createdAt: nowIso,
    };

    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), commentData);

    // Increment post comment count
    const postRef = doc(db, POSTS_COLLECTION, params.postId);
    await updateDoc(postRef, {
      commentsCount: increment(1),
    });

    return { id: docRef.id, ...commentData };
  },
};
