import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { UtilityRecord } from '../types';
import { pricingService } from './pricingService';
import { auditService } from './auditService';

const UTILITIES_COLLECTION = 'utilities';

export const utilityService = {
  // Utility document ID format: `${year}${String(month).padStart(2, '0')}-${roomId}`
  getUtilityDocId(year: number, month: number, roomId: string): string {
    return `${year}${String(month).padStart(2, '0')}-${roomId}`;
  },

  async getUtilityRecord(year: number, month: number, roomId: string): Promise<UtilityRecord | null> {
    try {
      const docId = this.getUtilityDocId(year, month, roomId);
      const docRef = doc(db, UTILITIES_COLLECTION, docId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as UtilityRecord;
      }
      return null;
    } catch (error) {
      console.error('Error fetching utility record:', error);
      return null;
    }
  },

  async getUtilitiesForRoom(roomId: string): Promise<UtilityRecord[]> {
    try {
      const q = query(
        collection(db, UTILITIES_COLLECTION),
        where('roomId', '==', roomId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as UtilityRecord[];
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching room utilities:', error);
      return [];
    }
  },

  async getAllUtilities(filters?: { year?: number; month?: number; buildingId?: string }): Promise<UtilityRecord[]> {
    try {
      const q = query(collection(db, UTILITIES_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as UtilityRecord[];

      if (filters?.year) list = list.filter(u => u.year === filters.year);
      if (filters?.month) list = list.filter(u => u.month === filters.month);
      if (filters?.buildingId) list = list.filter(u => u.buildingId === filters.buildingId);

      return list;
    } catch (error) {
      console.error('Error fetching utilities:', error);
      return [];
    }
  },

  // Record electricity and water meters with server-side pricing lookup & calculation
  async recordUtilities(params: {
    roomId: string;
    buildingId: string;
    year: number;
    month: number;
    semesterId: string;
    elecOldIndex: number;
    elecNewIndex: number;
    waterOldIndex: number;
    waterNewIndex: number;
    createdByUid: string;
    createdByEmail?: string;
    role?: string;
  }): Promise<UtilityRecord> {
    const {
      roomId,
      buildingId,
      year,
      month,
      semesterId,
      elecOldIndex,
      elecNewIndex,
      waterOldIndex,
      waterNewIndex,
      createdByUid,
      createdByEmail,
      role = 'manager',
    } = params;

    // VALIDATION: Non-negative & new >= old
    if (elecOldIndex < 0 || elecNewIndex < 0 || waterOldIndex < 0 || waterNewIndex < 0) {
      throw new Error('Chỉ số điện nước không được là số âm.');
    }
    if (elecNewIndex < elecOldIndex) {
      throw new Error(`Chỉ số điện mới (${elecNewIndex}) không được nhỏ hơn chỉ số cũ (${elecOldIndex}).`);
    }
    if (waterNewIndex < waterOldIndex) {
      throw new Error(`Chỉ số nước mới (${waterNewIndex}) không được nhỏ hơn chỉ số cũ (${waterOldIndex}).`);
    }

    // Lookup active pricing rules (NOT from client!)
    const activeElecRule = await pricingService.getActivePricingRule('electricity');
    const activeWaterRule = await pricingService.getActivePricingRule('water');

    const elecUnitPrice = activeElecRule ? activeElecRule.unitPrice : 3500;
    const waterUnitPrice = activeWaterRule ? activeWaterRule.unitPrice : 18000;

    const elecUsage = elecNewIndex - elecOldIndex;
    const elecAmount = elecUsage * elecUnitPrice;

    const waterUsage = waterNewIndex - waterOldIndex;
    const waterAmount = waterUsage * waterUnitPrice;

    const docId = this.getUtilityDocId(year, month, roomId);
    const docRef = doc(db, UTILITIES_COLLECTION, docId);
    const existingSnap = await getDoc(docRef);

    const nowIso = new Date().toISOString();
    const utilityRecord: UtilityRecord = {
      id: docId,
      roomId,
      buildingId,
      year,
      month,
      semesterId,
      electricity: {
        oldIndex: elecOldIndex,
        newIndex: elecNewIndex,
        usage: elecUsage,
        unitPrice: elecUnitPrice,
        amount: elecAmount,
      },
      water: {
        oldIndex: waterOldIndex,
        newIndex: waterNewIndex,
        usage: waterUsage,
        unitPrice: waterUnitPrice,
        amount: waterAmount,
      },
      status: 'finalized',
      createdBy: createdByUid,
      createdAt: existingSnap.exists() ? existingSnap.data().createdAt : nowIso,
      updatedAt: nowIso,
    };

    await setDoc(docRef, utilityRecord);

    await auditService.logAction(
      'Ghi chỉ số điện nước',
      createdByUid,
      createdByEmail,
      role,
      UTILITIES_COLLECTION,
      docId,
      existingSnap.exists() ? existingSnap.data() : null,
      utilityRecord,
      `Nhập số điện nước phòng ${roomId} tháng ${month}/${year}`
    );

    return utilityRecord;
  },
};
