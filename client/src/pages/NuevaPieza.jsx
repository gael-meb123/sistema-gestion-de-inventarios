import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { crearProductoSchema } from '../validations/formSchemas.js'
import { issuesToFieldErrors } from '../validations/zodHelpers.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function NuevaPieza() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    stock: '',
    imagen: null,
  })

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onImagenChange = (event) => {
    const file = event.target.files?.[0] || null
    setFieldErrors((prev) => ({ ...prev, imagen: undefined }))
    setForm((prev) => ({ ...prev, imagen: file }))
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

      if (parsed.data.imagen) {
        formData.append('imagen', parsed.data.imagen)
      }

      const { data } = await axios.post(`${API_BASE_URL}/api/productos`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setMensaje(`Pieza creada: ${data.producto.nombre}`)
      setForm({ nombre: '', precio: '', stock: '', imagen: null })
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo crear la pieza')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="panel">
      <div className="admin-header">
        <Link className="secondary-link-btn" to="/mi-panel">Volver al panel</Link>
      </div>

      <h2>Nueva pieza</h2>
      {mensaje && <p className="status loading">{mensaje}</p>}
      {error && <p className="status error">{error}</p>}

      <form className="form-grid" onSubmit={onSubmit}>
        <label htmlFor="nombre">Nombre</label>
        <input id="nombre" name="nombre" value={form.nombre} onChange={onChange} required />
        {fieldErrors.nombre && <p className="field-error">{fieldErrors.nombre}</p>}

        <label htmlFor="precio">Precio</label>
        <input
          id="precio"
          name="precio"
          type="number"
          step="0.01"
          min="0.01"
          value={form.precio}
          onChange={onChange}
          required
        />
        {fieldErrors.precio && <p className="field-error">{fieldErrors.precio}</p>}

        <label htmlFor="stock">Stock</label>
        <input
          id="stock"
          name="stock"
          type="number"
          min="0"
          step="1"
          value={form.stock}
          onChange={onChange}
          required
        />
        {fieldErrors.stock && <p className="field-error">{fieldErrors.stock}</p>}

        <label htmlFor="imagen">Imagen (JPG/PNG/WEBP, max 2MB)</label>
        <input
          id="imagen"
          name="imagen"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onImagenChange}
        />
        {fieldErrors.imagen && <p className="field-error">{fieldErrors.imagen}</p>}

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Crear pieza'}
        </button>
      </form>

      <p>
        Tambien puedes volver al <Link className="link" to="/mi-panel">listado</Link> para editar o eliminar.
      </p>
    </section>
  )
}

export default NuevaPieza
