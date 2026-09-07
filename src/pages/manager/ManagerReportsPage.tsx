import React, { useEffect, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, Users, Building2, CreditCard, Zap } from 'lucide-react';
import { reportService } from '../../services/reportService';
import { studentService } from '../../services/studentService';
import { roomService } from '../../services/roomService';
import { invoiceService } from '../../services/invoiceService';
import { Card } from '../../components/common/Card';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { toast } from 'sonner';

export const ManagerReportsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getDashboardStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  const handleExportStudents = async () => {
    try {
      const students = await studentService.getStudents();
      const headers = ['Mã HSSV', 'Họ và Tên', 'Lớp', 'Khoa', 'Phòng KTX', 'Số Điện Thoại', 'Email', 'Trạng Thái KTX'];
      const rows = students.map(s => [
        s.hssv,
        s.fullName,
        s.className,
        s.faculty,
        s.roomId || 'Chưa xếp',
        s.phone,
        s.email,
        s.dormStatus === 'living' ? 'Đang ở KTX' : s.dormStatus === 'waiting' ? 'Chờ xếp phòng' : 'Đã trả phòng',
      ]);
      reportService.exportToCsv(`Bao_Cao_Sinh_Vien_KTX_${new Date().toISOString().split('T')[0]}`, headers, rows);
      toast.success('Đã tải xuống file CSV danh sách sinh viên!');
    } catch (err: any) {
      toast.error('Lỗi xuất báo cáo: ' + err.message);
    }
  };

  const handleExportRooms = async () => {
    try {
      const rooms = await roomService.getRooms();
      const headers = ['Mã Phòng', 'Tên Phòng', 'Tòa Nhà', 'Tầng', 'Sức Chứa', 'Đang Ở', 'Còn Trống', 'Trạng Thái'];
      const rows = rooms.map(r => [
        r.roomId,
        r.roomName,
        r.buildingId === 'TOA_A' ? 'Tòa Nhà A' : 'Tòa Nhà B',
        r.floor,
        r.capacity,
        r.currentOccupants,
        r.availableSlots,
        r.status === 'full' ? 'Đầy' : r.status === 'maintenance' ? 'Bảo trì' : 'Còn chỗ',
      ]);
      reportService.exportToCsv(`Bao_Cao_Phong_KTX_${new Date().toISOString().split('T')[0]}`, headers, rows);
      toast.success('Đã tải xuống file CSV danh sách phòng!');
    } catch (err: any) {
      toast.error('Lỗi xuất báo cáo: ' + err.message);
    }
  };

  const handleExportInvoices = async () => {
    try {
      const invoices = await invoiceService.getAllInvoices();
      const headers = [
        'Mã Hóa Đơn',
        'Sinh Viên',
        'Mã HSSV',
        'Phòng',
        'Kỳ HĐ',
        'Tiền Phòng',
        'Tiêu Thụ Điện',
        'Tiền Điện',
        'Tiêu Thụ Nước',
        'Tiền Nước',
        'Phí Khác',
        'Tổng Tiền (VNĐ)',
        'Hạn Đóng',
        'Trạng Thái',
      ];
      const rows = invoices.map(i => [
        i.id,
        i.studentName || '',
        i.hssv || '',
        i.roomId,
        `Tháng ${i.month}/${i.year}`,
        i.roomFee,
        `${i.electricityUsage} kWh`,
        i.electricityFee,
        `${i.waterUsage} m3`,
        i.waterFee,
        i.otherFee,
        i.totalAmount,
        i.dueDate,
        i.status === 'paid' ? 'Đã đóng' : i.status === 'pending' ? 'Chờ duyệt' : i.status === 'overdue' ? 'Quá hạn' : 'Chưa đóng',
      ]);
      reportService.exportToCsv(`Bao_Cao_Tai_Chinh_Hoa_Don_${new Date().toISOString().split('T')[0]}`, headers, rows);
      toast.success('Đã tải xuống file CSV tài chính hóa đơn!');
    } catch (err: any) {
      toast.error('Lỗi xuất báo cáo: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Báo Cáo Thống Kê KTX</h1>
        <TableSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
          Tổng Hợp Dữ Liệu & Thống Kê
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Báo Cáo Hoạt Động Ký Túc Xá
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Xuất dữ liệu định dạng CSV tiêu chuẩn UTF-8, hỗ trợ mở trực tiếp trên Microsoft Excel và Google Sheets không bị lỗi font tiếng Việt.
        </p>
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-campus-300 transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Danh Sách Sinh Viên KTX</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Xuất toàn bộ danh sách sinh viên hiện đang lưu trú, thông tin liên hệ, khoa, lớp và mã phòng.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportStudents}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/30 transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel / CSV Sinh Viên</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-campus-300 transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Hiện Trạng Phòng & Sức Chứa</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Báo cáo công suất sử dụng phòng, tỷ lệ lấp đầy, số chỗ còn trống theo từng tòa nhà.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportRooms}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-md shadow-cyan-600/30 transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel / CSV Phòng</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:border-campus-300 transition space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Báo Cáo Tài Chính & Công Nợ</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tổng hợp tiền phòng, tiền điện, tiền nước theo tháng, danh sách các khoản nợ quá hạn cần thu.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportInvoices}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/30 transition flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Xuất Excel / CSV Hóa Đơn</span>
          </button>
        </div>
      </div>
    </div>
  );
};
