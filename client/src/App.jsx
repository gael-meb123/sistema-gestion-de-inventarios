import { Navigate, NavLink, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { useCart } from './context/CartContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import ProductoDetalle from './pages/ProductoDetalle.jsx'
import NotFound from './pages/NotFound.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import MiPanel from './pages/MiPanel.jsx'
import Carrito from './pages/Carrito.jsx'
import NuevaPieza from './pages/NuevaPieza.jsx'

function App() {
  const { user, isAuthenticated, logout } = useAuth()
  const { totalItems } = useCart()

  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" end className="topbar-brand">
          <span className="topbar-logo">⬡</span>
          Inventarios
        </NavLink>
        <nav>
          <NavLink to="/" end>Inicio</NavLink>
          {!isAuthenticated && <NavLink to="/login">Login</NavLink>}
          {!isAuthenticated && <NavLink to="/registro">Registro</NavLink>}
          {(!isAuthenticated || user?.rol !== 'admin') && (
            <NavLink to="/carrito" className="cart-link">
              Carrito
              {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </NavLink>
          )}
          {isAuthenticated && <NavLink to="/mi-panel">Mi panel</NavLink>}
          {isAuthenticated && (
            <button type="button" className="logout-btn" onClick={logout}>
              Salir
            </button>
          )}
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/carrito"
            element={isAuthenticated && user?.rol === 'admin' ? <Navigate to="/mi-panel" replace /> : <Carrito />}
          />
          <Route path="/productos" element={<Navigate to="/" replace />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route
            path="/mi-panel"
            element={(
              <ProtectedRoute roles={['admin', 'user']}>
                <MiPanel />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/mi-panel/nueva-pieza"
            element={(
              <ProtectedRoute roles={['admin']}>
                <NuevaPieza />
              </ProtectedRoute>
            )}
          />
          <Route path="/panel-admin" element={<Navigate to="/mi-panel" replace />} />
          <Route path="/panel-usuario" element={<Navigate to="/mi-panel" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
