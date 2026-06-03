import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

export function useAddToCartWithAuth() {
  const { addToCart } = useCart()
  const { isAuthenticated, authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  return async (producto) => {
    if (authLoading) {
      return false
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return false
    }

    return addToCart(producto)
  }
}
