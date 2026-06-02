import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function Carrito() {
  const { items, changeQuantity, removeFromCart, clearCart, subtotal, cartLoading, cartError } = useCart()

  return (
    <section className="panel panel-page page-shell">
      <div className="page-header">
        <h2>Carrito de compras</h2>
        {items.length > 0 && (
          <span className="badge">{items.length} {items.length === 1 ? 'producto' : 'productos'}</span>
        )}
      </div>

      {cartLoading && <p className="status loading">Cargando carrito...</p>}
      {cartError && <p className="status error">{cartError}</p>}

      {items.length === 0 && !cartLoading && (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <p className="empty-title">Tu carrito está vacío</p>
          <p className="empty-sub">Agrega productos desde el <Link className="link" to="/">inicio</Link></p>
        </div>
      )}

      {items.length > 0 && (
        <>
          <ul className="carrito-lista">
            {items.map((item) => (
              <li key={item.id} className="carrito-item">
                {item.imagenUrl ? (
                  <img src={`${API_BASE_URL}${item.imagenUrl}`} alt={item.nombre} className="producto-imagen-mini" />
                ) : (
                  <div className="imagen-mini-placeholder">📦</div>
                )}

                <div className="carrito-item-info">
                  <strong>{item.nombre}</strong>
                  <p>${item.precio.toFixed(2)} c/u</p>
                </div>

                <div className="carrito-controles">
                  <button type="button" onClick={() => changeQuantity(item.id, item.cantidad - 1)}>−</button>
                  <span>{item.cantidad}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(item.id, item.cantidad + 1)}
                    disabled={(item.stock ?? 0) <= 0}
                    title={(item.stock ?? 0) <= 0 ? 'Sin stock disponible' : undefined}
                  >
                    +
                  </button>
                </div>

                <div className="carrito-subtotal">${(item.precio * item.cantidad).toFixed(2)}</div>

                <button type="button" className="danger-btn icon-btn" onClick={() => removeFromCart(item.id)}>✕</button>
              </li>
            ))}
          </ul>

          <div className="carrito-footer">
            <div className="carrito-total">
              <span className="total-label">Total</span>
              <strong className="total-amount">${subtotal.toFixed(2)}</strong>
            </div>
            <button type="button" className="danger-btn" onClick={clearCart}>
              Vaciar carrito
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default Carrito

