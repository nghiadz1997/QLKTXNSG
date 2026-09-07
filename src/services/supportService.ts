import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { SupportRequest, SupportStatus, Student } from '../types';
import { auditService } from './auditService';

const SUPPORT_COLLECTION = 'supportRequests';

export const supportService = {
  // Student submits support request (strictly verified living status)
  async createRequest(
    student: Student,
    data: {
      category: SupportRequest['category'];
      title: string;
      content: string;
      priority: SupportRequest['priority'];
      imageUrls?: string[];
    }
  ): Promise<SupportRequest> {
    if (student.dormStatus !== 'living') {
      throw new Error('Chỉ sinh viên đang lưu trú tại KTX mới có quyền gửi yêu cầu hỗ trợ.');
    }
    if (!student.roomId) {
      throw new Error('Hồ sơ sinh viên chưa được gán phòng KTX.');
    }

    const nowIso = new Date().toISOString();
    const newRequest: Omit<SupportRequest, 'id'> = {
      ownerUid: student.uid,
      hssv: student.hssv,
      fullName: student.fullName,
      phone: student.phone,
      faculty: student.faculty,
      className: student.className,
      roomId: student.roomId,
      buildingId: student.buildingId || '',
      category: data.category,
      title: data.title,
      content: data.content,
      priority: data.priority,
      status: 'new',
      imageUrls: data.imageUrls || [],
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const docRef = await addDoc(collection(db, SUPPORT_COLLECTION), newRequest);
    return { id: docRef.id, ...newRequest };
  },

  async getRequestsByStudent(studentUid: string): Promise<SupportRequest[]> {
    try {
      const q = query(
        collection(db, SUPPORT_COLLECTION),
        where('ownerUid', '==', studentUid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SupportRequest[];
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching student support requests:', error);
      return [];
    }
  },

  async getAllRequests(filters?: {
    status?: string;
    priority?: string;
    roomId?: string;
    category?: string;
  }): Promise<SupportRequest[]> {
    try {
      const q = query(collection(db, SUPPORT_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SupportRequest[];

      if (filters?.status) list = list.filter(r => r.status === filters.status);
      if (filters?.priority) list = list.filter(r => r.priority === filters.priority);
      if (filters?.roomId) list = list.filter(r => r.roomId === filters.roomId);
      if (filters?.category) list = list.filter(r => r.category === filters.category);

      return list;
    } catch (error) {
      console.error('Error fetching support requests:', error);
      return [];
    }
  },

  async updateRequestStatus(
    requestId: string,
    status: SupportStatus,
    responseNote: string,
    managerUid: string,
    managerEmail?: string
  ): Promise<void> {
    const docRef = doc(db, SUPPORT_COLLECTION, requestId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error('Yêu cầu không tồn tại.');

    const nowIso = new Date().toISOString();
    await updateDoc(docRef, {
      status,
      responseNote: responseNote || '',
      handledBy: managerUid,
      updatedAt: nowIso,
    });

    await auditService.logAction(
      'Cập nhật tiến độ hỗ trợ',
      managerUid,
      managerEmail,
      'manager',
      SUPPORT_COLLECTION,
      requestId,
      { status: snap.data().status },
      { status, responseNote },
      `Chuyển trạng thái yêu cầu sang ${status}`
    );
  },
};
