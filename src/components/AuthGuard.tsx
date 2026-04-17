import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f111a] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-3xl animate-spin">⏳</div>
          <p className="text-gray-500 text-sm">กำลังตรวจสอบสิทธิ์…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to login, remember where they were trying to go
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
