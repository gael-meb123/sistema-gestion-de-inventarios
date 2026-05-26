import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function ProductoDetalle() {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const esAdmin = user?.rol === 'admin'
  const { id } = useParams()
  const [producto, setProducto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    <section className="panel">
      <h2>Detalle de producto</h2>
      {loading && <p className="status loading">Cargando detalle...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && producto && (
        <div>
          {producto.imagenUrl && (
            <img
              src={`${API_BASE_URL}${producto.imagenUrl}`}
              alt={producto.nombre}
              className="producto-imagen-detalle"
            />
          )}
          <h3>{producto.nombre}</h3>
          <p>Precio: ${producto.precio}</p>
          <p>Stock: {producto.stock}</p>
          <p>Disponible: {producto.disponible ? 'Si' : 'No'}</p>
          {!esAdmin && (
            <p>
              <button
                type="button"
                onClick={() => addToCart(producto)}
                disabled={!producto.disponible}
              >
                Agregar al carrito
              </button>
            </p>
          )}
          <p>
            <Link className="link" to="/">Regresar al listado</Link>
          </p>
        </div>
      )}
    </section>
  )
}

export default ProductoDetalle
