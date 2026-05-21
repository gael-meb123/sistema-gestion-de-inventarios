// index.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

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

// Rutas de productos
app.post('/api/productos', validarRegistroProducto, productoController.crearProducto);
app.get('/api/productos', productoController.obtenerProductos);
app.get('/api/productos/:id', productoController.obtenerProductoPorId);

sequelize.sync({ force: false }) 
  .then(() => {
    console.log('✓ Conexión e integración con PostgreSQL exitosa.');
    app.listen(PORT, () => {
      console.log(`Servidor Express corriendo en el puerto ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error al inicializar la base de datos:', error.message);
  });
