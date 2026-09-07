import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  runTransaction,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Student, StudentRoomHistory } from '../types';
import { auditService } from './auditService';

const STUDENTS_COLLECTION = 'students';
const ROOM_HISTORY_COLLECTION = 'studentRoomHistory';

export const studentService = {
  async getStudents(filters?: {
    buildingId?: string;
    roomId?: string;
    status?: string;
    dormStatus?: string;
    searchQuery?: string;
  }): Promise<Student[]> {
    try {
      const q = query(collection(db, STUDENTS_COLLECTION), orderBy('fullName', 'asc'), limit(200));
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ uid: d.id, ...d.data() })) as Student[];

      if (filters?.buildingId) {
        list = list.filter(s => s.buildingId === filters.buildingId);
      }
      if (filters?.roomId) {
        list = list.filter(s => s.roomId === filters.roomId);
      }
      if (filters?.status) {
        list = list.filter(s => s.status === filters.status);
      }
      if (filters?.dormStatus) {
        list = list.filter(s => s.dormStatus === filters.dormStatus);
      }
      if (filters?.searchQuery) {
        const qLower = filters.searchQuery.toLowerCase().trim();
        list = list.filter(
          s =>
            s.hssv.toLowerCase().includes(qLower) ||
            (s.cccd && s.cccd.toLowerCase().includes(qLower)) ||
            s.fullName.toLowerCase().includes(qLower) ||
            s.className.toLowerCase().includes(qLower) ||
            s.faculty.toLowerCase().includes(qLower) ||
            s.major.toLowerCase().includes(qLower) ||
            s.email.toLowerCase().includes(qLower) ||
            (s.roomId && s.roomId.toLowerCase().includes(qLower))
        );
      }

      return list;
    } catch (error) {
      console.error('Error fetching students:', error);
      return [];
    }
  },

  async getStudentByUid(uid: string): Promise<Student | null> {
    try {
      const docRef = doc(db, STUDENTS_COLLECTION, uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { uid: snap.id, ...snap.data() } as Student;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching student ${uid}:`, error);
      return null;
    }
  },

  async getStudentByHssv(hssv: string): Promise<Student | null> {
    try {
      const q = query(
        collection(db, STUDENTS_COLLECTION),
        where('hssv', '==', hssv.trim()),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { uid: d.id, ...d.data() } as Student;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching student by HSSV ${hssv}:`, error);
      return null;
    }
  },

  async getStudentByEmail(email: string): Promise<Student | null> {
    try {
      const q = query(
        collection(db, STUDENTS_COLLECTION),
        where('email', '==', email.trim().toLowerCase()),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { uid: d.id, ...d.data() } as Student;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching student by email ${email}:`, error);
      return null;
    }
  },

  async linkStudentToAuth(studentUid: string, authUid: string, email: string): Promise<void> {
    const docRef = doc(db, STUDENTS_COLLECTION, studentUid);
    const snap = await getDoc(docRef);
    const nowIso = new Date().toISOString();

    if (snap.exists()) {
      const studentData = snap.data() as Student;
      // 1. Update existing student doc with authUid and email
      await updateDoc(docRef, {
        authUid,
        email: email.trim(),
        updatedAt: nowIso,
      });

      // 2. Also ensure a document at students/{authUid} exists so getDoc(doc(db, 'students', authUid)) works directly
      if (studentUid !== authUid) {
        const authDocRef = doc(db, STUDENTS_COLLECTION, authUid);
        await setDoc(authDocRef, {
          ...studentData,
          uid: authUid,
          authUid,
          email: email.trim(),
          updatedAt: nowIso,
        }, { merge: true });
      }
    }
  },

  async createStudent(
    student: Student,
    performedByUid: string,
    performedByEmail?: string,
    role: string = 'manager'
  ): Promise<Student> {
    // Check if HSSV already exists
    const existing = await this.getStudentByHssv(student.hssv);
    if (existing) {
      throw new Error(`Mã HSSV "${student.hssv}" đã tồn tại trên hệ thống.`);
    }

    const docRef = doc(db, STUDENTS_COLLECTION, student.uid);
    const nowIso = new Date().toISOString();
    const studentData: Student = {
      ...student,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await setDoc(docRef, studentData);

    await auditService.logAction(
      'Thêm hồ sơ sinh viên mới',
      performedByUid,
      performedByEmail,
      role,
      STUDENTS_COLLECTION,
      student.uid,
      null,
      studentData,
      `Tạo sinh viên ${student.fullName} (${student.hssv})`
    );

    return studentData;
  },

  async updateStudent(
    uid: string,
    data: Partial<Student>,
    performedByUid: string,
    performedByEmail?: string,
    role: string = 'manager'
  ): Promise<void> {
    const docRef = doc(db, STUDENTS_COLLECTION, uid);
    const existing = await getDoc(docRef);
    const nowIso = new Date().toISOString();

    await updateDoc(docRef, {
      ...data,
      updatedAt: nowIso,
    });

    await auditService.logAction(
      'Cập nhật hồ sơ sinh viên',
      performedByUid,
      performedByEmail,
      role,
      STUDENTS_COLLECTION,
      uid,
      existing.exists() ? existing.data() : null,
      data
    );
  },

  async getStudentRoomHistory(studentUid: string): Promise<StudentRoomHistory[]> {
    try {
      const q = query(
        collection(db, ROOM_HISTORY_COLLECTION),
        where('studentUid', '==', studentUid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as StudentRoomHistory[];
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching student room history:', error);
      return [];
    }
  },

  // Chỉ Super Admin mới có quyền xóa sinh viên khỏi hệ thống
  async deleteStudent(
    studentUid: string,
    performedByUid: string,
    performedByEmail?: string,
    role: string = 'superAdmin'
  ): Promise<void> {
    if (role !== 'superAdmin') {
      throw new Error('Chỉ Quản trị viên cấp cao (Super Admin) mới có quyền xóa sinh viên.');
    }

    const docRef = doc(db, STUDENTS_COLLECTION, studentUid);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      throw new Error('Không tìm thấy thông tin sinh viên để xóa.');
    }

    const studentData = snap.data() as Student;

    // 1. Nếu sinh viên đang có phòng, tự động giải phóng chỗ ở
    if (studentData.roomId) {
      try {
        const roomRef = doc(db, 'rooms', studentData.roomId);
        const memberRef = doc(db, 'rooms', studentData.roomId, 'members', studentUid);

        await runTransaction(db, async (tx) => {
          const roomDoc = await tx.get(roomRef);
          if (roomDoc.exists()) {
            const currentOccupants = Math.max(0, (roomDoc.data().currentOccupants || 1) - 1);
            const capacity = roomDoc.data().capacity || 4;
            const availableSlots = Math.min(capacity, (roomDoc.data().availableSlots || 0) + 1);

            tx.update(roomRef, {
              currentOccupants,
              availableSlots,
              updatedAt: new Date().toISOString(),
            });
          }
          tx.delete(memberRef);
        });
      } catch (roomErr) {
        console.warn('Không thể tự động giải phóng phòng khi xóa sinh viên:', roomErr);
      }
    }

    // 2. Xóa tài liệu sinh viên chính
    await deleteDoc(docRef);

    // 3. Nếu có tài liệu đối chiếu (authUid khác studentUid), xóa luôn
    if (studentData.authUid && studentData.authUid !== studentUid) {
      try {
        await deleteDoc(doc(db, STUDENTS_COLLECTION, studentData.authUid));
      } catch (e) {
        console.warn('Lỗi khi dọn dẹp mirrored student doc:', e);
      }
    }

    // 4. Nếu có tài khoản người dùng users/{authUid}, xóa luôn để tránh dư thừa
    if (studentData.authUid) {
      try {
        await deleteDoc(doc(db, 'users', studentData.authUid));
      } catch (e) {
        console.warn('Lỗi khi dọn dẹp user profile:', e);
      }
    }

    // 5. Ghi nhật ký hệ thống (Audit Log)
    await auditService.logAction(
      'Xóa sinh viên (Super Admin)',
      performedByUid,
      performedByEmail,
      'superAdmin',
      STUDENTS_COLLECTION,
      studentUid,
      studentData,
      null,
      `Super Admin đã xóa vĩnh viễn sinh viên ${studentData.fullName} (MSSV: ${studentData.hssv}) khỏi KTX.`
    );
  },
};
