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
      }
    }
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

// Rutas de productos
app.post('/api/productos', autenticarToken, autorizarRoles('admin'), uploadProductoImagen, validarRegistroProducto, productoController.crearProducto);
app.put('/api/productos/:id', autenticarToken, autorizarRoles('admin'), uploadProductoImagen, validarRegistroProducto, productoController.actualizarProducto);
app.delete('/api/productos/:id', autenticarToken, autorizarRoles('admin'), productoController.eliminarProducto);
app.get('/api/productos', productoController.obtenerProductos);
app.get('/api/productos/:id', productoController.obtenerProductoPorId);

module.exports = app;
