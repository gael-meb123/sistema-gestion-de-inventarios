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

    const parsed = loginSchema.safeParse({
      email,
      password,
    })

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
      setError(err.response?.data?.mensaje || 'No se pudo iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="panel panel-narrow">
      <h2>Iniciar sesion</h2>
      {error && <p className="status error">{error}</p>}

      <form className="form-grid" onSubmit={onSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}

        <label htmlFor="password">Contrasena</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p>
        No tienes cuenta? <Link className="link" to="/registro">Registrate</Link>
      </p>
    </section>
  )
}

export default Login
