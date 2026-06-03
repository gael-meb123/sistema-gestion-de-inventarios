const { z } = require('zod');
const sequelize = require('../config/db');
const Carrito = require('../models/Carrito');
const CarritoItem = require('../models/CarritoItem');
const Producto = require('../models/Producto');
const Pedido = require('../models/Pedido');
const PedidoItem = require('../models/PedidoItem');

const checkoutTarjetaSchema = z.object({
  titular: z.string().trim().min(3, 'El titular debe tener al menos 3 caracteres'),
  numero: z.string().trim().transform((valor) => valor.replace(/\D/g, ''))
    .pipe(z.string().min(13, 'Numero de tarjeta invalido').max(19, 'Numero de tarjeta invalido')),
  expiracion: z.string().trim().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiracion invalida (MM/YY)'),
  cvv: z.string().trim().regex(/^\d{3,4}$/, 'CVV invalido'),
});

async function revertirTransaccion(transaction) {
  if (!transaction || transaction.finished) {
    return;
  }

  try {
    await transaction.rollback();
  } catch (_error) {
    // En SQLite la transacción puede cerrarse antes del rollback explícito.
  }
}

async function obtenerSnapshotCarritoVacio(carritoId) {
  return {
    id: carritoId,
    items: [],
    totalItems: 0,
    subtotal: 0,
  };
}

exports.confirmarCompra = async (req, res) => {
  let transaction;

  try {
    const parsed = checkoutTarjetaSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        mensaje: 'Datos de tarjeta invalidos',
        errores: parsed.error.issues.map((issue) => issue.message),
      });
    }

    transaction = await sequelize.transaction();

    const carrito = await Carrito.findOne({
      where: { usuarioId: req.usuario.id },
      transaction,
    });

    if (!carrito) {
      await revertirTransaccion(transaction);
      return res.status(400).json({ mensaje: 'El carrito esta vacio' });
    }

    const items = await CarritoItem.findAll({
      where: { carritoId: carrito.id },
      include: [{
        model: Producto,
        attributes: ['id', 'nombre', 'precio', 'stock', 'disponible', 'imagenUrl'],
      }],
      transaction,
    });

    if (items.length === 0) {
      await revertirTransaccion(transaction);
      return res.status(400).json({ mensaje: 'El carrito esta vacio' });
    }

    const lineas = items.map((item) => {
      const precioUnitario = Number(item.Producto?.precio || 0);
      return {
        productoId: item.productoId,
        nombre: item.Producto?.nombre,
        cantidad: item.cantidad,
        precioUnitario,
        subtotal: precioUnitario * item.cantidad,
        imagenUrl: item.Producto?.imagenUrl || null,
      };
    });

    const total = lineas.reduce((acc, linea) => acc + linea.subtotal, 0);
    const { titular, numero } = parsed.data;
    const ultimos4 = numero.slice(-4);

    const pedido = await Pedido.create({
      usuarioId: req.usuario.id,
      total,
      estado: 'completado',
      metodoPago: 'simulado',
      titularTarjeta: titular,
      ultimos4,
    }, { transaction });

    await PedidoItem.bulkCreate(
      lineas.map((linea) => ({
        pedidoId: pedido.id,
        productoId: linea.productoId,
        cantidad: linea.cantidad,
        precioUnitario: linea.precioUnitario,
      })),
      { transaction },
    );

    await CarritoItem.destroy({
      where: { carritoId: carrito.id },
      transaction,
    });

    await transaction.commit();

    const pedidoRespuesta = {
      id: pedido.id,
      total,
      estado: pedido.estado,
      metodoPago: pedido.metodoPago,
      ultimos4,
      fecha: pedido.createdAt,
      items: lineas.map((linea) => ({
        productoId: linea.productoId,
        nombre: linea.nombre,
        cantidad: linea.cantidad,
        precioUnitario: linea.precioUnitario,
        subtotal: linea.subtotal,
        imagenUrl: linea.imagenUrl,
      })),
    };

    return res.status(201).json({
      mensaje: 'Compra realizada exitosamente',
      pedido: pedidoRespuesta,
      carrito: await obtenerSnapshotCarritoVacio(carrito.id),
    });
  } catch (error) {
    await revertirTransaccion(transaction);
    return res.status(500).json({
      mensaje: 'Error al procesar la compra',
      error: error.message,
    });
  }
};
