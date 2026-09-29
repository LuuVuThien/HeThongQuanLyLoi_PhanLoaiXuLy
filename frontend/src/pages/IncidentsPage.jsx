/**
 * ============================================
 * INCIDENTS PAGE - REDESIGNED
 * Trang danh sách sự cố theo phong cách BugTracker
 * Bố cục sạch, bảng rõ ràng, badge nhiều màu
 * Hỗ trợ: Phân trang, Sắp xếp, Lọc
 * ============================================
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Search, Filter, X, ChevronDown } from 'lucide-react'
import IncidentTable from '../components/incidents/IncidentTable'
import ErrorMessage from '../components/common/ErrorMessage'
import { TableSkeleton } from '../components/common/LoadingSpinner'
import { useIncidents } from '../hooks/useIncidents'
import { STATUS_OPTIONS, SEVERITY_OPTIONS } from '../data/mockData'

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
    search: '',
  })

  // Fetch danh sách sự cố từ API với các params hiện tại
  const { data, isLoading, isError, error, refetch } = useIncidents({
    page,
    pageSize: 10,
    status: filters.status,
    severity: filters.severity,
    search: filters.search,
    sortBy,
    sortOrder,
  })

  // ============================================
  // XỬ LÝ SỰ KIỆN
  // ============================================
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters({ status: null, severity: null, search: '' })
    setPage(1)
  }

  const handleSort = (column, order) => {
    setSortBy(column)
    setSortOrder(order)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasActiveFilters = filters.status || filters.severity || filters.search

  // Label hiển thị cho filter đang chọn
  const activeStatusLabel = filters.status
    ? STATUS_OPTIONS.find(s => s.value === filters.status)?.label || filters.status
    : 'Tất cả trạng thái'

  const activeSeverityLabel = filters.severity
    ? SEVERITY_OPTIONS.find(s => s.value === filters.severity)?.label || filters.severity
    : 'Tất cả mức độ'

  return (
    <div className="space-y-0 animate-fade-in">
      {/* ====== HEADER BAR giống mẫu BugTracker ====== */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Dòng 1: Tiêu đề + Nút Submit */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Danh sách sự cố</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Quản lý và theo dõi tất cả sự cố trong hệ thống
            </p>
          </div>
          <Link
            to="/incidents/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-600 hover:to-blue-700 hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-cyan-500/15"
          >
            <PlusCircle size={17} />
            Báo cáo lỗi mới
          </Link>
        </div>

        {/* Dòng 2: Thanh Filter + Search giống mẫu */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px] max-w-[340px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search size={15} />
            </div>
            <input
              id="incident-search-input"
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Tìm kiếm sự cố..."
              className="w-full bg-[#1a2236] border border-white/10 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2.5 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-500"
            />
          </div>

          {/* Dropdown Trạng thái */}
          <div className="relative">
            <select
              id="incident-status-select"
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || null)}
              className="appearance-none bg-[#1a2236] border border-white/10 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none focus:border-cyan-500/50 transition-all cursor-pointer min-w-[160px]"
            >
              <option value="">Tất cả trạng thái</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Dropdown Mức độ */}
          <div className="relative">
            <select
              id="incident-severity-select"
              value={filters.severity || ''}
              onChange={(e) => handleFilterChange('severity', e.target.value || null)}
              className="appearance-none bg-[#1a2236] border border-white/10 text-slate-300 text-sm rounded-lg pl-3 pr-8 py-2.5 outline-none focus:border-cyan-500/50 transition-all cursor-pointer min-w-[160px]"
            >
              <option value="">Tất cả mức độ</option>
              {SEVERITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Nút xóa filter */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <X size={14} />
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* ====== BẢNG DỮ LIỆU ====== */}
      {isLoading ? (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#111827]/60 p-4">
          <TableSkeleton rows={8} />
        </div>
      ) : isError ? (
        <ErrorMessage
          message={error?.message || 'Không thể tải danh sách sự cố'}
          onRetry={refetch}
        />
      ) : (
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
