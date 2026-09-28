/**
 * ============================================
 * APP.JSX - Root Component
 * Cấu hình React Router với Authentication Guard
 * ============================================
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import IncidentsPage from './pages/IncidentsPage'
import IncidentDetailPage from './pages/IncidentDetailPage'
import CreateIncidentPage from './pages/CreateIncidentPage'
import ProjectsPage from './pages/ProjectsPage'
import UsersPage from './pages/UsersPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route: Đăng nhập */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes: Bắt buộc đã đăng nhập và có JWT Token */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* Trang Dashboard - Route mặc định */}
            <Route index element={<DashboardPage />} />

            {/* Trang danh sách sự cố */}
            <Route path="incidents" element={<IncidentsPage />} />

            {/* Trang xem chi tiết sự cố */}
            <Route path="incidents/:id" element={<IncidentDetailPage />} />

            {/* Trang tạo sự cố mới */}
            <Route path="incidents/create" element={<CreateIncidentPage />} />

            {/* Trang quản lý dự án */}
            <Route path="projects" element={<ProjectsPage />} />

            {/* Trang cài đặt / quản lý thành viên */}
            <Route path="settings" element={<UsersPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
