import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { PricingRule, RoomRate, PricingType } from '../types';
import { auditService } from './auditService';

const PRICING_RULES_COLLECTION = 'pricingRules';
const ROOM_RATES_COLLECTION = 'roomRates';

export const pricingService = {
  // Get active pricing rule for a type (electricity or water)
  async getActivePricingRule(type: PricingType): Promise<PricingRule | null> {
    try {
      const q = query(
        collection(db, PRICING_RULES_COLLECTION),
        where('type', '==', type),
        where('effectiveTo', '==', null),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as PricingRule;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching active pricing rule for ${type}:`, error);
      return null;
    }
  },

  // Get all pricing rules (full immutable history)
  async getAllPricingRules(): Promise<PricingRule[]> {
    try {
      const q = query(collection(db, PRICING_RULES_COLLECTION), orderBy('effectiveFrom', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as PricingRule[];
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
      return [];
    }
  },

  // Super Admin updates pricing: close old active rule, create new one
  async updatePricingRule(
    type: PricingType,
    newUnitPrice: number,
    adminUid: string,
    adminEmail?: string,
    reason?: string
  ): Promise<PricingRule> {
    if (newUnitPrice <= 0) {
      throw new Error('Đơn giá phải lớn hơn 0');
    }

    const nowIso = new Date().toISOString();

    // 1. Find currently active rule
    const activeRule = await this.getActivePricingRule(type);
    if (activeRule) {
      // Close old active rule
      const oldDocRef = doc(db, PRICING_RULES_COLLECTION, activeRule.id);
      await updateDoc(oldDocRef, {
        effectiveTo: nowIso,
      });
    }

    // 2. Create new immutable pricing record
    const newRuleData: Omit<PricingRule, 'id'> = {
      type,
      unitPrice: newUnitPrice,
      effectiveFrom: nowIso,
      effectiveTo: null,
      createdBy: adminUid,
      createdAt: nowIso,
    };

    const docRef = await addDoc(collection(db, PRICING_RULES_COLLECTION), newRuleData);

    // 3. Audit Log
    await auditService.logAction(
      `Cập nhật giá ${type === 'electricity' ? 'Điện' : 'Nước'}`,
      adminUid,
      adminEmail,
      'superAdmin',
      PRICING_RULES_COLLECTION,
      docRef.id,
      activeRule ? { unitPrice: activeRule.unitPrice } : null,
      { unitPrice: newUnitPrice },
      reason || 'Thay đổi đơn giá hệ thống'
    );

    return { id: docRef.id, ...newRuleData };
  },

  // Room Rates
  async getAllRoomRates(): Promise<RoomRate[]> {
    try {
      const q = query(collection(db, ROOM_RATES_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() })) as RoomRate[];
    } catch (error) {
      console.error('Error fetching room rates:', error);
      return [];
    }
  },

  async createRoomRate(
    data: { roomType: string; price: number; semesterId: string },
    adminUid: string,
    adminEmail?: string
  ): Promise<RoomRate> {
    if (data.price <= 0) {
      throw new Error('Giá phòng phải lớn hơn 0');
    }

    const nowIso = new Date().toISOString();
    const rateData: Omit<RoomRate, 'id'> = {
      roomType: data.roomType,
      price: data.price,
      effectiveFrom: nowIso,
      effectiveTo: null,
      semesterId: data.semesterId,
      status: 'active',
      createdBy: adminUid,
      createdAt: nowIso,
    };

    const docRef = await addDoc(collection(db, ROOM_RATES_COLLECTION), rateData);

    await auditService.logAction(
      'Tạo mức giá phòng mới',
      adminUid,
      adminEmail,
      'superAdmin',
      ROOM_RATES_COLLECTION,
      docRef.id,
      null,
      rateData,
      `Tạo giá phòng cho ${data.roomType}`
    );

    return { id: docRef.id, ...rateData };
  },
};
