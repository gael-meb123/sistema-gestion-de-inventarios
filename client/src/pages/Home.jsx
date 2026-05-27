import { Link } from 'react-router-dom'
import Productos from './Productos.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

function Home() {
  const { user } = useAuth()
  const { items, subtotal } = useCart()

  return (
    <>
      <section className="panel">
        <h2>Inicio</h2>
        <p>Bienvenido al sistema de inventarios.</p>
        <p>
          Desde aqui puedes consultar productos y acceder a tu <Link className="link" to="/mi-panel">panel</Link>.
        </p>
      </section>

      <div className="two-column">
        <aside className="left-panel panel">
          <div className="register-orders">
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <button className="secondary-btn">Register</button>
              <button className="secondary-btn">Orders</button>
              <div className="badge">1001</div>
            </div>
            {!user && (
              <div>
                <p>Inicia sesión para guardar tu carrito</p>
                <Link className="link" to="/login">Login</Link>
              </div>
            )}
          </div>

          <div className="mini-cart">
            <h4>Carrito</h4>
            {items.length === 0 && <p>Carrito vacío</p>}
            {items.length > 0 && (
              <ul className="carrito-lista">
                {items.map(i => (
                  <li key={i.id} className="carrito-item">
                    <div className="carrito-item-info">
                      <strong>{i.nombre}</strong>
                      <p>${i.precio.toFixed(2)}</p>
                    </div>
                    <div className="carrito-subtotal">{i.cantidad}</div>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: 8 }}>
              <strong>Total: ${subtotal.toFixed(2)}</strong>
            </div>
          </div>
        </aside>

        <main className="right-panel">
          <Productos />
        </main>
      </div>
    </>
  )
}

export default Home
