/**
 * ============================================
 * DASHBOARD PAGE - REDESIGNED (theo mẫu BugTracker)
 * Bố cục: 2 cột chính
 *   - Trái (~70%): Stat Cards + Biểu đồ lớn + 2 panel nhỏ
 *   - Phải (~30%): Sự cố khẩn cấp + Hoạt động gần đây
 * Giữ nguyên toàn bộ dữ liệu, hooks, tên trường
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
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Eye,
} from 'lucide-react'
import StatusPieChart from '../components/charts/StatusPieChart'
import SeverityBarChart from '../components/charts/SeverityBarChart'
import ErrorMessage from '../components/common/ErrorMessage'
import { StatCardSkeleton, ChartSkeleton } from '../components/common/LoadingSpinner'
import {
  useDashboardStats,
  useStatusChart,
  useSeverityChart,
  useIncidents,
} from '../hooks/useIncidents'
import {
  mockCurrentUser,
  STATUS_OPTIONS,
  SEVERITY_OPTIONS,
} from '../data/mockData'

// ============================================
// COMPONENT: Stat Card theo mẫu mới
// ============================================
function DashStatCard({ title, value, icon: Icon, accentColor, trend, linkTo }) {
  const colorStyles = {
    blue:   { iconBg: 'bg-blue-500/15', iconText: 'text-blue-400', accent: 'bg-blue-500', pillBg: 'bg-blue-500/10', pillText: 'text-blue-400' },
    orange: { iconBg: 'bg-amber-500/15', iconText: 'text-amber-400', accent: 'bg-amber-500', pillBg: 'bg-amber-500/10', pillText: 'text-amber-400' },
    green:  { iconBg: 'bg-emerald-500/15', iconText: 'text-emerald-400', accent: 'bg-emerald-500', pillBg: 'bg-emerald-500/10', pillText: 'text-emerald-400' },
    red:    { iconBg: 'bg-rose-500/15', iconText: 'text-rose-400', accent: 'bg-rose-500', pillBg: 'bg-rose-500/10', pillText: 'text-rose-400' },
  }
  const c = colorStyles[accentColor] || colorStyles.blue

  return (
    <div className="relative rounded-2xl p-5 bg-[#131C31]/80 border border-white/[0.06] hover:border-white/[0.12] transition-all group overflow-hidden">
      {/* Accent bar trên cùng */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${c.accent} rounded-t-2xl`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Icon tròn */}
          <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center mb-3`}>
            <Icon size={20} className={c.iconText} />
          </div>
          {/* Giá trị lớn */}
          <p className="text-3xl font-extrabold text-white tracking-tight">{value}</p>
          {/* Tiêu đề */}
          <p className="text-xs text-slate-400 font-medium mt-1">{title}</p>
        </div>

        {/* Trend badge */}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold mt-2 ${
            trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : trend < 0 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-500/10 text-slate-400'
          }`}>
            {trend > 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      {/* Link "Xem tất cả" giống mẫu */}
      {linkTo && (
        <Link to={linkTo} className={`inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full text-[11px] font-semibold ${c.pillBg} ${c.pillText} hover:opacity-80 transition-opacity`}>
          Xem tất cả
        </Link>
      )}
    </div>
  )
}

// ============================================
// COMPONENT: Badge trạng thái
// ============================================
function StatusBadge({ status }) {
  const option = STATUS_OPTIONS.find((s) => s.value === status)
  if (!option) return null
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
      style={{
        color: option.color,
        backgroundColor: `${option.color}18`,
        borderColor: `${option.color}35`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: option.color }} />
      {option.label}
    </span>
  )
}

// ============================================
// COMPONENT: Badge mức độ
// ============================================
function SeverityBadge({ severity }) {
  const option = SEVERITY_OPTIONS.find((s) => s.value === severity)
  if (!option) return null
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold"
      style={{ color: option.color, backgroundColor: `${option.color}20` }}
    >
      {option.label}
    </span>
  )
}

// ============================================
// COMPONENT: Hàm format thời gian tương đối
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

// ============================================
// MAIN COMPONENT
// ============================================
export default function DashboardPage() {
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

  const { data: incidentsData } = useIncidents({ pageSize: 100 })
  const allIncidents = incidentsData?.results || []

  // Stat cards data
  const statCards = [
    { title: 'Tổng số lỗi', value: stats?.total ?? allIncidents.length, icon: Bug, accentColor: 'blue', trend: 12, linkTo: '/incidents' },
    { title: 'Lỗi đang mở', value: (stats?.new ?? 0) + (stats?.in_progress ?? 0), icon: AlertTriangle, accentColor: 'orange', trend: -5, linkTo: '/incidents' },
    { title: 'Lỗi đã giải quyết', value: stats?.resolved ?? 0, icon: CheckCircle, accentColor: 'green', trend: 18, linkTo: '/incidents' },
    { title: 'Lỗi nghiêm trọng', value: stats?.critical ?? 0, icon: XOctagon, accentColor: 'red', trend: -8, linkTo: '/incidents' },
  ]

  // Sự cố khẩn cấp
  const urgentIncidents = allIncidents
    .filter((i) => (i.severity === 'critical' || i.severity === 'high') && i.status !== 'closed')
    .slice(0, 5)

  // Hoạt động gần đây
  const recentActivities = [...allIncidents]
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
    .slice(0, 6)

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="animate-fade-in">
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Xin chào, {mockCurrentUser.name} 👋
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{today} — Tổng quan hệ thống</p>
        </div>
        <Link
          to="/incidents/create"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/15 hover:shadow-cyan-500/25 transition-all active:scale-[0.98]"
        >
          <PlusCircle size={16} />
          Báo cáo lỗi mới
        </Link>
      </div>

      {/* ====== BỐ CỤC 2 CỘT CHÍNH ====== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* ===== CỘT TRÁI: Stats + Charts + Metrics (8/12) ===== */}
        <div className="xl:col-span-8 space-y-5">
          {/* --- Hàng 1: 4 Stat Cards --- */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsLoading
              ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              : statsError
                ? <div className="col-span-full"><ErrorMessage message="Không thể tải dữ liệu thống kê" onRetry={refetchStats} /></div>
                : statCards.map((card, idx) => (
                  <div key={card.title} className={`animate-slide-in-up stagger-${idx + 1}`}>
                    <DashStatCard {...card} />
                  </div>
                ))
            }
          </div>

          {/* --- Hàng 2: Biểu đồ lớn (Severity Bar Chart chiếm hết) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Biểu đồ cột - Mức độ nghiêm trọng */}
            {severityLoading ? (
              <ChartSkeleton />
            ) : severityError ? (
              <ErrorMessage message="Không thể tải biểu đồ" onRetry={refetchSeverity} />
            ) : (
              <div className="animate-slide-in-up">
                <SeverityBarChart data={severityData} />
              </div>
            )}

            {/* Biểu đồ tròn - Trạng thái */}
            {statusLoading ? (
              <ChartSkeleton />
            ) : statusError ? (
              <ErrorMessage message="Không thể tải biểu đồ" onRetry={refetchStatus} />
            ) : (
              <div className="animate-slide-in-up">
                <StatusPieChart data={statusData} />
              </div>
            )}
          </div>

          {/* --- Hàng 3: 2 Panel thống kê nhỏ song song --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Panel Tốc độ xử lý */}
            <div className="rounded-2xl p-5 bg-[#131C31]/80 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Activity size={15} className="text-cyan-400" />
                  Tốc độ xử lý
                </h3>
              </div>
              <div className="flex items-center gap-6">
                {/* Vòng tròn tiến trình */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#06b6d4" strokeWidth="6"
                      strokeDasharray={`${((stats?.resolved ?? 0) / Math.max(stats?.total ?? 1, 1)) * 213.6} 213.6`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-extrabold text-white">
                      {stats?.total ? Math.round(((stats?.resolved ?? 0) / stats.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Đã giải quyết</span>
                    <span className="text-emerald-400 font-bold">{stats?.resolved ?? 0}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats?.total ? ((stats?.resolved ?? 0) / stats.total) * 100 : 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Đang xử lý</span>
                    <span className="text-amber-400 font-bold">{stats?.in_progress ?? 0}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${stats?.total ? ((stats?.in_progress ?? 0) / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Panel Thống kê nhanh */}
            <div className="rounded-2xl p-5 bg-[#131C31]/80 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <BarChart3 size={15} className="text-indigo-400" />
                  Thống kê nhanh
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Sự cố mới', value: stats?.new ?? 0, total: stats?.total ?? 1, color: 'bg-sky-500' },
                  { label: 'Đang xử lý', value: stats?.in_progress ?? 0, total: stats?.total ?? 1, color: 'bg-amber-500' },
                  { label: 'Đã giải quyết', value: stats?.resolved ?? 0, total: stats?.total ?? 1, color: 'bg-emerald-500' },
                  { label: 'Đã đóng', value: stats?.closed ?? 0, total: stats?.total ?? 1, color: 'bg-slate-500' },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="text-white font-bold">{item.value}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${Math.max((item.value / Math.max(item.total, 1)) * 100, 2)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ===== CỘT PHẢI: Sự cố khẩn cấp + Hoạt động (4/12) ===== */}
        <div className="xl:col-span-4 space-y-5">
          {/* --- Sự cố khẩn cấp --- */}
          <div className="rounded-2xl p-5 bg-[#131C31]/80 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-sm shadow-rose-500/50" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                  Sự cố khẩn cấp
                </h3>
              </div>
              <Link
                to="/incidents"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                Tất cả <ArrowRight size={12} />
              </Link>
            </div>

            {urgentIncidents.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle size={32} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-sm text-slate-300">Không có sự cố khẩn cấp 🎉</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {urgentIncidents.map((incident) => (
                  <Link
                    key={incident.id}
                    to={`/incidents/${incident.id}`}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] transition-all group block"
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                      {incident.reporter?.name?.charAt(0) || '#'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 group-hover:text-white truncate transition-colors">
                        {incident.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <SeverityBadge severity={incident.severity} />
                        <StatusBadge status={incident.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {incident.project?.name} · {incident.assignee?.name || 'Chưa gán'}
                      </p>
                    </div>
                    <Eye size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0 mt-1 opacity-0 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* --- Hoạt động gần đây (Timeline) --- */}
          <div className="rounded-2xl p-5 bg-[#131C31]/80 border border-white/[0.06]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 uppercase tracking-wide">
                <Clock size={14} className="text-cyan-400" />
                Hoạt động gần đây
              </h3>
            </div>

            <div className="space-y-1">
              {recentActivities.map((activity, idx) => {
                const statusOption = STATUS_OPTIONS.find((s) => s.value === activity.status)
                const actionText =
                  activity.status === 'new' ? 'đã tạo sự cố'
                    : activity.status === 'in_progress' ? 'đang xử lý'
                    : activity.status === 'resolved' ? 'đã giải quyết'
                    : 'đã đóng sự cố'

                return (
                  <Link
                    key={activity.id}
                    to={`/incidents/${activity.id}`}
                    className="flex gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group block"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center shrink-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full mt-1.5 ring-2 ring-[#131C31]"
                        style={{ backgroundColor: statusOption?.color || '#6B7280' }}
                      />
                      {idx < recentActivities.length - 1 && (
                        <div className="w-px flex-1 bg-white/[0.06] mt-1" />
                      )}
                    </div>

                    {/* Nội dung */}
                    <div className="flex-1 min-w-0 pb-2">
                      <p className="text-xs text-slate-300">
                        <span className="font-bold text-white">{activity.reporter?.name || 'Hệ thống'}</span>
                        {' '}<span className="text-slate-400">{actionText}</span>
                      </p>
                      <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors mt-0.5 truncate">
                        {activity.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {timeAgo(activity.updated_at)}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* --- Footer trạng thái --- */}
          <div className="flex items-center justify-between px-2">
            <p className="text-[11px] text-slate-500">Cập nhật: vừa xong</p>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400">Realtime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
