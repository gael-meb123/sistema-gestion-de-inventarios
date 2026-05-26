import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, authLoading } = useAuth()

  if (authLoading) {
    return (
      <section className="panel">
        <p className="status loading">Validando sesion...</p>
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.rol)) {
    return <Navigate to="/mi-panel" replace />
  }

  return children
}

export default ProtectedRoute
