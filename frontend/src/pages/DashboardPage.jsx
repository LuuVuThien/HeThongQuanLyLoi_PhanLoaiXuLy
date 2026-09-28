/**
 * ============================================
 * DASHBOARD PAGE - REDESIGNED
 * Trang tổng quan hệ thống quản lý sự cố
 * Bao gồm: Greeting + Summary Cards + Charts
 *          + Urgent Table + Activity Feed
 * ============================================
 */
import { Link } from 'react-router-dom'
import {
  Bug,
  AlertTriangle,
  CheckCircle,
  XOctagon,
  PlusCircle,
  ArrowRight,
  Clock,
  ExternalLink,
} from 'lucide-react'
import StatCard from '../components/common/StatCard'
import StatusPieChart from '../components/charts/StatusPieChart'
import SeverityBarChart from '../components/charts/SeverityBarChart'
import ErrorMessage from '../components/common/ErrorMessage'
import { StatCardSkeleton, ChartSkeleton } from '../components/common/LoadingSpinner'
import {
  useDashboardStats,
  useStatusChart,
  useSeverityChart,
} from '../hooks/useIncidents'
import {
  mockIncidents,
  mockCurrentUser,
  STATUS_OPTIONS,
  SEVERITY_OPTIONS,
} from '../data/mockData'

// ============================================
// COMPONENT PHỤ: Badge trạng thái (dùng trong bảng)
// ============================================
function StatusBadge({ status }) {
  const option = STATUS_OPTIONS.find((s) => s.value === status)
  if (!option) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-sm"
      style={{
        color: option.color,
        backgroundColor: `${option.color}18`,
        borderColor: `${option.color}35`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: option.color }}
      />
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
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm border border-transparent"
      style={{
        color: option.color,
        backgroundColor: `${option.color}20`,
        borderColor: `${option.color}30`,
      }}
    >
      {option.label}
    </span>
  )
}

// ============================================
// COMPONENT PHỤ: Hàm format thời gian tương đối
// ============================================
function timeAgo(dateStr) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

export default function DashboardPage() {
  // Fetch dữ liệu thống kê từ API (qua custom hooks)
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    refetch: refetchStats,
  } = useDashboardStats()

  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
    refetch: refetchStatus,
  } = useStatusChart()

  const {
    data: severityData,
    isLoading: severityLoading,
    isError: severityError,
    refetch: refetchSeverity,
  } = useSeverityChart()

  // Cấu hình các StatCard
  const statCards = stats
    ? [
      {
        title: 'Tổng số lỗi',
        value: stats.totalIncidents,
        icon: Bug,
        color: 'blue',
        trend: 12,
      },
      {
        title: 'Lỗi đang mở',
        value: stats.openIncidents,
        icon: AlertTriangle,
        color: 'orange',
        trend: -5,
      },
      {
        title: 'Lỗi đã đóng',
        value: stats.closedIncidents,
        icon: CheckCircle,
        color: 'green',
        trend: 18,
      },
      {
        title: 'Lỗi nghiêm trọng',
        value: stats.criticalIncidents,
        icon: XOctagon,
        color: 'red',
        trend: -8,
      },
    ]
    : []

  // Lấy sự cố khẩn cấp (critical + high, chưa đóng, top 5)
  const urgentIncidents = mockIncidents
    .filter(
      (i) =>
        (i.severity === 'critical' || i.severity === 'high') &&
        i.status !== 'closed'
    )
    .slice(0, 5)

  // Lấy hoạt động gần nhất (sắp xếp theo updated_at, top 6)
  const recentActivities = [...mockIncidents]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6)

  // Format ngày hiện tại
  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6 sm:space-y-7 animate-fade-in">
      {/* ====== HEADER: Lời chào + Nút CTA ====== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
            Xin chào, {mockCurrentUser.name} 👋
          </h1>
          <p className="text-sm font-medium text-slate-300 mt-1">
            {today} — Tổng quan hệ thống quản lý sự cố
          </p>
        </div>
        <Link
          to="/incidents/create"
          className="sm:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
        >
          <PlusCircle size={16} />
          Báo cáo lỗi mới
        </Link>
      </div>

      {/* ====== SUMMARY CARDS ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))
          : statsError
            ? <div className="col-span-full">
              <ErrorMessage
                message="Không thể tải dữ liệu thống kê"
                onRetry={refetchStats}
              />
            </div>
            : statCards.map((card, idx) => (
              <div
                key={card.title}
                className={`animate-slide-in-up stagger-${idx + 1}`}
                style={{ opacity: 0 }}
              >
                <StatCard {...card} />
              </div>
            ))
        }
      </div>

      {/* ====== BIỂU ĐỒ ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
        {/* Biểu đồ tròn - Phân bố theo trạng thái */}
        {statusLoading ? (
          <ChartSkeleton />
        ) : statusError ? (
          <ErrorMessage
            message="Không thể tải biểu đồ trạng thái"
            onRetry={refetchStatus}
          />
        ) : (
          <div className="animate-slide-in-up h-full" style={{ opacity: 0, animationDelay: '0.2s' }}>
            <StatusPieChart data={statusData} />
          </div>
        )}

        {/* Biểu đồ cột - Phân bố theo mức độ nghiêm trọng */}
        {severityLoading ? (
          <ChartSkeleton />
        ) : severityError ? (
          <ErrorMessage
            message="Không thể tải biểu đồ mức độ"
            onRetry={refetchSeverity}
          />
        ) : (
          <div className="animate-slide-in-up h-full" style={{ opacity: 0, animationDelay: '0.3s' }}>
            <SeverityBarChart data={severityData} />
          </div>
        )}
      </div>

      {/* ====== KHU VỰC: Sự cố khẩn cấp + Hoạt động gần đây ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5 lg:gap-6">
        {/* ===== SỰ CỐ KHẨN CẤP CẦN XỬ LÝ (4/7 cột) ===== */}
        <div className="lg:col-span-4 rounded-2xl p-5 lg:p-6 bg-[#131C31]/80 border border-white/[0.06] backdrop-blur-sm animate-slide-in-up flex flex-col justify-between" style={{ opacity: 0, animationDelay: '0.35s' }}>
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Sự cố khẩn cấp cần xử lý
                </h3>
              </div>
              <Link
                to="/incidents"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-lg hover:bg-indigo-500/10"
              >
                Xem tất cả <ArrowRight size={13} />
              </Link>
            </div>

            {urgentIncidents.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle size={36} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-sm text-slate-300">
                  Không có sự cố khẩn cấp nào! 🎉
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {urgentIncidents.map((incident) => (
                  <Link
                    key={incident.id}
                    to={`/incidents/${incident.id}`}
                    className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.1] transition-all group shadow-sm cursor-pointer block"
                    title="Xem chi tiết sự cố"
                  >
                    {/* Mã lỗi */}
                    <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-indigo-400 w-8 flex-shrink-0 transition-colors">
                      #{incident.id}
                    </span>

                    {/* Tiêu đề & Dự án */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-white transition-colors truncate">
                        {incident.title}
                      </p>
                      <p className="text-xs font-medium text-slate-300 mt-1">
                        {incident.project.name}
                      </p>
                    </div>

                    {/* Mức độ */}
                    <SeverityBadge severity={incident.severity} />

                    {/* Trạng thái */}
                    <StatusBadge status={incident.status} />

                    {/* Người xử lý */}
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                      {incident.assignee ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                            {incident.assignee.name.charAt(0)}
                          </div>
                          <span className="text-xs font-medium text-slate-200 max-w-[70px] truncate">
                            {incident.assignee.name.split(' ').pop()}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Chưa gán
                        </span>
                      )}
                    </div>

                    {/* Nút xem */}
                    <div className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 group-hover:text-white transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
                      <ExternalLink size={15} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== HOẠT ĐỘNG GẦN ĐÂY (3/7 cột) ===== */}
        <div className="lg:col-span-3 rounded-2xl p-5 lg:p-6 bg-[#131C31]/80 border border-white/[0.06] backdrop-blur-sm animate-slide-in-up flex flex-col justify-between" style={{ opacity: 0, animationDelay: '0.4s' }}>
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                <Clock size={15} className="text-indigo-400" />
                Hoạt động gần đây
              </h3>
            </div>

            <div className="space-y-3">
              {recentActivities.map((activity, idx) => {
                const statusOption = STATUS_OPTIONS.find(
                  (s) => s.value === activity.status
                )
                const actionText =
                  activity.status === 'new'
                    ? 'đã tạo sự cố'
                    : activity.status === 'in_progress'
                      ? 'đang xử lý sự cố'
                      : activity.status === 'resolved'
                        ? 'đã giải quyết sự cố'
                        : 'đã đóng sự cố'

                return (
                  <Link
                    key={activity.id}
                    to={`/incidents/${activity.id}`}
                    className="flex gap-3 px-3.5 py-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] transition-colors group block cursor-pointer"
                    title="Xem chi tiết sự cố"
                  >
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 ring-2 ring-[#131C31] shadow-sm"
                        style={{
                          backgroundColor: statusOption?.color || '#6B7280',
                        }}
                      />
                      {idx < recentActivities.length - 1 && (
                        <div className="w-px flex-1 bg-white/[0.08] mt-1.5" />
                      )}
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200">
                        <span className="font-bold text-white">
                          {activity.reporter?.name || 'Hệ thống'}
                        </span>{' '}
                        <span className="text-slate-300 font-medium">{actionText}</span>
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors mt-1 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs font-medium text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-slate-500" />
                        {timeAgo(activity.updated_at)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ====== GHI CHÚ CUỐI TRANG ====== */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
        <p className="text-xs font-medium text-slate-400">
          Dữ liệu cập nhật lần cuối: vừa xong
        </p>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-400">Realtime</span>
        </div>
      </div>
    </div>
  )
}
