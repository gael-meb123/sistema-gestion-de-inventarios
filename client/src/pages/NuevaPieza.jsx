import { useState } from 'react'
import axios from 'axios'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { crearProductoSchema } from '../validations/formSchemas.js'
import { issuesToFieldErrors } from '../validations/zodHelpers.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function NuevaPieza() {
  const { authLoading, isAdmin, authHeaders } = useAuth()
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({ nombre: '', precio: '', stock: '', imagen: null })

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onImagenChange = (event) => {
    const file = event.target.files?.[0] || null
    setFieldErrors((prev) => ({ ...prev, imagen: undefined }))
    setForm((prev) => ({ ...prev, imagen: file }))
  }

  if (authLoading) {
    return (
      <section className="panel panel-page page-shell">
        <p className="status loading">Validando sesion...</p>
      </section>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/mi-panel" replace />
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setError('')
    setFieldErrors({})

    const parsed = crearProductoSchema.safeParse(form)
    if (!parsed.success) {
      setFieldErrors(issuesToFieldErrors(parsed.error.issues))
      setGuardando(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append('nombre', parsed.data.nombre)
      formData.append('precio', String(parsed.data.precio))
      formData.append('stock', String(parsed.data.stock))
      if (parsed.data.imagen) formData.append('imagen', parsed.data.imagen)

      const { data } = await axios.post(`${API_BASE_URL}/api/productos`, formData, {
        headers: authHeaders,
      })

      setMensaje(`✓ Pieza creada: ${data.producto.nombre}`)
      setForm({ nombre: '', precio: '', stock: '', imagen: null })
    } catch (err) {
      const status = err.response?.status
      const mensajeApi = err.response?.data?.mensaje
      if (status === 403) {
        setError(
          mensajeApi
            || 'Tu cuenta no tiene permisos de administrador. Registrate como admin con la clave correcta o vuelve a iniciar sesion.',
        )
      } else if (status === 401) {
        setError('Tu sesion expiro. Vuelve a iniciar sesion.')
      } else {
        setError(mensajeApi || 'No se pudo crear la pieza')
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="panel panel-page page-shell">
      <div className="panel-toolbar">
        <div>
          <h2>Nueva pieza</h2>
          <p className="text-muted">Agrega un nuevo producto al inventario</p>
        </div>
        <Link className="secondary-link-btn" to="/mi-panel">← Volver al panel</Link>
      </div>

      {mensaje && <p className="status loading">{mensaje}</p>}
      {error && <p className="status error">{error}</p>}

      <form className="form-grid" onSubmit={onSubmit}>
        <label htmlFor="nombre">Nombre del producto</label>
        <input id="nombre" name="nombre" value={form.nombre} onChange={onChange} placeholder="Ej. Tornillo M6x20" required />
        {fieldErrors.nombre && <p className="field-error">{fieldErrors.nombre}</p>}

        <label htmlFor="precio">Precio (MXN)</label>
        <input id="precio" name="precio" type="number" step="0.01" min="0.01" value={form.precio} onChange={onChange} placeholder="0.00" required />
        {fieldErrors.precio && <p className="field-error">{fieldErrors.precio}</p>}

        <label htmlFor="stock">Stock inicial</label>
        <input id="stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={onChange} placeholder="0" required />
        {fieldErrors.stock && <p className="field-error">{fieldErrors.stock}</p>}

        <label htmlFor="imagen">Imagen <span className="label-hint">(JPG/PNG/WEBP, máx 2MB)</span></label>
        <input id="imagen" name="imagen" type="file" accept="image/jpeg,image/png,image/webp" onChange={onImagenChange} className="file-input" />
        {fieldErrors.imagen && <p className="field-error">{fieldErrors.imagen}</p>}

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : '+ Crear pieza'}
        </button>
      </form>
    </section>
  )
}

export default NuevaPieza
