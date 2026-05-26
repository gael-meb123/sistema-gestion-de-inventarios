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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     description: Crea una nueva cuenta de usuario o administrador en el sistema
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - email
 *               - password
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Juan Perez"
 *               email:
 *                 type: string
 *                 example: "juan@example.com"
 *               password:
 *                 type: string
 *                 example: "abc12345"
 *               rol:
 *                 type: string
 *                 enum: ["user", "admin"]
 *                 example: "user"
 *               adminSetupKey:
 *                 type: string
 *                 example: "clave_super_segura"
 *                 description: "Requerido si rol es admin"
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             example:
 *               usuario:
 *                 id: 1
 *                 nombre: "Juan Perez"
 *                 email: "juan@example.com"
 *                 rol: "user"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Datos inválidos o usuario ya existe
 *         content:
 *           application/json:
 *             examples:
 *               emailExists:
 *                 summary: Email ya registrado
 *                 value:
 *                   mensaje: "El email ya está registrado"
 *               invalidEmail:
 *                 summary: Email inválido
 *                 value:
 *                   mensaje: "Email no válido"
 *               shortPassword:
 *                 summary: Contraseña muy corta
 *                 value:
 *                   mensaje: "La contraseña debe tener al menos 6 caracteres"
 *               missingAdminKey:
 *                 summary: Falta clave de admin
 *                 value:
 *                   mensaje: "Se requiere adminSetupKey para crear cuenta administrador"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Error al registrar usuario"
 */
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y retorna un token JWT válido por 24 horas
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: "juan@example.com"
 *               password:
 *                 type: string
 *                 example: "abc12345"
 *     responses:
 *       200:
 *         description: Sesión iniciada correctamente
 *         content:
 *           application/json:
 *             example:
 *               usuario:
 *                 id: 1
 *                 nombre: "Juan Perez"
 *                 email: "juan@example.com"
 *                 rol: "user"
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Email o contraseña incorrectos"
 *       400:
 *         description: Email y contraseña requeridos
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Email y contraseña son requeridos"
 *       500:
 *         description: Error interno del servidor
 */
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener datos del usuario autenticado
 *     description: Retorna la información del usuario actual basado en el token JWT proporcionado
 *     tags:
 *       - Autenticación
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario obtenidos
 *         content:
 *           application/json:
 *             example:
 *               usuario:
 *                 id: 1
 *                 nombre: "Juan Perez"
 *                 email: "juan@example.com"
 *                 rol: "user"
 *       401:
 *         description: Token ausente o inválido
 *         content:
 *           application/json:
 *             examples:
 *               noToken:
 *                 summary: Token no proporcionado
 *                 value:
 *                   mensaje: "Token no proporcionado"
 *               invalidToken:
 *                 summary: Token inválido o expirado
 *                 value:
 *                   mensaje: "Token inválido o expirado"
 */

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
 *     summary: Crear un nuevo producto (solo admin)
 *     description: Registra un producto nuevo con imagen opcional. Requiere autenticación de admin.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Productos
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: "Imagen JPG, PNG o WEBP máximo 2MB (opcional)"
 *     responses:
 *       201:
 *         description: Producto creado correctamente
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Producto registrado exitosamente en el sistema"
 *               producto:
 *                 id: 1
 *                 nombre: "Mouse inalámbrico"
 *                 precio: 250.5
 *                 stock: 20
 *                 disponible: true
 *                 imagenUrl: null
 *       400:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             examples:
 *               invalidImage:
 *                 summary: Formato de imagen inválido
 *                 value:
 *                   mensaje: "Formato inválido. Solo se permiten JPG, PNG y WEBP"
 *               imageTooLarge:
 *                 summary: Imagen muy grande
 *                 value:
 *                   mensaje: "La imagen no puede exceder 2MB"
 *               invalidPrice:
 *                 summary: Precio inválido
 *                 value:
 *                   mensaje: "El precio debe ser un número mayor a cero"
 *               invalidStock:
 *                 summary: Stock inválido
 *                 value:
 *                   mensaje: "El stock debe ser un número positivo"
 *       401:
 *         description: No autenticado (token ausente o inválido)
 *         content:
 *           application/json:
 *             examples:
 *               noToken:
 *                 summary: Token no proporcionado
 *                 value:
 *                   mensaje: "Token no proporcionado"
 *               invalidToken:
 *                 summary: Token inválido
 *                 value:
 *                   mensaje: "Token inválido o expirado"
 *       403:
 *         description: Autorización denegada (solo admins pueden crear)
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Acceso denegado. Solo administradores pueden crear productos"
 *       500:
 *         description: Error interno del servidor
 */
 /**
 * @swagger
 * /api/productos:
 *   get:
 *     summary: Listar todos los productos
 *     description: Obtiene el listado completo de productos registrados en el sistema. No requiere autenticación.
 *     tags:
 *       - Productos
 *     responses:
 *       200:
 *         description: Productos obtenidos exitosamente
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Productos obtenidos exitosamente"
 *               total: 2
 *               productos:
 *                 - id: 1
 *                   nombre: "Mouse inalámbrico"
 *                   precio: 250.5
 *                   stock: 20
 *                   disponible: true
 *                   imagenUrl: null
 *                   createdAt: "2024-05-20T10:30:00.000Z"
 *                   updatedAt: "2024-05-20T10:30:00.000Z"
 *       500:
 *         description: Error interno del servidor
 */
 /**
 * @swagger
 * /api/productos/{id}:
 *   get:
 *     summary: Obtener un producto por ID
 *     description: Retorna la información detallada de un producto específico según su ID.
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
 *             example:
 *               mensaje: "Producto obtenido exitosamente"
 *               producto:
 *                 id: 1
 *                 nombre: "Mouse inalámbrico"
 *                 precio: 250.5
 *                 stock: 20
 *                 disponible: true
 *                 imagenUrl: null
 *                 createdAt: "2024-05-20T10:30:00.000Z"
 *                 updatedAt: "2024-05-20T10:30:00.000Z"
 *       400:
 *         description: ID inválido
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "El ID debe ser un número entero positivo"
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "No se encontró un producto con el ID indicado"
 *       500:
 *         description: Error interno del servidor
 */
 /**
 * @swagger
 * /api/productos/{id}:
 *   put:
 *     summary: Actualizar un producto (solo admin)
 *     description: Actualiza los datos de un producto existente. Requiere autenticación de admin.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *                 example: "Mouse inalámbrico mejorado"
 *               precio:
 *                 type: number
 *                 example: 299.99
 *               stock:
 *                 type: integer
 *                 example: 15
 *               imagen:
 *                 type: string
 *                 format: binary
 *                 description: "Nueva imagen JPG, PNG o WEBP (opcional)"
 *     responses:
 *       200:
 *         description: Producto actualizado correctamente
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Producto actualizado exitosamente"
 *               producto:
 *                 id: 1
 *                 nombre: "Mouse inalámbrico mejorado"
 *                 precio: 299.99
 *                 stock: 15
 *                 disponible: true
 *       400:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "El precio debe ser un número mayor a cero"
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Token no proporcionado"
 *       403:
 *         description: Autorización denegada (solo admins)
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Acceso denegado. Solo administradores pueden actualizar productos"
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "No se encontró un producto con el ID indicado"
 *       500:
 *         description: Error interno del servidor
 */
 /**
 * @swagger
 * /api/productos/{id}:
 *   delete:
 *     summary: Eliminar un producto (solo admin)
 *     description: Elimina un producto del sistema. Requiere autenticación de admin.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Productos
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Producto eliminado exitosamente del sistema"
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Token no proporcionado"
 *       403:
 *         description: Autorización denegada (solo admins)
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Acceso denegado. Solo administradores pueden eliminar productos"
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "No se encontró un producto con el ID indicado"
 *       500:
 *         description: Error interno del servidor
 */
// Rutas de productos
app.post('/api/productos', autenticarToken, autorizarRoles('admin'), uploadProductoImagen, validarRegistroProducto, productoController.crearProducto);
app.put('/api/productos/:id', autenticarToken, autorizarRoles('admin'), uploadProductoImagen, validarRegistroProducto, productoController.actualizarProducto);
app.delete('/api/productos/:id', autenticarToken, autorizarRoles('admin'), productoController.eliminarProducto);
app.get('/api/productos', productoController.obtenerProductos);
app.get('/api/productos/:id', productoController.obtenerProductoPorId);

/**
 * @swagger
 * /api/carrito:
 *   get:
 *     summary: Obtener carrito del usuario autenticado
 *     description: Retorna el carrito con todos los items del usuario actual. Requiere autenticación.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Carrito
 *     responses:
 *       200:
 *         description: Carrito obtenido exitosamente
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Carrito obtenido exitosamente"
 *               carrito:
 *                 id: 1
 *                 usuarioId: 1
 *                 items:
 *                   - id: 1
 *                     productoId: 1
 *                     cantidad: 2
 *                     producto:
 *                       id: 1
 *                       nombre: "Mouse inalámbrico"
 *                       precio: 250.5
 *                 total: 501.00
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             examples:
 *               noToken:
 *                 value:
 *                   mensaje: "Token no proporcionado"
 *               invalidToken:
 *                 value:
 *                   mensaje: "Token inválido o expirado"
 *       500:
 *         description: Error interno del servidor
 */
/**
 * @swagger
 * /api/carrito/items:
 *   post:
 *     summary: Agregar producto al carrito
 *     description: Añade un producto al carrito del usuario autenticado o actualiza cantidad si ya existe.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Carrito
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productoId
 *               - cantidad
 *             properties:
 *               productoId:
 *                 type: integer
 *                 example: 1
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Producto agregado al carrito
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Producto agregado al carrito exitosamente"
 *               carrito:
 *                 items: []
 *                 total: 0
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             examples:
 *               outOfStock:
 *                 summary: Producto sin stock
 *                 value:
 *                   mensaje: "No hay suficiente stock disponible"
 *               invalidQuantity:
 *                 summary: Cantidad inválida
 *                 value:
 *                   mensaje: "La cantidad debe ser mayor a cero"
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Token no proporcionado"
 *       404:
 *         description: Producto no encontrado
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Producto no encontrado"
 *       500:
 *         description: Error interno del servidor
 */
/**
 * @swagger
 * /api/carrito/items/{productoId}:
 *   patch:
 *     summary: Actualizar cantidad en el carrito
 *     description: Modifica la cantidad de un producto en el carrito del usuario.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Carrito
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto en el carrito
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *             properties:
 *               cantidad:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *     responses:
 *       200:
 *         description: Cantidad actualizada
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Cantidad actualizada exitosamente"
 *               carrito:
 *                 items: []
 *                 total: 0
 *       400:
 *         description: Validación fallida
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Stock insuficiente. Máximo disponible: 15"
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Producto no en carrito
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Producto no encontrado en el carrito"
 *       500:
 *         description: Error interno
 */
/**
 * @swagger
 * /api/carrito/items/{productoId}:
 *   delete:
 *     summary: Eliminar producto del carrito
 *     description: Remueve un producto específico del carrito del usuario.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Carrito
 *     parameters:
 *       - in: path
 *         name: productoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto a eliminar
 *     responses:
 *       200:
 *         description: Producto eliminado del carrito
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Producto eliminado del carrito exitosamente"
 *               carrito:
 *                 items: []
 *                 total: 0
 *       401:
 *         description: No autenticado
 *       404:
 *         description: Producto no en carrito
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Producto no encontrado en el carrito"
 *       500:
 *         description: Error interno
 */
/**
 * @swagger
 * /api/carrito:
 *   delete:
 *     summary: Vaciar todo el carrito
 *     description: Elimina todos los items del carrito del usuario autenticado.
 *     security:
 *       - BearerAuth: []
 *     tags:
 *       - Carrito
 *     responses:
 *       200:
 *         description: Carrito vaciado exitosamente
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Carrito vaciado exitosamente"
 *               carrito:
 *                 items: []
 *                 total: 0
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error interno
 */

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
