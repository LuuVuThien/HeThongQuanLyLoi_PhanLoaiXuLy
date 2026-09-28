/**
 * ============================================
 * ADMIN LAYOUT COMPONENT
 * Bố cục chính: Sidebar + Topbar + Content area
 * REDESIGNED: Đảm bảo không bị chồng lấn, nền mới
 * ============================================
 */
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AdminLayout() {
  // State quản lý đóng/mở sidebar trên mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // State quản lý thu gọn sidebar (icon-only) trên desktop - mặc định là true (collapsed)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)

  return (
    <div className="min-h-screen bg-[#0B0F19]">
      {/* Sidebar cố định bên trái (hỗ trợ thu gọn icon-only) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Vùng nội dung chính (tự động mở rộng khi sidebar thu gọn) */}
      <div className={`admin-content ${isSidebarCollapsed ? 'is-collapsed' : 'is-expanded'}`}>
        {/* Topbar cố định trên cùng */}
        <Topbar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Nội dung trang - React Router sẽ render component tương ứng vào đây */}
        <main className="flex-1 p-4 lg:p-7 max-w-[1920px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
