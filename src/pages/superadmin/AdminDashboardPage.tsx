import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Users,
  Building2,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Layers,
  Radio
} from 'lucide-react';
import { reportService, type DashboardStats } from '../../services/reportService';
import { StatCard, Card } from '../../components/common/Card';
import { TableSkeleton } from '../../components/common/ConfirmDialog';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters - Section XXX
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedSemester, setSelectedSemester] = useState('SEM-2026-1');
  const [selectedBuilding, setSelectedBuilding] = useState('');

  // Live real-time subscription
  useEffect(() => {
    setLoading(true);
    const unsubscribe = reportService.subscribeDashboardStats(data => {
      setStats(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Super Admin</h1>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  // Filter calculations based on selected building
  const filteredRooms = stats?.rooms?.filter((r: any) => !selectedBuilding || r.buildingId === selectedBuilding) || [];
  const totalCapacity = selectedBuilding
    ? filteredRooms.reduce((acc: number, r: any) => acc + (r.capacity || 0), 0)
    : (stats?.totalCapacity ?? 0);
  const totalOccupants = selectedBuilding
    ? filteredRooms.reduce((acc: number, r: any) => acc + (r.currentOccupants || 0), 0)
    : (stats?.totalOccupants ?? 0);
  const fullRooms = selectedBuilding
    ? filteredRooms.filter((r: any) => r.status === 'full' || (r.capacity > 0 && (r.currentOccupants || 0) >= r.capacity)).length
    : (stats?.fullRooms ?? 0);
  const availableRooms = selectedBuilding
    ? filteredRooms.filter((r: any) => (r.status === 'available' || !r.status) && ((r.capacity || 0) - (r.currentOccupants || 0) > 0)).length
    : (stats?.availableRooms ?? 0);
  const totalRoomsCount = selectedBuilding ? filteredRooms.length : (stats?.totalRooms ?? 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-500/30 text-purple-200 backdrop-blur-md mb-2">
            <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Quản Trị Hệ Thống Cấp Cao (Super Admin)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Tổng Thể Ký Túc Xá Nam Sài Gòn
          </h1>
          <p className="text-purple-200/80 text-xs mt-1">
            Toàn quyền giám sát hạ tầng, tài chính, đơn giá, kiểm duyệt và nhật ký hoạt động Audit Logs.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-semibold text-purple-200 border border-white/10">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Đồng bộ Realtime Firestore</span>
        </div>
      </div>

      {/* Filter Bar - Section XXX */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm flex flex-wrap items-center gap-3 text-xs font-bold">
        <span className="text-slate-400 uppercase">Bộ Lọc Toàn Hệ Thống:</span>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="2026">Năm học 2026 - 2027</option>
          <option value="2027">Năm học 2027 - 2028</option>
        </select>
        <select
          value={selectedSemester}
          onChange={e => setSelectedSemester(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="SEM-2026-1">Học kỳ 1</option>
          <option value="SEM-2026-2">Học kỳ 2</option>
          <option value="SEM-2026-3">Học kỳ Hè</option>
        </select>
        <select
          value={selectedBuilding}
          onChange={e => setSelectedBuilding(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <option value="">Tất cả Tòa nhà</option>
          <option value="TOA_A">Tòa Nhà A</option>
          <option value="TOA_B">Tòa Nhà B</option>
        </select>
      </div>

      {/* Physical Capacity KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TỔNG SINH VIÊN LƯU TRÚ"
          value={stats?.livingStudents ?? 0}
          icon={Users}
          color="blue"
          subtitle={`Tổng hồ sơ: ${stats?.totalStudents ?? 0}`}
        />
        <StatCard
          title="TỔNG SỨC CHỨA KTX"
          value={`${totalCapacity} Chỗ`}
          icon={TrendingUp}
          color="purple"
          subtitle={`Đã ở: ${totalOccupants} chỗ`}
        />
        <StatCard
          title="CHỖ TRỐNG CÒN LẠI"
          value={`${Math.max(0, totalCapacity - totalOccupants)} Chỗ`}
          icon={Building2}
          color="emerald"
          subtitle="Sẵn sàng tiếp nhận tân sinh viên"
        />
        <StatCard
          title="PHÒNG ĐÃ ĐẦY"
          value={`${fullRooms} / ${totalRoomsCount} Phòng`}
          icon={Layers}
          color="amber"
          subtitle={`Còn ${availableRooms} phòng có chỗ`}
        />
      </div>

      {/* Financial Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TỔNG PHẢI THU (TOÀN KTX)"
          value={`${(stats?.totalBilled ?? 0).toLocaleString('vi-VN')} đ`}
          icon={CreditCard}
          color="blue"
          subtitle="Hóa đơn kỳ hiện tại"
        />
        <StatCard
          title="TỔNG ĐÃ THU"
          value={`${(stats?.totalPaid ?? 0).toLocaleString('vi-VN')} đ`}
          icon={CreditCard}
          color="emerald"
          subtitle="Doanh thu đã vào tài khoản"
        />
        <StatCard
          title="TỔNG CHƯA THU"
          value={`${(stats?.totalUnpaid ?? 0).toLocaleString('vi-VN')} đ`}
          icon={CreditCard}
          color="amber"
          subtitle="Đang trong hạn đóng"
        />
        <StatCard
          title="CÔNG NỢ QUÁ HẠN"
          value={`${(stats?.totalOverdue ?? 0).toLocaleString('vi-VN')} đ`}
          icon={AlertTriangle}
          color={(stats?.totalOverdue ?? 0) > 0 ? 'rose' : 'emerald'}
          subtitle={`${stats?.overdueCount ?? 0} hóa đơn quá hạn`}
        />
      </div>

      {/* Admin Action Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Quản Lý Chính Sách & Đơn Giá" subtitle="Chỉ Super Admin được sửa đổi">
          <div className="space-y-3 text-sm">
            <a
              href="/admin/pricing"
              className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 hover:bg-purple-100/60 text-purple-900 transition font-semibold"
            >
              <span>Bảng đơn giá điện, nước, phòng</span>
              <span className="text-xs text-purple-700">Điều chỉnh →</span>
            </a>
            <a
              href="/admin/semesters"
              className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 hover:bg-purple-100/60 text-purple-900 transition font-semibold"
            >
              <span>Niên khóa, học kỳ & hạn nộp</span>
              <span className="text-xs text-purple-700">Quản lý →</span>
            </a>
            <a
              href="/admin/buildings"
              className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 hover:bg-purple-100/60 text-purple-900 transition font-semibold"
            >
              <span>Hạ tầng tòa nhà & Khu KTX</span>
              <span className="text-xs text-purple-700">Cấu hình →</span>
            </a>
          </div>
        </Card>

        <Card title="Bảo Mật & Phân Quyền" subtitle="Custom Claims và kiểm soát truy cập">
          <div className="space-y-3 text-sm">
            <a
              href="/admin/users"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-semibold"
            >
              <span>Phân quyền tài khoản (Claims)</span>
              <span className="text-xs text-campus-600">Xem →</span>
            </a>
            <a
              href="/admin/audit-logs"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-semibold"
            >
              <span>Nhật ký hoạt động hệ thống (Audit Logs)</span>
              <span className="text-xs text-campus-600">Tra cứu →</span>
            </a>
            <a
              href="/admin/settings"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-semibold"
            >
              <span>Cấu hình thông số kỹ thuật</span>
              <span className="text-xs text-campus-600">Thiết lập →</span>
            </a>
          </div>
        </Card>

        <Card title="Đối Soát Vận Hành KTX" subtitle="Giám sát tiến độ của Ban Quản Lý">
          <div className="space-y-3 text-sm">
            <a
              href="/manager/invoices"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-semibold"
            >
              <span>Toàn bộ hóa đơn phát hành</span>
              <span className="text-xs text-slate-500">Xem →</span>
            </a>
            <a
              href="/manager/payments"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-semibold"
            >
              <span>Tiến độ xác nhận thanh toán</span>
              <span className="text-xs text-slate-500">Xem →</span>
            </a>
            <a
              href="/manager/reports"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 transition font-semibold"
            >
              <span>Xuất báo cáo tổng hợp (Excel)</span>
              <span className="text-xs text-slate-500">Tải về →</span>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};
