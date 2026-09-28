/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { loginUser, logoutUser, getCurrentUser } from '../services/api'
import { toast } from 'react-toastify'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('current_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [isLoading, setIsLoading] = useState(true)

  // Kiểm tra token khi ứng dụng khởi động
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('access_token')
      if (storedToken) {
        try {
          const profile = await getCurrentUser()
          setUser(profile)
        } catch {
          // Token hết hạn hoặc không hợp lệ -> xóa sạch
          localStorage.removeItem('access_token')
          localStorage.removeItem('current_user')
          setUser(null)
          setToken(null)
        }
      }
      setIsLoading(false)
    }

    verifySession()
  }, [])

  // Đăng nhập
  const login = async (credentials) => {
    try {
      const data = await loginUser(credentials)
      setUser(data.user)
      setToken(data.access_token)
      toast.success(`👋 Xin chào ${data.user.username}! Đăng nhập thành công.`)
      return { success: true, user: data.user }
    } catch (err) {
      const message = err.response?.data?.detail || 'Email hoặc mật khẩu không chính xác'
      toast.error(`❌ ${message}`)
      return { success: false, error: message }
    }
  }

  // Đăng xuất
  const logout = async () => {
    await logoutUser()
    setUser(null)
    setToken(null)
    toast.info('🔒 Đã đăng xuất an toàn khỏi hệ thống')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider')
  }
  return context
}
