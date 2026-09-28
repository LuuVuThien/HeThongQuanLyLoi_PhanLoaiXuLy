/**
 * ============================================
 * API SERVICE - Kết nối trực tiếp FastAPI & Neon DB
 * ============================================
 */
import axios from 'axios'

// ============================================
// CẤU HÌNH AXIOS INSTANCE
// ============================================
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor - Tự động gắn JWT Token
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

// Interceptor - Xử lý lỗi
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
    }
    return Promise.reject(error)
  }
)

// ============================================
// HÀM CHUYỂN ĐỔI ENUM GIỮA BACKEND & FRONTEND
// ============================================

export const mapStatusFromBackend = (status) => {
  const s = String(status || '').toUpperCase()
  if (s === 'IN_PROGRESS' || s === 'OPEN') return 'in_progress'
  if (s === 'RESOLVED') return 'resolved'
  if (s === 'CLOSED') return 'closed'
  return 'new'
}

export const mapStatusToBackend = (status) => {
  const s = String(status || '').toLowerCase()
  if (s === 'in_progress') return 'IN_PROGRESS'
  if (s === 'resolved') return 'RESOLVED'
  if (s === 'closed') return 'CLOSED'
  return 'NEW'
}

export const mapSeverityFromBackend = (sev) => {
  const s = String(sev || '').toUpperCase()
  if (s === 'BLOCKER' || s === 'CRITICAL') return 'critical'
  if (s === 'MAJOR' || s === 'HIGH') return 'high'
  if (s === 'MEDIUM') return 'medium'
  return 'low'
}

export const mapSeverityToBackend = (sev) => {
  const s = String(sev || '').toLowerCase()
  if (s === 'critical') return 'BLOCKER'
  if (s === 'high') return 'CRITICAL'
  if (s === 'medium') return 'MAJOR'
  return 'MINOR'
}

// Chuyển đổi bản ghi Incident từ FastAPI về format Frontend
const transformIncident = (inc) => {
  return {
    id: inc.id,
    title: inc.title,
    description: inc.description,
    status: mapStatusFromBackend(inc.status),
    severity: mapSeverityFromBackend(inc.severity),
    priority: inc.priority || 'LOW',
    project: inc.project || {
      id: inc.project_id || 1,
      name: inc.project_id ? `Dự án #${inc.project_id}` : 'Hệ thống chính',
      code: 'SYS',
    },
    reporter: inc.reporter || {
      id: inc.reporter_id || 1,
      name: `User #${inc.reporter_id || 1}`,
      role: 'tester',
    },
    assignee: inc.assignee_id
      ? {
          id: inc.assignee_id,
          name: `Developer #${inc.assignee_id}`,
          role: 'developer',
        }
      : null,
    created_at: inc.created_at || new Date().toISOString(),
    updated_at: inc.updated_at || inc.created_at || new Date().toISOString(),
    attachments: inc.attachments || [],
  }
}

// ============================================
// CÁC HÀM GỌI API THỰC TẾ (FASTAPI + NEON)
// ============================================

/**
 * Lấy danh sách sự cố từ Neon qua FastAPI
 * GET /incidents/?skip=0&limit=200
 */
export const fetchIncidents = async ({ page = 1, pageSize = 10, status, severity, sortBy = 'created_at', sortOrder = 'desc' }) => {
  try {
    const { data } = await apiClient.get('/incidents/', {
      params: { skip: 0, limit: 200 },
    })

    // Chuẩn hóa dữ liệu
    let list = Array.isArray(data) ? data.map(transformIncident) : []

    // Áp dụng bộ lọc
    if (status) {
      list = list.filter((i) => i.status === status)
    }
    if (severity) {
      list = list.filter((i) => i.severity === severity)
    }

    // Áp dụng sắp xếp
    if (sortBy) {
      list.sort((a, b) => {
        let valA = a[sortBy]
        let valB = b[sortBy]
        if (sortBy === 'created_at' || sortBy === 'updated_at') {
          valA = new Date(valA || 0).getTime()
          valB = new Date(valB || 0).getTime()
        }
        if (typeof valA === 'string') {
          valA = valA.toLowerCase()
          valB = valB.toLowerCase()
        }
        if (sortOrder === 'desc') return valA > valB ? -1 : 1
        return valA > valB ? 1 : -1
      })
    }

    const total = list.length
    const totalPages = Math.ceil(total / pageSize) || 1
    const start = (page - 1) * pageSize
    const results = list.slice(start, start + pageSize)

    return {
      results,
      total,
      totalPages,
      currentPage: page,
    }
  } catch (err) {
    console.error('Lỗi khi fetch danh sách sự cố:', err)
    return { results: [], total: 0, totalPages: 1, currentPage: 1 }
  }
}

/**
 * Lấy dữ liệu thống kê thật từ 100 lỗi Neon cho Dashboard
 */
export const fetchDashboardStats = async () => {
  try {
    const { data } = await apiClient.get('/incidents/', {
      params: { skip: 0, limit: 200 },
    })

    const list = Array.isArray(data) ? data.map(transformIncident) : []
    const total = list.length
    const newCount = list.filter((i) => i.status === 'new').length
    const inProgressCount = list.filter((i) => i.status === 'in_progress').length
    const resolvedCount = list.filter((i) => i.status === 'resolved' || i.status === 'closed').length
    const criticalCount = list.filter((i) => i.severity === 'critical' || i.severity === 'high').length

    return {
      total,
      new: newCount,
      in_progress: inProgressCount,
      resolved: resolvedCount,
      critical: criticalCount,
    }
  } catch (err) {
    console.error('Lỗi fetch dashboard stats:', err)
    return { total: 0, new: 0, in_progress: 0, resolved: 0, critical: 0 }
  }
}

/**
 * Biểu đồ tròn trạng thái từ dữ liệu Neon
 */
export const fetchStatusChartData = async () => {
  try {
    const { data } = await apiClient.get('/incidents/', {
      params: { skip: 0, limit: 200 },
    })

    const list = Array.isArray(data) ? data.map(transformIncident) : []
    return [
      { name: 'Mới (New)', value: list.filter((i) => i.status === 'new').length, color: '#3b82f6' },
      { name: 'Đang xử lý (In Progress)', value: list.filter((i) => i.status === 'in_progress').length, color: '#f59e0b' },
      { name: 'Đã giải quyết (Resolved)', value: list.filter((i) => i.status === 'resolved').length, color: '#10b981' },
      { name: 'Đã đóng (Closed)', value: list.filter((i) => i.status === 'closed').length, color: '#64748b' },
    ]
  } catch {
    return []
  }
}

/**
 * Biểu đồ cột mức độ nghiêm trọng từ dữ liệu Neon
 */
export const fetchSeverityChartData = async () => {
  try {
    const { data } = await apiClient.get('/incidents/', {
      params: { skip: 0, limit: 200 },
    })

    const list = Array.isArray(data) ? data.map(transformIncident) : []
    return [
      { name: 'Nhẹ (Low)', count: list.filter((i) => i.severity === 'low').length, color: '#10b981' },
      { name: 'Trung bình (Medium)', count: list.filter((i) => i.severity === 'medium').length, color: '#f59e0b' },
      { name: 'Nặng (High)', count: list.filter((i) => i.severity === 'high').length, color: '#f97316' },
      { name: 'Nghiêm trọng (Critical)', count: list.filter((i) => i.severity === 'critical').length, color: '#ef4444' },
    ]
  } catch {
    return []
  }
}

/**
 * Lấy chi tiết một sự cố theo ID
 * GET /incidents/{id}
 */
export const fetchIncidentById = async (id) => {
  const { data } = await apiClient.get(`/incidents/${id}`)
  return transformIncident(data)
}

/**
 * Cập nhật một sự cố (PATCH)
 * PATCH /incidents/{id}
 */
export const updateIncident = async ({ id, data: patchData }) => {
  const payload = {}
  if (patchData.status) {
    payload.status = mapStatusToBackend(patchData.status)
  }
  if (patchData.severity) {
    payload.severity = mapSeverityToBackend(patchData.severity)
  }
  if (patchData.title) {
    payload.title = patchData.title
  }
  if (patchData.description) {
    payload.description = patchData.description
  }
  if (patchData.assignee) {
    payload.assignee_id = patchData.assignee.id
  } else if (patchData.assignee_id !== undefined) {
    payload.assignee_id = patchData.assignee_id
  }

  const { data } = await apiClient.patch(`/incidents/${id}`, payload)
  return transformIncident(data)
}

/**
 * Xóa một sự cố
 * DELETE /incidents/{id}
 */
export const deleteIncident = async (id) => {
  await apiClient.delete(`/incidents/${id}`)
  return { success: true }
}

/**
 * Lấy danh sách người dùng từ Neon
 * GET /users/
 */
export const fetchUsers = async () => {
  try {
    const { data } = await apiClient.get('/users/', { params: { skip: 0, limit: 100 } })
    if (Array.isArray(data) && data.length > 0) {
      return data.map((u) => ({
        id: u.id,
        name: u.username,
        email: u.email,
        role: (u.role || 'developer').toLowerCase(),
        avatar: null,
      }))
    }
  } catch (err) {
    console.warn('Lỗi lấy danh sách users:', err)
  }
  return [
    { id: 1, name: 'testuser_a3381479', email: 'test_701acebe@example.com', role: 'developer' },
    { id: 2, name: 'caothong', email: 'panda@gmail.com', role: 'developer' },
  ]
}

/**
 * Tạo người dùng mới
 * POST /users/
 */
export const createUser = async (userData) => {
  const payload = {
    username: userData.name.toLowerCase().replace(/\s+/g, '_'),
    email: userData.email,
    password: 'password123',
    role: (userData.role || 'DEVELOPER').toUpperCase(),
  }
  const { data } = await apiClient.post('/users/', payload)
  return {
    id: data.id,
    name: data.username,
    email: data.email,
    role: data.role.toLowerCase(),
  }
}

/**
 * Lấy danh sách dự án
 * GET /projects/
 */
export const fetchProjects = async () => {
  try {
    const { data } = await apiClient.get('/projects/', { params: { skip: 0, limit: 100 } })
    if (Array.isArray(data) && data.length > 0) {
      return data.map((p) => ({
        id: p.id,
        name: p.name,
        code: (p.name.substring(0, 3) || 'PRJ').toUpperCase(),
        description: p.description,
      }))
    }
  } catch (err) {
    console.warn('Lỗi lấy projects:', err)
  }
  return [
    { id: 1, name: 'Hệ thống Quản lý Sự cố', code: 'IMS', description: 'Dự án chính' },
    { id: 2, name: 'Cổng Thanh toán Online', code: 'PAY', description: 'Module giao dịch' },
  ]
}

/**
 * Tạo mới dự án
 * POST /projects/
 */
export const createProject = async (projectData) => {
  const { data } = await apiClient.post('/projects/', {
    name: projectData.name,
    description: projectData.code ? `[${projectData.code}] ${projectData.name}` : projectData.name,
  })
  return {
    id: data.id,
    name: data.name,
    code: (projectData.code || 'PRJ').toUpperCase(),
  }
}

/**
 * Tạo sự cố mới (Tester báo cáo lỗi) lưu trực tiếp vào Neon qua FastAPI
 * POST /incidents/
 */
export const createIncident = async (formData) => {
  const payload = {
    title: formData.title,
    description: formData.description,
    status: 'NEW',
    priority: 'HIGH',
    severity: mapSeverityToBackend(formData.severity),
    project_id: formData.project_id ? Number(formData.project_id) : 1,
    reporter_id: 1, // Mặc định tài khoản ID 1
    assignee_id: null,
  }

  const { data } = await apiClient.post('/incidents/', payload)
  return transformIncident(data)
}

/**
 * AI Realtime Scanner: Gọi API /incidents/classify của FastAPI (chạy RuleBasedClassifier)
 */
export const analyzeBugText = async (title = '', description = '') => {
  const fullText = `${title} ${description}`.trim()
  if (fullText.length < 15) return null

  try {
    const { data } = await apiClient.post('/incidents/classify', {
      title,
      description,
    })

    // data: { severity: "Critical", priority: "P1", confidence: 0.95, matched_keywords: [...], reason: "..." }
    const sev = String(data.severity || '').toLowerCase()
    let color = '#f59e0b'
    let label = 'Trung bình (Medium)'

    if (sev === 'critical') {
      color = '#ef4444'
      label = 'Nghiêm trọng (Critical)'
    } else if (sev === 'high') {
      color = '#f97316'
      label = 'Nặng (High)'
    } else if (sev === 'low') {
      color = '#10b981'
      label = 'Nhẹ (Low)'
    }

    return {
      severity: sev,
      confidence: Math.round((data.confidence || 0.85) * 100),
      label,
      color,
      reason: data.reason || 'Dựa trên từ khóa ngữ cảnh và phân tích rủi ro hệ thống.',
      keywords: data.matched_keywords || [],
    }
  } catch {
    // Fallback nếu kết nối mạng tạm gián đoạn
    return fallbackLocalAnalyze(title, description)
  }
}

// Fallback heuristic khi offline
const fallbackLocalAnalyze = (title = '', description = '') => {
  const text = `${title} ${description}`.toLowerCase()
  if (text.includes('momo') || text.includes('thanh toán') || text.includes('tiền') || text.includes('crash') || text.includes('sập')) {
    return {
      severity: 'critical',
      confidence: 96,
      label: 'Nghiêm trọng (Critical)',
      color: '#ef4444',
      reason: 'Phát hiện từ khóa rủi ro cao liên quan đến giao dịch tài chính hoặc sập hệ thống.',
      keywords: ['thanh toán', 'crash'],
    }
  }
  return {
    severity: 'medium',
    confidence: 80,
    label: 'Trung bình (Medium)',
    color: '#f59e0b',
    reason: 'Đề xuất mức mặc định Trung bình theo bộ luật.',
    keywords: [],
  }
}

/**
 * Đăng nhập người dùng (nhận JWT Token)
 * POST /auth/login
 */
export const loginUser = async ({ email, password }) => {
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);

  const { data } = await apiClient.post('/auth/login', params)
  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('current_user', JSON.stringify(data.user))
  }
  return data
}

/**
 * Lấy thông tin tài khoản hiện tại từ JWT Token
 * GET /auth/me
 */
export const getCurrentUser = async () => {
  const { data } = await apiClient.get('/auth/me')
  return data
}

/**
 * Đăng xuất an toàn khỏi hệ thống
 */
export const logoutUser = async () => {
  try {
    await apiClient.post('/auth/logout')
  } catch {
    // ignore
  } finally {
    localStorage.removeItem('access_token')
    localStorage.removeItem('current_user')
  }
}

export default apiClient
