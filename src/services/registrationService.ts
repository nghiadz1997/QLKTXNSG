import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { DormRegistration, RegistrationStatus } from '../types';
import { roomService } from './roomService';
import { studentService } from './studentService';
import { auditService } from './auditService';

const REGISTRATIONS_COLLECTION = 'dormRegistrations';

export const registrationService = {
  // Public user submission
  async submitPublicRegistration(
    data: Omit<DormRegistration, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<DormRegistration> {
    const nowIso = new Date().toISOString();
    const regData: Omit<DormRegistration, 'id'> = {
      ...data,
      status: 'pending',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const docRef = await addDoc(collection(db, REGISTRATIONS_COLLECTION), regData);
    return { id: docRef.id, ...regData };
  },

  async getAllRegistrations(statusFilter?: RegistrationStatus): Promise<DormRegistration[]> {
    try {
      const q = query(collection(db, REGISTRATIONS_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as DormRegistration[];
      if (statusFilter) {
        list = list.filter(r => r.status === statusFilter);
      }
      return list;
    } catch (error) {
      console.error('Error fetching registrations:', error);
      return [];
    }
  },

  // Lookup registration status for applicants
  async searchRegistration(keyword: string): Promise<DormRegistration | null> {
    const clean = keyword.trim();
    if (!clean) return null;

    try {
      // 1. Try directly by doc id
      const directRef = doc(db, REGISTRATIONS_COLLECTION, clean);
      const directSnap = await getDoc(directRef);
      if (directSnap.exists()) {
        return { id: directSnap.id, ...directSnap.data() } as DormRegistration;
      }

      // 2. Search in all registrations for HSSV or CCCD or phone
      const all = await this.getAllRegistrations();
      const match = all.find(
        r =>
          r.id.toLowerCase() === clean.toLowerCase() ||
          r.hssv.toLowerCase() === clean.toLowerCase() ||
          r.cccd === clean ||
          r.phone === clean
      );
      return match || null;
    } catch (err) {
      console.error('Error searching registration:', err);
      return null;
    }
  },

  // Manager approves registration
  async approveRegistration(
    id: string,
    managerUid: string,
    managerEmail?: string
  ): Promise<void> {
    const docRef = doc(db, REGISTRATIONS_COLLECTION, id);
    const nowIso = new Date().toISOString();

    await updateDoc(docRef, {
      status: 'approved',
      processedBy: managerUid,
      processedAt: nowIso,
      updatedAt: nowIso,
    });

    await auditService.logAction(
      'Duyệt đơn đăng ký KTX',
      managerUid,
      managerEmail,
      'manager',
      REGISTRATIONS_COLLECTION,
      id,
      { status: 'pending' },
      { status: 'approved' },
      'Duyệt hồ sơ đăng ký KTX'
    );
  },

  // Manager rejects registration
  async rejectRegistration(
    id: string,
    reason: string,
    managerUid: string,
    managerEmail?: string
  ): Promise<void> {
    const docRef = doc(db, REGISTRATIONS_COLLECTION, id);
    const nowIso = new Date().toISOString();

    await updateDoc(docRef, {
      status: 'rejected',
      note: reason,
      processedBy: managerUid,
      processedAt: nowIso,
      updatedAt: nowIso,
    });

    await auditService.logAction(
      'Từ chối đơn đăng ký KTX',
      managerUid,
      managerEmail,
      'manager',
      REGISTRATIONS_COLLECTION,
      id,
      { status: 'pending' },
      { status: 'rejected', reason },
      reason
    );
  },

  // Manager assigns room to approved registration
  async assignRoomToRegistration(
    registrationId: string,
    roomId: string,
    managerUid: string,
    managerEmail?: string
  ): Promise<void> {
    const regDocRef = doc(db, REGISTRATIONS_COLLECTION, registrationId);
    const snap = await getDoc(regDocRef);
    if (!snap.exists()) throw new Error('Đơn đăng ký không tồn tại.');

    const reg = snap.data() as DormRegistration;

    // Check if student profile already exists or create new student record
    let student = await studentService.getStudentByHssv(reg.hssv);
    let targetUid = student?.uid;

    if (!student) {
      // Create student entry
      targetUid = `student_${reg.hssv}`;
      student = await studentService.createStudent(
        {
          uid: targetUid,
          hssv: reg.hssv,
          cccd: reg.cccd || '',
          fullName: reg.fullName,
          dateOfBirth: reg.dateOfBirth,
          gender: reg.gender,
          phone: reg.phone,
          email: reg.email,
          faculty: reg.faculty,
          major: reg.major,
          className: reg.className,
          course: 'Khóa 2026',
          status: 'active',
          dormStatus: 'waiting',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        managerUid,
        managerEmail
      );
    }

    // Now assign to room atomically
    await roomService.assignStudentToRoom(targetUid!, roomId, managerUid, managerEmail);

    // Update registration to completed
    const nowIso = new Date().toISOString();
    await updateDoc(regDocRef, {
      status: 'completed',
      assignedRoomId: roomId,
      processedBy: managerUid,
      processedAt: nowIso,
      updatedAt: nowIso,
    });

    await auditService.logAction(
      'Xếp phòng cho đơn đăng ký',
      managerUid,
      managerEmail,
      'manager',
      REGISTRATIONS_COLLECTION,
      registrationId,
      { status: reg.status },
      { status: 'completed', assignedRoomId: roomId },
      `Xếp phòng ${roomId} cho sinh viên ${reg.fullName}`
    );
  },
};
