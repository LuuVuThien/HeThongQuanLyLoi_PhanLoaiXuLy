/**
 * ============================================
 * ERROR MESSAGE COMPONENT
 * Hiển thị thông báo lỗi thân thiện khi API thất bại
 * Có nút "Thử lại" để retry
 * ============================================
 */
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorMessage({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 animate-fade-in">
      {/* Icon lỗi với hiệu ứng pulse */}
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertCircle size={32} className="text-red-400" />
      </div>

      {/* Nội dung lỗi */}
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-lg font-semibold text-slate-200">
          Không thể tải dữ liệu
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {message || 'Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'}
        </p>
      </div>

      {/* Nút thử lại */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30 hover:border-indigo-500/40 transition-all duration-200 text-sm font-medium"
        >
          <RefreshCw size={16} />
          Thử lại
        </button>
      )}
    </div>
  )
}
