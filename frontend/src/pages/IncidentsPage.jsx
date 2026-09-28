/**
 * ============================================
 * INCIDENTS PAGE
 * Trang danh sách sự cố với bảng dữ liệu
 * Hỗ trợ: Phân trang, Sắp xếp, Lọc
 * ============================================
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle } from 'lucide-react'
import IncidentTable from '../components/incidents/IncidentTable'
import IncidentFilters from '../components/incidents/IncidentFilters'
import ErrorMessage from '../components/common/ErrorMessage'
import { TableSkeleton } from '../components/common/LoadingSpinner'
import { useIncidents } from '../hooks/useIncidents'

export default function IncidentsPage() {
  // ============================================
  // STATE QUẢN LÝ PARAMS CHO QUERY
  // ============================================
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [filters, setFilters] = useState({
    status: null,
    severity: null,
  })

  // Fetch danh sách sự cố từ API với các params hiện tại
  const { data, isLoading, isError, error, refetch } = useIncidents({
    page,
    pageSize: 10,
    status: filters.status,
    severity: filters.severity,
    sortBy,
    sortOrder,
  })

  // ============================================
  // XỬ LÝ SỰ KIỆN
  // ============================================

  // Xử lý khi thay đổi bộ lọc
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1) // Reset về trang 1 khi đổi filter
  }

  // Xử lý khi xóa tất cả bộ lọc
  const handleClearFilters = () => {
    setFilters({ status: null, severity: null })
    setPage(1)
  }

  // Xử lý khi sắp xếp cột
  const handleSort = (column, order) => {
    setSortBy(column)
    setSortOrder(order)
  }

  // Xử lý khi chuyển trang
  const handlePageChange = (newPage) => {
    setPage(newPage)
    // Scroll lên đầu bảng khi chuyển trang
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ====== HEADER: Tiêu đề + Nút tạo mới ====== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Danh sách sự cố</h1>
          <p className="text-sm text-slate-400 mt-1">
            Quản lý và theo dõi tất cả sự cố trong hệ thống
          </p>
        </div>
        {/* Nút tạo sự cố mới */}
        <Link
          to="/incidents/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] w-fit"
        >
          <PlusCircle size={18} />
          Báo cáo lỗi mới
        </Link>
      </div>

      {/* ====== BỘ LỌC ====== */}
      <div className="rounded-2xl p-4 bg-slate-800/20 border border-white/5">
        <IncidentFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* ====== BẢNG DỮ LIỆU ====== */}
      {isLoading ? (
        // Skeleton loading cho bảng
        <div className="rounded-2xl border border-white/5 overflow-hidden bg-slate-800/20 p-4">
          <TableSkeleton rows={8} />
        </div>
      ) : isError ? (
        // Hiển thị lỗi với nút retry
        <ErrorMessage
          message={error?.message || 'Không thể tải danh sách sự cố'}
          onRetry={refetch}
        />
      ) : (
        // Bảng dữ liệu chính
        <IncidentTable
          data={data.results}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          currentPage={data.currentPage}
          totalPages={data.totalPages}
          total={data.total}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  )
}
