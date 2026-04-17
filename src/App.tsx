import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { NodePage }        from './pages/NodePage'
import { HomePage }        from './pages/HomePage'
import { AdminPage }       from './pages/admin/AdminPage'
import { NodesAdminPage }  from './pages/admin/NodesAdminPage'
import { LoginPage }       from './pages/admin/LoginPage'
import { AuthGuard }       from './components/AuthGuard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"          element={<HomePage />} />
        <Route path="/:nodeId"   element={<NodePage />} />

        {/* Admin login */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Protected admin routes */}
        <Route path="/admin" element={
          <AuthGuard><NodesAdminPage /></AuthGuard>
        } />
        <Route path="/admin/:nodeId" element={
          <AuthGuard><AdminPage /></AuthGuard>
        } />

        {/* Catch-all → home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
