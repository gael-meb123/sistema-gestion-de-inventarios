// index.js
const { DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 4000;

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
