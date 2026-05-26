// index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { DataTypes } = require('sequelize');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const sequelize = require('./config/db');
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
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(adjuntarUsuarioOpcional);

morgan.token('userId', req => req.usuario?.id || 'anon');
morgan.token('rol', req => req.usuario?.rol || 'guest');

app.use(morgan(':method :url :status :response-time ms user=:userId rol=:rol'));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de Swagger
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
    ]
  },
  apis: ['./index.js', './controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas de autenticacion
app.post('/api/auth/register', authController.registrar);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', autenticarToken, authController.me);

// Rutas por rol para paneles
app.get('/api/panel/admin', autenticarToken, autorizarRoles('admin'), (req, res) => {
  return res.status(200).json({
    mensaje: 'Bienvenido al panel de administrador',
    usuario: req.usuario,
  });
});

// Rutas de carrito (persistidas por usuario)
app.get('/api/carrito', autenticarToken, carritoController.obtenerCarrito);
app.post('/api/carrito/items', autenticarToken, carritoController.agregarItem);
app.patch('/api/carrito/items/:productoId', autenticarToken, carritoController.actualizarCantidad);
app.delete('/api/carrito/items/:productoId', autenticarToken, carritoController.eliminarItem);
app.delete('/api/carrito', autenticarToken, carritoController.vaciarCarrito);

app.get('/api/panel/usuario', autenticarToken, autorizarRoles('user', 'admin'), (req, res) => {
  return res.status(200).json({
    mensaje: 'Bienvenido al panel de usuario',
    usuario: req.usuario,
  });
});

/**
 * @swagger
 * /api/productos:
 *   post:
 *     summary: Crear un nuevo producto
 *     description: Registra un producto nuevo dentro del sistema de inventarios.
 *     tags:
 *       - Productos
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - precio
 *               - stock
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Mouse inalámbrico"
 *               precio:
 *                 type: number
 *                 example: 250.50
 *               stock:
 *                 type: integer
 *                 example: 20
 *     responses:
 *       201:
 *         description: Producto creado correctamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
/**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Listar todos los productos
 *     description: Obtiene el listado completo de productos registrados en el sistema.
 *     tags:
 *       - Productos
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
 *                   example: "Productos obtenidos exitosamente"
 *                 total:
 *                   type: integer
 *                   example: 2
 *                 productos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nombre:
 *                         type: string
 *                         example: "Mouse inalámbrico"
 *                       precio:
 *                         type: number
 *                         example: 250.5
 *                       stock:
 *                         type: integer
 *                         example: 20
 *                       disponible:
 *                         type: boolean
 *                         example: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Error interno del servidor
 */
/**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     description: Retorna la información de un producto específico según su ID.
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
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
 *                   example: "Producto obtenido exitosamente"
 *                 producto:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nombre:
 *                       type: string
 *                       example: "Mouse inalámbrico"
 *                     precio:
 *                       type: number
 *                       example: 250.5
 *                     stock:
 *                       type: integer
 *                       example: 20
 *                     disponible:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: El ID debe ser un número entero positivo
 *       404:
 *         description: No se encontró un producto con el ID indicado
 *       500:
 *         description: Error interno del servidor
 */
// Rutas de productos
app.post('/api/productos', autenticarToken, autorizarRoles('admin'), uploadProductoImagen, validarRegistroProducto, productoController.crearProducto);
app.put('/api/productos/:id', autenticarToken, autorizarRoles('admin'), uploadProductoImagen, validarRegistroProducto, productoController.actualizarProducto);
app.delete('/api/productos/:id', autenticarToken, autorizarRoles('admin'), productoController.eliminarProducto);
app.get('/api/productos', productoController.obtenerProductos);
app.get('/api/productos/:id', productoController.obtenerProductoPorId);

const asegurarColumnaImagenProducto = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    const columnas = await queryInterface.describeTable('Productos');
    if (!columnas.imagenUrl) {
      await queryInterface.addColumn('Productos', 'imagenUrl', {
        type: DataTypes.STRING,
        allowNull: true,
      });
      console.log('Se agrego la columna imagenUrl en Productos.');
    }
  } catch (error) {
    console.error('No se pudo verificar/agregar imagenUrl en Productos:', error.message);
  }
};

sequelize.sync({ force: false })
  .then(async () => {
    await asegurarColumnaImagenProducto();
    console.log('✓ Conexión e integración con PostgreSQL exitosa.');
    app.listen(PORT, () => {
      console.log(`Servidor Express corriendo en el puerto ${PORT}`);
      console.log(`Swagger disponible en http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(error => {
    console.error('Error al inicializar la base de datos:', error.message);
  });
