import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Invoice, InvoiceStatus } from '../types';
import { roomService } from './roomService';
import { utilityService } from './utilityService';
import { auditService } from './auditService';

const INVOICES_COLLECTION = 'invoices';

export const invoiceService = {
  // Helper: check if invoice is overdue
  computeEffectiveStatus(status: InvoiceStatus, dueDate: string): InvoiceStatus {
    if (status === 'paid') return 'paid';
    const today = new Date().toISOString().split('T')[0];
    if (today > dueDate) return 'overdue';
    return status;
  },

  async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    try {
      const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const inv = { id: snap.id, ...snap.data() } as Invoice;
        return {
          ...inv,
          status: this.computeEffectiveStatus(inv.status, inv.dueDate),
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  },

  async getInvoicesForStudent(studentUid: string): Promise<Invoice[]> {
    try {
      const q = query(
        collection(db, INVOICES_COLLECTION),
        where('studentUid', '==', studentUid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => {
        const inv = { id: d.id, ...d.data() } as Invoice;
        return {
          ...inv,
          status: this.computeEffectiveStatus(inv.status, inv.dueDate),
        };
      });
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching student invoices:', error);
      return [];
    }
  },

  async getAllInvoices(filters?: {
    roomId?: string;
    buildingId?: string;
    semesterId?: string;
    status?: string;
    year?: number;
    month?: number;
  }): Promise<Invoice[]> {
    try {
      const q = query(collection(db, INVOICES_COLLECTION), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      let list = snap.docs.map(d => {
        const inv = { id: d.id, ...d.data() } as Invoice;
        return {
          ...inv,
          status: this.computeEffectiveStatus(inv.status, inv.dueDate),
        };
      });

      if (filters?.roomId) list = list.filter(i => i.roomId === filters.roomId);
      if (filters?.buildingId) list = list.filter(i => i.buildingId === filters.buildingId);
      if (filters?.semesterId) list = list.filter(i => i.semesterId === filters.semesterId);
      if (filters?.status) list = list.filter(i => i.status === filters.status);
      if (filters?.year) list = list.filter(i => i.year === filters.year);
      if (filters?.month) list = list.filter(i => i.month === filters.month);

      return list;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  },

  // Generate invoices for all members of a room with snapshot unit prices
  async generateRoomInvoices(params: {
    roomId: string;
    semesterId: string;
    year: number;
    month: number;
    roomFeePerStudent: number;
    otherFeePerStudent: number;
    dueDate: string;
    createdByUid: string;
    createdByEmail?: string;
    role?: string;
  }): Promise<Invoice[]> {
    const {
      roomId,
      semesterId,
      year,
      month,
      roomFeePerStudent,
      otherFeePerStudent,
      dueDate,
      createdByUid,
      createdByEmail,
      role = 'manager',
    } = params;

    const room = await roomService.getRoomById(roomId);
    if (!room) throw new Error(`Phòng ${roomId} không tồn tại.`);

    const members = await roomService.getRoomMembers(roomId);
    if (members.length === 0) {
      throw new Error(`Phòng ${roomId} hiện không có sinh viên nào đang lưu trú.`);
    }

    // Fetch utilities for this room and month
    const utility = await utilityService.getUtilityRecord(year, month, roomId);
    if (!utility) {
      throw new Error(`Chưa có chỉ số điện nước tháng ${month}/${year} của phòng ${roomId}. Vui lòng nhập chỉ số trước.`);
    }

    // Utility split equally among current occupants
    const occupantCount = members.length;
    const studentElecUsage = Math.round((utility.electricity.usage / occupantCount) * 10) / 10;
    const studentElecUnitPrice = utility.electricity.unitPrice;
    const studentElecFee = Math.round(utility.electricity.amount / occupantCount);

    const studentWaterUsage = Math.round((utility.water.usage / occupantCount) * 10) / 10;
    const studentWaterUnitPrice = utility.water.unitPrice;
    const studentWaterFee = Math.round(utility.water.amount / occupantCount);

    const nowIso = new Date().toISOString();
    const createdInvoices: Invoice[] = [];

    for (const member of members) {
      const invoiceId = `INV-${year}${String(month).padStart(2, '0')}-${roomId}-${member.hssv}`;
      const totalAmount = roomFeePerStudent + studentElecFee + studentWaterFee + otherFeePerStudent;

      const invoice: Invoice = {
        id: invoiceId,
        studentUid: member.studentId,
        studentName: member.fullName,
        hssv: member.hssv,
        roomId,
        buildingId: room.buildingId,
        semesterId,
        year,
        month,
        roomFee: roomFeePerStudent,
        electricityUsage: studentElecUsage,
        electricityUnitPrice: studentElecUnitPrice,
        electricityFee: studentElecFee,
        waterUsage: studentWaterUsage,
        waterUnitPrice: studentWaterUnitPrice,
        waterFee: studentWaterFee,
        otherFee: otherFeePerStudent,
        totalAmount,
        dueDate,
        status: 'unpaid',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
      await setDoc(docRef, invoice);
      createdInvoices.push(invoice);

      await auditService.logAction(
        'Tạo hóa đơn KTX',
        createdByUid,
        createdByEmail,
        role,
        INVOICES_COLLECTION,
        invoiceId,
        null,
        invoice,
        `Tạo hóa đơn tháng ${month}/${year} cho sinh viên ${member.fullName}`
      );
    }

    return createdInvoices;
  },

  // Update invoice status (e.g. mark as paid after verified payment)
  async updateInvoiceStatus(
    invoiceId: string,
    newStatus: InvoiceStatus,
    confirmedByUid: string,
    confirmedByEmail?: string,
    role: string = 'manager'
  ): Promise<void> {
    const docRef = doc(db, INVOICES_COLLECTION, invoiceId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) throw new Error(`Hóa đơn ${invoiceId} không tồn tại.`);

    const nowIso = new Date().toISOString();
    const updateData: Partial<Invoice> = {
      status: newStatus,
      updatedAt: nowIso,
      ...(newStatus === 'paid' ? { paidAt: nowIso, confirmedBy: confirmedByUid } : {}),
    };

    await updateDoc(docRef, updateData);

    await auditService.logAction(
      'Cập nhật trạng thái hóa đơn',
      confirmedByUid,
      confirmedByEmail,
      role,
      INVOICES_COLLECTION,
      invoiceId,
      { status: snap.data().status },
      { status: newStatus },
      `Đổi trạng thái thành ${newStatus}`
    );
  },
};
