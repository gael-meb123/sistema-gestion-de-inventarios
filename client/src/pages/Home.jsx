import { Link } from 'react-router-dom'
import Productos from './Productos.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

function Home() {
  const { user } = useAuth()
  const { items, subtotal } = useCart()

  return (
    <>
      {!user && (
        <div className="hero-banner">
          <div className="hero-content">
            <h1 className="hero-title">Sistema de Inventarios</h1>
            <p className="hero-sub">Gestiona productos, pedidos y stock en un solo lugar.</p>
            <div className="hero-actions">
              <Link className="btn-primary" to="/login">Iniciar sesión</Link>
              <Link className="btn-ghost" to="/registro">Crear cuenta</Link>
            </div>
          </div>
        </div>
      )}

      <div className="two-column">
        <aside className="left-panel">
          <div className="panel sidebar-card">
            {user ? (
              <div className="user-greeting">
                <div className="user-avatar">{user.nombre?.[0]?.toUpperCase() || '?'}</div>
                <div>
                  <p className="user-name">{user.nombre}</p>
                  <Link className="link" to="/mi-panel">Ver mi panel →</Link>
                </div>
              </div>
            ) : (
              <div className="sidebar-auth">
                <p className="sidebar-auth-label">Accede a tu cuenta</p>
                <div className="sidebar-auth-btns">
                  <Link className="btn-primary-sm" to="/login">Login</Link>
                  <Link className="btn-ghost-sm" to="/registro">Registro</Link>
                </div>
              </div>
            )}
          </div>

          <div className="panel sidebar-card">
            <h4 className="sidebar-section-title">🛒 Carrito</h4>
            {items.length === 0 ? (
              <p className="sidebar-empty">Tu carrito está vacío</p>
            ) : (
              <>
                <ul className="mini-cart-list">
                  {items.slice(0, 4).map(i => (
                    <li key={i.id} className="mini-cart-item">
                      <span className="mini-cart-name">{i.nombre}</span>
                      <span className="mini-cart-qty">×{i.cantidad}</span>
                      <span className="mini-cart-price">${(i.precio * i.cantidad).toFixed(2)}</span>
                    </li>
                  ))}
                  {items.length > 4 && (
                    <li className="mini-cart-more">+{items.length - 4} más</li>
                  )}
                </ul>
                <div className="mini-cart-total">
                  <span>Total</span>
                  <strong>${subtotal.toFixed(2)}</strong>
                </div>
                <Link className="btn-primary-sm block-btn" to="/carrito">Ver carrito</Link>
              </>
            )}
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
