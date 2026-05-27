import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { registroSchema } from '../validations/formSchemas.js'
import { issuesToFieldErrors } from '../validations/zodHelpers.js'

function Registro() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'user', adminSetupKey: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    const parsed = registroSchema.safeParse(form)
    if (!parsed.success) {
      setFieldErrors(issuesToFieldErrors(parsed.error.issues))
      setLoading(false)
      return
    }

    try {
      const { usuario } = await register(parsed.data)
      navigate(usuario.rol === 'admin' ? '/panel-admin' : '/panel-usuario', { replace: true })
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo registrar la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <section className="panel panel-narrow auth-panel">
        <div className="auth-header">
          <div className="auth-icon">✨</div>
          <h2>Crear cuenta</h2>
          <p className="auth-subtitle">Únete al sistema de inventarios</p>
        </div>

        {error && <p className="status error">{error}</p>}

        <form className="form-grid" onSubmit={onSubmit}>
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" name="nombre" value={form.nombre} onChange={onChange} placeholder="Tu nombre" required minLength={2} />
          {fieldErrors.nombre && <p className="field-error">{fieldErrors.nombre}</p>}

          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={onChange} placeholder="tu@email.com" required />
          {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}

          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" value={form.password} onChange={onChange} placeholder="••••••••" minLength={6} required />
          {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}

          <label htmlFor="rol">Rol</label>
          <select id="rol" name="rol" value={form.rol} onChange={onChange}>
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
          {fieldErrors.rol && <p className="field-error">{fieldErrors.rol}</p>}

          {form.rol === 'admin' && (
            <>
              <label htmlFor="adminSetupKey">Clave de administrador</label>
              <input id="adminSetupKey" name="adminSetupKey" type="password" value={form.adminSetupKey} onChange={onChange} placeholder="Clave secreta" required />
              {fieldErrors.adminSetupKey && <p className="field-error">{fieldErrors.adminSetupKey}</p>}
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link className="link" to="/login">Inicia sesión</Link>
        </p>
      </section>
    </div>
  )
}

export default Registro
