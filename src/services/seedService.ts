import { doc, setDoc, getDocs, collection, query, limit, writeBatch } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Building, Room, PricingRule, RoomRate, Semester, Student, UserProfile } from '../types';

export const seedService = {
  async isDatabaseSeeded(): Promise<boolean> {
    try {
      const snap = await getDocs(query(collection(db, 'buildings'), limit(1)));
      return !snap.empty;
    } catch {
      return false;
    }
  },

  // Khởi tạo khung KTX Nam Sài Gòn sạch (Không có dữ liệu sinh viên mẫu)
  async seedCleanStructure(): Promise<void> {
    const nowIso = new Date().toISOString();

    // 1. Buildings
    const buildingA: Building = {
      id: 'TOA_A',
      buildingId: 'TOA_A',
      name: 'Tòa Nhà A (Nam) - KTX Nam Sài Gòn',
      totalFloors: 4,
      totalRooms: 16,
      genderAllowed: 'male',
      description: 'Khu ký túc xá nam khang trang, an ninh',
      createdAt: nowIso,
    };
    const buildingB: Building = {
      id: 'TOA_B',
      buildingId: 'TOA_B',
      name: 'Tòa Nhà B (Nữ) - KTX Nam Sài Gòn',
      totalFloors: 4,
      totalRooms: 16,
      genderAllowed: 'female',
      description: 'Khu ký túc xá nữ tiện nghi, bảo vệ 24/7',
      createdAt: nowIso,
    };

    await setDoc(doc(db, 'buildings', 'TOA_A'), buildingA);
    await setDoc(doc(db, 'buildings', 'TOA_B'), buildingB);

    // 2. Pricing Rules
    const elecRule: PricingRule = {
      id: 'rule_elec_2026',
      type: 'electricity',
      unitPrice: 3500, // 3.500 VND / kWh
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      effectiveTo: null,
      createdBy: 'admin',
      createdAt: nowIso,
    };
    const waterRule: PricingRule = {
      id: 'rule_water_2026',
      type: 'water',
      unitPrice: 18000, // 18.000 VND / m3
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      effectiveTo: null,
      createdBy: 'admin',
      createdAt: nowIso,
    };

    await setDoc(doc(db, 'pricingRules', elecRule.id), elecRule);
    await setDoc(doc(db, 'pricingRules', waterRule.id), waterRule);

    // 3. Active Semester
    const semester: Semester = {
      id: 'SEM-2026-1',
      academicYear: '2026-2027',
      semesterName: 'Học kỳ 1',
      startDate: '2026-09-01',
      endDate: '2027-01-15',
      paymentDueDate: '2026-09-30',
      status: 'active',
      createdAt: nowIso,
    };
    await setDoc(doc(db, 'semesters', semester.id), semester);

    // 4. Room Rate
    const rateStandard: RoomRate = {
      id: 'RATE-STANDARD-4',
      roomType: 'Phòng 4 Người Tiêu Chuẩn',
      price: 650000, // 650.000 VND/tháng/sinh viên
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      effectiveTo: null,
      semesterId: semester.id,
      status: 'active',
      createdBy: 'admin',
      createdAt: nowIso,
    };
    await setDoc(doc(db, 'roomRates', rateStandard.id), rateStandard);

    // 5. Clean Empty Rooms for Nam Sai Gon (0 occupants, all available)
    const cleanRooms: Room[] = [
      {
        id: 'A101',
        roomId: 'A101',
        roomName: 'Phòng A101 (Tầng 1 - Nam)',
        buildingId: 'TOA_A',
        floor: 1,
        capacity: 4,
        currentOccupants: 0,
        availableSlots: 4,
        status: 'available',
        roomType: 'Phòng 4 Người Tiêu Chuẩn',
        roomRateId: rateStandard.id,
        monthlyRate: rateStandard.price,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'A102',
        roomId: 'A102',
        roomName: 'Phòng A102 (Tầng 1 - Nam)',
        buildingId: 'TOA_A',
        floor: 1,
        capacity: 4,
        currentOccupants: 0,
        availableSlots: 4,
        status: 'available',
        roomType: 'Phòng 4 Người Tiêu Chuẩn',
        roomRateId: rateStandard.id,
        monthlyRate: rateStandard.price,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'A201',
        roomId: 'A201',
        roomName: 'Phòng A201 (Tầng 2 - Nam)',
        buildingId: 'TOA_A',
        floor: 2,
        capacity: 4,
        currentOccupants: 0,
        availableSlots: 4,
        status: 'available',
        roomType: 'Phòng 4 Người Tiêu Chuẩn',
        roomRateId: rateStandard.id,
        monthlyRate: rateStandard.price,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'B101',
        roomId: 'B101',
        roomName: 'Phòng B101 (Tầng 1 - Nữ)',
        buildingId: 'TOA_B',
        floor: 1,
        capacity: 4,
        currentOccupants: 0,
        availableSlots: 4,
        status: 'available',
        roomType: 'Phòng 4 Người Tiêu Chuẩn',
        roomRateId: rateStandard.id,
        monthlyRate: rateStandard.price,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'B102',
        roomId: 'B102',
        roomName: 'Phòng B102 (Tầng 1 - Nữ)',
        buildingId: 'TOA_B',
        floor: 1,
        capacity: 4,
        currentOccupants: 0,
        availableSlots: 4,
        status: 'available',
        roomType: 'Phòng 4 Người Tiêu Chuẩn',
        roomRateId: rateStandard.id,
        monthlyRate: rateStandard.price,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
      {
        id: 'B201',
        roomId: 'B201',
        roomName: 'Phòng B201 (Tầng 2 - Nữ)',
        buildingId: 'TOA_B',
        floor: 2,
        capacity: 4,
        currentOccupants: 0,
        availableSlots: 4,
        status: 'available',
        roomType: 'Phòng 4 Người Tiêu Chuẩn',
        roomRateId: rateStandard.id,
        monthlyRate: rateStandard.price,
        createdAt: nowIso,
        updatedAt: nowIso,
      }
    ];

    for (const r of cleanRooms) {
      await setDoc(doc(db, 'rooms', r.id), r);
    }

    // 6. Thông báo chào mừng
    await setDoc(doc(db, 'communityPosts', 'post_welcome'), {
      id: 'post_welcome',
      authorUid: 'bql_ktx',
      authorName: 'Ban Quản Lý KTX Nam Sài Gòn',
      authorRole: 'manager',
      title: 'Chào mừng tân sinh viên và học sinh năm học 2026-2027',
      content: 'Ban Quản Lý Ký túc xá Nam Sài Gòn xin gửi lời chào mừng toàn thể học sinh, sinh viên. Chúc các bạn có một năm học đạt kết quả cao và chấp hành nghiêm túc Nội quy KTX.',
      imageUrls: [],
      likesCount: 1,
      likedBy: [],
      commentsCount: 0,
      status: 'active',
      isPinned: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  },

  // Xóa sạch toàn bộ dữ liệu mẫu trong các collection để sẵn sàng vận hành thật
  async clearAllMockData(): Promise<void> {
    const currentUid = auth.currentUser?.uid;
    const collectionsToClear = [
      'students',
      'invoices',
      'payments',
      'utilities',
      'utilityReadings',
      'supportRequests',
      'studentRoomHistory',
      'roomHistory',
      'notifications',
      'announcements',
      'dormRegistrations',
      'communityPosts',
      'communityComments',
      'postComments',
      'rooms',
      'buildings',
      'pricingRules',
      'roomRates',
      'semesters',
      'auditLogs',
      'settings',
      'users'
    ];

    for (const colName of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const batch = writeBatch(db);
          snap.forEach((d) => {
            // Giữ lại tài khoản admin đang đăng nhập để không bị mất phiên làm việc
            if (colName === 'users' && currentUid && d.id === currentUid) {
              return;
            }
            batch.delete(d.ref);
          });
          await batch.commit();
        }
      } catch (err) {
        console.warn(`Could not clear collection ${colName}:`, err);
      }
    }
  },

  // Xóa toàn bộ dữ liệu cũ và khởi tạo cấu trúc chuẩn KTX Nam Sài Gòn (phòng trống, bảng giá, học kỳ)
  async resetToCleanProduction(): Promise<void> {
    await this.clearAllMockData();
    await this.seedCleanStructure();
  }
};
