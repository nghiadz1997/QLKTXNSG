// System roles: student, manager (Quản lý KTX), truongPhong (Trưởng phòng KTX), superAdmin (Quản trị viên)
export type Role = 'student' | 'manager' | 'truongPhong' | 'superAdmin';

export interface CustomUserClaims {
  role: Role;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  status: 'active' | 'inactive' | 'locked';
  photoURL?: string;
  phone?: string;
  studentId?: string;
  hssv?: string;
  createdAt: string;
  updatedAt: string;
}

// Student types
export type DormStatus = 'notInDorm' | 'waiting' | 'living' | 'checkedOut';
export type StudentStatus = 'active' | 'inactive' | 'locked';

export interface Student {
  uid: string;
  authUid?: string;
  hssv: string;
  cccd: string; // Số CCCD / Căn cước công dân
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  faculty: string; // Khoa
  major: string; // Ngành học
  className: string; // Lớp
  course: string;
  roomId?: string;
  buildingId?: string;
  status: StudentStatus;
  dormStatus: DormStatus;
  checkInDate?: string;
  checkOutDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRoomHistory {
  id?: string;
  studentUid: string;
  roomId: string;
  buildingId?: string;
  action: 'checkIn' | 'checkOut' | 'transfer';
  checkInDate: string;
  checkOutDate?: string;
  performedBy: string;
  createdAt: string;
}

// Room & Building types
export type RoomStatus = 'available' | 'full' | 'maintenance' | 'locked';

export interface Building {
  id: string;
  buildingId: string;
  name: string;
  totalFloors: number;
  totalRooms: number;
  genderAllowed: 'male' | 'female' | 'mixed';
  description?: string;
  createdAt: string;
}

export interface RoomMember {
  studentId: string;
  hssv: string;
  cccd?: string;
  fullName: string;
  className: string;
  major?: string;
  phone: string;
  checkInDate: string;
}

export interface Room {
  id: string;
  roomId: string; // e.g. A101
  roomName: string;
  buildingId: string;
  floor: number;
  capacity: number;
  currentOccupants: number;
  availableSlots: number;
  status: RoomStatus;
  roomType: string; // e.g. "Phòng tiêu chuẩn 4 người", "Phòng dịch vụ 2 người"
  roomRateId?: string;
  monthlyRate?: number;
  createdAt: string;
  updatedAt: string;
}

// Dorm Registrations
export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'assigned' | 'completed';

export interface DormRegistration {
  id: string;
  fullName: string;
  hssv: string;
  cccd: string; // Số CCCD / Căn cước công dân
  cccdDate?: string; // Ngày cấp CCCD
  cccdPlace?: string; // Nơi cấp CCCD
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  faculty: string; // Khoa
  major: string; // Ngành học
  className: string; // Lớp
  ethnicity?: string; // Dân tộc
  religion?: string; // Tôn giáo
  permanentAddress?: string; // Hộ khẩu thường trú
  address?: string; // Địa chỉ hiện tại / liên hệ
  
  // Thông tin Cha
  fatherName?: string;
  fatherAge?: string;
  fatherJob?: string;
  fatherPhone?: string;
  fatherPermanentAddress?: string;
  fatherContactAddress?: string;

  // Thông tin Mẹ
  motherName?: string;
  motherAge?: string;
  motherJob?: string;
  motherPhone?: string;
  motherPermanentAddress?: string;
  motherContactAddress?: string;

  // Giấy chứng nhận ưu tiên & Nguyện vọng
  priorityCertificates?: string;
  desiredStayDuration?: string; // e.g. "1 Học kỳ", "1 Năm"
  note?: string;
  guardianSignatureName?: string; // PHHS nếu HSSV dưới 18 tuổi
  agreedRules?: boolean;

  status: RegistrationStatus;
  assignedRoomId?: string;
  assignedBuildingId?: string;
  processedBy?: string;
  processedAt?: string;
  ownerUid?: string;
  createdAt: string;
  updatedAt: string;
}

// Pricing and Room Rates (Immutable history)
export type PricingType = 'electricity' | 'water';

export interface PricingRule {
  id: string;
  type: PricingType;
  unitPrice: number; // e.g. 3500 for electricity, 18000 for water
  effectiveFrom: string;
  effectiveTo: string | null;
  createdBy: string;
  createdAt: string;
}

export interface RoomRate {
  id: string;
  roomType: string;
  price: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  semesterId: string;
  status: 'active' | 'archived';
  createdBy: string;
  createdAt: string;
}

// Semester
export interface Semester {
  id: string;
  academicYear: string; // e.g. "2026-2027"
  semesterName: string; // e.g. "Học kỳ 1"
  startDate: string;
  endDate: string;
  paymentDueDate: string;
  status: 'upcoming' | 'active' | 'completed';
  createdAt?: string;
}

// Utilities
export interface MeterData {
  oldIndex: number;
  newIndex: number;
  usage: number;
  unitPrice: number;
  amount: number;
}

export interface UtilityRecord {
  id: string; // e.g. "202609-A101"
  roomId: string;
  buildingId: string;
  year: number;
  month: number;
  semesterId: string;
  electricity: MeterData;
  water: MeterData;
  status: 'draft' | 'finalized';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Invoices & Payments
export type InvoiceStatus = 'unpaid' | 'pending' | 'paid' | 'overdue';

export interface Invoice {
  id: string;
  studentUid: string;
  studentName?: string;
  hssv?: string;
  roomId: string;
  buildingId: string;
  semesterId: string;
  year: number;
  month: number;
  roomFee: number;
  electricityUsage: number;
  electricityUnitPrice: number;
  electricityFee: number;
  waterUsage: number;
  waterUnitPrice: number;
  waterFee: number;
  otherFee: number;
  totalAmount: number;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  confirmedBy?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  studentUid: string;
  roomId: string;
  amount: number;
  paymentMethod: 'banking' | 'cash' | 'momo' | 'vnpay';
  transactionCode: string;
  status: 'pending' | 'confirmed' | 'rejected';
  paidAt: string;
  confirmedBy?: string;
  createdAt: string;
}

// Support Requests
export type SupportCategory =
  | 'Điện'
  | 'Nước'
  | 'Điều hòa'
  | 'Internet'
  | 'Vệ sinh'
  | 'Cơ sở vật chất'
  | 'An ninh'
  | 'Phòng'
  | 'Khác';

export type SupportPriority = 'normal' | 'urgent';
export type SupportStatus = 'new' | 'received' | 'processing' | 'resolved' | 'closed';

export interface SupportRequest {
  id: string;
  ownerUid: string;
  hssv: string;
  fullName: string;
  phone: string;
  faculty: string;
  className: string;
  roomId: string;
  buildingId: string;
  category: SupportCategory;
  title: string;
  content: string;
  priority: SupportPriority;
  status: SupportStatus;
  imageUrls: string[];
  responseNote?: string;
  handledBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Community
export interface CommunityPost {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole: Role;
  title: string;
  content: string;
  imageUrls: string[];
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  status: 'active' | 'hidden' | 'locked';
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  authorRole: Role;
  content: string;
  createdAt: string;
}

// Notifications
export interface Notification {
  id: string;
  userUid: string;
  title: string;
  message: string;
  type: 'invoice' | 'payment' | 'room' | 'support' | 'announcement' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Audit Logs
export interface AuditLog {
  id: string;
  action: string;
  userUid: string;
  userEmail?: string;
  role: string;
  targetCollection: string;
  targetId: string;
  oldValue: any;
  newValue: any;
  reason?: string;
  timestamp: string;
}
