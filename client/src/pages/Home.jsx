import { Link } from 'react-router-dom'
import Productos from './Productos.jsx'

function Home() {
  return (
    <>
      <section className="panel">
        <h2>Inicio</h2>
        <p>Bienvenido al sistema de inventarios.</p>
        <p>
          Desde aqui puedes consultar productos y acceder a tu <Link className="link" to="/mi-panel">panel</Link>.
        </p>
      </section>
      <Productos />
    </>
  )
}

export default Home
