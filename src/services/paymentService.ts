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
import type { Payment } from '../types';
import { invoiceService } from './invoiceService';
import { auditService } from './auditService';

const PAYMENTS_COLLECTION = 'payments';

export const paymentService = {
  async getPayments(filters?: {
    studentUid?: string;
    invoiceId?: string;
    status?: string;
  }): Promise<Payment[]> {
    try {
      const q = query(collection(db, PAYMENTS_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Payment[];

      if (filters?.studentUid) list = list.filter(p => p.studentUid === filters.studentUid);
      if (filters?.invoiceId) list = list.filter(p => p.invoiceId === filters.invoiceId);
      if (filters?.status) list = list.filter(p => p.status === filters.status);

      return list;
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  },

  // Student submits proof of payment (banking/cash/momo/etc.)
  async submitPayment(data: {
    invoiceId: string;
    studentUid: string;
    roomId: string;
    amount: number;
    paymentMethod: 'banking' | 'cash' | 'momo' | 'vnpay';
    transactionCode?: string;
    billImage?: string;
    note?: string;
    studentEmail?: string;
  }): Promise<Payment> {
    const nowIso = new Date().toISOString();
    const paymentData: any = {
      invoiceId: data.invoiceId,
      studentUid: data.studentUid,
      studentId: data.studentUid,
      roomId: data.roomId,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionCode:
        data.transactionCode ||
        (data.paymentMethod === 'cash'
          ? 'Đã nộp tại văn phòng KTX'
          : 'Chuyển khoản (có ảnh bill đính kèm)'),
      billImage: data.billImage || '',
      note: data.note || '',
      status: 'pending',
      paidAt: nowIso,
      createdAt: nowIso,
    };

    const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), paymentData);

    // Also update invoice status to 'pending' to show payment in review
    try {
      await invoiceService.updateInvoiceStatus(
        data.invoiceId,
        'pending',
        data.studentUid,
        data.studentEmail,
        'student'
      );
    } catch (invErr) {
      console.warn('Could not update invoice status directly (payment ticket created):', invErr);
    }

    return { id: docRef.id, ...paymentData };
  },

  // Manager or Admin confirms payment
  async confirmPayment(
    paymentId: string,
    confirmedByUid: string,
    confirmedByEmail?: string,
    role: string = 'manager'
  ): Promise<void> {
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error(`Thanh toán ${paymentId} không tồn tại.`);

    const payment = snap.data() as Payment;
    const nowIso = new Date().toISOString();

    await updateDoc(docRef, {
      status: 'confirmed',
      confirmedBy: confirmedByUid,
      updatedAt: nowIso,
    });

    // Mark invoice as paid
    await invoiceService.updateInvoiceStatus(
      payment.invoiceId,
      'paid',
      confirmedByUid,
      confirmedByEmail,
      role
    );

    await auditService.logAction(
      'Xác nhận thanh toán',
      confirmedByUid,
      confirmedByEmail,
      role,
      PAYMENTS_COLLECTION,
      paymentId,
      { status: 'pending' },
      { status: 'confirmed' },
      `Xác nhận giao dịch ${payment.transactionCode} số tiền ${payment.amount} VNĐ`
    );
  },

  // Manager rejects payment
  async rejectPayment(
    paymentId: string,
    reason: string,
    confirmedByUid: string,
    confirmedByEmail?: string,
    role: string = 'manager'
  ): Promise<void> {
    const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error(`Thanh toán ${paymentId} không tồn tại.`);

    const payment = snap.data() as Payment;
    const nowIso = new Date().toISOString();

    await updateDoc(docRef, {
      status: 'rejected',
      confirmedBy: confirmedByUid,
      updatedAt: nowIso,
    });

    // Revert invoice back to unpaid
    await invoiceService.updateInvoiceStatus(
      payment.invoiceId,
      'unpaid',
      confirmedByUid,
      confirmedByEmail,
      role
    );

    await auditService.logAction(
      'Từ chối thanh toán',
      confirmedByUid,
      confirmedByEmail,
      role,
      PAYMENTS_COLLECTION,
      paymentId,
      { status: 'pending' },
      { status: 'rejected' },
      `Từ chối: ${reason}`
    );
  }
};
