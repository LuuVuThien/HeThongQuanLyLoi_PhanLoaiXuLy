/**
 * ============================================
 * CREATE INCIDENT PAGE
 * Trang tạo báo cáo lỗi mới (dành cho Tester)
 * Sử dụng CreateIncidentForm component
 * ============================================
 */
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileWarning } from 'lucide-react'
import CreateIncidentForm from '../components/incidents/CreateIncidentForm'

export default function CreateIncidentPage() {
  const navigate = useNavigate()

  // Callback khi tạo sự cố thành công -> chuyển về danh sách
  const handleSuccess = () => {
    // Delay ngắn để user thấy toast thành công
    setTimeout(() => {
      navigate('/incidents')
    }, 1500)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* ====== HEADER ====== */}
      <div className="flex items-center gap-4">
        {/* Nút quay lại */}
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Báo cáo lỗi mới</h1>
          <p className="text-sm text-slate-400 mt-1">
            Điền thông tin chi tiết để hệ thống AI tự động phân loại mức độ nghiêm trọng
          </p>
        </div>
      </div>

      {/* ====== FORM CARD ====== */}
      <div className="rounded-2xl p-6 lg:p-8 bg-slate-800/30 border border-white/5 backdrop-blur-sm">
        {/* Thông báo về AI phân loại */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 mb-8">
          <FileWarning size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Phân loại tự động bằng AI</p>
            <p className="text-xs text-amber-200/60 mt-1 leading-relaxed">
              Mức độ nghiêm trọng (Severity) sẽ được hệ thống AI tự động gán dựa trên mô tả của bạn.
              Hãy mô tả lỗi càng chi tiết càng tốt để đảm bảo phân loại chính xác.
            </p>
          </div>
        </div>

        {/* Form nhập liệu */}
        <CreateIncidentForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
