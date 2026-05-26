const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Producto = sequelize.define('Producto', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, 
  },
  precio: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  disponible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  imagenUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'Productos',
  timestamps: true, 
});

module.exports = Producto;