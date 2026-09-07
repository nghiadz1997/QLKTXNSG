import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  TrendingUp,
  Radio
} from 'lucide-react';
import { reportService, type DashboardStats } from '../../services/reportService';
import { StatCard, Card } from '../../components/common/Card';
import { TableSkeleton } from '../../components/common/ConfirmDialog';

export const ManagerDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Quản Lý Ký Túc Xá</h1>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-campus-600">
            Trung Tâm Điều Hành KTX
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Bảng Điều Khiển Quản Lý KTX Nam Sài Gòn
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng quan tình hình sinh viên, tình trạng phòng, chỉ số điện nước và tài chính công nợ ký túc xá.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600">
          <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span>Thời Gian Thực Firestore</span>
        </div>
      </div>

      {/* Primary KPI Grid - Section XXIX */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TỔNG SINH VIÊN ĐANG Ở"
          value={`${stats?.livingStudents ?? 0} / ${stats?.totalStudents ?? 0}`}
          icon={Users}
          color="blue"
          subtitle={`Tổng số hồ sơ: ${stats?.totalStudents ?? 0}`}
        />
        <StatCard
          title="TÌNH TRẠNG PHÒNG"
          value={`${stats?.fullRooms ?? 0} Đầy / ${stats?.totalRooms ?? 0} Phòng`}
          icon={Building2}
          color="cyan"
          subtitle={`Còn ${stats?.availableRooms ?? 0} phòng có chỗ trống`}
        />
        <StatCard
          title="TỔNG SỨC CHỨA KTX"
          value={`${stats?.totalOccupants ?? 0} / ${stats?.totalCapacity ?? 0} Chỗ`}
          icon={TrendingUp}
          color="emerald"
          subtitle={`Tỷ lệ lấp đầy: ${stats?.occupancyRate ?? 0}%`}
        />
        <StatCard
          title="YÊU CẦU HỖ TRỢ CHỜ XỬ LÝ"
          value={stats?.pendingSupports ?? 0}
          icon={Wrench}
          color={(stats?.pendingSupports ?? 0) > 0 ? 'rose' : 'emerald'}
          subtitle="Sự cố kỹ thuật, điện, nước"
        />
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TỔNG PHẢI THU"
          value={`${(stats?.totalBilled ?? 0).toLocaleString('vi-VN')} đ`}
          icon={CreditCard}
          color="blue"
          subtitle="Tổng giá trị hóa đơn đã lập"
        />
        <StatCard
          title="ĐÃ THU"
          value={`${(stats?.totalPaid ?? 0).toLocaleString('vi-VN')} đ`}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Giao dịch đã được xác nhận"
        />
        <StatCard
          title="CHƯA THU"
          value={`${(stats?.totalUnpaid ?? 0).toLocaleString('vi-VN')} đ`}
          icon={Clock}
          color="amber"
          subtitle="Hóa đơn chưa thanh toán / chờ duyệt"
        />
        <StatCard
          title="HÓA ĐƠN QUÁ HẠN"
          value={`${stats?.overdueCount ?? 0} HĐ`}
          icon={AlertTriangle}
          color={(stats?.overdueCount ?? 0) > 0 ? 'rose' : 'emerald'}
          subtitle={`Công nợ quá hạn: ${(stats?.totalOverdue ?? 0).toLocaleString('vi-VN')} đ`}
        />
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Quản Lý Lưu Trú & Phòng" subtitle="Điều phối chỗ ở và sinh viên">
          <div className="space-y-3 text-sm">
            <a
              href="/manager/students"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-800">Danh sách & Phân phòng sinh viên</span>
              <span className="text-xs text-campus-600 font-bold">Truy cập →</span>
            </a>
            <a
              href="/manager/rooms"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-800">Sơ đồ phòng & Sức chứa</span>
              <span className="text-xs text-campus-600 font-bold">Truy cập →</span>
            </a>
            <a
              href="/manager/registrations"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-800">Duyệt đơn đăng ký KTX</span>
              <span className="text-xs text-campus-600 font-bold">Truy cập →</span>
            </a>
          </div>
        </Card>

        <Card title="Quản Lý Điện Nước & Hóa Đơn" subtitle="Chốt số đồng hồ và thu phí">
          <div className="space-y-3 text-sm">
            <a
              href="/manager/electricity"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-800">Ghi chỉ số điện tháng</span>
              <span className="text-xs text-amber-600 font-bold">Truy cập →</span>
            </a>
            <a
              href="/manager/water"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-800">Ghi chỉ số nước tháng</span>
              <span className="text-xs text-cyan-600 font-bold">Truy cập →</span>
            </a>
            <a
              href="/manager/invoices"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-800">Lập hóa đơn KTX theo phòng</span>
              <span className="text-xs text-campus-600 font-bold">Truy cập →</span>
            </a>
          </div>
        </Card>

        <Card title="Vận Hành & Báo Cáo" subtitle="Đối soát và kỹ thuật">
          <div className="space-y-3 text-sm">
            <a
              href="/manager/payments"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-800">Duyệt xác nhận thanh toán</span>
              <span className="text-xs text-emerald-600 font-bold">Truy cập →</span>
            </a>
            <a
              href="/manager/support"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-800">Xử lý yêu cầu sửa chữa</span>
              <span className="text-xs text-rose-600 font-bold">Truy cập →</span>
            </a>
            <a
              href="/manager/reports"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-800">Xuất báo cáo tài chính (CSV/Excel)</span>
              <span className="text-xs text-purple-600 font-bold">Truy cập →</span>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
};
