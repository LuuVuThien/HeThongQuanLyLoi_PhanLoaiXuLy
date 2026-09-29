/**
 * ============================================
 * USERS PAGE (Quản lý người dùng & vai trò)
 * Phục vụ Admin & PM theo dõi 4 nhóm người dùng
 * ============================================
 */
import { useState } from 'react'
import { useUsers, useCreateUser } from '../hooks/useIncidents'
import { User, Shield, Mail, Plus, X, Users, Lock } from 'lucide-react'
import { Spinner } from '../components/common/LoadingSpinner'
import { toast } from 'react-toastify'

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers()
  const createUserMutation = useCreateUser()
  const [selectedRole, setSelectedRole] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'developer', password: '' })
  
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [passwords, setPasswords] = useState({ old: '', new: '' })
  const [isChangingPass, setIsChangingPass] = useState(false)

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
      case 'pm':
        return { label: 'Project Manager', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' }
      case 'tester':
        return { label: 'Tester (QA)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' }
      case 'developer':
        return { label: 'Developer', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
      default:
        return { label: role, color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
    }
  }

  const filteredUsers = selectedRole === 'all'
    ? users
    : users.filter((u) => u.role === selectedRole)

  const handleCreateUser = async (e) => {
    e.preventDefault()
    if (!newUser.name.trim()) {
      toast.warning('Vui lòng điền họ tên thành viên')
      return
    }
    if (!newUser.email.trim()) {
      toast.warning('Vui lòng điền email thành viên')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUser.email.trim())) {
      toast.error('Email không đúng định dạng (Ví dụ: user@company.com)')
      return
    }

    try {
      await createUserMutation.mutateAsync(newUser)
      toast.success(`🎉 Đã thêm thành viên ${newUser.name} (${newUser.role.toUpperCase()}) lưu vào PostgreSQL thành công!`)
      setIsModalOpen(false)
      setNewUser({ name: '', email: '', role: 'developer', password: '' })
    } catch (err) {
      console.error('Lỗi khi thêm người dùng:', err)
      const msg = err.response?.data?.detail || 'Không thể thêm thành viên, vui lòng thử lại!'
      toast.error(typeof msg === 'string' ? msg : 'Lỗi khi lưu người dùng trên cơ sở dữ liệu')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!passwords.old || !passwords.new) {
      toast.warning('Vui lòng điền đủ mật khẩu cũ và mới')
      return
    }
    
    setIsChangingPass(true)
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({ old_password: passwords.old, new_password: passwords.new })
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(data.message)
        setIsChangePasswordOpen(false)
        setPasswords({ old: '', new: '' })
      } else {
        toast.error(data.detail || 'Lỗi khi đổi mật khẩu')
      }
    } catch (error) {
      toast.error('Lỗi kết nối máy chủ')
    } finally {
      setIsChangingPass(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Thành viên</h1>
          <p className="text-sm text-slate-400 mt-1">
            Danh sách nhân sự và phân quyền 4 vai trò chính: Admin, PM, Tester và Developer
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-semibold hover:bg-white/10 hover:text-white transition-all cursor-pointer border border-white/10"
          >
            <Lock size={18} />
            Đổi mật khẩu
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] w-fit cursor-pointer"
          >
            <Plus size={18} />
            Thêm thành viên
          </button>
        </div>
      </div>

      {/* Bộ lọc Role */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedRole('all')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedRole === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Users size={14} /> Tất cả ({users.length})
        </button>
        <button
          onClick={() => setSelectedRole('admin')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedRole === 'admin'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <Shield size={14} /> Admin
        </button>
        <button
          onClick={() => setSelectedRole('pm')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedRole === 'pm'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <User size={14} /> PM
        </button>
        <button
          onClick={() => setSelectedRole('tester')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedRole === 'tester'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <User size={14} /> Tester
        </button>
        <button
          onClick={() => setSelectedRole('developer')}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedRole === 'developer'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <User size={14} /> Developer
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={32} className="text-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredUsers.map((u) => {
            const roleBadge = getRoleBadge(u.role)
            return (
              <div
                key={u.id}
                className="p-5 rounded-2xl bg-[#131C31]/90 border border-white/[0.08] hover:border-white/20 transition-all flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/20 shrink-0">
                  {u.name.charAt(0)}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-white truncate">{u.name}</h3>
                    <span className="text-xs font-mono text-slate-500">#{u.id}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                    <Mail size={12} className="shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>

                  <div className="pt-1">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL THÊM THÀNH VIÊN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#131C31] border border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User size={18} className="text-indigo-400" />
                Thêm Thành viên Mới
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Họ và tên</label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn C"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Email</label>
                <input
                  type="email"
                  placeholder="VD: vanc.nguyen@company.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Vai trò (Role)</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="developer">Developer</option>
                  <option value="tester">Tester (QA)</option>
                  <option value="pm">Project Manager (PM)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mật khẩu khởi tạo (Tùy chọn)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={15} />
                  </div>
                  <input
                    type="text"
                    placeholder="Mặc định: 123456"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Thành viên có thể dùng mật khẩu này để đăng nhập ngay vào hệ thống.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={createUserMutation.isPending}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/5 cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold hover:shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Spinner size={14} className="text-white" />
                      <span>Đang lưu vào PostgreSQL...</span>
                    </>
                  ) : (
                    <span>Thêm thành viên</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ĐỔI MẬT KHẨU */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#131C31] border border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-indigo-400" />
                Đổi mật khẩu của bạn
              </h3>
              <button
                onClick={() => setIsChangePasswordOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mật khẩu hiện tại</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={15} />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwords.old}
                    onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mật khẩu mới</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={15} />
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isChangingPass}
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/5 cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold hover:shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isChangingPass ? (
                    <>
                      <Spinner size={14} className="text-white" />
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Lưu thay đổi</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
