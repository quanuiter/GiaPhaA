import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@xyflow/react/dist/style.css'
import ProtectedRoute   from './components/ProtectedRoute'
import TreeRoute        from './components/TreeRoute'
import Layout           from './components/Layout'
import LoginPage        from './pages/LoginPage'
import TreeSelectPage   from './pages/TreeSelectPage'
import DashboardPage    from './pages/DashboardPage'
import MembersPage      from './pages/MembersPage'
import MemberDetailPage from './pages/MemberDetailPage'
import MemberFormPage   from './pages/MemberFormPage'
import TreePage         from './pages/TreePage'
import EventsPage       from './pages/EventsPage'
import ReportsPage      from './pages/ReportsPage'
import AdminPage        from './pages/AdminPage'
const qc = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Đã login nhưng chưa chọn cây */}
          <Route element={<ProtectedRoute />}>
            <Route path="/trees" element={<TreeSelectPage />} />
          </Route>

          {/* Đã login VÀ đã chọn cây */}
          <Route element={<ProtectedRoute />}>
            <Route element={<TreeRoute />}>
              <Route element={<Layout />}>
                <Route path="/"          element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/members"   element={<MembersPage />} />
                <Route path="/members/new"      element={<MemberFormPage />} />
                <Route path="/members/:id/edit" element={<MemberFormPage />} />
                <Route path="/members/:id"      element={<MemberDetailPage />} />
                <Route path="/tree"      element={<TreePage />} />
                <Route path="/events"    element={<EventsPage />} />
                <Route path="/reports"   element={<ReportsPage />} />
                <Route path="/admin"     element={<AdminPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
