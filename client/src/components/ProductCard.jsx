import React from 'react'
import { Link } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function ProductCard({ producto, esAdmin, onAddToCart }) {
  return (
    <article className="producto-card">
      {producto.imagenUrl ? (
        <img src={`${API_BASE_URL}${producto.imagenUrl}`} alt={producto.nombre} className="producto-imagen" />
      ) : (
        <div className="producto-imagen placeholder">Sin imagen</div>
      )}

      <h3>{producto.nombre}</h3>
      <p className="precio">${producto.precio}</p>
      <p className="stock">{producto.stock} en stock</p>
      <div className="card-actions">
        <Link to={`/producto/${producto.id}`}>Ver detalle</Link>
        {!esAdmin && (
          <button type="button" onClick={() => onAddToCart(producto)} disabled={!producto.disponible}>
            {producto.disponible ? 'Agregar' : 'Agotado'}
          </button>
        )}
      </div>
    </article>
  )
}
