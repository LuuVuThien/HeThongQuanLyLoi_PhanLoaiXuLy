/**
 * ============================================
 * TOPBAR COMPONENT
 * Hiển thị thông tin phiên đăng nhập & nút Đăng xuất
 * ============================================
 */
import { Link, useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, PlusCircle, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.username || user?.name || 'User'
  const displayRole = user?.role || 'developer'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'
      case 'manager':
      case 'pm':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
      case 'tester':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    }
  }

  return (
    <header className="h-16 bg-[#111827]/80 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      {/* Phần bên trái: Nút menu + Search */}
      <div className="flex items-center gap-3">
        {/* Nút toggle sidebar (mobile/tablet) */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl hover:bg-white/10 text-slate-400 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Thanh tìm kiếm */}
        <div className="hidden sm:flex items-center gap-2 bg-white/[0.04] rounded-xl px-3 py-2 border border-white/[0.06] focus-within:border-indigo-500/30 focus-within:bg-white/[0.06] transition-all w-64">
          <Search size={16} className="text-slate-500" />
          <input
            type="text"
            placeholder="Tìm kiếm sự cố..."
            className="bg-transparent border-none outline-none text-sm text-slate-300 placeholder-slate-500 w-full"
          />
          <kbd className="hidden md:inline-flex text-[10px] text-slate-500 bg-white/[0.06] rounded px-1.5 py-0.5 border border-white/[0.08]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Phần bên phải: CTA + Thông báo + User info + Logout */}
      <div className="flex items-center gap-3">
        {/* Nút CTA: Báo cáo lỗi mới */}
        <Link
          to="/incidents/create"
          className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 cursor-pointer"
        >
          <PlusCircle size={16} />
          <span>Báo cáo lỗi</span>
        </Link>

        {/* Nút thông báo */}
        <button className="relative p-2 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-[#111827]">
            3
          </span>
        </button>

        {/* Đường kẻ ngăn cách */}
        <div className="w-px h-6 bg-white/[0.08] mx-1" />

        {/* Thông tin người dùng đang đăng nhập */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/10 shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 truncate max-w-[130px]">{displayName}</p>
            <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border uppercase tracking-wider ${getRoleColor(displayRole)}`}>
              {displayRole}
            </span>
          </div>
        </div>

        {/* Nút Đăng xuất (Logout) */}
        <button
          onClick={handleLogout}
          title="Đăng xuất khỏi hệ thống"
          className="p-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          <LogOut size={16} />
          <span className="hidden lg:inline">Đăng xuất</span>
        </button>
      </div>
    </header>
  )
}
