const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const { inicializarAsociaciones } = require('./models/asociaciones');
const authController = require('./controllers/authController');
const carritoController = require('./controllers/carritoController');
const productoController = require('./controllers/productoController');
const { validarRegistroProducto } = require('./middlewares/validadorProducto');
const { uploadProductoImagen } = require('./middlewares/uploadProductoImagen');
const {
  adjuntarUsuarioOpcional,
  autenticarToken,
  autorizarRoles,
} = require('./middlewares/auth');

const app = express();
const PORT = process.env.PORT || 4000;

inicializarAsociaciones();

app.use(cors({
  origin: function (origin, callback) {
    const allowed = ['http://localhost:5173', 'http://localhost:5174'];
    if (!origin) return callback(null, true);
    if (allowed.indexOf(origin) !== -1) return callback(null, true);
    return callback(new Error('CORS policy: Origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(adjuntarUsuarioOpcional);

morgan.token('userId', req => req.usuario?.id || 'anon');
morgan.token('rol', req => req.usuario?.rol || 'guest');

app.use(morgan(':method :url :status :response-time ms user=:userId rol=:rol'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Gestión de Inventarios API',
      version: '1.0.0',
      description: 'Documentación de endpoints del sistema de gestión de inventarios'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Servidor local'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido al hacer login'
        }
      },
      schemas: {
        UsuarioRegistro: {
          type: 'object',
          required: ['nombre', 'email', 'password'],
          properties: {
            nombre: { type: 'string', example: 'Juan Perez' },
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', example: 'Secreto123' },
            rol: { type: 'string', enum: ['admin', 'user'], example: 'user' },
            adminSetupKey: { type: 'string', example: 'miClaveAdmin' }
          }
        },
        UsuarioLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            password: { type: 'string', example: 'Secreto123' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            mensaje: { type: 'string', example: 'Login exitoso' },
            token: { type: 'string', example: 'eyJhbGciOi...' },
            usuario: {
              $ref: '#/components/schemas/UsuarioBase'
            }
          }
        },
        UsuarioBase: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Juan Perez' },
            email: { type: 'string', format: 'email', example: 'juan@example.com' },
            rol: { type: 'string', enum: ['admin', 'user'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ProductoBase: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 10 },
            nombre: { type: 'string', example: 'Tornillo M6' },
            precio: { type: 'number', format: 'float', example: 2.5 },
            stock: { type: 'integer', example: 50 },
            disponible: { type: 'boolean', example: true },
            imagenUrl: { type: 'string', example: '/uploads/productos/tornillo.jpg' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        ProductoInput: {
          type: 'object',
          required: ['nombre', 'precio', 'stock'],
          properties: {
            nombre: { type: 'string', example: 'Tornillo M6' },
            precio: { type: 'number', example: 2.5 },
            stock: { type: 'integer', example: 50 }
          }
        },
        CarritoItemBase: {
          type: 'object',
          properties: {
            productoId: { type: 'integer', example: 10 },
            nombre: { type: 'string', example: 'Tornillo M6' },
            precio: { type: 'number', example: 2.5 },
            stock: { type: 'integer', example: 50 },
            disponible: { type: 'boolean', example: true },
            imagenUrl: { type: 'string', example: '/uploads/productos/tornillo.jpg' },
            cantidad: { type: 'integer', example: 3 }
          }
        },
        CarritoSnapshot: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            items: { type: 'array', items: { $ref: '#/components/schemas/CarritoItemBase' } },
            totalItems: { type: 'integer', example: 3 },
            subtotal: { type: 'number', example: 7.5 }
          }
        }
      }
    }
  },
  apis: ['./app.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registra un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioRegistro'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 token:
 *                   type: string
 *                 usuario:
 *                   $ref: '#/components/schemas/UsuarioBase'
 *       400:
 *         description: Error de validación
 *       409:
 *         description: Ya existe una cuenta con ese email
 */
app.post('/api/auth/register', authController.registrar);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Inicia sesión y obtiene un token JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UsuarioLogin'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Error de validación
 *       401:
 *         description: Credenciales inválidas
 */
app.post('/api/auth/login', authController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: Obtiene el perfil del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usuario:
 *                   $ref: '#/components/schemas/UsuarioBase'
 *       401:
 *         description: Token inválido o ausente
 */
app.get('/api/auth/me', autenticarToken, authController.me);

/**
 * @openapi
 * /api/panel/admin:
 *   get:
 *     tags:
 *       - Panels
 *     summary: Mensaje para el panel de administrador
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bienvenido administrador
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 usuario:
 *                   $ref: '#/components/schemas/UsuarioBase'
 *       401:
 *         description: Token inválido o ausente
 *       403:
 *         description: No autorizado
 */
app.get('/api/panel/admin', autenticarToken, autorizarRoles('admin'), (req, res) => {
  return res.status(200).json({
    mensaje: 'Bienvenido al panel de administrador',
    usuario: req.usuario,
  });
});

/**
 * @openapi
 * /api/carrito:
 *   get:
 *     tags:
 *       - Carrito
 *     summary: Obtiene el carrito del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito obtenido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 carrito:
 *                   $ref: '#/components/schemas/CarritoSnapshot'
 *       401:
 *         description: Token inválido o ausente
 */
app.get('/api/carrito', autenticarToken, carritoController.obtenerCarrito);

/**
 * @openapi
 * /api/carrito/items:
 *   post:
 *     tags:
 *       - Carrito
 *     summary: Agrega un item al carrito
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['productoId']
 *             properties:
 *               productoId:
 *                 type: integer
 *                 example: 10
 *               cantidad:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Item agregado y carrito actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 carrito:
 *                   $ref: '#/components/schemas/CarritoSnapshot'
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       401:
 *         description: Token inválido o ausente
 */
app.post('/api/carrito/items', autenticarToken, carritoController.agregarItem);

/**
 * @openapi
 * /api/carrito/items/{productoId}:
 *   patch:
 *     tags:
 *       - Carrito
 *     summary: Actualiza la cantidad de un item del carrito
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productoId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto en el carrito
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['cantidad']
 *             properties:
 *               cantidad:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cantidad actualizada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 carrito:
 *                   $ref: '#/components/schemas/CarritoSnapshot'
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Token inválido o ausente
 *       404:
 *         description: Item no existe en el carrito
 */
app.patch('/api/carrito/items/:productoId', autenticarToken, carritoController.actualizarCantidad);

/**
 * @openapi
 * /api/carrito/items/{productoId}:
 *   delete:
 *     tags:
 *       - Carrito
 *     summary: Elimina un item del carrito
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productoId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto en el carrito
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 carrito:
 *                   $ref: '#/components/schemas/CarritoSnapshot'
 *       401:
 *         description: Token inválido o ausente
 *       404:
 *         description: Item no estaba en el carrito
 */
app.delete('/api/carrito/items/:productoId', autenticarToken, carritoController.eliminarItem);

/**
 * @openapi
 * /api/carrito:
 *   delete:
 *     tags:
 *       - Carrito
 *     summary: Vacía el carrito del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito vaciado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 carrito:
 *                   $ref: '#/components/schemas/CarritoSnapshot'
 *       401:
 *         description: Token inválido o ausente
 */
app.delete('/api/carrito', autenticarToken, carritoController.vaciarCarrito);

/**
 * @openapi
 * /api/panel/usuario:
 *   get:
 *     tags:
 *       - Panels
 *     summary: Mensaje para el panel de usuario
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bienvenido usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 usuario:
 *                   $ref: '#/components/schemas/UsuarioBase'
 *       401:
 *         description: Token inválido o ausente
 *       403:
 *         description: No autorizado
 */
app.get('/api/panel/usuario', autenticarToken, autorizarRoles('user', 'admin'), (req, res) => {
  return res.status(200).json({
    mensaje: 'Bienvenido al panel de usuario',
    usuario: req.usuario,
  });
});

/**
 * @openapi
 * /api/productos:
 *   post:
 *     tags:
 *       - Productos
 *     summary: Crea un nuevo producto (solo admin)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: ['nombre', 'precio', 'stock']
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: 'Tornillo M6'
 *               precio:
 *                 type: number
 *                 example: 2.5
 *               stock:
 *                 type: integer
 *                 example: 50
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Producto registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 producto:
 *                   $ref: '#/components/schemas/ProductoBase'
 *       400:
 *         description: Validación fallida
 *       401:
 *         description: Token inválido o ausente
 *       403:
 *         description: No autorizado
 */
app.post('/api/productos', autenticarToken, autorizarRoles('admin'), uploadProductoImagen, validarRegistroProducto, productoController.crearProducto);

/**
 * @openapi
 * /api/productos/{id}:
 *   put:
 *     tags:
 *       - Productos
 *     summary: Actualiza un producto existente (solo admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: ['nombre', 'precio', 'stock']
 *             properties:
 *               nombre:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *               imagen:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 producto:
 *                   $ref: '#/components/schemas/ProductoBase'
 *       400:
 *         description: Validación fallida
 *       401:
 *         description: Token inválido o ausente
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 */
app.put('/api/productos/:id', autenticarToken, autorizarRoles('admin'), uploadProductoImagen, validarRegistroProducto, productoController.actualizarProducto);

/**
 * @openapi
 * /api/productos/{id}:
 *   delete:
 *     tags:
 *       - Productos
 *     summary: Elimina un producto (solo admin)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *       401:
 *         description: Token inválido o ausente
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Producto no encontrado
 */
app.delete('/api/productos/:id', autenticarToken, autorizarRoles('admin'), productoController.eliminarProducto);

/**
 * @openapi
 * /api/productos:
 *   get:
 *     tags:
 *       - Productos
 *     summary: Lista todos los productos
 *     responses:
 *       200:
 *         description: Productos obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 total:
 *                   type: integer
 *                 productos:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProductoBase'
 */
app.get('/api/productos', productoController.obtenerProductos);

/**
 * @openapi
 * /api/productos/{id}:
 *   get:
 *     tags:
 *       - Productos
 *     summary: Obtiene un producto por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 producto:
 *                   $ref: '#/components/schemas/ProductoBase'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Producto no encontrado
 */
app.get('/api/productos/:id', productoController.obtenerProductoPorId);

module.exports = app;
