import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  GraduationCap,
  ShieldCheck,
  Wifi,
  Users,
  Search,
  ArrowRight,
  LogIn,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  HeartHandshake,
  Check,
  ChevronRight
} from 'lucide-react';
import { registrationService } from '../../services/registrationService';
import type { DormRegistration } from '../../types';

export const HomePage: React.FC = () => {
  // Search application status state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<DormRegistration | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setHasSearched(true);
    try {
      const result = await registrationService.searchRegistration(searchQuery.trim());
      setSearchResult(result);
    } catch (err) {
      console.error(err);
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const getStatusDisplay = (status: string, reg: DormRegistration) => {
    switch (status) {
      case 'pending':
        return (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <div className="flex items-center space-x-2 font-bold text-sm text-amber-800 mb-1">
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
              <span>Đang Chờ Duyệt & Sắp Xếp Phòng</span>
            </div>
            <p className="text-xs leading-relaxed text-amber-700">
              Hồ sơ của bạn đã được tiếp nhận an toàn trên hệ thống. Hiện đang chờ Ban Quản Lý KTX và Trưởng phòng kiểm tra đối chiếu hồ sơ để xét duyệt và sắp xếp phòng phù hợp.
            </p>
          </div>
        );
      case 'approved':
        return (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
            <div className="flex items-center space-x-2 font-bold text-sm text-blue-800 mb-1">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              <span>Hồ Sơ Đã Được Duyệt • Đang Xếp Phòng</span>
            </div>
            <p className="text-xs leading-relaxed text-blue-700">
              Hồ sơ đăng ký của bạn đã được phê duyệt hợp lệ. Ban Quản Lý đang tiến hành bố trí phòng và giường trống theo quy định.
            </p>
          </div>
        );
      case 'completed':
        return (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="flex items-center space-x-2 font-bold text-sm text-emerald-800 mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Chúc Mừng! Đã Hoàn Tất Phân Phòng</span>
            </div>
            <p className="text-xs leading-relaxed text-emerald-700">
              Bạn đã được xếp vào <strong>Phòng {reg.assignedRoomId}</strong>. Vui lòng liên hệ Văn phòng Ký túc xá để hoàn tất thủ tục nhận phòng và nhận chìa khóa.
            </p>
          </div>
        );
      case 'rejected':
        return (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900">
            <div className="flex items-center space-x-2 font-bold text-sm text-rose-800 mb-1">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <span>Hồ Sơ Không Được Duyệt</span>
            </div>
            <p className="text-xs leading-relaxed text-rose-700">
              Lý do: {reg.note || 'Số lượng phòng đã hết hoặc thông tin chưa đạt yêu cầu theo quy định của KTX.'}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-campus-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Branding */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-campus-700 via-campus-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-campus-600/30 group-hover:scale-105 transition transform">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-campus-600 uppercase block">
                CỔNG THÔNG TIN KÝ TÚC XÁ
              </span>
              <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight block">
                KÝ TÚC XÁ NAM SÀI GÒN
              </span>
            </div>
          </Link>

          {/* Quick Nav & Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <a
              href="#tra-cuu"
              className="hidden md:inline-flex items-center px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-campus-600 hover:bg-slate-100 rounded-xl transition"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" />
              Tra Cứu Hồ Sơ
            </a>

            <Link
              to="/register-dorm"
              className="inline-flex items-center px-4 py-2.5 bg-campus-600 hover:bg-campus-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-campus-600/25 transition transform hover:-translate-y-0.5"
            >
              <FileText className="w-4 h-4 mr-1.5" />
              <span>Nộp Đơn Vào KTX</span>
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-slate-900/20 transition transform hover:-translate-y-0.5"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              <span>Đăng Nhập</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-campus-50/30 to-slate-50 py-16 sm:py-24 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-campus-100 text-campus-800 text-xs font-bold border border-campus-200 shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Tuyển Sinh Ký Túc Xá Năm Học 2026 - 2027</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                KÝ TÚC XÁ <span className="text-transparent bg-clip-text bg-gradient-to-r from-campus-600 to-cyan-600">NAM SÀI GÒN</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Ngôi nhà chung tiện nghi, văn minh và an ninh dành cho học sinh, sinh viên. Không gian sống xanh, phòng ốc hiện đại, dịch vụ quản lý khép kín cùng chi phí hỗ trợ học đường tối ưu nhất.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  to="/register-dorm"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 bg-gradient-to-r from-campus-600 to-campus-700 hover:from-campus-700 hover:to-campus-800 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-campus-600/30 transition transform hover:-translate-y-0.5 space-x-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>Nộp Đơn Đăng Ký Vào KTX Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 bg-white hover:bg-slate-100 text-slate-800 font-bold text-sm rounded-2xl border border-slate-300 shadow-sm transition space-x-2"
                >
                  <LogIn className="w-4 h-4 text-campus-600" />
                  <span>Đăng Nhập Cán Bộ & Sinh Viên</span>
                </Link>
              </div>

              {/* Quick stats banner */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200/80 max-w-lg mx-auto lg:mx-0 text-left">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 block">32+</span>
                  <span className="text-xs text-slate-500 font-semibold">Phòng KTX tiêu chuẩn</span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-campus-600 block">150+</span>
                  <span className="text-xs text-slate-500 font-semibold">Chỗ ở tiện nghi</span>
                </div>
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 block">24/7</span>
                  <span className="text-xs text-slate-500 font-semibold">An ninh & Camera</span>
                </div>
              </div>
            </div>

            {/* Right: Featured Building & Rooms Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80"
                  alt="Ký Túc Xá Nam Sài Gòn"
                  className="w-full h-80 sm:h-96 object-cover opacity-90 hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/80 backdrop-blur-md text-[11px] font-bold self-start mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Môi trường an ninh - Văn minh</span>
                  </div>
                  <h3 className="text-xl font-black">Tòa Nhà KTX Nam Sài Gòn</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Trang bị đầy đủ giường tầng tiêu chuẩn, bàn học cá nhân, tủ đồ có khóa, máy nước nóng lạnh và điều hòa nhiệt độ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tra Cứu Hồ Sơ Xét Duyệt Widget */}
      <section id="tra-cuu" className="py-12 bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-campus-900 via-slate-900 to-campus-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
            <div className="max-w-2xl mx-auto text-center space-y-3 mb-6">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-cyan-400 uppercase tracking-widest">
                <Search className="w-4 h-4" />
                <span>TRA CỨU TRỰC TUYẾN</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Kiểm Tra Tiến Độ Xét Duyệt Hồ Sơ KTX
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Nhập <strong>Mã HSSV</strong>, <strong>Số CCCD</strong> hoặc <strong>Mã hồ sơ</strong> để xem tình trạng phê duyệt và xếp phòng từ Ban Quản Lý KTX.
              </p>
            </div>

            <form onSubmit={handleSearch} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  required
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Nhập Mã HSSV hoặc Số CCCD..."
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-white/15 transition"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-campus-500 hover:from-cyan-400 hover:to-campus-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/30 transition flex items-center justify-center space-x-2 shrink-0"
              >
                {searching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Đang tra cứu...</span>
                  </>
                ) : (
                  <>
                    <span>Tra Cứu Ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Search Result Card */}
            {hasSearched && (
              <div className="mt-8 max-w-xl mx-auto bg-white rounded-3xl p-6 text-slate-800 shadow-xl border border-slate-100">
                {searchResult ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Họ và tên thí sinh</span>
                        <h4 className="text-lg font-black text-slate-900">{searchResult.fullName}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-slate-400 uppercase block">Mã HSSV</span>
                        <span className="font-mono font-bold text-campus-600 text-base">{searchResult.hssv}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs py-1">
                      <div>
                        <span className="text-slate-400 block">Số CCCD:</span>
                        <span className="font-mono font-bold text-slate-700">{searchResult.cccd}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Khoa / Ngành:</span>
                        <span className="font-bold text-slate-700">{searchResult.faculty}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Ngày nộp đơn:</span>
                        <span className="font-medium text-slate-700">
                          {new Date(searchResult.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Lớp sinh hoạt:</span>
                        <span className="font-bold text-slate-700">{searchResult.className || 'Chưa phân lớp'}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {getStatusDisplay(searchResult.status, searchResult)}
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-2">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700 text-sm">Không tìm thấy hồ sơ đăng ký phù hợp</p>
                    <p className="text-xs text-slate-400">
                      Vui lòng kiểm tra lại chính xác Mã HSSV hoặc Số CCCD đã điền trong đơn xin vào KTX.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Facilities & Amenities Showcase */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-campus-600 block">
              TIỆN ÍCH & CƠ SỞ VẬT CHẤT
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-950">
              Môi Trường Sống Toàn Diện Dành Cho Sinh Viên
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Ký Túc Xá Nam Sài Gòn đầu tư đồng bộ hệ thống phòng ở khép kín và các tiện ích nội khu nhằm mang lại không gian học tập và sinh hoạt lý tưởng nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4 hover:border-campus-400 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Phòng Ở Khép Kín</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Phòng thiết kế thoáng mát, giường tầng chắc chắn, ban công phơi đồ riêng, nhà vệ sinh sạch sẽ khép kín trong từng phòng.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4 hover:border-campus-400 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">An Ninh Đảm Bảo 24/7</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Đội ngũ bảo vệ túc trực ngày đêm, camera giám sát tại tất cả hành lang và cổng ra vào, giờ giấc mở đóng cổng nghiêm ngặt.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4 hover:border-campus-400 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Wifi className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Internet & Học Tập</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Đường truyền cáp quang tốc độ cao phủ sóng toàn khu ký túc xá, phòng tự học và không gian sinh hoạt cộng đồng yên tĩnh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-xs font-bold text-campus-600 uppercase tracking-widest block">HÌNH ẢNH THỰC TẾ</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Không Gian Sinh Hoạt Tại KTX Nam Sài Gòn</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-3xl overflow-hidden shadow-sm border border-slate-200 group">
              <img
                src="https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80"
                alt="Phòng KTX"
                className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="p-4 bg-white">
                <h4 className="font-bold text-sm text-slate-900">Khu Giường Tầng Tiêu Chuẩn</h4>
                <p className="text-xs text-slate-500 mt-0.5">Trang bị rèm chắn sáng, ổ cắm và đèn học riêng</p>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-sm border border-slate-200 group">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80"
                alt="Sinh viên học tập"
                className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="p-4 bg-white">
                <h4 className="font-bold text-sm text-slate-900">Phòng Tự Học & Thư Viện</h4>
                <p className="text-xs text-slate-500 mt-0.5">Không gian nghiên cứu, làm bài tập nhóm hiệu quả</p>
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-sm border border-slate-200 group">
              <img
                src="https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80"
                alt="Khuôn viên trường"
                className="w-full h-56 object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="p-4 bg-white">
                <h4 className="font-bold text-sm text-slate-900">Khuôn Viên Sân Thể Thao</h4>
                <p className="text-xs text-slate-500 mt-0.5">Sân bóng chuyền, cầu lông rèn luyện thể chất</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="py-16 bg-gradient-to-r from-campus-700 via-campus-600 to-cyan-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black">
            Sẵn Sàng Trở Thành Thành Viên KTX Nam Sài Gòn?
          </h2>
          <p className="text-base text-cyan-100 max-w-2xl mx-auto">
            Điền đơn đăng ký trực tuyến theo biểu mẫu quy định của Nhà trường ngay hôm nay để được Ban Quản Lý xét duyệt chỗ ở sớm nhất.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register-dorm"
              className="px-8 py-4 rounded-2xl bg-white text-campus-700 font-black text-sm shadow-xl hover:bg-slate-50 transition transform hover:-translate-y-0.5 flex items-center space-x-2"
            >
              <FileText className="w-5 h-5" />
              <span>Nộp Đơn Đăng Ký Trực Tuyến</span>
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 rounded-2xl bg-slate-950/40 hover:bg-slate-950/60 text-white font-bold text-sm border border-white/30 backdrop-blur-md transition flex items-center space-x-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Cổng Đăng Nhập Quản Lý</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white font-black text-base">
                <Building2 className="w-5 h-5 text-campus-500" />
                <span>KÝ TÚC XÁ NAM SÀI GÒN</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Hệ thống quản lý ký túc xá sinh viên hiện đại, tự động hóa phân phòng, theo dõi điện nước và hóa đơn minh bạch.
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Thông Tin Liên Hệ</h5>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-campus-400 shrink-0" />
                <span>Khu Ký Túc Xá Nam Sài Gòn, TP. Hồ Chí Minh</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-campus-400 shrink-0" />
                <span>Hotline: (028) 38.xxx.xxx - Phòng CTSV</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-campus-400 shrink-0" />
                <span>Email: ktx@namsaigon.edu.vn</span>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-white font-bold text-sm uppercase tracking-wider mb-2">Thời Gian Làm Việc</h5>
              <p>Thứ Hai - Thứ Bảy: 07:30 - 17:00</p>
              <p>Chủ Nhật & Ngày lễ: Trực an ninh 24/7</p>
              <p className="text-cyan-400 font-semibold pt-1">Bảo vệ & Hỗ trợ kỹ thuật trực 24/24</p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-slate-500">
            © 2026 Ký Túc Xá Nam Sài Gòn. Toàn quyền bảo lưu.
          </div>
        </div>
      </footer>
    </div>
  );
};
