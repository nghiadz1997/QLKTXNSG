import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { studentService } from './studentService';
import { roomService } from './roomService';
import { invoiceService } from './invoiceService';
import { paymentService } from './paymentService';
import { supportService } from './supportService';

export interface DashboardStats {
  totalStudents: number;
  livingStudents: number;
  totalRooms: number;
  fullRooms: number;
  availableRooms: number;
  totalCapacity: number;
  totalOccupants: number;
  occupancyRate: number;
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
  totalOverdue: number;
  overdueCount: number;
  pendingSupports: number;
  invoices: any[];
  students: any[];
  rooms: any[];
  supports: any[];
}

function computeStats(
  students: any[],
  rooms: any[],
  invoices: any[],
  _payments: any[],
  supports: any[]
): DashboardStats {
  const totalStudents = students.length;
  const livingStudents = students.filter(s => s.dormStatus === 'living').length;

  const totalRooms = rooms.length;
  const fullRooms = rooms.filter(
    r => r.status === 'full' || (r.capacity > 0 && (r.currentOccupants || 0) >= r.capacity)
  ).length;
  const availableRooms = rooms.filter(
    r => (r.status === 'available' || !r.status) && (r.capacity - (r.currentOccupants || 0) > 0)
  ).length;
  const totalCapacity = rooms.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const totalOccupants = rooms.reduce((acc, r) => acc + (r.currentOccupants || 0), 0);

  const totalBilled = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalPaid = invoices
    .filter(i => i.status === 'paid')
    .reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalUnpaid = invoices
    .filter(i => i.status === 'unpaid' || i.status === 'pending')
    .reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const totalOverdue = overdueInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

  const pendingSupports = supports.filter(
    s => s.status === 'new' || s.status === 'received' || s.status === 'processing'
  ).length;

  return {
    totalStudents,
    livingStudents,
    totalRooms,
    fullRooms,
    availableRooms,
    totalCapacity,
    totalOccupants,
    occupancyRate: totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0,
    totalBilled,
    totalPaid,
    totalUnpaid,
    totalOverdue,
    overdueCount: overdueInvoices.length,
    pendingSupports,
    invoices,
    students,
    rooms,
    supports,
  };
}

export const reportService = {
  // Export table rows to CSV file download
  exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row
          .map(val => {
            const str = String(val ?? '').replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      ),
    ].join('\r\n');

    // Add UTF-8 BOM so Excel opens Vietnamese characters correctly
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Gather complete overview statistics (one-time fetch)
  async getDashboardStats(): Promise<DashboardStats> {
    const [students, rooms, invoices, payments, supports] = await Promise.all([
      studentService.getStudents(),
      roomService.getRooms(),
      invoiceService.getAllInvoices(),
      paymentService.getPayments(),
      supportService.getAllRequests(),
    ]);

    return computeStats(students, rooms, invoices, payments, supports);
  },

  // Real-time listener for live dashboard statistics
  subscribeDashboardStats(callback: (stats: DashboardStats) => void): () => void {
    let studentsData: any[] = [];
    let roomsData: any[] = [];
    let invoicesData: any[] = [];
    let paymentsData: any[] = [];
    let supportsData: any[] = [];

    const emit = () => {
      callback(computeStats(studentsData, roomsData, invoicesData, paymentsData, supportsData));
    };

    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      snap => {
        studentsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        emit();
      },
      err => console.warn('Realtime students listener:', err)
    );

    const unsubRooms = onSnapshot(
      collection(db, 'rooms'),
      snap => {
        roomsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        emit();
      },
      err => console.warn('Realtime rooms listener:', err)
    );

    const unsubInvoices = onSnapshot(
      collection(db, 'invoices'),
      snap => {
        invoicesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        emit();
      },
      err => console.warn('Realtime invoices listener:', err)
    );

    const unsubPayments = onSnapshot(
      collection(db, 'payments'),
      snap => {
        paymentsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        emit();
      },
      err => console.warn('Realtime payments listener:', err)
    );

    const unsubSupports = onSnapshot(
      collection(db, 'supportRequests'),
      snap => {
        supportsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        emit();
      },
      err => console.warn('Realtime supports listener:', err)
    );

    return () => {
      unsubStudents();
      unsubRooms();
      unsubInvoices();
      unsubPayments();
      unsubSupports();
    };
  },
};
