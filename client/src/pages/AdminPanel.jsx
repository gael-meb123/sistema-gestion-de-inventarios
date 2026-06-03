import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { crearProductoSchema } from '../validations/formSchemas.js'
import { issuesToFieldErrors } from '../validations/zodHelpers.js'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function AdminPanel() {
  const { user, isAdmin, authHeaders } = useAuth()
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [productos, setProductos] = useState([])
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [formEditar, setFormEditar] = useState({
    nombre: '',
    precio: '',
    stock: '',
    imagen: null,
  })
  const [editFieldErrors, setEditFieldErrors] = useState({})
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [eliminandoId, setEliminandoId] = useState(null)

  const cargarProductos = async () => {
    setCargandoProductos(true)
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/productos`)
      setProductos(data.productos || [])
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo cargar el listado de productos')
    } finally {
      setCargandoProductos(false)
    }
  }

  useEffect(() => {
    const cargarPanel = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/panel/admin`, {
          headers: authHeaders,
        })
        setMensaje(data.mensaje)
      } catch (err) {
        setError(err.response?.data?.mensaje || 'No se pudo cargar el panel de administrador')
      }

      await cargarProductos()
    }

    if (isAdmin) {
      cargarPanel()
    }
  }, [isAdmin, authHeaders])

  const onChange = (event) => {
    const { name, value } = event.target
    setFormEditar((prev) => ({ ...prev, [name]: value }))
  }

  const onImagenChange = (event) => {
    const file = event.target.files?.[0] || null
    setError('')
    setEditFieldErrors((prev) => ({ ...prev, imagen: undefined }))
    setFormEditar((prev) => ({ ...prev, imagen: file }))
  }

  const iniciarEdicion = (producto) => {
    setEditandoId(producto.id)
    setEditFieldErrors({})
    setFormEditar({
      nombre: producto.nombre,
      precio: String(producto.precio),
      stock: String(producto.stock),
      imagen: null,
    })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setEditFieldErrors({})
    setFormEditar({ nombre: '', precio: '', stock: '', imagen: null })
  }

  const guardarEdicion = async (productoId) => {
    setGuardandoEdicion(true)
    setEditFieldErrors({})
    setError('')

    const parsed = crearProductoSchema.safeParse(formEditar)
    if (!parsed.success) {
      setEditFieldErrors(issuesToFieldErrors(parsed.error.issues))
      setGuardandoEdicion(false)
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

      const { data } = await axios.put(`${API_BASE_URL}/api/productos/${productoId}`, formData, {
        headers: authHeaders,
      })

      setMensaje(`Producto actualizado: ${data.producto.nombre}`)
      cancelarEdicion()
      await cargarProductos()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo actualizar el producto')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  const eliminarProducto = async (productoId) => {
    if (!window.confirm('Deseas eliminar este producto?')) {
      return
    }

    setEliminandoId(productoId)
    setError('')

    try {
      await axios.delete(`${API_BASE_URL}/api/productos/${productoId}`, {
        headers: authHeaders,
      })
      setMensaje('Producto eliminado exitosamente')
      if (editandoId === productoId) {
        cancelarEdicion()
      }
      await cargarProductos()
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo eliminar el producto')
    } finally {
      setEliminandoId(null)
    }
  }

  const renderFormularioEdicion = (productoId) => (
    <div className="admin-edit-form">
      <label>
        Nombre
        <input name="nombre" value={formEditar.nombre} onChange={onChange} />
      </label>
      {editFieldErrors.nombre && <p className="field-error">{editFieldErrors.nombre}</p>}
      <label>
        Precio
        <input name="precio" type="number" step="0.01" min="0.01" value={formEditar.precio} onChange={onChange} />
      </label>
      {editFieldErrors.precio && <p className="field-error">{editFieldErrors.precio}</p>}
      <label>
        Stock
        <input name="stock" type="number" min="0" step="1" value={formEditar.stock} onChange={onChange} />
      </label>
      {editFieldErrors.stock && <p className="field-error">{editFieldErrors.stock}</p>}
      <label>
        Imagen
        <input name="imagen" type="file" accept="image/jpeg,image/png,image/webp" onChange={onImagenChange} />
      </label>
      {editFieldErrors.imagen && <p className="field-error">{editFieldErrors.imagen}</p>}
      <div className="admin-actions">
        <button type="button" onClick={() => guardarEdicion(productoId)} disabled={guardandoEdicion}>
          {guardandoEdicion ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" className="secondary-btn" onClick={cancelarEdicion}>
          Cancelar
        </button>
      </div>
    </div>
  )

  return (
    <section className="panel panel-page page-shell">
      <div className="panel-toolbar">
        <div>
          <h2>Panel de administrador</h2>
          <p className="text-muted">{user?.nombre} · {user?.email}</p>
        </div>
        <div className="panel-toolbar-actions">
          <Link className="secondary-btn" to="/mi-panel/perfil">Mi cuenta</Link>
          {isAdmin && (
            <Link className="new-piece-btn" to="/mi-panel/nueva-pieza">+ Nueva pieza</Link>
          )}
        </div>
      </div>

      <div className="panel-hero">
        <div className="user-avatar lg">{user?.nombre?.[0]?.toUpperCase() || '?'}</div>
        <div>
          <p className="text-muted">Gestiona el inventario y los productos del catálogo.</p>
        </div>
      </div>

      {mensaje && <p className="status loading">{mensaje}</p>}
      {error && <p className="status error">{error}</p>}

      <div className="panel-section">
        <h3>Productos registrados</h3>
        {cargandoProductos && <p className="status loading">Cargando productos...</p>}

        {!cargandoProductos && productos.length === 0 && (
          <p>No hay productos para mostrar.</p>
        )}

        {!cargandoProductos && productos.length > 0 && (
          <>
            <div className="admin-table-wrapper admin-table-desktop">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Disponible</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((producto) => (
                    <tr key={producto.id}>
                      <td>
                        {producto.imagenUrl ? (
                          <img
                            src={`${API_BASE_URL}${producto.imagenUrl}`}
                            alt={producto.nombre}
                            className="producto-imagen-mini"
                          />
                        ) : 'Sin imagen'}

                        {editandoId === producto.id && (
                          <>
                            <input
                              name="imagen"
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={onImagenChange}
                            />
                            {editFieldErrors.imagen && <p className="field-error">{editFieldErrors.imagen}</p>}
                          </>
                        )}
                      </td>

                      {editandoId === producto.id ? (
                        <>
                          <td>
                            <input name="nombre" value={formEditar.nombre} onChange={onChange} />
                            {editFieldErrors.nombre && <p className="field-error">{editFieldErrors.nombre}</p>}
                          </td>
                          <td>
                            <input
                              name="precio"
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={formEditar.precio}
                              onChange={onChange}
                            />
                            {editFieldErrors.precio && <p className="field-error">{editFieldErrors.precio}</p>}
                          </td>
                          <td>
                            <input
                              name="stock"
                              type="number"
                              min="0"
                              step="1"
                              value={formEditar.stock}
                              onChange={onChange}
                            />
                            {editFieldErrors.stock && <p className="field-error">{editFieldErrors.stock}</p>}
                          </td>
                          <td>{Number(formEditar.stock) > 0 ? 'Si' : 'No'}</td>
                          <td className="admin-actions">
                            <button
                              type="button"
                              onClick={() => guardarEdicion(producto.id)}
                              disabled={guardandoEdicion}
                            >
                              {guardandoEdicion ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button type="button" className="secondary-btn" onClick={cancelarEdicion}>
                              Cancelar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{producto.nombre}</td>
                          <td>${producto.precio}</td>
                          <td>{producto.stock}</td>
                          <td>{producto.disponible ? 'Si' : 'No'}</td>
                          <td className="admin-actions">
                            <button type="button" onClick={() => iniciarEdicion(producto)}>Editar</button>
                            <button
                              type="button"
                              className="danger-btn"
                              onClick={() => eliminarProducto(producto.id)}
                              disabled={eliminandoId === producto.id}
                            >
                              {eliminandoId === producto.id ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="admin-cards-list">
              {productos.map((producto) => (
                <li key={`card-${producto.id}`} className="admin-product-card panel">
                  {producto.imagenUrl ? (
                    <img
                      src={`${API_BASE_URL}${producto.imagenUrl}`}
                      alt={producto.nombre}
                      className="admin-product-card-img"
                    />
                  ) : (
                    <div className="admin-product-card-img admin-product-card-img--placeholder">📦</div>
                  )}

                  {editandoId === producto.id ? (
                    renderFormularioEdicion(producto.id)
                  ) : (
                    <>
                      <h4>{producto.nombre}</h4>
                      <dl className="admin-product-meta">
                        <div>
                          <dt>Precio</dt>
                          <dd>${producto.precio}</dd>
                        </div>
                        <div>
                          <dt>Stock</dt>
                          <dd>{producto.stock}</dd>
                        </div>
                        <div>
                          <dt>Disponible</dt>
                          <dd>{producto.disponible ? 'Si' : 'No'}</dd>
                        </div>
                      </dl>
                      <div className="admin-actions">
                        <button type="button" onClick={() => iniciarEdicion(producto)}>Editar</button>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => eliminarProducto(producto.id)}
                          disabled={eliminandoId === producto.id}
                        >
                          {eliminandoId === producto.id ? 'Eliminando...' : 'Eliminar'}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

export default AdminPanel
