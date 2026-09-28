/**
 * ============================================
 * USERS PAGE (Quản lý người dùng & vai trò)
 * Phục vụ Admin & PM theo dõi 4 nhóm người dùng
 * ============================================
 */
import { useState } from 'react'
import { useUsers } from '../hooks/useIncidents'
import { User, Shield, Mail, Plus, X, Users } from 'lucide-react'
import { Spinner } from '../components/common/LoadingSpinner'
import { toast } from 'react-toastify'

export default function UsersPage() {
  const { data: users = [], isLoading } = useUsers()
  const [selectedRole, setSelectedRole] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'developer' })

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

  const handleCreateUser = (e) => {
    e.preventDefault()
    if (!newUser.name.trim() || !newUser.email.trim()) {
      toast.warning('Vui lòng điền đầy đủ họ tên và email')
      return
    }

    toast.success(`🎉 Đã thêm thành viên ${newUser.name} (${newUser.role.toUpperCase()}) thành công!`)
    setIsModalOpen(false)
    setNewUser({ name: '', email: '', role: 'developer' })
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

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] w-fit cursor-pointer"
        >
          <Plus size={18} />
          Thêm thành viên
        </button>
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

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold hover:shadow-lg shadow-indigo-500/20"
                >
                  Thêm thành viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
