import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { loginSchema } from '../validations/formSchemas.js'
import { issuesToFieldErrors } from '../validations/zodHelpers.js'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      setFieldErrors(issuesToFieldErrors(parsed.error.issues))
      setLoading(false)
      return
    }

    try {
      const { usuario } = await login(parsed.data)
      const fallback = usuario.rol === 'admin' ? '/panel-admin' : '/panel-usuario'
      const destino = location.state?.from?.pathname || fallback
      navigate(destino, { replace: true })
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="panel panel-narrow auth-panel">
        <div className="auth-header">
          <div className="auth-icon">🔐</div>
          <h2>Bienvenido</h2>
          <p className="auth-subtitle">Inicia sesión en tu cuenta</p>
        </div>

        {error && <p className="status error">{error}</p>}

        <form className="form-grid" onSubmit={onSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
          {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}

          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
          {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="auth-footer">
          ¿No tienes cuenta?{' '}
          <Link className="link" to="/registro">Regístrate</Link>
        </p>
      </section>
    </div>
  )
}

export default Login
