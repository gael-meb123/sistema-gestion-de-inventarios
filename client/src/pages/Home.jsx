import { Link } from 'react-router-dom'
import Productos from './Productos.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

function MiniCarritoSidebar() {
  const { items, subtotal } = useCart()

  return (
    <div className="panel sidebar-card">
      <h4 className="sidebar-section-title">Carrito</h4>
      {items.length === 0 ? (
        <p className="sidebar-empty">Tu carrito está vacío</p>
      ) : (
        <>
          <ul className="mini-cart-list">
            {items.slice(0, 4).map((i) => (
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
  )
}

function SidebarUsuario({ user, esAdmin }) {
  return (
    <aside className="left-panel">
      <div className="panel sidebar-card">
        <div className="user-greeting">
          <div className="user-avatar">{user.nombre?.[0]?.toUpperCase() || '?'}</div>
          <div>
            <p className="user-name">{user.nombre}</p>
            <Link className="link" to="/mi-panel">Ver mi panel →</Link>
          </div>
        </div>
      </div>

      {esAdmin ? (
        <div className="panel sidebar-card">
          <h4 className="sidebar-section-title">Administración</h4>
          <nav className="home-sidebar-admin-links">
            <Link to="/mi-panel">Panel de administrador</Link>
            <Link to="/mi-panel/nueva-pieza">Nueva pieza</Link>
            <Link to="/">Ver catálogo</Link>
          </nav>
        </div>
      ) : (
        <MiniCarritoSidebar />
      )}
    </aside>
  )
}

function Home() {
  const { user } = useAuth()
  const esAdmin = user?.rol === 'admin'

  return (
    <div className="home-page">
      {!user && (
        <div className="hero-banner">
          <h1 className="hero-title">Sistema de Inventarios</h1>
          <p className="hero-sub">Gestiona productos, pedidos y stock en un solo lugar.</p>
        </div>
      )}

      {user ? (
        <div className="two-column">
          <SidebarUsuario user={user} esAdmin={esAdmin} />
          <main className="right-panel home-catalog">
            <Productos />
          </main>
        </div>
      ) : (
        <main className="home-catalog home-catalog--full">
          <Productos />
        </main>
      )}
    </div>
  )
}

export default Home
