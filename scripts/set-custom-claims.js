/**
 * SMART DORMITORY - GÁN CUSTOM CLAIMS CHO TÀI KHOẢN FIREBASE AUTH
 * 
 * Hướng dẫn sử dụng:
 * 1. Tải file serviceAccountKey.json từ Firebase Console -> Project Settings -> Service Accounts.
 * 2. Đặt file serviceAccountKey.json vào thư mục gốc của project (hoặc set biến GOOGLE_APPLICATION_CREDENTIALS).
 * 3. Chạy lệnh:
 *    node scripts/set-custom-claims.js <USER_UID> <ROLE>
 * 
 * Ví dụ:
 *    node scripts/set-custom-claims.js abc123xyz superAdmin
 *    node scripts/set-custom-claims.js def456uvw manager
 *    node scripts/set-custom-claims.js ghi789rst student
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

const [,, targetUid, targetRole] = process.argv;

if (!targetUid || !targetRole) {
  console.error('\n❌ Thiếu tham số!');
  console.log('Cách dùng: node scripts/set-custom-claims.js <USER_UID> <student|manager|superAdmin>\n');
  process.exit(1);
}

const validRoles = ['student', 'manager', 'truongPhong', 'superAdmin'];
if (!validRoles.includes(targetRole)) {
  console.error(`\n❌ Vai trò không hợp lệ: "${targetRole}". Vai trò hợp lệ: ${validRoles.join(', ')}\n`);
  process.exit(1);
}

if (!fs.existsSync(serviceAccountPath)) {
  console.warn('\n⚠️ Không tìm thấy file "serviceAccountKey.json" tại thư mục gốc.');
  console.warn('Vui lòng tải file Service Account Key từ Firebase Console để chạy script này.\n');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setClaims() {
  try {
    await admin.auth().setCustomUserClaims(targetUid, {
      role: targetRole
    });

    console.log(`\n✅ THÀNH CÔNG: Đã gán Custom Claim { role: "${targetRole}" } cho người dùng ${targetUid}.`);
    console.log('Token của người dùng sẽ cập nhật vai trò mới trong lần đăng nhập tiếp theo.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Lỗi khi gán claims:', error);
    process.exit(1);
  }
}

setClaims();
