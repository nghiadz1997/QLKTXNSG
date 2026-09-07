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
import type { Semester } from '../types';
import { auditService } from './auditService';

const SEMESTERS_COLLECTION = 'semesters';

export const semesterService = {
  async getSemesters(): Promise<Semester[]> {
    try {
      const q = query(collection(db, SEMESTERS_COLLECTION), orderBy('startDate', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as Semester[];
    } catch (error) {
      console.error('Error fetching semesters:', error);
      return [];
    }
  },

  async getActiveSemester(): Promise<Semester | null> {
    const semesters = await this.getSemesters();
    return semesters.find(s => s.status === 'active') || semesters[0] || null;
  },

  async createSemester(
    semesterData: Omit<Semester, 'id'>,
    adminUid: string,
    adminEmail?: string
  ): Promise<Semester> {
    const docRef = await addDoc(collection(db, SEMESTERS_COLLECTION), {
      ...semesterData,
      createdAt: new Date().toISOString(),
    });

    await auditService.logAction(
      'Tạo học kỳ mới',
      adminUid,
      adminEmail,
      'superAdmin',
      SEMESTERS_COLLECTION,
      docRef.id,
      null,
      semesterData
    );

    return { id: docRef.id, ...semesterData };
  },

  async updateSemester(
    id: string,
    data: Partial<Semester>,
    adminUid: string,
    adminEmail?: string
  ): Promise<void> {
    const docRef = doc(db, SEMESTERS_COLLECTION, id);
    const existing = await getDoc(docRef);
    await updateDoc(docRef, data);

    await auditService.logAction(
      'Cập nhật học kỳ',
      adminUid,
      adminEmail,
      'superAdmin',
      SEMESTERS_COLLECTION,
      id,
      existing.exists() ? existing.data() : null,
      data
    );
  }
};
