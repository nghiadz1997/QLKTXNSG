import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  Lock,
  Radio,
  CreditCard,
  Save,
  CheckCircle2
} from 'lucide-react';
import { isRealFirebaseConfigured } from '../../config/firebase';
import { Card } from '../../components/common/Card';
import { settingsService, DEFAULT_BANK_INFO, type DormBankInfo } from '../../services/settingsService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const SystemSettingsPage: React.FC = () => {
  const { userProfile, role } = useAuth();
  const [bankInfo, setBankInfo] = useState<DormBankInfo>(DEFAULT_BANK_INFO);
  const [savingBank, setSavingBank] = useState(false);
  const [loadingBank, setLoadingBank] = useState(true);

  useEffect(() => {
    settingsService
      .getBankInfo()
      .then(info => {
        setBankInfo(info);
      })
      .finally(() => setLoadingBank(false));
  }, []);

  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      await settingsService.saveBankInfo(
        bankInfo,
        userProfile?.uid || 'admin',
        userProfile?.email,
        role || 'superAdmin'
      );
      toast.success('Đã lưu cấu hình tài khoản ngân hàng KTX thành công! Sinh viên sẽ thấy thông tin này ngay lập tức.');
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi khi lưu thông tin ngân hàng: ' + (err.message || 'Thử lại sau.'));
    } finally {
      setSavingBank(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
          <Settings className="w-4 h-4" /> Cấu Hình Kỹ Thuật Hệ Thống
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Cài Đặt Hệ Thống KÝ TÚC XÁ NAM SÀI GÒN
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Giám sát trạng thái kết nối cơ sở dữ liệu Firebase Cloud Firestore (Project qlktxnsg), cấu hình tài khoản nhận tiền KTX và phân quyền thời gian thực.
        </p>
      </div>

      <div className="space-y-6">
        {/* Dormitory Bank Account Settings */}
        <Card
          title="Thông Tin Tài Khoản Nhận Tiền KTX Nam Sài Gòn"
          subtitle="Thông tin hiển thị khi sinh viên nộp tiền phòng học kỳ & điện nước"
        >
          <form onSubmit={handleSaveBankInfo} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Ngân Hàng Thụ Hưởng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Agribank / Vietcombank / BIDV"
                  value={bankInfo.bankName}
                  onChange={e => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Số Tài Khoản KTX *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 1600205268888 hoặc STK chính thức"
                  value={bankInfo.accountNumber}
                  onChange={e => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-campus-700 focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tên Chủ Tài Khoản *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: BAN QUẢN LÝ KÝ TÚC XÁ NAM SÀI GÒN"
                  value={bankInfo.accountHolder}
                  onChange={e => setBankInfo({ ...bankInfo, accountHolder: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chi Nhánh Ngân Hàng
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Chi nhánh Nam Sài Gòn, TP. Hồ Chí Minh"
                  value={bankInfo.branch || ''}
                  onChange={e => setBankInfo({ ...bankInfo, branch: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ghi Chú Hướng Dẫn Sinh Viên
              </label>
              <textarea
                rows={2}
                placeholder="Ghi chú thêm về quy định nộp tiền hoặc lưu ý cho sinh viên..."
                value={bankInfo.note || ''}
                onChange={e => setBankInfo({ ...bankInfo, note: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingBank}
                className="px-5 py-2.5 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md shadow-campus-600/30 transition flex items-center space-x-2"
              >
                {savingBank ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu Cấu Hình Tài Khoản KTX</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Card>

        {/* Firebase Status */}
        <Card title="Trạng Thái Kết Nối Firebase" subtitle="Thông tin cấu hình backend">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center space-x-3">
                <Database className="w-6 h-6 text-campus-600" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Firebase Cloud Firestore</h4>
                  <p className="text-xs text-slate-500">
                    {isRealFirebaseConfigured
                      ? 'Đang kết nối trực tiếp với Firebase Production credentials (qlktxnsg)'
                      : 'Đang hoạt động trong chế độ phát triển / Demo Preview'}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isRealFirebaseConfigured
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}
              >
                {isRealFirebaseConfigured ? '🟢 Live Production (qlktxnsg)' : '🔵 Dev / Demo Mode'}
              </span>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <strong className="block text-slate-800 mb-1">Cấu hình Firebase thật đang sử dụng:</strong>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-slate-500">
                <li>Project ID: <span className="text-slate-800 font-bold">qlktxnsg</span></li>
                <li>Auth Domain: <span className="text-slate-800">qlktxnsg.firebaseapp.com</span></li>
                <li>Storage Bucket: <span className="text-slate-800">qlktxnsg.firebasestorage.app</span></li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Security & Realtime Status */}
        <Card
          title="Chính Sách An Toàn & Bảo Mật Dữ Liệu"
          subtitle="Tiêu chuẩn an toàn thông tin vận hành KTX thực tế"
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-emerald-950">Bảo Vệ Cơ Sở Dữ Liệu Chống Xóa Nhầm</h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Các thao tác xóa hàng loạt hoặc reset cấu trúc mẫu đã được gỡ bỏ vĩnh viễn khỏi giao diện người dùng nhằm ngăn ngừa rủi ro mất dữ liệu và các nguy cơ tấn công mạng.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start space-x-3">
              <Radio className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-blue-950">Đồng Bộ Thời Gian Thực (Real-Time Live Sync)</h4>
                <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                  Toàn bộ chỉ số KPI, danh sách phòng, sinh viên và hóa đơn được liên kết trực tiếp với Firestore qua cơ chế realtime listener. Mọi biến động dữ liệu được phản ánh tức thì trên toàn hệ thống mà không cần tải lại trang.
                </p>
              </div>
            </div>

            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100 flex items-start space-x-3">
              <Lock className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-purple-950">Phân Quyền Đa Cấp (Role-Based Access Control)</h4>
                <p className="text-xs text-purple-800 mt-1 leading-relaxed">
                  Hệ thống phân quyền theo cấp bậc: <strong>Super Admin</strong> (toàn quyền thiết lập hệ thống, tài khoản, đơn giá, số tài khoản ngân hàng KTX), <strong>Trưởng Phòng / Quản Lý KTX</strong> (vận hành phòng, sinh viên, điện nước, hóa đơn) và <strong>Sinh Viên</strong> (tra cứu phòng ở, hóa đơn cá nhân, xác nhận đã đóng tiền).
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
