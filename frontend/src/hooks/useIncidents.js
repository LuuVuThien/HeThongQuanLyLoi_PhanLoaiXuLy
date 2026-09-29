/**
 * ============================================
 * CUSTOM HOOK: useIncidents
 * Quản lý server state cho danh sách sự cố
 * Sử dụng React Query để caching, auto-refetch
 * ============================================
 */
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchIncidents,
  fetchIncidentById,
  updateIncident,
  deleteIncident,
  fetchDashboardStats,
  fetchStatusChartData,
  fetchSeverityChartData,
  fetchProjects,
  fetchUsers,
  createIncident,
  createProject,
  createUser,
  analyzeBugText,
} from '../services/api'

/**
 * Hook lấy chi tiết một sự cố theo ID
 */
export const useIncident = (id) => {
  return useQuery({
    queryKey: ['incident', id],
    queryFn: () => fetchIncidentById(id),
    enabled: !!id,
    staleTime: 60 * 1000,
  })
}

/**
 * Hook cập nhật sự cố (PATCH)
 * Dùng cho Dev nhận việc/sửa xong, Tester đóng/mở lại lỗi
 */
export const useUpdateIncident = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateIncident,
    onSuccess: (updatedData) => {
      // Invalidate và cập nhật cache tức thì
      queryClient.setQueryData(['incident', String(updatedData.id)], updatedData)
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['chart-status'] })
      queryClient.invalidateQueries({ queryKey: ['chart-severity'] })
    },
  })
}

/**
 * Hook xóa sự cố (DELETE)
 */
export const useDeleteIncident = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteIncident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['chart-status'] })
      queryClient.invalidateQueries({ queryKey: ['chart-severity'] })
    },
  })
}

/**
 * Hook lấy danh sách người dùng (dùng để gán Assignee)
 */
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook AI Auto-Classifier: Quét nội dung thời gian thực với debounce
 * Phục vụ tính năng ngôi sao phân loại mức độ nghiêm trọng
 */
export const useBugClassifier = (title = '', description = '') => {
  const [classificationResult, setClassificationResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const textLength = `${title} ${description}`.trim().length

  useEffect(() => {
    if (textLength < 15) {
      return
    }

    const startTimer = setTimeout(() => {
      setIsAnalyzing(true)
    }, 0)

    let isMounted = true

    // Debounce 450ms
    const timer = setTimeout(async () => {
      try {
        const result = await analyzeBugText(title, description)
        if (isMounted) {
          setClassificationResult(result)
          setIsAnalyzing(false)
        }
      } catch {
        if (isMounted) setIsAnalyzing(false)
      }
    }, 450)

    return () => {
      isMounted = false
      clearTimeout(startTimer)
      clearTimeout(timer)
    }
  }, [title, description, textLength])

  return {
    classification: textLength < 15 ? null : classificationResult,
    isAnalyzing: textLength < 15 ? false : isAnalyzing,
  }
}

/**
 * Hook lấy danh sách sự cố với phân trang, lọc, sắp xếp
 * @param {Object} params - Tham số query (page, status, severity, sortBy, sortOrder)
 */
export const useIncidents = (params = {}) => {
  return useQuery({
    // queryKey chứa params để React Query tự refetch khi params thay đổi
    queryKey: ['incidents', params],
    queryFn: () => fetchIncidents(params),
    // Giữ dữ liệu cũ khi đang fetch trang mới (tránh nhấp nháy)
    placeholderData: (previousData) => previousData,
    // Thời gian cache: 5 phút
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook lấy thống kê tổng quan cho Dashboard
 */
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000, // Cache 2 phút
  })
}

/**
 * Hook lấy dữ liệu biểu đồ trạng thái (Pie Chart)
 */
export const useStatusChart = () => {
  return useQuery({
    queryKey: ['chart-status'],
    queryFn: fetchStatusChartData,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook lấy dữ liệu biểu đồ mức độ nghiêm trọng (Bar Chart)
 */
export const useSeverityChart = () => {
  return useQuery({
    queryKey: ['chart-severity'],
    queryFn: fetchSeverityChartData,
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * Hook lấy danh sách dự án cho dropdown
 */
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 10 * 60 * 1000, // Cache 10 phút (ít thay đổi)
  })
}

/**
 * Hook tạo sự cố mới (Mutation)
 * Tự động invalidate cache danh sách sự cố & thống kê sau khi tạo thành công
 */
export const useCreateIncident = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      // Xóa cache để force refetch dữ liệu mới
      queryClient.invalidateQueries({ queryKey: ['incidents'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      queryClient.invalidateQueries({ queryKey: ['chart-status'] })
      queryClient.invalidateQueries({ queryKey: ['chart-severity'] })
    },
  })
}

/**
 * Hook tạo dự án mới (Mutation)
 * Tự động cập nhật cache danh sách projects sau khi tạo thành công
 */
export const useCreateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

/**
 * Hook thêm thành viên mới (Mutation)
 * Tự động cập nhật cache danh sách users sau khi tạo thành công
 */
export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

