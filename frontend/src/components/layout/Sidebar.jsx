/**
 * ============================================
 * SIDEBAR COMPONENT
 * Menu điều hướng bên trái với hiệu ứng hover
 * REDESIGNED: Màu sắc nâng cấp, active state rõ ràng hơn
 * ============================================
 */
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  AlertTriangle,
  PlusCircle,
  FolderOpen,
  Settings,
  Bug,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

// Cấu hình menu items
const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/incidents', icon: AlertTriangle, label: 'Danh sách sự cố' },
  { path: '/incidents/create', icon: PlusCircle, label: 'Báo cáo lỗi' },
  { path: '/projects', icon: FolderOpen, label: 'Dự án' },
  { path: '/settings', icon: Settings, label: 'Cài đặt' },
]

export default function Sidebar({ isOpen, onClose, isCollapsed = true, onToggleCollapse }) {
  return (
    <>
      {/* Overlay cho mobile - đóng sidebar khi click ra ngoài */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar chính */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full
          bg-[#111827]
          border-r border-white/[0.08] shadow-2xl
          flex flex-col
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'lg:w-[72px] w-[260px]' : 'w-[260px]'}
        `}
      >
        {/* Logo / Tên hệ thống */}
        <div className={`h-16 flex items-center border-b border-white/[0.08] px-4 transition-all duration-300 ${isCollapsed ? 'lg:justify-center justify-between' : 'justify-between'}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0 cursor-pointer"
              title="BugTracker - Quản lý sự cố"
            >
              <Bug size={21} className="text-white" />
            </div>

            {/* Tên hệ thống - Ẩn khi collapsed trên desktop */}
            <div className={`whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'lg:hidden opacity-0' : 'block opacity-100'}`}>
              <h1 className="text-sm font-bold text-white tracking-wide">BugTracker</h1>
              <p className="text-[10px] text-slate-400 font-medium">Quản lý sự cố</p>
            </div>
          </div>

          {/* Nút đóng sidebar trên mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Menu điều hướng dạng icon-only khi thu gọn */}
        <nav className="flex-1 px-2.5 py-4 space-y-2 overflow-y-auto overflow-x-hidden">
          {/* Header nhóm menu - Ẩn khi collapsed */}
          <p className={`text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2 transition-all ${isCollapsed ? 'lg:hidden' : 'block'}`}>
            Menu chính
          </p>

          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onClose}
              title={isCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center rounded-xl font-medium transition-all duration-200
                ${isCollapsed ? 'lg:justify-center lg:w-11 lg:h-11 lg:mx-auto px-3 py-2.5' : 'gap-3 px-3.5 py-2.5'}
                ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0 transition-transform group-hover:scale-110" />
              
              {/* Nhãn chữ (chỉ hiển thị khi không thu gọn hoặc trên mobile) */}
              <span className={`text-sm whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'lg:hidden' : 'inline'}`}>
                {item.label}
              </span>

              {/* Tooltip nổi khi hover trên chế độ thu gọn desktop */}
              {isCollapsed && (
                <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-slate-900/95 text-slate-200 text-xs font-semibold rounded-lg shadow-xl border border-white/10 whitespace-nowrap z-50 pointer-events-none">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer sidebar & Nút Collapse / Expand */}
        <div className="p-3 border-t border-white/[0.08] flex flex-col gap-2">
          {/* Nút Toggle Thu gọn / Mở rộng Sidebar */}
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className={`hidden lg:flex items-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.05] transition-all duration-200
              ${isCollapsed ? 'justify-center w-11 h-11 mx-auto' : 'gap-2.5 px-3 py-2 w-full text-xs font-medium'}
            `}
          >
            {isCollapsed ? (
              <ChevronRight size={18} className="text-indigo-400 hover:scale-110 transition-transform" />
            ) : (
              <>
                <ChevronLeft size={16} className="text-slate-400" />
                <span>Thu gọn menu</span>
              </>
            )}
          </button>

          {/* Trạng thái hệ thống */}
          <div className={`flex items-center transition-all ${isCollapsed ? 'lg:justify-center py-1' : 'gap-2 px-2 py-1'}`}>
            <div
              className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50 flex-shrink-0"
              title="Hệ thống hoạt động · v1.0.0"
            />
            <div className={`transition-opacity duration-200 ${isCollapsed ? 'lg:hidden' : 'block'}`}>
              <span className="text-xs text-slate-300 font-medium block">Hệ thống hoạt động</span>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">v1.0.0 · Backend Connected</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
