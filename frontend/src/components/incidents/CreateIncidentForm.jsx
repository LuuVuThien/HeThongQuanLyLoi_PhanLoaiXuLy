/**
 * ============================================
 * CREATE INCIDENT FORM COMPONENT
 * Form tạo báo cáo lỗi mới (dành cho Tester)
 * Validation: React Hook Form + Yup
 * ============================================
 * 
 * Lưu ý quan trọng:
 * - Mức độ nghiêm trọng (Severity) sẽ do Backend AI tự động gán
 *   dựa trên mô tả của Tester, nên KHÔNG hiển thị trên form
 * - File đính kèm là tùy chọn (optional)
 */
import { useForm, useWatch } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Send,
  Paperclip,
  AlertCircle,
  FileText,
  X,
  Sparkles,
  Bot,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { Spinner } from '../common/LoadingSpinner'
import { useProjects, useCreateIncident, useBugClassifier } from '../../hooks/useIncidents'
import { SEVERITY_OPTIONS } from '../../data/mockData'
import { toast } from 'react-toastify'
import { useState } from 'react'

// ============================================
// SCHEMA VALIDATION (Yup)
// ============================================
const incidentSchema = yup.object().shape({
  project_id: yup.string().required('Vui lòng chọn dự án'),
  title: yup
    .string()
    .required('Vui lòng nhập tiêu đề lỗi')
    .min(10, 'Tiêu đề phải có ít nhất 10 ký tự')
    .max(100, 'Tiêu đề không được vượt quá 100 ký tự'),
  description: yup
    .string()
    .required('Vui lòng nhập mô tả chi tiết')
    .min(20, 'Mô tả phải có ít nhất 20 ký tự để AI có thể phân tích chính xác'),
})

export default function CreateIncidentForm({ onSuccess }) {
  const [attachedFiles, setAttachedFiles] = useState([])
  const [customSeverity, setCustomSeverity] = useState(null)

  // Hook lấy danh sách dự án
  const { data: projects = [], isLoading: projectsLoading } = useProjects()

  // Hook tạo sự cố mới
  const createMutation = useCreateIncident()

  // Khởi tạo React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(incidentSchema),
    defaultValues: {
      project_id: '',
      title: '',
      description: '',
    },
  })

  const titleValue = useWatch({ control, name: 'title', defaultValue: '' })
  const descValue = useWatch({ control, name: 'description', defaultValue: '' })

  // AI Scanner Hook: Phân tích ngữ nghĩa thời gian thực
  const { classification, isAnalyzing } = useBugClassifier(titleValue, descValue)

  // Mức độ được chọn: ưu tiên can thiệp thủ công, nếu không thì dùng gợi ý AI, mặc định là 'medium'
  const selectedSeverity = customSeverity || classification?.severity || 'medium'
  const isManualOverride = customSeverity !== null

  // Xử lý khi Tester click chọn mức độ thủ công
  const handleSelectSeverity = (severityValue) => {
    setCustomSeverity(severityValue)
  }

  // Khôi phục theo gợi ý của AI
  const handleApplyAISuggestion = () => {
    setCustomSeverity(null)
    if (classification?.label) {
      toast.info(`✨ Đã áp dụng lại phân loại AI: ${classification.label}`)
    }
  }

  // ============================================
  // XỬ LÝ FILE ĐÍNH KÈM
  // ============================================
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter((f) => f.size <= 10 * 1024 * 1024)
    if (validFiles.length < files.length) {
      toast.warning('Một số file vượt quá 10MB đã bị bỏ qua')
    }
    setAttachedFiles((prev) => [...prev, ...validFiles].slice(0, 5))
    e.target.value = ''
  }

  const removeFile = (index) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // ============================================
  // XỬ LÝ SUBMIT FORM
  // ============================================
  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        severity: selectedSeverity,
        attachments: attachedFiles.map((f) => f.name),
      }

      await createMutation.mutateAsync(payload)

      toast.success('🎉 Báo cáo sự cố đã được tạo và lưu thành công!')
      reset()
      setAttachedFiles([])
      setCustomSeverity(null)
      onSuccess?.()
    } catch {
      toast.error('❌ Có lỗi xảy ra khi tạo báo cáo. Vui lòng thử lại!')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ====== CHỌN DỰ ÁN ====== */}
      <div className="space-y-2">
        <label htmlFor="project_id" className="block text-sm font-medium text-slate-300">
          Dự án <span className="text-red-400">*</span>
        </label>
        <select
          id="project_id"
          {...register('project_id')}
          disabled={projectsLoading}
          className={`w-full bg-[var(--bg-input)] border rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-colors appearance-none cursor-pointer ${errors.project_id
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-white/10 focus:border-indigo-500/50'
            }`}
        >
          <option value="">-- Chọn dự án --</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.code}] {p.name}
            </option>
          ))}
        </select>
        {errors.project_id && (
          <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
            <AlertCircle size={12} />
            {errors.project_id.message}
          </p>
        )}
      </div>

      {/* ====== TIÊU ĐỀ LỖI ====== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="title" className="block text-sm font-medium text-slate-300">
            Tiêu đề lỗi <span className="text-red-400">*</span>
          </label>
          <span className={`text-xs ${titleValue.length > 100 ? 'text-red-400' : 'text-slate-500'}`}>
            {titleValue.length}/100
          </span>
        </div>
        <input
          id="title"
          type="text"
          {...register('title')}
          placeholder="Mô tả ngắn gọn lỗi gặp phải (VD: Lỗi thanh toán không trừ tiền khi dùng Momo)"
          className={`w-full bg-[var(--bg-input)] border rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder-slate-600 ${errors.title
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-white/10 focus:border-indigo-500/50'
            }`}
        />
        {errors.title && (
          <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
            <AlertCircle size={12} />
            {errors.title.message}
          </p>
        )}
      </div>

      {/* ====== MÔ TẢ CHI TIẾT ====== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="description" className="block text-sm font-medium text-slate-300">
            Mô tả chi tiết / Các bước tái hiện <span className="text-red-400">*</span>
          </label>
          <span className={`text-xs ${descValue.length > 0 && descValue.length < 20 ? 'text-red-400' : 'text-slate-500'}`}>
            {descValue.length} ký tự
          </span>
        </div>
        <textarea
          id="description"
          {...register('description')}
          rows={5}
          placeholder={`Mô tả chi tiết lỗi và các bước tái hiện:\n1. Vào trang thanh toán giỏ hàng...\n2. Chọn cổng thanh toán Momo...\n3. Bấm xác nhận chuyển khoản...\n4. Kết quả mong đợi vs thực tế...`}
          className={`w-full bg-[var(--bg-input)] border rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder-slate-600 resize-y min-h-[120px] ${errors.description
              ? 'border-red-500/50 focus:border-red-500'
              : 'border-white/10 focus:border-indigo-500/50'
            }`}
        />
        {errors.description && (
          <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
            <AlertCircle size={12} />
            {errors.description.message}
          </p>
        )}
      </div>

      {/* ====== ✨ TÍNH NĂNG NGÔI SAO: AI AUTO-CLASSIFICATION WIDGET ====== */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-[#131C31] border border-indigo-500/25 relative overflow-hidden transition-all duration-300">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
              <Bot size={16} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                AI Phân tích & Gợi ý mức độ nghiêm trọng
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30 uppercase tracking-wider">
                  Realtime
                </span>
              </h4>
            </div>
          </div>

          {/* Trạng thái quét */}
          {isAnalyzing ? (
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 animate-pulse">
              <Sparkles size={12} className="animate-spin" />
              <span>Đang phân tích...</span>
            </div>
          ) : classification ? (
            <div className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 size={13} />
              <span>Độ tin cậy: {classification.confidence}%</span>
            </div>
          ) : null}
        </div>

        {/* Nội dung kết quả phân tích AI */}
        {classification ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-black/25 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Mức độ đề xuất:</span>
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: `${classification.color}25`,
                      color: classification.color,
                      border: `1px solid ${classification.color}40`,
                    }}
                  >
                    <Zap size={12} />
                    {classification.label}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {classification.reason}
                </p>
              </div>

              {isManualOverride && (
                <button
                  type="button"
                  onClick={handleApplyAISuggestion}
                  className="sm:self-center px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold border border-indigo-500/30 transition-colors whitespace-nowrap"
                >
                  Áp dụng lại gợi ý AI
                </button>
              )}
            </div>

            {/* Từ khóa đã nhận diện */}
            {classification.keywords?.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
                <span className="text-[11px] text-slate-500">Từ khóa kích hoạt:</span>
                {classification.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-white/5 text-slate-300 font-mono text-[11px] border border-white/10"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            💡 Nhập tiêu đề và ít nhất 15 ký tự mô tả để hệ thống tự động nhận diện từ khóa và đề xuất mức độ nghiêm trọng chuẩn xác.
          </p>
        )}
      </div>

      {/* ====== CHỌN MỨC ĐỘ NGHIÊM TRỌNG (Tester có thể can thiệp) ====== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-300">
            Xác nhận Mức độ nghiêm trọng (Severity)
          </label>
          {isManualOverride && (
            <span className="text-xs text-amber-400 font-medium">
              (Đã điều chỉnh thủ công)
            </span>
          )}
        </div>

        {/* 4 Lựa chọn mức độ với UI pill cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {SEVERITY_OPTIONS.map((opt) => {
            const isSelected = selectedSeverity === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelectSeverity(opt.value)}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer ${isSelected
                    ? 'ring-2 shadow-lg'
                    : 'bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                  }`}
                style={
                  isSelected
                    ? {
                      backgroundColor: `${opt.color}20`,
                      borderColor: `${opt.color}60`,
                      color: opt.color,
                      boxShadow: `0 0 15px ${opt.color}25`,
                    }
                    : {}
                }
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: opt.color }}
                />
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ====== FILE ĐÍNH KÈM ====== */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">
          File đính kèm <span className="text-slate-500 font-normal">(tùy chọn, tối đa 5 file, mỗi file ≤ 10MB)</span>
        </label>

        <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/10 hover:border-white/20 transition-colors cursor-pointer">
          <Paperclip size={16} />
          Chọn file
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.log,.csv,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {attachedFiles.length > 0 && (
          <div className="space-y-2">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5 animate-fade-in"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className="text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-300 truncate">{file.name}</span>
                  <span className="text-xs text-slate-600 shrink-0">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ====== NÚT SUBMIT ====== */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || createMutation.isPending}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200
            ${isSubmitting || createMutation.isPending
              ? 'bg-indigo-500/30 text-indigo-300/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]'
            }
          `}
        >
          {isSubmitting || createMutation.isPending ? (
            <>
              <Spinner size={16} className="text-indigo-300" />
              Đang xử lý...
            </>
          ) : (
            <>
              <Send size={16} />
              Gửi báo cáo lỗi
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            reset()
            setAttachedFiles([])
            setCustomSeverity(null)
          }}
          className="px-5 py-3 rounded-xl text-sm font-medium text-slate-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          Đặt lại
        </button>
      </div>
    </form>
  )
}
