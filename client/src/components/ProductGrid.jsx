import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import ProductCard from './ProductCard'
import SearchBar from './SearchBar'
import CategoryTabs from './CategoryTabs'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function ProductGrid() {
  const { addToCart } = useCart()
  const { user } = useAuth()
  const esAdmin = user?.rol === 'admin'

  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  useEffect(() => {
    let mounted = true
    const cargar = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/productos`)
        if (!mounted) return
        setProductos(data.productos || [])
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudieron cargar los productos')
      } finally {
        setLoading(false)
      }
    }
    cargar()
    return () => { mounted = false }
  }, [])

  const categories = useMemo(() => {
    const found = new Set()
    productos.forEach(p => { if (p.categoria) found.add(p.categoria) })
    return ['All', ...Array.from(found)]
  }, [productos])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return productos.filter(p => {
      if (activeCategory !== 'All' && p.categoria !== activeCategory) return false
      if (!q) return true
      return p.nombre.toLowerCase().includes(q)
    })
  }, [productos, query, activeCategory])

  return (
    <section className="catalog-layout">
      <div className="catalog-controls">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar productos..." />
        <CategoryTabs categories={categories} active={activeCategory} onChange={setActiveCategory} />
      </div>

      {loading && <p className="status loading">Cargando productos...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p>No hay productos que coincidan con los filtros.</p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ul className="productos-grid catalog-grid">
          {filtered.map(producto => (
            <li key={producto.id}>
              <ProductCard producto={producto} esAdmin={esAdmin} onAddToCart={addToCart} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
