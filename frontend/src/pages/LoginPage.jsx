import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ShieldCheck, Lock, Mail, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react'
import { Spinner } from '../components/common/LoadingSpinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [errors, setErrors] = useState({ email: '', password: '' })
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Kiểm tra validation trực quan
    const newErrors = { email: '', password: '' }
    let hasError = false
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email hoặc tên đăng nhập'
      hasError = true
    }
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
      hasError = true
    }

    if (hasError) {
      setErrors(newErrors)
      return
    }

    setErrors({ email: '', password: '' })
    setIsSubmitting(true)
    const result = await login({ email: email.trim(), password })
    setIsSubmitting(false)

    if (result.success) {
      navigate(from, { replace: true })
    }
  }

  const handleForgotPassword = async () => {
    const emailPrompt = window.prompt("Nhập email đăng ký của bạn để lấy mật khẩu mới:")
    if (!emailPrompt) return;
    
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: emailPrompt.trim() })
      })
      
      const data = await response.json()
      if (response.ok && data.success) {
        window.alert(`Cấp lại thành công! Mật khẩu mới của bạn là: ${data.new_password}`)
      } else {
        window.alert(`Lỗi: ${data.detail || data.message || "Không thể cấp lại mật khẩu"}`)
      }
    } catch (error) {
      window.alert("Lỗi kết nối tới máy chủ.")
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/15 to-pink-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/25 mb-2">
            <ShieldCheck size={30} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Incident Management System
          </h1>
          <p className="text-xs text-slate-400">
            Hệ thống phân loại sự cố thông minh & Quản trị lỗi phần mềm
          </p>
        </div>

        {/* Card Form Đăng nhập */}
        <div className="rounded-3xl p-7 bg-[#131C31]/90 border border-white/10 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-base font-bold text-white">Đăng nhập tài khoản</h2>
              <p className="text-xs text-slate-400 mt-0.5">Sử dụng thông tin định danh của bạn</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
              <CheckCircle2 size={12} />
              <span>Bảo mật SSL/TLS</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Input Email / Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Email hoặc Tên đăng nhập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  id="email-input"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                  }}
                  placeholder="admin@company.com"
                  className={`w-full bg-black/40 border rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 ${
                    errors.email ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-[11px] text-rose-400 flex items-center gap-1">
                  <span>⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Input Mật khẩu */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Mật khẩu</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-black/40 border rounded-xl pl-10 pr-11 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 ${
                    errors.password ? 'border-rose-500 bg-rose-500/5' : 'border-white/10 focus:border-indigo-500'
                  }`}
                />
                <button
                  id="toggle-password-btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-[11px] text-rose-400 flex items-center gap-1">
                  <span>⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white font-bold text-sm hover:opacity-95 hover:shadow-lg shadow-indigo-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Spinner size={16} className="text-white" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập hệ thống</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
