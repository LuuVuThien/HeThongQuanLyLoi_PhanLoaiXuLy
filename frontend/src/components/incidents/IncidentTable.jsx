/**
 * ============================================
 * INCIDENT TABLE COMPONENT - REDESIGNED
 * Bảng hiển thị sự cố theo phong cách BugTracker
 * Bảng sạch, hàng rõ ràng, badge trạng thái nhiều màu
 * Hỗ trợ: Sắp xếp (Sort), Phân trang (Pagination)
 * ============================================
 */
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Edit3, MessageSquare } from 'lucide-react'
import { STATUS_OPTIONS, SEVERITY_OPTIONS } from '../../data/mockData'

// ============================================
// COMPONENT PHỤ: Badge trạng thái (kiểu pill bo tròn nhiều màu)
// ============================================
function StatusBadge({ status }) {
  const option = STATUS_OPTIONS.find((s) => s.value === status)
  if (!option) return null

  // Ánh xạ màu sắc theo trạng thái giống mẫu BugTracker
  const colorMap = {
    new: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30', dot: 'bg-sky-400' },
    in_progress: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' },
    resolved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
    closed: { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-400' },
  }
  const colors = colorMap[status] || { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-400' }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
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

  const colorMap = {
    low: 'text-emerald-400',
    medium: 'text-amber-400',
    high: 'text-orange-400',
    critical: 'text-rose-400',
  }

  return (
    <span className={`text-sm font-semibold ${colorMap[severity] || 'text-slate-400'}`}>
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
      className={`ml-1.5 p-0.5 rounded transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}
    >
      <Icon size={13} />
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
    <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-[#111827]/60">
      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[50px]">
                ID
                <SortButton column="id" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
              <th className="text-left px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Sự cố
                <SortButton column="title" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
              <th className="text-left px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[130px]">
                Người tạo
              </th>
              <th className="text-left px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[120px]">
                Ngày tạo
                <SortButton column="created_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
              </th>
              <th className="text-left px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[140px]">
                Trạng thái
              </th>
              <th className="text-left px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[130px]">
                Người xử lý
              </th>
              <th className="text-left px-5 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[110px]">
                Mức độ
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                      <MessageSquare size={20} className="text-slate-600" />
                    </div>
                    <p className="text-sm font-medium">Không tìm thấy sự cố nào phù hợp</p>
                    <p className="text-xs text-slate-600">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((incident, idx) => (
                <tr
                  key={incident.id}
                  onClick={() => navigate(`/incidents/${incident.id}`)}
                  className="border-t border-white/[0.04] hover:bg-white/[0.03] transition-all duration-150 cursor-pointer group"
                  title="Click để xem chi tiết sự cố"
                >
                  {/* ID */}
                  <td className="px-5 py-4">
                    <span className="text-xs font-mono font-bold text-slate-500 group-hover:text-cyan-400 transition-colors">
                      #{incident.id}
                    </span>
                  </td>

                  {/* Tiêu đề sự cố + Dự án */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {/* Icon hành động nhỏ giống mẫu */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/incidents/${incident.id}`) }}
                          className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-cyan-400 transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={13} />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors truncate max-w-[320px]" title={incident.title}>
                          {incident.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{incident.project?.name || '—'}</p>
                      </div>
                    </div>
                  </td>

                  {/* Người tạo */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-300 font-medium">
                      {incident.reporter?.name || '—'}
                    </span>
                  </td>

                  {/* Ngày tạo */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-400 whitespace-nowrap">
                      {formatDate(incident.created_at)}
                    </span>
                  </td>

                  {/* Trạng thái */}
                  <td className="px-5 py-4">
                    <StatusBadge status={incident.status} />
                  </td>

                  {/* Người xử lý */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-300 font-medium">
                      {incident.assignee?.name || (
                        <span className="text-slate-600 italic font-normal">Chưa gán</span>
                      )}
                    </span>
                  </td>

                  {/* Mức độ */}
                  <td className="px-5 py-4">
                    <SeverityBadge severity={incident.severity} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh phân trang */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-white/[0.06] gap-3 bg-white/[0.01]">
        {/* Thông tin tổng số */}
        <p className="text-xs text-slate-500">
          Hiển thị <span className="text-slate-300 font-semibold">{data.length}</span> / <span className="text-slate-300 font-semibold">{total}</span> sự cố
          {currentPage > 0 && totalPages > 0 && (
            <span className="ml-2 text-slate-600">
              (Trang {currentPage}/{totalPages})
            </span>
          )}
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
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                page === currentPage
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
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
