const { Sequelize } = require('sequelize');

const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: envFile });

const isTest = process.env.NODE_ENV === 'test';
const databaseUrl = process.env.DATABASE_URL;

if (!isTest && !databaseUrl) {
  console.error('❌ ERROR: DATABASE_URL no está configurada en variables de entorno');
  process.exit(1);
}

const sequelize = isTest
  ? new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    })
  : new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl:
          process.env.NODE_ENV === 'production'
            ? { require: true, rejectUnauthorized: false }
            : false,
      },
    });

module.exports = sequelize;