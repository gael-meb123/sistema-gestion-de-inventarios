import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="panel">
      <h2>404 - Ruta no encontrada</h2>
      <p>La ruta solicitada no existe.</p>
      <p>
        <Link className="link" to="/">Volver al inicio</Link>
      </p>
    </section>
  )
}

export default NotFound
