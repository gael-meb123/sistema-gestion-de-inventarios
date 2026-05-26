import { Link } from 'react-router-dom'

function Home() {
  return (
    <section className="panel">
      <h2>Inicio</h2>
      <p>Frontend inicializado con React Router para el sistema de inventarios.</p>
      <p>
        Ve al panel de <Link className="link" to="/productos">productos</Link> para consultar datos del servidor.
      </p>
    </section>
  )
}

export default Home
