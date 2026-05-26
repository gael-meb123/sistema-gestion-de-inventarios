const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const CarritoItem = sequelize.define('CarritoItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  carritoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  productoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  tableName: 'CarritoItems',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['carritoId', 'productoId'],
    },
  ],
});

module.exports = CarritoItem;
