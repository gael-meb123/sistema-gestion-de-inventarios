// index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const sequelize = require('./config/db');
const productoController = require('./controllers/productoController');
const { validarRegistroProducto } = require('./middlewares/validadorProducto');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());

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
 *               - descripcion
 *               - precio
 *               - stock
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Mouse inalámbrico"
 *               descripcion:
 *                 type: string
 *                 example: "Mouse ergonómico con conexión USB"
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
app.use(express.json()); 

// Rutas de productos
app.post('/api/productos', validarRegistroProducto, productoController.crearProducto);
app.get('/api/productos', productoController.obtenerProductos);
app.get('/api/productos/:id', productoController.obtenerProductoPorId);

sequelize.sync({ force: false })
  .then(() => {
    console.log('✓ Conexión e integración con PostgreSQL exitosa.');
    app.listen(PORT, () => {
      console.log(`Servidor Express corriendo en el puerto ${PORT}`);
      console.log(`Swagger disponible en http://localhost:${PORT}/api-docs`);
    });
  })
  .catch(error => {
    console.error('Error al inicializar la base de datos:', error.message);
  });
