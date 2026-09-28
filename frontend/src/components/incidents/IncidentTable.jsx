/**
 * ============================================
 * INCIDENT TABLE COMPONENT
 * Bảng hiển thị danh sách sự cố
 * Hỗ trợ: Sắp xếp (Sort), Phân trang (Pagination)
 * ============================================
 */
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { STATUS_OPTIONS, SEVERITY_OPTIONS } from '../../data/mockData'

// ============================================
// COMPONENT PHỤ: Badge trạng thái
// ============================================
function StatusBadge({ status }) {
  const option = STATUS_OPTIONS.find((s) => s.value === status)
  if (!option) return null

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
      style={{
        color: option.color,
        backgroundColor: `${option.color}15`,
        borderColor: `${option.color}30`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: option.color }} />
      {option.label}
    </span>
  )
}

// ============================================
// COMPONENT PHỤ: Badge mức độ nghiêm trọng
// ============================================
function SeverityBadge({ severity }) {
  const option = SEVERITY_OPTIONS.find((s) => s.value === severity)
  if (!option) return null

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold"
      style={{
        color: option.color,
        backgroundColor: `${option.color}20`,
      }}
    >
      {option.label}
    </span>
  )
}

// ============================================
// COMPONENT PHỤ: Nút sắp xếp cột
// ============================================
function SortButton({ column, currentSort, currentOrder, onSort }) {
  const isActive = currentSort === column
  const Icon = isActive ? (currentOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <button
      onClick={() => onSort(column)}
      className={`ml-1 p-0.5 rounded transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
    >
      <Icon size={14} />
    </button>
  )
}

// ============================================
// COMPONENT CHÍNH: Bảng sự cố
// ============================================
export default function IncidentTable({
  data,
  sortBy,
  sortOrder,
  onSort,
  currentPage,
  totalPages,
  total,
  onPageChange,
}) {
  const navigate = useNavigate()

  // Hàm format ngày giờ tiếng Việt
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Xử lý khi click vào header cột để sắp xếp
  const handleSort = (column) => {
    if (sortBy === column) {
      onSort(column, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(column, 'asc')
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 overflow-hidden bg-slate-800/20">
      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* Header */}
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/5">
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ID
                <SortButton column="id" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-[250px]">
                Tiêu đề
                <SortButton column="title" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Dự án
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Mức độ
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Người tạo
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Người xử lý
              </th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ngày tạo
                <SortButton column="created_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500">
                  Không tìm thấy sự cố nào phù hợp
                </td>
              </tr>
            ) : (
              data.map((incident, idx) => (
                <tr
                  key={incident.id}
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className="border-t border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer animate-fade-in group"
                  style={{ animationDelay: `${idx * 30}ms` }}
                  title="Click để xem chi tiết sự cố"
                >
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-xs group-hover:text-indigo-400 font-semibold">
                    #{incident.id.toString().padStart(3, '0')}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-200 font-semibold truncate max-w-[300px] group-hover:text-white transition-colors" title={incident.title}>
                      {incident.title}
                    </p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-400 bg-white/5 px-2 py-1 rounded-lg">
                      {incident.project?.name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={incident.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <SeverityBadge severity={incident.severity} />
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    {incident.reporter?.name || '—'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-400 text-xs">
                    {incident.assignee?.name || (
                      <span className="text-slate-600 italic">Chưa gán</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-xs whitespace-nowrap">
                    {formatDate(incident.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh phân trang */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-white/5 gap-3">
        {/* Thông tin tổng số */}
        <p className="text-xs text-slate-500">
          Hiển thị <span className="text-slate-300 font-medium">{data.length}</span> / <span className="text-slate-300 font-medium">{total}</span> sự cố
        </p>

        {/* Nút phân trang */}
        <div className="flex items-center gap-1">
          {/* Nút trang trước */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 disabled:text-slate-700 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Các nút số trang */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                page === currentPage
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              {page}
            </button>
          ))}

          {/* Nút trang tiếp */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 disabled:text-slate-700 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
