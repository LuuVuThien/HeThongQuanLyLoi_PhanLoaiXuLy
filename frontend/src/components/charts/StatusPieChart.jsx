/**
 * ============================================
 * STATUS PIE CHART COMPONENT (Tái sử dụng)
 * Biểu đồ Donut thống kê lỗi theo Trạng thái
 * REDESIGNED: Center stat, legend bên cạnh, tooltip glassmorphism
 * ============================================
 */
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Component tooltip tùy chỉnh - Glassmorphism dark
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-sm font-medium text-white">{payload[0].name}</p>
      <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
        {payload[0].value} sự cố
      </p>
    </div>
  )
}

// Label tùy chỉnh hiển thị phần trăm trên biểu đồ
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.08) return null // Ẩn label nếu < 8%
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function StatusPieChart({ data, title = 'Phân bố theo trạng thái' }) {
  // Tính tổng để hiển thị ở giữa donut
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="rounded-2xl p-5 lg:p-6 bg-[#131C31]/80 border border-white/[0.06] backdrop-blur-sm h-full flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-slate-200 mb-2">{title}</h3>

      {/* Căn giữa toàn bộ cụm Donut + Legend và giảm gap thừa */}
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-8 py-2 max-w-xl mx-auto w-full">
        {/* Biểu đồ Donut với số tổng ở giữa */}
        <div className="relative w-[210px] h-[210px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
                stroke="none"
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.color}
                    className="hover:opacity-85 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Số tổng hiển thị ở tâm donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl font-extrabold text-white tracking-tight">{total}</span>
            <span className="text-[11px] text-slate-300 font-medium">Tổng lỗi</span>
          </div>
        </div>

        {/* Legend gọn gàng bên cạnh */}
        <div className="flex flex-col gap-2.5 w-full max-w-[260px]">
          {data.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm font-medium text-slate-200 truncate">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-white">{entry.value}</span>
                <span className="text-xs font-semibold text-slate-400">
                  {total > 0 ? `${((entry.value / total) * 100).toFixed(0)}%` : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
