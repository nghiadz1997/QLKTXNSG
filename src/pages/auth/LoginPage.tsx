import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, KeyRound, User, Lock, ArrowRight, ShieldCheck, Mail, UserPlus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { toast } from 'sonner';
import type { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Mode: login or register
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<Role>('manager');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast.error('Vui lòng nhập đầy đủ thông tin đăng nhập.');
      return;
    }

    setLoginLoading(true);
    try {
      const detectedRole = await login(identifier, password);
      toast.success('Đăng nhập thành công!');

      // Hệ thống tự hiểu vai trò và điều hướng tương ứng
      if (detectedRole === 'superAdmin') {
        navigate('/admin');
      } else if (detectedRole === 'truongPhong' || detectedRole === 'manager') {
        navigate('/manager');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Sai thông tin xác thực.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = 'Tài khoản hoặc mật khẩu không chính xác.';
      } else if (err.code === 'auth/wrong-password') {
        msg = 'Mật khẩu không đúng.';
      }
      toast.error('Đăng nhập thất bại: ' + msg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail.trim() || !regPassword.trim() || !regFullName.trim()) {
      toast.error('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (regPassword.length < 6) {
      toast.error('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setRegLoading(true);
    try {
      await authService.registerUser(regEmail, regPassword, regFullName, regRole);
      toast.success('Đăng ký tài khoản thành công trên Firebase Authentication!');
      if (regRole === 'student') {
        navigate('/student');
      } else if (regRole === 'superAdmin') {
        navigate('/admin');
      } else {
        navigate('/manager');
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || 'Không thể tạo tài khoản.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email này đã được đăng ký trong hệ thống Firebase.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Mật khẩu quá yếu (tối thiểu 6 ký tự).';
      }
      toast.error('Đăng ký thất bại: ' + msg);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-campus-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-campus-600 to-cyan-400 text-white shadow-xl shadow-campus-500/30 mb-4 ring-4 ring-white/10 hover:scale-105 transition">
            <Building2 className="w-8 h-8" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            KÝ TÚC XÁ NAM SÀI GÒN
          </h1>
          <p className="text-sm text-cyan-200/80 mt-1 font-medium">
            Hệ thống Quản lý KTX Thông Minh (Firebase Production)
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20">
          {authMode === 'login' ? (
            <>
              <div className="mb-5 text-center">
                <h2 className="text-xl font-extrabold text-slate-900">Đăng Nhập Hệ Thống</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Đăng nhập bằng Email hoặc Mã sinh viên. Hệ thống tự nhận diện vai trò.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Tài khoản (Email hoặc Mã HSSV)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder="Nhập email hoặc mã sinh viên..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-campus-600 to-campus-700 hover:from-campus-700 hover:to-campus-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-campus-600/30 transition flex items-center justify-center space-x-2"
                >
                  {loginLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xác thực Firebase...</span>
                    </>
                  ) : (
                    <>
                      <span>Đăng nhập hệ thống</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Registration Toggle */}
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Chưa có tài khoản?</span>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="font-bold text-campus-600 hover:text-campus-700 hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Đăng ký tài khoản mới
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Register Mode */}
              <div className="mb-5">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-campus-600 bg-campus-50 px-2.5 py-1 rounded-lg mb-2">
                  <UserPlus className="w-3.5 h-3.5" />
                  Đăng Ký Tài Khoản Mới
                </div>
                <h2 className="text-xl font-extrabold text-slate-800">Tạo Tài Khoản Firebase Thật</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tài khoản sẽ được lưu vào Firebase Authentication và phân quyền chuẩn.
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Họ và tên *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={regFullName}
                      onChange={e => setRegFullName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Email đăng nhập *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Vai trò (Phân quyền) *
                  </label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value as Role)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                  >
                    <option value="student">Sinh viên (Student)</option>
                    <option value="manager">Cán bộ Quản lý KTX (Manager)</option>
                    <option value="truongPhong">Trưởng phòng KTX (Trưởng Ban Quản Lý)</option>
                    <option value="superAdmin">Quản trị viên cấp cao (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Mật khẩu * (Ít nhất 6 ký tự)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Xác nhận mật khẩu *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-campus-500 focus:bg-white transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-campus-600 to-campus-700 hover:from-campus-700 hover:to-campus-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-campus-600/30 transition flex items-center justify-center space-x-2"
                >
                  {regLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang tạo tài khoản Firebase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tạo Tài Khoản & Đăng Nhập</span>
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  ← Đã có tài khoản? Quay lại đăng nhập
                </button>
              </div>
            </>
          )}

          {/* Public Dorm Registration link */}
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500 mb-1">Chưa có chỗ ở tại Ký túc xá?</p>
            <Link
              to="/register-dorm"
              className="inline-flex items-center text-xs font-bold text-campus-600 hover:text-campus-700 hover:underline"
            >
              Đăng ký vào Ký túc xá (Trang công khai) →
            </Link>
          </div>
        </div>

        {/* Security Note Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1">
          <KeyRound className="w-3.5 h-3.5" />
          Bảo mật Firebase Authentication • Firestore Production
        </p>
      </div>
    </div>
  );
};
