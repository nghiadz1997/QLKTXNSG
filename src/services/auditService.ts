import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AuditLog } from '../types';

const AUDIT_COLLECTION = 'auditLogs';

export const auditService = {
  async logAction(
    action: string,
    userUid: string,
    userEmail: string | undefined,
    role: string,
    targetCollection: string,
    targetId: string,
    oldValue: any = null,
    newValue: any = null,
    reason?: string
  ): Promise<void> {
    try {
      const logData = {
        action,
        userUid,
        userEmail: userEmail || '',
        role,
        targetCollection,
        targetId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
        reason: reason || '',
        timestamp: new Date().toISOString(),
      };
      await addDoc(collection(db, AUDIT_COLLECTION), logData);
    } catch (error) {
      console.error('[Audit Log Error]', error);
      // Non-blocking in client
    }
  },

  async getAuditLogs(maxLogs: number = 100): Promise<AuditLog[]> {
    try {
      const q = query(
        collection(db, AUDIT_COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(maxLogs)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AuditLog[];
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  },
};
