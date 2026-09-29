/**
 * ============================================
 * INCIDENT FILTERS COMPONENT
 * Bộ lọc cho bảng danh sách sự cố
 * Lọc theo: Trạng thái, Mức độ nghiêm trọng
 * ============================================
 */
import { Filter, X } from 'lucide-react'
import { STATUS_OPTIONS, SEVERITY_OPTIONS } from '../../data/mockData'

export default function IncidentFilters({ filters, onFilterChange, onClearFilters }) {
  // Kiểm tra xem có filter nào đang active không
  const hasActiveFilters = filters.status || filters.severity

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Ô tìm kiếm từ khóa sự cố */}
      <div className="relative flex-1 min-w-[220px]">
        <input
          id="incident-search-input"
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange('search', e.target.value)}
          placeholder="Nhập từ khóa tìm kiếm sự cố..."
          className="w-full bg-white/5 border border-white/10 text-slate-300 text-sm rounded-xl pl-9 pr-3 py-2 outline-none focus:border-indigo-500/50 transition-colors placeholder:text-slate-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
          <Filter size={14} />
        </div>
      </div>

      {/* Dropdown lọc theo Trạng thái */}
      <select
        id="incident-status-select"
        value={filters.status || ''}
        onChange={(e) => onFilterChange('status', e.target.value || null)}
        className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-500/50 transition-colors appearance-none cursor-pointer min-w-[140px]"
      >
        <option value="">Tất cả trạng thái</option>
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Dropdown lọc theo Mức độ nghiêm trọng */}
      <select
        id="incident-severity-select"
        value={filters.severity || ''}
        onChange={(e) => onFilterChange('severity', e.target.value || null)}
        className="bg-white/5 border border-white/10 text-slate-300 text-sm rounded-xl px-3 py-2 outline-none focus:border-indigo-500/50 transition-colors appearance-none cursor-pointer min-w-[160px]"
      >
        <option value="">Tất cả mức độ</option>
        {SEVERITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Nút xóa tất cả bộ lọc */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
        >
          <X size={14} />
          Xóa lọc
        </button>
      )}
    </div>
  )
}
