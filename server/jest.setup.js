require('dotenv').config({ path: '.env.test' });

const sequelize = require('../config/db');

// Sincronizar base de datos antes de ejecutar pruebas
beforeAll(async () => {
  try {
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Error sincronizando base de datos de pruebas:', error);
  }
});

// Cerrar conexión después de todas las pruebas
afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Error cerrando conexión de base de datos:', error);
  }
});
