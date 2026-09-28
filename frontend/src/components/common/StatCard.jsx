/**
 * ============================================
 * STAT CARD COMPONENT (Tái sử dụng)
 * Thẻ hiển thị chỉ số thống kê trên Dashboard
 * Props: title, value, icon, color, trend
 * REDESIGNED: Tăng contrast, thêm pill badge cho trend
 * ============================================
 */

export default function StatCard({ title, value, icon: Icon, color, trend }) {
  // Map màu sắc sang Tailwind classes
  const colorMap = {
    blue: {
      bg: 'from-blue-500/15 to-blue-600/5',
      icon: 'from-blue-500 to-blue-600',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      glow: 'group-hover:shadow-blue-500/10',
    },
    green: {
      bg: 'from-emerald-500/15 to-emerald-600/5',
      icon: 'from-emerald-500 to-emerald-600',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      glow: 'group-hover:shadow-emerald-500/10',
    },
    orange: {
      bg: 'from-amber-500/15 to-amber-600/5',
      icon: 'from-amber-500 to-amber-600',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      glow: 'group-hover:shadow-amber-500/10',
    },
    red: {
      bg: 'from-rose-500/15 to-rose-600/5',
      icon: 'from-rose-500 to-rose-600',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
      glow: 'group-hover:shadow-rose-500/10',
    },
    purple: {
      bg: 'from-purple-500/15 to-purple-600/5',
      icon: 'from-purple-500 to-purple-600',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
      glow: 'group-hover:shadow-purple-500/10',
    },
  }

  const colors = colorMap[color] || colorMap.blue

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-5 lg:p-6
        bg-gradient-to-br ${colors.bg}
        border ${colors.border}
        backdrop-blur-sm
        transition-all duration-300
        hover:scale-[1.015] hover:shadow-2xl ${colors.glow}
        group cursor-default flex flex-col justify-between h-full min-h-[140px]
      `}
    >
      {/* Hiệu ứng glow nền */}
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${colors.icon} opacity-[0.08] blur-2xl group-hover:opacity-[0.18] transition-opacity duration-500`} />

      <div className="relative flex items-start justify-between gap-3">
        {/* Tiêu đề & Giá trị chính */}
        <div className="space-y-1.5 flex-1">
          <p className="text-sm text-slate-300 font-medium tracking-wide">{title}</p>
          <p className={`text-3xl lg:text-4xl font-extrabold ${colors.text} tracking-tight`}>
            {value}
          </p>
        </div>

        {/* Icon nổi bật */}
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors.icon} flex items-center justify-center shadow-lg shadow-black/30 flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon size={22} className="text-white" />
        </div>
      </div>

      {/* Hiển thị xu hướng tăng/giảm - pill badge rõ nét */}
      <div className="relative mt-3 pt-2">
        {trend !== undefined && trend !== null && (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
              ${
                trend > 0
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : trend < 0
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                    : 'bg-slate-500/15 text-slate-300 border border-slate-500/25'
              }
            `}
          >
            <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
            <span>{Math.abs(trend)}% so với tuần trước</span>
          </div>
        )}
      </div>
    </div>
  )
}
