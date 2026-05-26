import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function UserPanel() {
  const { token, user } = useAuth()
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarPanel = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/panel/usuario`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setMensaje(data.mensaje)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el panel de usuario')
      }
    }

    cargarPanel()
  }, [token])

  return (
    <section className="panel">
      <h2>Panel de usuario</h2>
      <p>Usuario: {user?.nombre} ({user?.email})</p>
      {mensaje && <p className="status loading">{mensaje}</p>}
      {error && <p className="status error">{error}</p>}
      <p>
        Puedes navegar al listado de <Link className="link" to="/productos">productos</Link>.
      </p>
    </section>
  )
}

export default UserPanel
