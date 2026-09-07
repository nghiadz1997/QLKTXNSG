import React, { useEffect, useState } from 'react';
import { ShieldAlert, Clock, User, FileText, Search, RefreshCw } from 'lucide-react';
import { auditService } from '../../services/auditService';
import { Card } from '../../components/common/Card';
import { TableSkeleton } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';
import type { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs(100);
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
      log.targetCollection.toLowerCase().includes(q) ||
      (log.reason && log.reason.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs - Nhật Ký Hoạt Động</h1>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Bảo Mật & Truy Vết Hoạt Động
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Hệ Thống Nhật Ký Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận toàn bộ các thao tác nghiệp vụ quan trọng: thay đổi giá, phân/chuyển phòng, nhập điện nước, lập hóa đơn và xác nhận thanh toán. Dữ liệu chỉ đọc và không thể can thiệp từ client.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm nhật ký theo hành động, email, bộ sưu tập hoặc lý do..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-campus-500"
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title="Chưa có bản ghi nhật ký nào"
          description="Các hành động quan trọng như sửa giá, phân phòng, chốt số điện nước sẽ tự động ghi lại tại đây."
        />
      ) : (
        <Card title={`Bản Ghi Hoạt Động (${filteredLogs.length})`} subtitle="Sắp xếp theo thời gian mới nhất">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Hành Động</th>
                  <th className="py-3 px-4">Người Thực Hiện</th>
                  <th className="py-3 px-4">Vai Trò</th>
                  <th className="py-3 px-4">Đối Tượng</th>
                  <th className="py-3 px-4">Chi Tiết / Lý Do</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{log.userEmail || log.userUid}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{log.userUid}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        log.role === 'superAdmin'
                          ? 'bg-purple-100 text-purple-800'
                          : log.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {log.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {log.targetCollection}/{log.targetId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {log.reason ? (
                        <span className="text-slate-800 font-medium">{log.reason}</span>
                      ) : log.newValue ? (
                        <span className="font-mono text-[11px] text-slate-500">
                          {JSON.stringify(log.newValue).substring(0, 80)}...
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
