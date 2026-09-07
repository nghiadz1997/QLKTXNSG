import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  writeBatch 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACg9RfxTcXT7hr0VknJN-2wvfpl1jT-ok",
  authDomain: "qlktxnsg.firebaseapp.com",
  projectId: "qlktxnsg",
  storageBucket: "qlktxnsg.firebasestorage.app",
  messagingSenderId: "476374592242",
  appId: "1:476374592242:web:422231147b3fb3591b7e6b",
  measurementId: "G-FHLX18HE64"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanAndSeed() {
  console.log("=== BẮT ĐẦU DỌN SẠCH DỮ LIỆU MẪU & KHỞI TẠO KTX NAM SÀI GÒN ===");
  console.log("Kết nối Firebase Project:", firebaseConfig.projectId);

  const collectionsToClear = [
    "students",
    "invoices",
    "payments",
    "utilities",
    "supportRequests",
    "studentRoomHistory",
    "notifications",
    "announcements",
    "dormRegistrations",
    "communityPosts",
    "communityComments",
    "rooms",
    "buildings",
    "pricingRules",
    "roomRates",
    "semesters",
    "users"
  ];

  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        console.log(`Đang xoá ${snap.size} documents trong collection '${colName}'...`);
        const batch = writeBatch(db);
        snap.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        console.log(`-> Đã dọn sạch collection '${colName}'.`);
      } else {
        console.log(`Collection '${colName}' hiện tại đang trống.`);
      }
    } catch (err) {
      console.warn(`Lưu ý khi dọn '${colName}':`, err.message);
    }
  }

  const nowIso = new Date().toISOString();

  console.log("\n--- Khởi tạo Cấu Trúc Khung KTX Nam Sài Gòn Sạch ---");

  // 1. Tòa Nhà
  await setDoc(doc(db, "buildings", "TOA_A"), {
    id: "TOA_A",
    buildingId: "TOA_A",
    name: "Tòa Nhà A (Nam) - KTX Nam Sài Gòn",
    totalFloors: 4,
    totalRooms: 16,
    genderAllowed: "male",
    description: "Khu ký túc xá nam khang trang, an ninh 24/7",
    createdAt: nowIso
  });

  await setDoc(doc(db, "buildings", "TOA_B"), {
    id: "TOA_B",
    buildingId: "TOA_B",
    name: "Tòa Nhà B (Nữ) - KTX Nam Sài Gòn",
    totalFloors: 4,
    totalRooms: 16,
    genderAllowed: "female",
    description: "Khu ký túc xá nữ tiện nghi, bảo vệ và camera giám sát 24/7",
    createdAt: nowIso
  });
  console.log("✓ Đã tạo 2 Tòa Nhà: TOA_A (Nam) & TOA_B (Nữ)");

  // 2. Pricing Rules
  await setDoc(doc(db, "pricingRules", "rule_elec_2026"), {
    id: "rule_elec_2026",
    type: "electricity",
    unitPrice: 3500,
    effectiveFrom: "2026-09-01T00:00:00.000Z",
    effectiveTo: null,
    createdBy: "admin",
    createdAt: nowIso
  });
  await setDoc(doc(db, "pricingRules", "rule_water_2026"), {
    id: "rule_water_2026",
    type: "water",
    unitPrice: 18000,
    effectiveFrom: "2026-09-01T00:00:00.000Z",
    effectiveTo: null,
    createdBy: "admin",
    createdAt: nowIso
  });
  console.log("✓ Đã thiết lập Đơn giá: Điện 3.500 đ/kWh, Nước 18.000 đ/m3");

  // 3. Semester
  await setDoc(doc(db, "semesters", "SEM-2026-1"), {
    id: "SEM-2026-1",
    academicYear: "2026-2027",
    semesterName: "Học kỳ 1",
    startDate: "2026-09-01",
    endDate: "2027-01-15",
    paymentDueDate: "2026-09-30",
    status: "active",
    createdAt: nowIso
  });
  console.log("✓ Đã tạo Học kỳ hiện hành: Học kỳ 1 (2026-2027)");

  // 4. Room Rate
  await setDoc(doc(db, "roomRates", "RATE-STANDARD-4"), {
    id: "RATE-STANDARD-4",
    roomType: "Phòng 4 Người Tiêu Chuẩn",
    price: 650000,
    effectiveFrom: "2026-09-01T00:00:00.000Z",
    effectiveTo: null,
    semesterId: "SEM-2026-1",
    status: "active",
    createdBy: "admin",
    createdAt: nowIso
  });
  console.log("✓ Đã thiết lập Giá phòng: 650.000 đ/tháng");

  // 5. Danh sách phòng trống thực tế
  const cleanRooms = [
    {
      id: "A101",
      roomId: "A101",
      roomName: "Phòng A101 (Tầng 1 - Nam)",
      buildingId: "TOA_A",
      floor: 1,
      capacity: 4,
      currentOccupants: 0,
      availableSlots: 4,
      status: "available",
      roomType: "Phòng 4 Người Tiêu Chuẩn",
      roomRateId: "RATE-STANDARD-4",
      monthlyRate: 650000,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: "A102",
      roomId: "A102",
      roomName: "Phòng A102 (Tầng 1 - Nam)",
      buildingId: "TOA_A",
      floor: 1,
      capacity: 4,
      currentOccupants: 0,
      availableSlots: 4,
      status: "available",
      roomType: "Phòng 4 Người Tiêu Chuẩn",
      roomRateId: "RATE-STANDARD-4",
      monthlyRate: 650000,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: "A201",
      roomId: "A201",
      roomName: "Phòng A201 (Tầng 2 - Nam)",
      buildingId: "TOA_A",
      floor: 2,
      capacity: 4,
      currentOccupants: 0,
      availableSlots: 4,
      status: "available",
      roomType: "Phòng 4 Người Tiêu Chuẩn",
      roomRateId: "RATE-STANDARD-4",
      monthlyRate: 650000,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: "B101",
      roomId: "B101",
      roomName: "Phòng B101 (Tầng 1 - Nữ)",
      buildingId: "TOA_B",
      floor: 1,
      capacity: 4,
      currentOccupants: 0,
      availableSlots: 4,
      status: "available",
      roomType: "Phòng 4 Người Tiêu Chuẩn",
      roomRateId: "RATE-STANDARD-4",
      monthlyRate: 650000,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: "B102",
      roomId: "B102",
      roomName: "Phòng B102 (Tầng 1 - Nữ)",
      buildingId: "TOA_B",
      floor: 1,
      capacity: 4,
      currentOccupants: 0,
      availableSlots: 4,
      status: "available",
      roomType: "Phòng 4 Người Tiêu Chuẩn",
      roomRateId: "RATE-STANDARD-4",
      monthlyRate: 650000,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: "B201",
      roomId: "B201",
      roomName: "Phòng B201 (Tầng 2 - Nữ)",
      buildingId: "TOA_B",
      floor: 2,
      capacity: 4,
      currentOccupants: 0,
      availableSlots: 4,
      status: "available",
      roomType: "Phòng 4 Người Tiêu Chuẩn",
      roomRateId: "RATE-STANDARD-4",
      monthlyRate: 650000,
      createdAt: nowIso,
      updatedAt: nowIso
    }
  ];

  for (const r of cleanRooms) {
    await setDoc(doc(db, "rooms", r.id), r);
  }
  console.log("✓ Đã tạo 6 phòng trống tiêu chuẩn: A101, A102, A201, B101, B102, B201 (0 người ở, 4 chỗ trống mỗi phòng)");

  // 6. Bài chào mừng KTX
  await setDoc(doc(db, "communityPosts", "post_welcome"), {
    id: "post_welcome",
    authorUid: "bql_ktx",
    authorName: "Ban Quản Lý KTX Nam Sài Gòn",
    authorRole: "manager",
    title: "Chào mừng tân sinh viên và học sinh năm học 2026-2027",
    content: "Ban Quản Lý Ký túc xá Nam Sài Gòn xin gửi lời chào mừng toàn thể học sinh, sinh viên. Chúc các bạn có một năm học đạt kết quả cao và chấp hành nghiêm túc Nội quy KTX.",
    imageUrls: [],
    likesCount: 1,
    likedBy: [],
    commentsCount: 0,
    status: "active",
    isPinned: true,
    createdAt: nowIso,
    updatedAt: nowIso
  });
  console.log("✓ Đã tạo Bài đăng chào mừng của Ban Quản Lý KTX");

  console.log("\n=== HOÀN TẤT DỌN SẠCH & KHỞI TẠO KHUNG PRODUCTION THÀNH CÔNG 100%! ===");
  process.exit(0);
}

cleanAndSeed().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
