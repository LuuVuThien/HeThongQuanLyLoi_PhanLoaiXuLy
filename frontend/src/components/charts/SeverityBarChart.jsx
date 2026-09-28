/**
 * ============================================
 * SEVERITY BAR CHART COMPONENT (Tái sử dụng)
 * Biểu đồ cột thống kê lỗi theo Mức độ nghiêm trọng
 * REDESIGNED: Gradient cột, label trên đầu cột, tooltip glass
 * ============================================
 */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'

// Component tooltip tùy chỉnh - Glassmorphism dark
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-sm font-medium text-white">{label}</p>
      <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>
        {payload[0].value} sự cố
      </p>
    </div>
  )
}

// Custom label trên đầu cột
function renderTopLabel(props) {
  const { x, y, width, value } = props
  return (
    <text
      x={x + width / 2}
      y={y - 8}
      fill="#94A3B8"
      textAnchor="middle"
      fontSize={12}
      fontWeight={600}
    >
      {value}
    </text>
  )
}

export default function SeverityBarChart({ data, title = 'Phân bố theo mức độ nghiêm trọng' }) {
  return (
    <div className="rounded-2xl p-5 lg:p-6 bg-[#131C31]/80 border border-white/[0.06] backdrop-blur-sm h-full flex flex-col justify-between">
      <h3 className="text-sm font-semibold text-slate-200 mb-2">{title}</h3>

      <div className="flex-1 w-full pt-2">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={data}
            margin={{ top: 25, right: 15, left: -15, bottom: 5 }}
            barCategoryGap="20%"
          >
            {/* Grid nền mờ */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(148, 163, 184, 0.08)"
              vertical={false}
            />

            {/* Trục X - Tên mức độ */}
            <XAxis
              dataKey="name"
              tick={{ fill: '#CBD5E1', fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: 'rgba(148, 163, 184, 0.12)' }}
              tickLine={false}
            />

            {/* Trục Y - Số lượng */}
            <YAxis
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

            {/* Cột biểu đồ với bo tròn */}
            <Bar
              dataKey="value"
              radius={[8, 8, 0, 0]}
              maxBarSize={64}
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              <LabelList dataKey="value" content={renderTopLabel} />
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.color}
                  className="hover:opacity-85 transition-opacity cursor-pointer"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
