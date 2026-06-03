import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { checkoutTarjetaSchema } from '../validations/formSchemas.js'
import { issuesToFieldErrors } from '../validations/zodHelpers.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function formatearNumeroTarjeta(valor) {
  const digitos = valor.replace(/\D/g, '').slice(0, 19)
  return digitos.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatearExpiracion(valor) {
  const limpio = valor.replace(/\D/g, '').slice(0, 4)
  if (limpio.length <= 2) {
    return limpio
  }
  return `${limpio.slice(0, 2)}/${limpio.slice(2)}`
}

function Checkout() {
  const { items, subtotal, finalizarCompra, cartLoading, cartError } = useCart()
  const [titular, setTitular] = useState('')
  const [numero, setNumero] = useState('')
  const [expiracion, setExpiracion] = useState('')
  const [cvv, setCvv] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [pedido, setPedido] = useState(null)

  useEffect(() => {
    if (cartError) {
      setError(cartError)
    }
  }, [cartError])

  if (!cartLoading && items.length === 0 && !pedido) {
    return <Navigate to="/carrito" replace />
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    const parsed = checkoutTarjetaSchema.safeParse({
      titular,
      numero,
      expiracion,
      cvv,
    })

    if (!parsed.success) {
      setFieldErrors(issuesToFieldErrors(parsed.error.issues))
      return
    }

    setProcesando(true)
    await new Promise((resolve) => { setTimeout(resolve, 800) })

    const resultado = await finalizarCompra(parsed.data)
    setProcesando(false)

    if (resultado.ok) {
      setPedido(resultado.pedido)
      return
    }

    setError(cartError || 'No se pudo completar el pago')
  }

  if (pedido) {
    return (
      <section className="panel panel-page page-shell checkout-success">
        <div className="checkout-success-icon">✓</div>
        <h2>Compra realizada</h2>
        <p className="checkout-success-lead">
          Tu pedido <strong>#{pedido.id}</strong> fue confirmado correctamente.
        </p>
        <div className="checkout-success-summary">
          <p>Total pagado: <strong>${Number(pedido.total).toFixed(2)}</strong></p>
          {pedido.ultimos4 && (
            <p className="checkout-success-card">Tarjeta terminada en •••• {pedido.ultimos4}</p>
          )}
        </div>
        <ul className="checkout-success-items">
          {pedido.items?.map((item) => (
            <li key={item.productoId}>
              <span>{item.nombre} ×{item.cantidad}</span>
              <span>${Number(item.subtotal).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <Link className="btn-primary" to="/">Seguir comprando</Link>
      </section>
    )
  }

  return (
    <section className="panel panel-page page-shell checkout-page">
      <div className="page-header">
        <h2>Finalizar compra</h2>
        <Link className="link" to="/carrito">← Volver al carrito</Link>
      </div>

      <p className="checkout-simulacion-aviso">
        Pago simulado — no se realiza ningún cargo real a tu tarjeta.
      </p>

      {cartLoading && <p className="status loading">Cargando resumen...</p>}
      {error && <p className="status error">{error}</p>}

      <div className="checkout-layout">
        <aside className="checkout-resumen panel">
          <h3>Resumen del pedido</h3>
          <ul className="checkout-resumen-lista">
            {items.map((item) => (
              <li key={item.id} className="checkout-resumen-item">
                {item.imagenUrl ? (
                  <img
                    src={`${API_BASE_URL}${item.imagenUrl}`}
                    alt={item.nombre}
                    className="producto-imagen-mini"
                  />
                ) : (
                  <div className="imagen-mini-placeholder">📦</div>
                )}
                <div>
                  <strong>{item.nombre}</strong>
                  <p>{item.cantidad} × ${item.precio.toFixed(2)}</p>
                </div>
                <span>${(item.precio * item.cantidad).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="checkout-resumen-total">
            <span>Total</span>
            <strong>${subtotal.toFixed(2)}</strong>
          </div>
        </aside>

        <form className="checkout-form payment-card panel" onSubmit={onSubmit}>
          <h3>Datos de tarjeta</h3>

          <label>
            Titular de la tarjeta
            <input
              type="text"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              placeholder="Como aparece en la tarjeta"
              autoComplete="cc-name"
            />
            {fieldErrors.titular && <span className="field-error">{fieldErrors.titular}</span>}
          </label>

          <label>
            Número de tarjeta
            <input
              type="text"
              inputMode="numeric"
              value={numero}
              onChange={(e) => setNumero(formatearNumeroTarjeta(e.target.value))}
              placeholder="0000 0000 0000 0000"
              autoComplete="cc-number"
            />
            {fieldErrors.numero && <span className="field-error">{fieldErrors.numero}</span>}
          </label>

          <div className="checkout-form-row">
            <label>
              Vencimiento
              <input
                type="text"
                inputMode="numeric"
                value={expiracion}
                onChange={(e) => setExpiracion(formatearExpiracion(e.target.value))}
                placeholder="MM/YY"
                autoComplete="cc-exp"
              />
              {fieldErrors.expiracion && <span className="field-error">{fieldErrors.expiracion}</span>}
            </label>

            <label>
              CVV
              <input
                type="password"
                inputMode="numeric"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                autoComplete="cc-csc"
              />
              {fieldErrors.cvv && <span className="field-error">{fieldErrors.cvv}</span>}
            </label>
          </div>

          <div className="checkout-actions">
            <button type="submit" className="btn-primary" disabled={procesando || items.length === 0}>
              {procesando ? 'Procesando pago...' : `Pagar $${subtotal.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}

export default Checkout
