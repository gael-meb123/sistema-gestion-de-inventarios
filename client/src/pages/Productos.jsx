import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function Productos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/productos`)
        setProductos(data.productos || [])
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudieron cargar los productos')
      } finally {
        setLoading(false)
      }
    }

    cargarProductos()
  }, [])

  return (
    <section className="panel">
      <h2>Productos</h2>
      {loading && <p className="status loading">Cargando productos...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && productos.length === 0 && (
        <p>No hay productos registrados todavía.</p>
      )}

      {!loading && !error && productos.length > 0 && (
        <ul className="productos-grid">
          {productos.map((producto) => (
            <li key={producto.id} className="producto-card">
              <h3>{producto.nombre}</h3>
              <p>Precio: ${producto.precio}</p>
              <p>Stock: {producto.stock}</p>
              <p>Disponible: {producto.disponible ? 'Si' : 'No'}</p>
              <Link to={`/producto/${producto.id}`}>Ver detalle</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default Productos
