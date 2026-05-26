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
