import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function Carrito() {
  const {
    items,
    changeQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    cartLoading,
    cartError,
  } = useCart()

  const onRestar = async (id, cantidad) => {
    await changeQuantity(id, cantidad - 1)
  }

  const onSumar = async (id, cantidad) => {
    await changeQuantity(id, cantidad + 1)
  }

  const onEliminar = async (id) => {
    await removeFromCart(id)
  }

  const onVaciar = async () => {
    await clearCart()
  }

  return (
    <section className="panel">
      <h2>Carrito de compras</h2>

      {cartLoading && <p className="status loading">Cargando carrito...</p>}
      {cartError && <p className="status error">{cartError}</p>}

      {items.length === 0 && (
        <p>
          Tu carrito esta vacio. Ve a <Link className="link" to="/">inicio</Link> para agregar productos.
        </p>
      )}

      {items.length > 0 && (
        <>
          <ul className="carrito-lista">
            {items.map((item) => (
              <li key={item.id} className="carrito-item">
                {item.imagenUrl && (
                  <img
                    src={`${API_BASE_URL}${item.imagenUrl}`}
                    alt={item.nombre}
                    className="producto-imagen-mini"
                  />
                )}

                <div className="carrito-item-info">
                  <strong>{item.nombre}</strong>
                  <p>${item.precio.toFixed(2)} c/u</p>
                </div>

                <div className="carrito-controles">
                  <button type="button" onClick={() => onRestar(item.id, item.cantidad)}>-</button>
                  <span>{item.cantidad}</span>
                  <button type="button" onClick={() => onSumar(item.id, item.cantidad)}>+</button>
                </div>

                <div className="carrito-subtotal">${(item.precio * item.cantidad).toFixed(2)}</div>

                <button type="button" className="danger-btn" onClick={() => onEliminar(item.id)}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>

          <div className="carrito-footer">
            <strong>Total: ${subtotal.toFixed(2)}</strong>
            <button type="button" className="danger-btn" onClick={onVaciar}>
              Vaciar carrito
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export default Carrito
