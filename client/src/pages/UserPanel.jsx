import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function UserPanel() {
  const { user, authHeaders } = useAuth()
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarPanel = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/panel/usuario`, {
          headers: authHeaders,
        })
        setMensaje(data.mensaje)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el panel de usuario')
      }
    }
    cargarPanel()
  }, [authHeaders])

  return (
    <section className="panel panel-page page-shell">
      <div className="panel-hero">
        <div className="user-avatar lg">{user?.nombre?.[0]?.toUpperCase() || '?'}</div>
        <div>
          <h2>{user?.nombre}</h2>
          <p className="text-muted">{user?.email}</p>
          <Link className="link" to="/mi-panel/perfil">Editar mi cuenta →</Link>
        </div>
      </div>

      {mensaje && <p className="status loading">{mensaje}</p>}
      {error && <p className="status error">{error}</p>}

      <div className="panel-section">
        <div className="panel-actions">
          <Link className="action-card" to="/">
            <span className="action-icon">🗂️</span>
            <span>Ver catálogo</span>
          </Link>
          <Link className="action-card" to="/carrito">
            <span className="action-icon">🛒</span>
            <span>Mi carrito</span>
          </Link>
          <Link className="action-card" to="/mi-panel/perfil">
            <span className="action-icon">👤</span>
            <span>Mi cuenta</span>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default UserPanel
