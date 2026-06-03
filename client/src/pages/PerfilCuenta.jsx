import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { actualizarPerfilSchema } from '../validations/formSchemas.js'
import { issuesToFieldErrors } from '../validations/zodHelpers.js'

function formatearFecha(valor) {
  if (!valor) {
    return '—'
  }
  return new Date(valor).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function PerfilCuenta() {
  const { user, isAdmin, updateProfile, refreshUser } = useAuth()
  const [perfil, setPerfil] = useState(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [confirmarPasswordNueva, setConfirmarPasswordNueva] = useState('')
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    const cargar = async () => {
      setLoading(true)
      setError('')
      try {
        const datos = await refreshUser()
        setPerfil(datos)
        setNombre(datos?.nombre || '')
        setEmail(datos?.email || '')
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar tu perfil')
        setNombre(user?.nombre || '')
        setEmail(user?.email || '')
      } finally {
        setLoading(false)
      }
    }

    cargar()
  }, [refreshUser, user?.id])

  const onSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setExito('')
    setFieldErrors({})

    const nombreLimpio = nombre.trim()
    const emailLimpio = email.trim().toLowerCase()
    const nombreActual = (perfil?.nombre || user?.nombre || '').trim()
    const emailActual = (perfil?.email || user?.email || '').trim().toLowerCase()

    const payload = {}
    if (nombreLimpio && nombreLimpio !== nombreActual) {
      payload.nombre = nombreLimpio
    }
    if (emailLimpio && emailLimpio !== emailActual) {
      payload.email = emailLimpio
      payload.passwordActual = passwordActual
    }
    if (passwordNueva) {
      payload.passwordActual = passwordActual
      payload.passwordNueva = passwordNueva
      payload.confirmarPasswordNueva = confirmarPasswordNueva
    }

    const parsed = actualizarPerfilSchema.safeParse(payload)
    if (!parsed.success) {
      setFieldErrors(issuesToFieldErrors(parsed.error.issues))
      return
    }

    const envio = { ...parsed.data }
    delete envio.confirmarPasswordNueva

    setGuardando(true)
    try {
      const data = await updateProfile(envio)
      setPerfil(data.usuario)
      setNombre(data.usuario.nombre)
      setEmail(data.usuario.email)
      setPasswordActual('')
      setPasswordNueva('')
      setConfirmarPasswordNueva('')
      setExito(data.mensaje || 'Perfil actualizado correctamente')
    } catch (err) {
      const erroresApi = err.response?.data?.errores
      if (erroresApi?.length) {
        const mapa = {}
        for (const item of erroresApi) {
          mapa[item.campo] = item.mensaje
        }
        setFieldErrors(mapa)
      }
      setError(err.response?.data?.mensaje || 'No se pudo actualizar el perfil')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="panel panel-page page-shell perfil-page">
      <div className="panel-toolbar">
        <div>
          <h2>Mi cuenta</h2>
          <p className="text-muted">Actualiza tus datos personales y credenciales de acceso</p>
        </div>
        <Link className="secondary-btn" to="/mi-panel">← Volver al panel</Link>
      </div>

      {loading && <p className="status loading">Cargando perfil...</p>}
      {error && <p className="status error">{error}</p>}
      {exito && <p className="status success">{exito}</p>}

      {!loading && (
        <div className="perfil-layout">
          <aside className="perfil-resumen panel">
            <div className="user-avatar lg">{user?.nombre?.[0]?.toUpperCase() || '?'}</div>
            <h3>{user?.nombre}</h3>
            <p className="text-muted">{user?.email}</p>
            <span className={`perfil-rol-badge ${isAdmin ? 'admin' : 'user'}`}>
              {isAdmin ? 'Administrador' : 'Cliente'}
            </span>
            <dl className="perfil-meta">
              <div>
                <dt>Miembro desde</dt>
                <dd>{formatearFecha(perfil?.createdAt)}</dd>
              </div>
              <div>
                <dt>Última actualización</dt>
                <dd>{formatearFecha(perfil?.updatedAt)}</dd>
              </div>
            </dl>
          </aside>

          <form className="perfil-form panel" onSubmit={onSubmit}>
            <fieldset className="perfil-fieldset">
              <legend>Datos personales</legend>
              <p className="perfil-fieldset-hint">
                Información visible en tu cuenta y en los pedidos.
              </p>

              <div className="perfil-fields-grid">
                <div className="perfil-field">
                  <label htmlFor="perfil-nombre">Nombre completo</label>
                  <input
                    id="perfil-nombre"
                    name="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Tu nombre"
                    autoComplete="name"
                  />
                  {fieldErrors.nombre && <p className="field-error">{fieldErrors.nombre}</p>}
                </div>

                <div className="perfil-field">
                  <label htmlFor="perfil-email">Correo electrónico</label>
                  <input
                    id="perfil-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete="email"
                  />
                  {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
                </div>
              </div>
            </fieldset>

            <fieldset className="perfil-fieldset">
              <legend>Seguridad</legend>
              <p className="perfil-fieldset-hint">
                Para cambiar el correo o la contraseña, ingresa tu contraseña actual.
              </p>

              <div className="perfil-fields-grid perfil-fields-grid--stacked">
                <div className="perfil-field perfil-field--full">
                  <label htmlFor="perfil-password-actual">Contraseña actual</label>
                  <input
                    id="perfil-password-actual"
                    name="passwordActual"
                    type="password"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    placeholder="Solo si cambias email o contraseña"
                    autoComplete="current-password"
                  />
                  {fieldErrors.passwordActual && (
                    <p className="field-error">{fieldErrors.passwordActual}</p>
                  )}
                </div>

                <div className="perfil-field">
                  <label htmlFor="perfil-password-nueva">Nueva contraseña</label>
                  <input
                    id="perfil-password-nueva"
                    name="passwordNueva"
                    type="password"
                    value={passwordNueva}
                    onChange={(e) => setPasswordNueva(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    autoComplete="new-password"
                  />
                  {fieldErrors.passwordNueva && (
                    <p className="field-error">{fieldErrors.passwordNueva}</p>
                  )}
                </div>

                <div className="perfil-field">
                  <label htmlFor="perfil-password-confirmar">Confirmar nueva contraseña</label>
                  <input
                    id="perfil-password-confirmar"
                    name="confirmarPasswordNueva"
                    type="password"
                    value={confirmarPasswordNueva}
                    onChange={(e) => setConfirmarPasswordNueva(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    autoComplete="new-password"
                  />
                  {fieldErrors.confirmarPasswordNueva && (
                    <p className="field-error">{fieldErrors.confirmarPasswordNueva}</p>
                  )}
                </div>
              </div>
            </fieldset>

            <div className="perfil-form-actions">
              <button type="submit" className="btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default PerfilCuenta
