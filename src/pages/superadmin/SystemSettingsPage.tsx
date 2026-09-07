import React from 'react';
import { Settings, ShieldCheck, Database, KeyRound, CheckCircle2, Lock, Radio } from 'lucide-react';
import { isRealFirebaseConfigured } from '../../config/firebase';
import { Card } from '../../components/common/Card';

export const SystemSettingsPage: React.FC = () => {
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
          Giám sát trạng thái kết nối cơ sở dữ liệu Firebase Cloud Firestore (Project qlktxnsg), xác thực Authentication và cơ chế đồng bộ thời gian thực.
        </p>
      </div>

      <div className="space-y-6">
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
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                isRealFirebaseConfigured
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
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
                  Hệ thống phân quyền theo cấp bậc: <strong>Super Admin</strong> (toàn quyền thiết lập hệ thống, tài khoản, đơn giá), <strong>Trưởng Phòng / Quản Lý KTX</strong> (vận hành phòng, sinh viên, điện nước, hóa đơn) và <strong>Sinh Viên</strong> (tra cứu phòng ở, hóa đơn cá nhân, báo cáo sự cố).
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
