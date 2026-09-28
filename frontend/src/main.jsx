/**
 * ============================================
 * MAIN.JSX - Entry Point
 * Khởi tạo ứng dụng với các Provider:
 * - React Query: Quản lý server state, caching
 * - ToastContainer: Thông báo toast toàn cục
 * ============================================
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import App from './App.jsx'

// Cấu hình React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Số lần retry khi API thất bại
      retry: 2,
      // Thời gian refetch khi window focus lại
      refetchOnWindowFocus: false,
      // Thời gian dữ liệu được coi là "fresh" (không cần refetch)
      staleTime: 60 * 1000, // 1 phút
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Provider cho React Query - quản lý cache & server state */}
    <QueryClientProvider client={queryClient}>
      <App />

      {/* Toast Container - vị trí góc trên bên phải */}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        limit={3}
      />
    </QueryClientProvider>
  </StrictMode>,
)
