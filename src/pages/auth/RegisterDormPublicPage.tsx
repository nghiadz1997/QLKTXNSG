import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CheckCircle,
  ArrowLeft,
  Send,
  Sparkles,
  User,
  Users,
  ShieldCheck,
  FileCheck,
  Clock,
  Search,
  AlertCircle
} from 'lucide-react';
import { registrationService } from '../../services/registrationService';
import { toast } from 'sonner';

export const RegisterDormPublicPage: React.FC = () => {
  const [formData, setFormData] = useState({
    // I. HSSV
    fullName: '',
    gender: 'male' as 'male' | 'female' | 'other',
    dateOfBirth: '',
    hssv: '',
    className: '',
    faculty: 'Công Nghệ Thông Tin',
    major: 'Kỹ Thuật Phần Mềm',
    phone: '',
    email: '',
    ethnicity: 'Kinh',
    religion: 'Không',
    cccd: '',
    cccdDate: '',
    cccdPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: '',
    address: '',

    // II. Cha
    fatherName: '',
    fatherAge: '',
    fatherJob: '',
    fatherPhone: '',
    fatherPermanentAddress: '',
    fatherContactAddress: '',

    // II. Mẹ
    motherName: '',
    motherAge: '',
    motherJob: '',
    motherPhone: '',
    motherPermanentAddress: '',
    motherContactAddress: '',

    // III. Giấy tờ ưu tiên & Lưu trú
    priorityCertificates: '',
    desiredStayDuration: '1 Năm Học (10 tháng)',
    note: '',

    // IV. Cam kết
    guardianSignatureName: '',
    agreedRules: true,
  });

  const [loading, setLoading] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.hssv || !formData.phone || !formData.cccd || !formData.permanentAddress) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*).');
      return;
    }

    if (!formData.agreedRules) {
      toast.error('Vui lòng đọc và tích cam kết thực hiện Nội quy Ký túc xá.');
      return;
    }

    setLoading(true);
    try {
      const reg = await registrationService.submitPublicRegistration(formData);
      setSubmittedId(reg.id);
      toast.success('Gửi đơn xin vào Ký túc xá thành công!');
    } catch (err: any) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi gửi đơn: ' + (err.message || 'Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const copySameAddressFather = () => {
    setFormData(prev => ({
      ...prev,
      fatherPermanentAddress: prev.permanentAddress,
      fatherContactAddress: prev.permanentAddress,
    }));
    toast.info('Đã sao chép hộ khẩu thường trú của HSSV sang Cha.');
  };

  const copySameAddressMother = () => {
    setFormData(prev => ({
      ...prev,
      motherPermanentAddress: prev.permanentAddress,
      motherContactAddress: prev.permanentAddress,
    }));
    toast.info('Đã sao chép hộ khẩu thường trú của HSSV sang Mẹ.');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-xs font-bold text-slate-600 hover:text-campus-600 transition bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Về Trang Chủ KTX Nam Sài Gòn
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center text-xs font-bold text-campus-600 hover:text-campus-700 transition"
          >
            Đã có tài khoản? Đăng nhập →
          </Link>
        </div>

        {/* Paper Application Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="text-center space-y-2 border-b border-slate-200 pb-6">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500 block">
              CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM
            </span>
            <span className="text-xs font-bold tracking-wider text-slate-700 block">
              Độc lập - Tự do - Hạnh phúc
            </span>
            <div className="w-32 h-0.5 bg-slate-300 mx-auto my-2" />

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 pt-2 tracking-tight uppercase">
              ĐƠN XIN VÀO KÝ TÚC XÁ
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 italic">
              Kính gửi: Phòng Công tác Chính trị - Học sinh sinh viên / Ban Quản Lý Ký Túc Xá Nam Sài Gòn
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Dành cho Học sinh Sinh viên có nguyện vọng lưu trú năm học 2026 - 2027</span>
            <span className="font-mono text-campus-600 font-bold bg-campus-50 px-2.5 py-1 rounded-lg border border-campus-200">
              MẪU ĐƠN CHUẨN
            </span>
          </div>
        </div>

        {submittedId ? (
          /* Submission Success State */
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-md border border-emerald-100 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-12 h-12" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200 inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                ĐANG CHỜ BAN QUẢN LÝ KTX DUYỆT & SẮP PHÒNG
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                Đã Tiếp Nhận Đơn Đăng Ký Vào Ký Túc Xá!
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hồ sơ của bạn <strong>{formData.fullName}</strong> (Mã HSSV: <strong className="font-mono">{formData.hssv}</strong>) đã được lưu trữ thành công vào hệ thống.
              </p>
            </div>

            {/* Info details box */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Mã hồ sơ tiếp nhận:</span>
                <span className="font-mono font-bold text-campus-600">{submittedId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Họ và tên:</span>
                <span className="font-bold text-slate-800">{formData.fullName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Số CCCD:</span>
                <span className="font-mono font-bold text-slate-800">{formData.cccd}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Khoa / Ngành:</span>
                <span className="font-bold text-slate-800">{formData.faculty}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Trạng thái:</span>
                <span className="font-bold text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Chờ duyệt & sắp phòng
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 max-w-md mx-auto italic">
              * Bạn có thể quay lại Trang Chủ bất kỳ lúc nào và nhập Mã HSSV hoặc Số CCCD để tra cứu tiến độ xét duyệt và số phòng được phân bổ.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="w-full sm:w-auto px-6 py-3 bg-campus-600 hover:bg-campus-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                Về Trang Chủ Tra Cứu
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedId(null);
                  setFormData({
                    fullName: '',
                    gender: 'male',
                    dateOfBirth: '',
                    hssv: '',
                    className: '',
                    faculty: 'Công Nghệ Thông Tin',
                    major: 'Kỹ Thuật Phần Mềm',
                    phone: '',
                    email: '',
                    ethnicity: 'Kinh',
                    religion: 'Không',
                    cccd: '',
                    cccdDate: '',
                    cccdPlace: 'Cục Cảnh sát QLHC về TTXH',
                    permanentAddress: '',
                    address: '',
                    fatherName: '',
                    fatherAge: '',
                    fatherJob: '',
                    fatherPhone: '',
                    fatherPermanentAddress: '',
                    fatherContactAddress: '',
                    motherName: '',
                    motherAge: '',
                    motherJob: '',
                    motherPhone: '',
                    motherPermanentAddress: '',
                    motherContactAddress: '',
                    priorityCertificates: '',
                    desiredStayDuration: '1 Năm Học (10 tháng)',
                    note: '',
                    guardianSignatureName: '',
                    agreedRules: true,
                  });
                }}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Gửi thêm hồ sơ khác
              </button>
            </div>
          </div>
        ) : (
          /* Actual Paper Application Form */
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-8">
            {/* SECTION I: THÔNG TIN HỌC SINH SINH VIÊN */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-campus-100 text-campus-700 font-black text-xs flex items-center justify-center">
                  I
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Thông Tin Học Sinh Sinh Viên (HSSV)
                  </h3>
                  <p className="text-xs text-slate-500">Cung cấp chính xác thông tin định danh cá nhân và đào tạo</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Họ và tên HSSV *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Giới tính *
                  </label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition font-medium"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày, tháng, năm sinh *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mã HSSV *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hssv}
                    onChange={e => setFormData({ ...formData, hssv: e.target.value.trim() })}
                    placeholder="22001xxx"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Điện thoại HSSV *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0912345678"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lớp sinh hoạt *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.className}
                    onChange={e => setFormData({ ...formData, className: e.target.value })}
                    placeholder="CNTT-K22A"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Khoa / Viện đào tạo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.faculty}
                    onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                    placeholder="Công Nghệ Thông Tin"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chuyên ngành học
                  </label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={e => setFormData({ ...formData, major: e.target.value })}
                    placeholder="Kỹ Thuật Phần Mềm"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dân tộc
                  </label>
                  <input
                    type="text"
                    value={formData.ethnicity}
                    onChange={e => setFormData({ ...formData, ethnicity: e.target.value })}
                    placeholder="Kinh / Tày / Nùng..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tôn giáo
                  </label>
                  <input
                    type="text"
                    value={formData.religion}
                    onChange={e => setFormData({ ...formData, religion: e.target.value })}
                    placeholder="Không / Phật giáo / Công giáo..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email liên hệ *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition font-mono"
                  />
                </div>

                {/* CCCD Group */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số CCCD / CMND *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cccd}
                    onChange={e => setFormData({ ...formData, cccd: e.target.value.trim() })}
                    placeholder="00120300xxxx (12 số)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ngày cấp CCCD *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.cccdDate}
                    onChange={e => setFormData({ ...formData, cccdDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nơi cấp CCCD *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cccdPlace}
                    onChange={e => setFormData({ ...formData, cccdPlace: e.target.value })}
                    placeholder="Cục Cảnh sát QLHC về TTXH"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hộ khẩu thường trú của HSSV *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.permanentAddress}
                    onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })}
                    placeholder="Số nhà, Đường, Thôn/Xã/Phường, Quận/Huyện, Tỉnh/Thành phố"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* SECTION II: THÔNG TIN THÂN NHÂN GIA ĐÌNH */}
            <div className="space-y-6 pt-4 border-t border-slate-200">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                  II
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Thông Tin Thân Nhân Gia Đình
                  </h3>
                  <p className="text-xs text-slate-500">Phục vụ liên hệ khẩn cấp và bảo trợ của gia đình</p>
                </div>
              </div>

              {/* Thông tin Cha */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    <span>1. Thông Tin Cha</span>
                  </h4>
                  <button
                    type="button"
                    onClick={copySameAddressFather}
                    className="text-[11px] font-bold text-campus-600 hover:text-campus-700 hover:underline"
                  >
                    Dùng chung địa chỉ HSSV
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Họ tên Cha:</label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={e => setFormData({ ...formData, fatherName: e.target.value })}
                      placeholder="Nguyễn Văn B"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Tuổi:</label>
                    <input
                      type="number"
                      value={formData.fatherAge}
                      onChange={e => setFormData({ ...formData, fatherAge: e.target.value })}
                      placeholder="50"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Điện thoại Cha:</label>
                    <input
                      type="tel"
                      value={formData.fatherPhone}
                      onChange={e => setFormData({ ...formData, fatherPhone: e.target.value })}
                      placeholder="0903xxxxxx"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-1">Nghề nghiệp Cha:</label>
                    <input
                      type="text"
                      value={formData.fatherJob}
                      onChange={e => setFormData({ ...formData, fatherJob: e.target.value })}
                      placeholder="Công nhân / Kinh doanh tự do / Nông dân..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-1">Hộ khẩu thường trú Cha:</label>
                    <input
                      type="text"
                      value={formData.fatherPermanentAddress}
                      onChange={e => setFormData({ ...formData, fatherPermanentAddress: e.target.value })}
                      placeholder="Địa chỉ thường trú theo sổ hộ khẩu"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-1">Địa chỉ liên hệ Cha:</label>
                    <input
                      type="text"
                      value={formData.fatherContactAddress}
                      onChange={e => setFormData({ ...formData, fatherContactAddress: e.target.value })}
                      placeholder="Nơi ở hiện tại của Cha"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin Mẹ */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-rose-600" />
                    <span>2. Thông Tin Mẹ</span>
                  </h4>
                  <button
                    type="button"
                    onClick={copySameAddressMother}
                    className="text-[11px] font-bold text-campus-600 hover:text-campus-700 hover:underline"
                  >
                    Dùng chung địa chỉ HSSV
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Họ tên Mẹ:</label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={e => setFormData({ ...formData, motherName: e.target.value })}
                      placeholder="Trần Thị C"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Tuổi:</label>
                    <input
                      type="number"
                      value={formData.motherAge}
                      onChange={e => setFormData({ ...formData, motherAge: e.target.value })}
                      placeholder="48"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">Điện thoại Mẹ:</label>
                    <input
                      type="tel"
                      value={formData.motherPhone}
                      onChange={e => setFormData({ ...formData, motherPhone: e.target.value })}
                      placeholder="0918xxxxxx"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-1">Nghề nghiệp Mẹ:</label>
                    <input
                      type="text"
                      value={formData.motherJob}
                      onChange={e => setFormData({ ...formData, motherJob: e.target.value })}
                      placeholder="Nội trợ / Buôn bán / Công chức..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-1">Hộ khẩu thường trú Mẹ:</label>
                    <input
                      type="text"
                      value={formData.motherPermanentAddress}
                      onChange={e => setFormData({ ...formData, motherPermanentAddress: e.target.value })}
                      placeholder="Địa chỉ thường trú theo sổ hộ khẩu"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-semibold text-slate-600 mb-1">Địa chỉ liên hệ Mẹ:</label>
                    <input
                      type="text"
                      value={formData.motherContactAddress}
                      onChange={e => setFormData({ ...formData, motherContactAddress: e.target.value })}
                      placeholder="Nơi ở hiện tại của Mẹ"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION III: CHỨNG NHẬN ƯU TIÊN & THỜI GIAN Ở */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">
                  III
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Diện Ưu Tiên & Thời Gian Lưu Trú
                  </h3>
                  <p className="text-xs text-slate-500">Các chứng nhận chính sách xã hội để được ưu tiên bố trí chỗ ở</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Các giấy chứng nhận ưu tiên (nếu có):
                  </label>
                  <textarea
                    rows={2}
                    value={formData.priorityCertificates}
                    onChange={e => setFormData({ ...formData, priorityCertificates: e.target.value })}
                    placeholder="Ví dụ: Giấy chứng nhận hộ nghèo / cận nghèo năm 2026; Con thương binh / liệt sĩ; Sinh viên vùng sâu vùng xa hải đảo..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Thời gian mong muốn ở
                  </label>
                  <select
                    value={formData.desiredStayDuration}
                    onChange={e => setFormData({ ...formData, desiredStayDuration: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 font-medium"
                  >
                    <option value="1 Học kỳ (5 tháng)">1 Học kỳ (5 tháng)</option>
                    <option value="1 Năm Học (10 tháng)">1 Năm Học (10 tháng)</option>
                    <option value="Cả năm (12 tháng bao gồm hè)">Cả năm (12 tháng bao gồm hè)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Ghi chú / Nguyện vọng đặc biệt
                  </label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Ví dụ: Mong muốn ở cùng phòng bạn Mã HSSV 22002..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500"
                  />
                </div>
              </div>
            </div>

            {/* SECTION IV: CAM KẾT NỘI QUY & CHỮ KÝ */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
                  IV
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 uppercase">
                    Cam Kết Thực Hiện Nội Quy Ký Túc Xá
                  </h3>
                </div>
              </div>

              {/* Legal Pledge Text Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 leading-relaxed italic space-y-2">
                <p>
                  "Nay tôi làm đơn này kính đề nghị Phòng Công tác Chính trị - Học sinh sinh viên / Ban Quản Lý Ký túc xá xem xét cho tôi được vào ở Ký túc xá. Nếu được giải quyết, tôi cam kết thực hiện nghiêm túc Nội quy Ký túc xá của Nhà trường, chấp hành nếp sống văn minh và giữ gìn an ninh trật tự."
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.agreedRules}
                    onChange={e => setFormData({ ...formData, agreedRules: e.target.checked })}
                    className="mt-1 w-4 h-4 rounded text-campus-600 focus:ring-campus-500 border-slate-300"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Tôi cam đoan toàn bộ thông tin khai báo trên là đúng sự thật và hoàn toàn chịu trách nhiệm trước Nhà trường.
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Người làm đơn (Ký tên / Ghi rõ họ tên)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.fullName ? `${formData.fullName} (Đã xác nhận)` : ''}
                      placeholder="Họ tên thí sinh"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Họ tên Phụ huynh (Dành cho HSSV dưới 18 tuổi)
                    </label>
                    <input
                      type="text"
                      value={formData.guardianSignatureName}
                      onChange={e => setFormData({ ...formData, guardianSignatureName: e.target.value })}
                      placeholder="Họ tên PHHS xác nhận bảo lãnh"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Action Button */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                * Dữ liệu được bảo mật và truyền trực tiếp về cơ sở dữ liệu KTX Nam Sài Gòn.
              </span>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-campus-600 to-campus-700 hover:from-campus-700 hover:to-campus-800 text-white font-black rounded-2xl text-sm shadow-xl shadow-campus-600/30 transition flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang gửi hồ sơ...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>NỘP ĐƠN XIN VÀO KÝ TÚC XÁ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
