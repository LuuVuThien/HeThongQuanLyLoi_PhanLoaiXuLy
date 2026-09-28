/**
 * ============================================
 * INCIDENT DETAIL PAGE
 * Trang xem chi tiết sự cố và thực hiện chuyển trạng thái (Activity Workflow)
 * Phục vụ Developer nhận việc, Tester nghiệm thu/đóng lỗi
 * ============================================
 */
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  User,
  FolderOpen,
  CheckCircle,
  Play,
  RotateCcw,
  Trash2,
  FileText,
  Calendar,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'
import { useIncident, useUpdateIncident, useDeleteIncident, useUsers } from '../hooks/useIncidents'
import { STATUS_OPTIONS, SEVERITY_OPTIONS } from '../data/mockData'
import { toast } from 'react-toastify'
import { Spinner } from '../components/common/LoadingSpinner'
import ErrorMessage from '../components/common/ErrorMessage'

export default function IncidentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Lấy chi tiết sự cố theo ID
  const { data: incident, isLoading, isError, error, refetch } = useIncident(id)

  // Hook cập nhật trạng thái sự cố (PATCH)
  const updateMutation = useUpdateIncident()

  // Hook xóa sự cố (DELETE)
  const deleteMutation = useDeleteIncident()

  // Hook lấy danh sách Users
  const { data: users = [] } = useUsers()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Spinner size={32} className="text-indigo-400" />
        <p className="text-sm text-slate-400">Đang tải thông tin sự cố #{id}...</p>
      </div>
    )
  }

  if (isError || !incident) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorMessage
          message={error?.message || 'Không tìm thấy thông tin sự cố'}
          onRetry={refetch}
        />
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/incidents')}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-slate-300 transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    )
  }

  // Tìm thông tin hiển thị trạng thái và mức độ
  const statusInfo = STATUS_OPTIONS.find((s) => s.value === incident.status) || STATUS_OPTIONS[0]
  const severityInfo = SEVERITY_OPTIONS.find((s) => s.value === incident.severity) || SEVERITY_OPTIONS[1]

  // ============================================
  // CÁC HÀM XỬ LÝ CHUYỂN TRẠNG THÁI (WORKFLOW)
  // ============================================

  // 1. Dev nhận lỗi: new -> in_progress
  const handleAssignToMeAndStart = async () => {
    try {
      await updateMutation.mutateAsync({
        id: incident.id,
        data: {
          status: 'in_progress',
          assignee: { id: 4, name: 'Phạm Minh Đức', role: 'developer' }, // Dev hiện tại
        },
      })
      toast.success('⚡ Đã nhận sự cố! Trạng thái chuyển thành "Đang xử lý"')
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }

  // 2. Dev sửa xong: in_progress -> resolved
  const handleMarkResolved = async () => {
    try {
      await updateMutation.mutateAsync({
        id: incident.id,
        data: { status: 'resolved' },
      })
      toast.success('🎉 Đã đánh dấu sự cố là "Đã sửa"! Đang chờ Tester kiểm tra lại.')
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }

  // 3. Tester test lại đạt: resolved -> closed
  const handleCloseIncident = async () => {
    try {
      await updateMutation.mutateAsync({
        id: incident.id,
        data: { status: 'closed' },
      })
      toast.success('🔒 Đã nghiệm thu và ĐÓNG sự cố thành công!')
    } catch {
      toast.error('Có lỗi xảy ra khi đóng sự cố')
    }
  }

  // 4. Tester test lại không đạt: resolved/closed -> in_progress (Re-open)
  const handleReopenIncident = async () => {
    try {
      await updateMutation.mutateAsync({
        id: incident.id,
        data: { status: 'in_progress' },
      })
      toast.warning('🔄 Đã mở lại sự cố (Re-open) để Developer tiếp tục sửa.')
    } catch {
      toast.error('Có lỗi xảy ra khi mở lại sự cố')
    }
  }

  // 5. Gán người xử lý (Assignee)
  const handleAssigneeChange = async (userId) => {
    try {
      const selectedUser = users.find((u) => u.id === Number(userId)) || null
      await updateMutation.mutateAsync({
        id: incident.id,
        data: { assignee: selectedUser },
      })
      toast.success(
        selectedUser
          ? `Đã phân công sự cố cho ${selectedUser.name}`
          : 'Đã hủy phân công'
      )
    } catch {
      toast.error('Có lỗi xảy ra khi gán người xử lý')
    }
  }

  // Xóa sự cố
  const handleDelete = async () => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa sự cố #${incident.id}?`)) {
      try {
        await deleteMutation.mutateAsync(incident.id)
        toast.success(`Đã xóa sự cố #${incident.id}`)
        navigate('/incidents')
      } catch {
        toast.error('Có lỗi xảy ra khi xóa sự cố')
      }
    }
  }

  // Format ngày
  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* ====== THANH ĐIỀU HƯỚNG TRÊN CÙNG ====== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors"
            title="Quay lại"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                #{incident.id.toString().padStart(3, '0')}
              </span>
              <span className="text-xs text-slate-400">{incident.project?.name}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {incident.title}
            </h1>
          </div>
        </div>

        {/* Nút xóa */}
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
        >
          <Trash2 size={14} />
          Xóa sự cố
        </button>
      </div>

      {/* ====== THANH ĐIỀU KHIỂN HÀNH ĐỘNG (ACTION WORKFLOW BAR) ====== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-indigo-950/40 to-slate-900/90 border border-indigo-500/20 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">Trạng thái hiện tại:</div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm"
            style={{
              color: statusInfo.color,
              backgroundColor: `${statusInfo.color}20`,
              borderColor: `${statusInfo.color}40`,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: statusInfo.color }} />
            {statusInfo.label}
          </span>

          <span
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold"
            style={{
              color: severityInfo.color,
              backgroundColor: `${severityInfo.color}20`,
              border: `1px solid ${severityInfo.color}40`,
            }}
          >
            <ShieldAlert size={13} />
            {severityInfo.label}
          </span>
        </div>

        {/* CÁC NÚT THAO TÁC THEO VÒNG ĐỜI LỖI */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Khi lỗi Mới (new) -> Developer nhận việc */}
          {incident.status === 'new' && (
            <button
              onClick={handleAssignToMeAndStart}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              {updateMutation.isPending ? <Spinner size={14} /> : <Play size={14} />}
              Nhận việc & Bắt đầu sửa (In Progress)
            </button>
          )}

          {/* Khi đang xử lý (in_progress) -> Developer sửa xong */}
          {incident.status === 'in_progress' && (
            <button
              onClick={handleMarkResolved}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
            >
              {updateMutation.isPending ? <Spinner size={14} /> : <CheckCircle size={14} />}
              Đã sửa xong (Resolved)
            </button>
          )}

          {/* Khi đã sửa xong (resolved) -> Tester nghiệm thu hoặc Reopen */}
          {incident.status === 'resolved' && (
            <>
              <button
                onClick={handleCloseIncident}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                {updateMutation.isPending ? <Spinner size={14} /> : <CheckCircle size={14} />}
                Nghiệm thu & Đóng sự cố (Closed)
              </button>

              <button
                onClick={handleReopenIncident}
                disabled={updateMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold text-xs hover:bg-rose-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <RotateCcw size={14} />
                Lỗi vẫn còn (Re-open)
              </button>
            </>
          )}

          {/* Khi đã đóng (closed) -> Cho phép mở lại nếu lỗi tái phát sinh */}
          {incident.status === 'closed' && (
            <button
              onClick={handleReopenIncident}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-medium text-xs border border-white/10 transition-colors"
            >
              <RotateCcw size={14} />
              Mở lại sự cố
            </button>
          )}
        </div>
      </div>

      {/* ====== NỘI DUNG CHÍNH (2 CỘT) ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI (2/3): Mô tả chi tiết, File đính kèm */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Mô tả */}
          <div className="p-6 rounded-2xl bg-[#131C31]/90 border border-white/[0.08] backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-indigo-400" />
              Mô tả chi tiết & Bước tái hiện
            </h3>

            <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              {incident.description}
            </div>

            {/* AI Insight Badge */}
            <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 flex items-start gap-2.5">
              <Sparkles size={16} className="text-indigo-400 shrink-0 mt-0.5" />
              <div className="text-xs text-indigo-300/90 leading-relaxed">
                <span className="font-semibold text-white">AI Classification Summary:</span> Sự cố được hệ thống tự động phân loại mức độ{' '}
                <span className="font-bold underline" style={{ color: severityInfo.color }}>
                  {severityInfo.label}
                </span>{' '}
                dựa trên từ khóa ngữ cảnh và phân tích mức độ tác động rủi ro.
              </div>
            </div>
          </div>

          {/* Card File đính kèm */}
          <div className="p-6 rounded-2xl bg-[#131C31]/90 border border-white/[0.08] backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              File đính kèm ({incident.attachments?.length || 0})
            </h3>

            {incident.attachments && incident.attachments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {incident.attachments.map((file, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3 hover:bg-white/[0.06] transition-colors"
                  >
                    <FileText size={18} className="text-indigo-400 shrink-0" />
                    <span className="text-xs text-slate-200 font-medium truncate">{file}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Không có file đính kèm nào.</p>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (1/3): Metadata, Người phụ trách, Lịch sử */}
        <div className="space-y-6">
          {/* Card Thông tin sự cố */}
          <div className="p-6 rounded-2xl bg-[#131C31]/90 border border-white/[0.08] backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Thông tin sự cố
            </h3>

            <div className="space-y-3.5 text-xs">
              {/* Dự án */}
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FolderOpen size={14} /> Dự án:
                </span>
                <span className="font-semibold text-slate-200">
                  {incident.project?.name || '—'}
                </span>
              </div>

              {/* Người báo cáo */}
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User size={14} /> Người báo cáo:
                </span>
                <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] text-white">
                    {incident.reporter?.name?.charAt(0) || 'U'}
                  </div>
                  <span>{incident.reporter?.name || 'Chưa rõ'}</span>
                </div>
              </div>

              {/* Người xử lý */}
              <div className="py-2 border-b border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <User size={14} /> Người xử lý:
                  </span>
                  {incident.assignee && (
                    <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white">
                        {incident.assignee.name.charAt(0)}
                      </div>
                      <span>{incident.assignee.name}</span>
                    </div>
                  )}
                </div>

                <select
                  value={incident.assignee?.id || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  disabled={updateMutation.isPending}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-indigo-500/50 cursor-pointer"
                >
                  <option value="">-- Chưa gán người xử lý --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Ngày tạo */}
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar size={14} /> Ngày tạo:
                </span>
                <span className="text-slate-300 font-mono">
                  {formatDate(incident.created_at)}
                </span>
              </div>

              {/* Cập nhật lần cuối */}
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock size={14} /> Cập nhật cuối:
                </span>
                <span className="text-slate-300 font-mono">
                  {formatDate(incident.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick link đến các sự cố khác */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <Link
              to="/incidents"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              ← Xem toàn bộ danh sách sự cố
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
