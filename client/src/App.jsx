import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Productos from './pages/Productos.jsx'
import ProductoDetalle from './pages/ProductoDetalle.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Sistema de Inventarios</h1>
        <nav>
          <NavLink to="/" end>
            Inicio
          </NavLink>
          <NavLink to="/productos">Productos</NavLink>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
