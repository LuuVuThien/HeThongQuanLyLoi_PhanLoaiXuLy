/**
 * ============================================
 * PROJECTS PAGE
 * Quản lý danh sách dự án trong hệ thống
 * ============================================
 */
import { useState } from 'react'
import { FolderOpen, Plus, Bug, CheckCircle, Clock, X } from 'lucide-react'
import { useProjects, useIncidents, useCreateProject } from '../hooks/useIncidents'
import { Spinner } from '../components/common/LoadingSpinner'
import { toast } from 'react-toastify'

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects()
  const { data: incidentsData } = useIncidents({ pageSize: 100 })
  const createProjectMutation = useCreateProject()
  const allIncidents = incidentsData?.results || []

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', code: '', description: '' })

  // Đếm số lượng bug theo từng dự án
  const getProjectStats = (projectId) => {
    const projBugs = allIncidents.filter((i) => i.project?.id === projectId)
    return {
      total: projBugs.length,
      open: projBugs.filter((i) => i.status === 'new' || i.status === 'in_progress').length,
      resolved: projBugs.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
    }
  }

  // Thống kê tổng hợp toàn hệ thống
  const totalOpenBugs = allIncidents.filter((i) => i.status === 'new' || i.status === 'in_progress').length
  const totalResolvedBugs = allIncidents.filter((i) => i.status === 'resolved' || i.status === 'closed').length

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProject.name.trim()) {
      toast.warning('Vui lòng nhập tên dự án')
      return
    }

    try {
      await createProjectMutation.mutateAsync(newProject)
      toast.success(`🎉 Đã tạo dự án [${(newProject.code || 'PRJ').toUpperCase()}] ${newProject.name} lưu trực tiếp vào PostgreSQL thành công!`)
      setIsModalOpen(false)
      setNewProject({ name: '', code: '', description: '' })
    } catch (err) {
      console.error('Lỗi khi tạo dự án:', err)
      const msg = err.response?.data?.detail || 'Không thể tạo dự án, vui lòng thử lại!'
      toast.error(typeof msg === 'string' ? msg : 'Lỗi khi tạo dự án trên cơ sở dữ liệu')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Dự án</h1>
          <p className="text-sm text-slate-400 mt-1">
            Theo dõi tiến độ xử lý sự cố và chất lượng phần mềm theo từng dự án
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 active:scale-[0.98] w-fit cursor-pointer"
        >
          <Plus size={18} />
          Tạo dự án mới
        </button>
      </div>

      {/* Thẻ thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#131C31]/90 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FolderOpen size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Tổng số dự án</div>
            <div className="text-lg font-bold text-white">{projects.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#131C31]/90 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Lỗi đang xử lý</div>
            <div className="text-lg font-bold text-amber-300">{totalOpenBugs}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#131C31]/90 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-400">Đã sửa & Đóng</div>
            <div className="text-lg font-bold text-emerald-300">{totalResolvedBugs}</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size={32} className="text-indigo-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const stats = getProjectStats(proj.id)
            return (
              <div
                key={proj.id}
                className="p-6 rounded-2xl bg-[#131C31]/90 border border-white/[0.08] hover:border-indigo-500/30 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {proj.code}
                    </span>
                    <span className="text-xs text-slate-500">ID: #{proj.id}</span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {proj.name}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-white/5 text-center">
                  <div className="p-2 rounded-xl bg-white/[0.02]">
                    <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                      <Bug size={12} /> Tổng
                    </div>
                    <div className="text-base font-bold text-white mt-0.5">{stats.total}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <div className="text-xs text-amber-400">Đang mở</div>
                    <div className="text-base font-bold text-amber-300 mt-0.5">{stats.open}</div>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10">
                    <div className="text-xs text-emerald-400">Đã xong</div>
                    <div className="text-base font-bold text-emerald-300 mt-0.5">{stats.resolved}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL TẠO DỰ ÁN MỚI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-[#131C31] border border-white/10 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderOpen size={18} className="text-indigo-400" />
                Tạo Dự án Mới
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tên dự án</label>
                <input
                  type="text"
                  placeholder="VD: Smart Warehouse Management"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mã dự án (Code)</label>
                <input
                  type="text"
                  placeholder="VD: SWM"
                  maxLength={8}
                  value={newProject.code}
                  onChange={(e) => setNewProject({ ...newProject, code: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 uppercase outline-none focus:border-indigo-500/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Mô tả dự án (Tùy chọn)</label>
                <textarea
                  rows={3}
                  placeholder="Ghi chú mục tiêu, phạm vi hoặc công nghệ sử dụng..."
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500/50 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={createProjectMutation.isPending}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/5 cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold hover:shadow-lg shadow-indigo-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <Spinner size={14} className="text-white" />
                      <span>Đang lưu vào PostgreSQL...</span>
                    </>
                  ) : (
                    <span>Lưu dự án</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
