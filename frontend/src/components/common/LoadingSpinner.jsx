/**
 * ============================================
 * LOADING SPINNER COMPONENT
 * Hiển thị khi đang tải dữ liệu từ API
 * Có 2 mode: spinner nhỏ (inline) và skeleton (full)
 * ============================================
 */

// Spinner xoay tròn - dùng cho nút bấm, inline loading
export function Spinner({ size = 20, className = '' }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-75"
      />
    </svg>
  )
}

// Skeleton loading cho Card thống kê
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-slate-800/50 border border-white/5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 rounded bg-slate-700" />
          <div className="h-8 w-16 rounded bg-slate-700" />
        </div>
        <div className="w-11 h-11 rounded-xl bg-slate-700" />
      </div>
    </div>
  )
}

// Skeleton loading cho bảng dữ liệu
export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="flex gap-4 px-4 py-3">
        {[80, 200, 120, 100, 120, 120, 120].map((w, i) => (
          <div key={i} className="h-4 rounded bg-slate-700" style={{ width: w }} />
        ))}
      </div>
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 px-4 py-4 border-t border-white/5 animate-pulse" style={{ animationDelay: `${rowIdx * 100}ms` }}>
          {[60, 180, 100, 80, 100, 100, 100].map((w, i) => (
            <div key={i} className="h-4 rounded bg-slate-700/60" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  )
}

// Skeleton loading cho biểu đồ
export function ChartSkeleton() {
  return (
    <div className="rounded-2xl p-5 bg-slate-800/30 border border-white/5 animate-pulse">
      <div className="h-5 w-40 rounded bg-slate-700 mb-6" />
      <div className="h-64 rounded-xl bg-slate-700/30 flex items-center justify-center">
        <Spinner size={32} className="text-slate-600" />
      </div>
    </div>
  )
}

// Loading toàn trang
export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
      <p className="text-sm text-slate-400 animate-pulse">Đang tải dữ liệu...</p>
    </div>
  )
}
