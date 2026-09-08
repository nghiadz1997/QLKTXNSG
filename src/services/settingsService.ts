import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auditService } from './auditService';

export interface DormBankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  transferSyntaxHint?: string;
  note?: string;
}

export const DEFAULT_BANK_INFO: DormBankInfo = {
  bankName: 'Agribank / Vietcombank / BIDV (KTX Nam Sài Gòn)',
  accountNumber: 'Liên hệ Văn phòng KTX',
  accountHolder: 'BAN QUẢN LÝ KÝ TÚC XÁ NAM SÀI GÒN',
  branch: 'Chi nhánh Nam Sài Gòn - TP.HCM',
  transferSyntaxHint: '[Mã HSSV] [Mã Hóa Đơn]',
  note: 'Sinh viên chuyển khoản theo số tài khoản chính thức do Ban Quản lý KTX thông báo hoặc nộp tiền mặt trực tiếp tại Văn phòng KTX.',
};

const SETTINGS_COLLECTION = 'settings';
const BANK_INFO_DOC = 'bankInfo';

export const settingsService = {
  async getBankInfo(): Promise<DormBankInfo> {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION, BANK_INFO_DOC);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...DEFAULT_BANK_INFO, ...snap.data() } as DormBankInfo;
      }
      return DEFAULT_BANK_INFO;
    } catch (error) {
      console.warn('Error fetching bank info, using default:', error);
      return DEFAULT_BANK_INFO;
    }
  },

  async saveBankInfo(
    info: DormBankInfo,
    userUid: string,
    userEmail?: string,
    role: string = 'manager'
  ): Promise<void> {
    const docRef = doc(db, SETTINGS_COLLECTION, BANK_INFO_DOC);
    await setDoc(docRef, {
      ...info,
      updatedAt: new Date().toISOString(),
      updatedBy: userUid,
    });

    await auditService.logAction(
      'Cập nhật thông tin ngân hàng KTX',
      userUid,
      userEmail,
      role,
      SETTINGS_COLLECTION,
      BANK_INFO_DOC,
      null,
      info,
      'Cập nhật số tài khoản nhận tiền KTX'
    );
  },
};
