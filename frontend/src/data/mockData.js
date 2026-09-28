/**
 * ============================================
 * CẤU HÌNH VÀ ENUM HỆ THỐNG (Đã xóa toàn bộ mock data cũ)
 * ============================================
 */

// Enum trạng thái sự cố
export const STATUS_OPTIONS = [
  { value: 'new', label: 'Mới', color: '#3b82f6' },
  { value: 'in_progress', label: 'Đang xử lý', color: '#f59e0b' },
  { value: 'resolved', label: 'Đã sửa', color: '#10b981' },
  { value: 'closed', label: 'Đã đóng', color: '#64748b' },
]

// Enum mức độ nghiêm trọng
export const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Nhẹ', color: '#10b981' },
  { value: 'medium', label: 'Trung bình', color: '#f59e0b' },
  { value: 'high', label: 'Nặng', color: '#f97316' },
  { value: 'critical', label: 'Nghiêm trọng', color: '#ef4444' },
]

// Người dùng hiện tại
export const mockCurrentUser = {
  id: 2,
  name: 'Cao Thông',
  role: 'developer',
  email: 'panda@gmail.com',
  avatar: null,
}
