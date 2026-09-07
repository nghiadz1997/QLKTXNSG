import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Notification } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const notificationService = {
  async getUserNotifications(userUid: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, NOTIFICATIONS_COLLECTION),
        where('userUid', '==', userUid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Notification[];
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, { isRead: true });
  },

  async sendNotification(params: {
    userUid: string;
    title: string;
    message: string;
    type: Notification['type'];
    link?: string;
  }): Promise<Notification> {
    const nowIso = new Date().toISOString();
    const notificationData: Omit<Notification, 'id'> = {
      userUid: params.userUid,
      title: params.title,
      message: params.message,
      type: params.type,
      isRead: false,
      link: params.link,
      createdAt: nowIso,
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
    return { id: docRef.id, ...notificationData };
  },
};
