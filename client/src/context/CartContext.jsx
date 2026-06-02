import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext.jsx'

const STORAGE_KEY = 'inventarios_carrito'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const CartContext = createContext(null)

function leerCarritoInicial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (_error) {
    return []
  }
}

function fusionarProductosStock(prev, productosActualizados = []) {
  if (!productosActualizados.length) {
    return prev
  }

  const next = { ...prev }
  for (const item of productosActualizados) {
    next[item.productoId] = {
      stock: item.stock,
      disponible: item.disponible,
    }
  }
  return next
}

export function CartProvider({ children }) {
  const { token, user, isAuthenticated, authLoading } = useAuth()
  const esAdmin = user?.rol === 'admin'
  const [items, setItems] = useState(leerCarritoInicial)
  const [cartLoading, setCartLoading] = useState(false)
  const [cartError, setCartError] = useState('')
  const [productosStock, setProductosStock] = useState({})

  const headers = useMemo(() => (
    token ? { Authorization: `Bearer ${token}` } : {}
  ), [token])

  const normalizarItemsApi = (apiItems = []) => apiItems.map((item) => ({
    id: item.productoId,
    nombre: item.nombre,
    precio: Number(item.precio) || 0,
    imagenUrl: item.imagenUrl || null,
    cantidad: item.cantidad,
    stock: item.stock ?? 0,
    disponible: Boolean(item.disponible),
  }))

  const setDesdeCarritoApi = (carrito, productosActualizados) => {
    setItems(normalizarItemsApi(carrito?.items || []))
    if (productosActualizados?.length) {
      setProductosStock((prev) => fusionarProductosStock(prev, productosActualizados))
    }
  }

  const aplicarStockAProducto = (producto) => {
    const actualizado = productosStock[producto.id]
    if (!actualizado) {
      return producto
    }
    return { ...producto, ...actualizado }
  }

  const persistir = (nextItems) => {
    setItems(nextItems)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
  }

  useEffect(() => {
    const cargarCarrito = async () => {
      if (authLoading) {
        return
      }

      if (!isAuthenticated) {
        setItems(leerCarritoInicial())
        return
      }

      if (esAdmin) {
        setItems([])
        setCartLoading(false)
        return
      }

      setCartLoading(true)
      setCartError('')

      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/carrito`, { headers })
        setDesdeCarritoApi(data.carrito)
      } catch (error) {
        setCartError(error.response?.data?.mensaje || 'No se pudo cargar el carrito')
      } finally {
        setCartLoading(false)
      }
    }

    cargarCarrito()
  }, [authLoading, isAuthenticated, esAdmin, headers])

  const addToCart = async (producto) => {
    setCartError('')

    if (esAdmin) {
      setCartError('El carrito no esta disponible para administradores')
      return false
    }

    if (isAuthenticated) {
      try {
        const { data } = await axios.post(`${API_BASE_URL}/api/carrito/items`, {
          productoId: producto.id,
          cantidad: 1,
        }, { headers })
        setDesdeCarritoApi(data.carrito, data.productosActualizados)
        return true
      } catch (error) {
        setCartError(error.response?.data?.mensaje || 'No se pudo agregar al carrito')
        return false
      }
    }

    const stockDisponible = productosStock[producto.id]?.stock ?? producto.stock ?? 0
    const existente = items.find((item) => item.id === producto.id)
    const cantidadActual = existente?.cantidad ?? 0

    if (cantidadActual + 1 > stockDisponible) {
      setCartError(`Stock insuficiente. Disponible: ${stockDisponible}`)
      return false
    }

    if (existente) {
      const next = items.map((item) => (
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ))
      persistir(next)
      setProductosStock((prev) => ({
        ...prev,
        [producto.id]: {
          stock: stockDisponible - 1,
          disponible: stockDisponible - 1 > 0,
        },
      }))
      return true
    }

    persistir([
      ...items,
      {
        id: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precio) || 0,
        imagenUrl: producto.imagenUrl || null,
        cantidad: 1,
        stock: stockDisponible - 1,
        disponible: stockDisponible - 1 > 0,
      },
    ])
    setProductosStock((prev) => ({
      ...prev,
      [producto.id]: {
        stock: stockDisponible - 1,
        disponible: stockDisponible - 1 > 0,
      },
    }))
    return true
  }

  const removeFromCart = async (id) => {
    setCartError('')

    if (esAdmin) {
      return false
    }

    if (isAuthenticated) {
      try {
        const { data } = await axios.delete(`${API_BASE_URL}/api/carrito/items/${id}`, { headers })
        setDesdeCarritoApi(data.carrito, data.productosActualizados)
        return true
      } catch (error) {
        setCartError(error.response?.data?.mensaje || 'No se pudo eliminar el producto del carrito')
        return false
      }
    }

    const itemEliminado = items.find((item) => item.id === id)
    if (itemEliminado) {
      const stockCatalogo = productosStock[id]?.stock ?? itemEliminado.stock ?? 0
      setProductosStock((prev) => ({
        ...prev,
        [id]: {
          stock: stockCatalogo + itemEliminado.cantidad,
          disponible: stockCatalogo + itemEliminado.cantidad > 0,
        },
      }))
    }

    persistir(items.filter((item) => item.id !== id))
    return true
  }

  const changeQuantity = async (id, nextCantidad) => {
    setCartError('')

    if (esAdmin) {
      return false
    }

    if (nextCantidad <= 0) {
      return removeFromCart(id)
    }

    if (isAuthenticated) {
      try {
        const { data } = await axios.patch(`${API_BASE_URL}/api/carrito/items/${id}`, {
          cantidad: nextCantidad,
        }, { headers })
        setDesdeCarritoApi(data.carrito, data.productosActualizados)
        return true
      } catch (error) {
        setCartError(error.response?.data?.mensaje || 'No se pudo actualizar la cantidad')
        return false
      }
    }

    const itemActual = items.find((item) => item.id === id)
    if (!itemActual) {
      return false
    }

    const stockCatalogo = productosStock[id]?.stock ?? itemActual.stock ?? 0
    const stockTotal = stockCatalogo + itemActual.cantidad

    if (nextCantidad > stockTotal) {
      setCartError(`Stock insuficiente. Disponible: ${stockTotal}`)
      return false
    }

    const delta = nextCantidad - itemActual.cantidad
    const next = items.map((item) => (
      item.id === id
        ? {
          ...item,
          cantidad: nextCantidad,
          stock: Math.max(0, (item.stock ?? stockCatalogo) - delta),
          disponible: Math.max(0, (item.stock ?? stockCatalogo) - delta) > 0,
        }
        : item
    ))
    persistir(next)
    setProductosStock((prev) => ({
      ...prev,
      [id]: {
        stock: Math.max(0, stockCatalogo - delta),
        disponible: Math.max(0, stockCatalogo - delta) > 0,
      },
    }))
    return true
  }

  const clearCart = async () => {
    setCartError('')

    if (esAdmin) {
      return false
    }

    if (isAuthenticated) {
      try {
        const { data } = await axios.delete(`${API_BASE_URL}/api/carrito`, { headers })
        setDesdeCarritoApi(data.carrito, data.productosActualizados)
        return true
      } catch (error) {
        setCartError(error.response?.data?.mensaje || 'No se pudo vaciar el carrito')
        return false
      }
    }

    const restauraciones = {}
    for (const item of items) {
      const stockCatalogo = productosStock[item.id]?.stock ?? item.stock ?? 0
      restauraciones[item.id] = {
        stock: stockCatalogo + item.cantidad,
        disponible: stockCatalogo + item.cantidad > 0,
      }
    }
    if (Object.keys(restauraciones).length > 0) {
      setProductosStock((prev) => ({ ...prev, ...restauraciones }))
    }

    persistir([])
    return true
  }

  const totals = useMemo(() => {
    const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0)
    const subtotal = items.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)
    return { totalItems, subtotal }
  }, [items])

  const value = useMemo(() => ({
    items,
    addToCart,
    removeFromCart,
    changeQuantity,
    clearCart,
    cartLoading,
    cartError,
    productosStock,
    aplicarStockAProducto,
    totalItems: totals.totalItems,
    subtotal: totals.subtotal,
  }), [items, totals, cartLoading, cartError, productosStock])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider')
  }
  return context
}
