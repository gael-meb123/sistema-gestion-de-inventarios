const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Pedido = sequelize.define('Pedido', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'completado',
  },
  metodoPago: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'simulado',
  },
  titularTarjeta: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  ultimos4: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'Pedidos',
  timestamps: true,
});

module.exports = Pedido;
