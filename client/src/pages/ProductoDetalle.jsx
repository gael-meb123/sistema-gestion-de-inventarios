import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function ProductoDetalle() {
  const { addToCart, aplicarStockAProducto, productosStock } = useCart()
  const { user } = useAuth()
  const esAdmin = user?.rol === 'admin'
  const { id } = useParams()
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const productoVisible = useMemo(
    () => (producto ? aplicarStockAProducto(producto) : null),
    [producto, productosStock, aplicarStockAProducto],
  )

  useEffect(() => {
    const cargarDetalle = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/productos/${id}`)
        setProducto(data.producto)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo obtener el producto')
      } finally {
        setLoading(false)
      }
    }
    cargarDetalle()
  }, [id])

  return (
    <section className="panel panel-page page-shell">
      <Link className="back-link" to="/">← Volver al catálogo</Link>

      {loading && <p className="status loading">Cargando producto...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && productoVisible && (
        <div className="detalle-layout">
          <div className="detalle-imagen-wrap">
            {producto.imagenUrl ? (
              <img src={`${API_BASE_URL}${producto.imagenUrl}`} alt={producto.nombre} className="producto-imagen-detalle" />
            ) : (
              <div className="detalle-imagen-placeholder">📦</div>
            )}
          </div>

          <div className="detalle-info">
            <h2>{productoVisible.nombre}</h2>
            <p className="detalle-precio">${productoVisible.precio}</p>

            <div className="detalle-meta">
              <div className="detalle-meta-item">
                <span className="meta-label">Stock</span>
                <span className="meta-value">{productoVisible.stock} unidades</span>
              </div>
              <div className="detalle-meta-item">
                <span className="meta-label">Disponible</span>
                <span className={`meta-badge ${productoVisible.disponible ? 'badge-green' : 'badge-red'}`}>
                  {productoVisible.disponible ? 'Disponible' : 'Agotado'}
                </span>
              </div>
            </div>

            {!esAdmin && (
              <button
                type="button"
                className="btn-add-cart"
                onClick={() => addToCart(productoVisible)}
                disabled={!productoVisible.disponible}
              >
                {productoVisible.disponible ? '🛒 Agregar al carrito' : 'Sin stock'}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default ProductoDetalle
