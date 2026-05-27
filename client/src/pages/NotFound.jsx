import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="panel">
      <div className="empty-state">
        <div className="empty-icon" style={{ fontSize: '3rem' }}>🌫️</div>
        <p className="empty-title">404 — Página no encontrada</p>
        <p className="empty-sub">La ruta que buscas no existe.</p>
        <Link className="btn-primary-sm" to="/">Volver al inicio</Link>
      </div>
    </section>
  )
}

export default NotFound
