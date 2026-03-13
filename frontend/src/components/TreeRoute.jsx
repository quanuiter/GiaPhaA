import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function TreeRoute() {
  const { currentTree } = useAuthStore()
  return currentTree ? <Outlet /> : <Navigate to="/trees" replace />
}