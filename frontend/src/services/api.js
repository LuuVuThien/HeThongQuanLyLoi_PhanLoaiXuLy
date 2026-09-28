/**
 * ============================================
 * API SERVICE - Cấu hình Axios & các hàm gọi API
 * Kết nối đến Backend Django RESTful API
 * ============================================
 */
import axios from 'axios'
import {
  mockIncidents,
  mockDashboardStats,
  mockStatusChartData,
  mockSeverityChartData,
  mockProjects,
  mockUsers,
} from '../data/mockData'

// ============================================
// CẤU HÌNH AXIOS INSTANCE
// ============================================
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000, // Timeout 10 giây
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor - Tự động gắn token vào mỗi request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor - Xử lý response lỗi toàn cục
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi 401 - Unauthorized (token hết hạn)
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ============================================
// HÀM GIẢ LẬP ĐỘ TRỄ API (Simulate network delay)
// Dùng trong khi chờ Backend hoàn thiện
// ============================================
const simulateDelay = (ms = 800) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// ============================================
// CÁC HÀM GỌI API (sử dụng Mock Data)
// Khi Backend sẵn sàng, chỉ cần thay thế body
// của mỗi hàm bằng apiClient.get/post tương ứng
// ============================================

/**
 * Lấy danh sách sự cố với phân trang, sắp xếp và lọc
 * GET /api/incidents?page=1&status=new&severity=high&sort=created_at
 */
export const fetchIncidents = async ({ page = 1, pageSize = 10, status, severity, sortBy, sortOrder }) => {
  await simulateDelay(600)

  // Áp dụng bộ lọc (Filter)
  let filtered = [...mockIncidents]
  if (status) {
    filtered = filtered.filter((i) => i.status === status)
  }
  if (severity) {
    filtered = filtered.filter((i) => i.severity === severity)
  }

  // Áp dụng sắp xếp (Sort)
  if (sortBy) {
    filtered.sort((a, b) => {
      let valA = a[sortBy]
      let valB = b[sortBy]
      if (sortBy === 'created_at') {
        valA = new Date(valA).getTime()
        valB = new Date(valB).getTime()
      }
      if (typeof valA === 'string') {
        valA = valA.toLowerCase()
        valB = valB.toLowerCase()
      }
      if (sortOrder === 'desc') return valA > valB ? -1 : 1
      return valA > valB ? 1 : -1
    })
  }

  // Áp dụng phân trang (Pagination)
  const total = filtered.length
  const totalPages = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const results = filtered.slice(start, start + pageSize)

  return {
    results,
    total,
    totalPages,
    currentPage: page,
  }

  // === KHI BACKEND SẴN SÀNG, DÙNG CODE NÀY ===
  // const params = { page, page_size: pageSize, status, severity, ordering: sortBy }
  // const { data } = await apiClient.get('/incidents/', { params })
  // return data
}

/**
 * Lấy dữ liệu thống kê cho Dashboard
 * GET /api/incidents/stats
 */
export const fetchDashboardStats = async () => {
  await simulateDelay(500)
  return mockDashboardStats

  // === KHI BACKEND SẴN SÀNG ===
  // const { data } = await apiClient.get('/incidents/stats/')
  // return data
}

/**
 * Lấy dữ liệu biểu đồ trạng thái
 * GET /api/incidents/chart/status
 */
export const fetchStatusChartData = async () => {
  await simulateDelay(400)
  return mockStatusChartData

  // === KHI BACKEND SẴN SÀNG ===
  // const { data } = await apiClient.get('/incidents/chart/status/')
  // return data
}

/**
 * Lấy dữ liệu biểu đồ mức độ nghiêm trọng
 * GET /api/incidents/chart/severity
 */
export const fetchSeverityChartData = async () => {
  await simulateDelay(400)
  return mockSeverityChartData

  // === KHI BACKEND SẴN SÀNG ===
  // const { data } = await apiClient.get('/incidents/chart/severity/')
  // return data
}

/**
 * Lấy chi tiết một sự cố theo ID
 * GET /api/incidents/{incident_id}
 */
export const fetchIncidentById = async (id) => {
  await simulateDelay(400)
  const incident = mockIncidents.find((i) => i.id === Number(id))
  if (!incident) {
    throw new Error(`Không tìm thấy sự cố với ID #${id}`)
  }
  return incident

  // === KHI BACKEND SẴN SÀNG ===
  // const { data } = await apiClient.get(`/incidents/${id}/`)
  // return data
}

/**
 * Cập nhật một sự cố (PATCH)
 * PATCH /api/incidents/{incident_id}
 * Dùng cho Dev nhận việc/sửa xong, Tester đóng lỗi
 */
export const updateIncident = async ({ id, data: patchData }) => {
  await simulateDelay(500)
  const index = mockIncidents.findIndex((i) => i.id === Number(id))
  if (index === -1) {
    throw new Error(`Không tìm thấy sự cố với ID #${id}`)
  }

  // Cập nhật bản ghi trong mock data
  mockIncidents[index] = {
    ...mockIncidents[index],
    ...patchData,
    updated_at: new Date().toISOString(),
  }

  return mockIncidents[index]

  // === KHI BACKEND SẴN SÀNG ===
  // const { data } = await apiClient.patch(`/incidents/${id}/`, patchData)
  // return data
}

/**
 * Xóa một sự cố
 * DELETE /api/incidents/{incident_id}
 */
export const deleteIncident = async (id) => {
  await simulateDelay(500)
  const index = mockIncidents.findIndex((i) => i.id === Number(id))
  if (index === -1) {
    throw new Error(`Không tìm thấy sự cố với ID #${id}`)
  }
  mockIncidents.splice(index, 1)
  return { success: true, message: `Đã xóa sự cố #${id}` }

  // === KHI BACKEND SẴN SÀNG ===
  // await apiClient.delete(`/incidents/${id}/`)
  // return { success: true }
}

/**
 * Lấy danh sách người dùng trong hệ thống
 * GET /api/users
 */
export const fetchUsers = async () => {
  await simulateDelay(300)
  return mockUsers

  // === KHI BACKEND SẴN SÀNG ===
  // const { data } = await apiClient.get('/users/')
  // return data
}

/**
 * AI NLP Assistant: Phân tích mô tả lỗi thời gian thực
 * Dự đoán mức độ nghiêm trọng và lý do nhận diện
 */
export const analyzeBugText = (title = '', description = '') => {
  const fullText = `${title} ${description}`.toLowerCase()
  if (fullText.trim().length < 15) return null

  // Tập luật từ khóa phân loại
  const criticalKeywords = ['thanh toán', 'tiền', 'momo', 'zalopay', 'ngân hàng', 'mất dữ liệu', 'sập', 'crash', 'xss', 'lỗ hổng', 'tấn công', 'bảo mật', 'otp', 'lộ thông tin']
  const highKeywords = ['500', 'internal server error', 'timeout', 'memory leak', 'không nhận được', 'không gửi được', 'không tải được', 'phí vận chuyển', 'tính sai', 'mất tín hiệu', 'chậm hơn 10', 'lỗi nghiêm trọng']
  const mediumKeywords = ['không thể upload', 'load chậm', 'xuất excel', 'cache', 'realtime', 'đồng bộ', 'không hoạt động', 'sai số liệu', 'hiển thị sai']
  const lowKeywords = ['font', 'chữ', 'màu', 'layout', 'tablet', 'zoom', 'ipad', 'chính tả', 'contrast', 'dark mode', 'giao diện']

  const matchedCritical = criticalKeywords.filter(k => fullText.includes(k))
  const matchedHigh = highKeywords.filter(k => fullText.includes(k))
  const matchedMedium = mediumKeywords.filter(k => fullText.includes(k))
  const matchedLow = lowKeywords.filter(k => fullText.includes(k))

  if (matchedCritical.length > 0) {
    return {
      severity: 'critical',
      confidence: Math.min(98, 88 + matchedCritical.length * 3),
      label: 'Nghiêm trọng (Critical)',
      color: '#ef4444',
      reason: `Phát hiện các từ khóa rủi ro cao: "${matchedCritical.join(', ')}" liên quan đến tài chính, bảo mật hoặc ngắt quãng dịch vụ.`,
      keywords: matchedCritical,
    }
  }

  if (matchedHigh.length > 0) {
    return {
      severity: 'high',
      confidence: Math.min(95, 82 + matchedHigh.length * 3),
      label: 'Nặng (High)',
      color: '#f97316',
      reason: `Phát hiện các từ khóa ảnh hưởng hiệu năng/dịch vụ: "${matchedHigh.join(', ')}".`,
      keywords: matchedHigh,
    }
  }

  if (matchedMedium.length > 0) {
    return {
      severity: 'medium',
      confidence: Math.min(90, 80 + matchedMedium.length * 3),
      label: 'Trung bình (Medium)',
      color: '#f59e0b',
      reason: `Ảnh hưởng đến chức năng nghiệp vụ nhưng hệ thống vẫn hoạt động: "${matchedMedium.join(', ')}".`,
      keywords: matchedMedium,
    }
  }

  if (matchedLow.length > 0) {
    return {
      severity: 'low',
      confidence: Math.min(92, 85 + matchedLow.length * 2),
      label: 'Nhẹ (Low)',
      color: '#10b981',
      reason: `Lỗi thẩm mỹ, hiển thị hoặc trải nghiệm người dùng nhỏ: "${matchedLow.join(', ')}".`,
      keywords: matchedLow,
    }
  }

  return {
    severity: 'medium',
    confidence: 75,
    label: 'Trung bình (Medium)',
    color: '#f59e0b',
    reason: 'Chưa đủ từ khóa đặc biệt, hệ thống đề xuất mức mặc định là Trung bình.',
    keywords: [],
  }
}

/**
 * Lấy danh sách dự án cho dropdown
 * GET /api/projects
 */
export const fetchProjects = async () => {
  await simulateDelay(300)
  return mockProjects

  // === KHI BACKEND SẴN SÀNG ===
  // const { data } = await apiClient.get('/projects/')
  // return data
}

/**
 * Tạo sự cố mới (Tester báo cáo lỗi)
 * POST /api/incidents
 */
export const createIncident = async (formData) => {
  await simulateDelay(1000)

  // Tìm dự án tương ứng
  const projectObj = mockProjects.find((p) => p.id === Number(formData.project_id)) || {
    id: Number(formData.project_id) || 1,
    name: 'Dự án hệ thống',
  }

  // Tự động phân loại nếu người dùng chưa chọn
  const aiResult = analyzeBugText(formData.title, formData.description)
  const assignedSeverity = formData.severity || aiResult?.severity || 'medium'

  const newIncident = {
    id: mockIncidents.length + 1,
    title: formData.title,
    description: formData.description,
    project: projectObj,
    status: 'new',
    severity: assignedSeverity,
    reporter: { id: 3, name: 'Lê Hoàng Cường' },
    assignee: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    attachments: formData.attachments || [],
  }

  // Thêm vào đầu danh sách để Dashboard và Table thấy ngay
  mockIncidents.unshift(newIncident)

  return newIncident
}

export default apiClient
