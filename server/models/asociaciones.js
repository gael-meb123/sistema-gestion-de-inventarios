const Usuario = require('./Usuario');
const Producto = require('./Producto');
const Carrito = require('./Carrito');
const CarritoItem = require('./CarritoItem');

let inicializadas = false;

function inicializarAsociaciones() {
  if (inicializadas) {
    return;
  }

  Usuario.hasOne(Carrito, { foreignKey: 'usuarioId', onDelete: 'CASCADE' });
  Carrito.belongsTo(Usuario, { foreignKey: 'usuarioId' });

  Carrito.hasMany(CarritoItem, { foreignKey: 'carritoId', onDelete: 'CASCADE' });
  CarritoItem.belongsTo(Carrito, { foreignKey: 'carritoId' });

  Producto.hasMany(CarritoItem, { foreignKey: 'productoId' });
  CarritoItem.belongsTo(Producto, { foreignKey: 'productoId' });

  inicializadas = true;
}

module.exports = {
  inicializarAsociaciones,
};
