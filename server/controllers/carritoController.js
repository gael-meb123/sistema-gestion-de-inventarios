const { z } = require('zod');
const sequelize = require('../config/db');
const Carrito = require('../models/Carrito');
const CarritoItem = require('../models/CarritoItem');
const Producto = require('../models/Producto');

const numeroDesdeInput = (schema) => z.preprocess((valor) => {
  if (typeof valor === 'string') {
    const limpio = valor.trim();
    if (limpio === '') {
      return undefined;
    }
    return Number(limpio);
  }
  return valor;
}, schema);

const payloadAgregarSchema = z.object({
  productoId: numeroDesdeInput(z.number().int().positive()),
  cantidad: numeroDesdeInput(z.number().int().positive()).optional(),
});

const payloadActualizarSchema = z.object({
  cantidad: numeroDesdeInput(z.number().int().positive()),
});

async function obtenerOCrearCarrito(usuarioId, transaction = null) {
  const opciones = {
    where: { usuarioId },
    defaults: { usuarioId },
  };

  if (transaction) {
    opciones.transaction = transaction;
  }

  const [carrito] = await Carrito.findOrCreate(opciones);
  return carrito;
}

async function obtenerSnapshotCarrito(usuarioId) {
  const carrito = await obtenerOCrearCarrito(usuarioId);

  const items = await CarritoItem.findAll({
    where: { carritoId: carrito.id },
    include: [{
      model: Producto,
      attributes: ['id', 'nombre', 'precio', 'stock', 'disponible', 'imagenUrl'],
    }],
    order: [['id', 'ASC']],
  });

  const normalizados = items.map((item) => ({
    productoId: item.productoId,
    nombre: item.Producto?.nombre,
    precio: Number(item.Producto?.precio || 0),
    stock: item.Producto?.stock ?? 0,
    disponible: Boolean(item.Producto?.disponible),
    imagenUrl: item.Producto?.imagenUrl || null,
    cantidad: item.cantidad,
  }));

  const totalItems = normalizados.reduce((acc, item) => acc + item.cantidad, 0);
  const subtotal = normalizados.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  return {
    id: carrito.id,
    items: normalizados,
    totalItems,
    subtotal,
  };
}

async function resumenStockProducto(productoId, transaction) {
  const producto = await Producto.findByPk(productoId, {
    attributes: ['id', 'stock', 'disponible'],
    transaction,
  });

  if (!producto) {
    return null;
  }

  return {
    productoId: producto.id,
    stock: producto.stock,
    disponible: producto.disponible,
  };
}

async function resumenesStockProductos(productoIds, transaction) {
  const unicos = [...new Set(productoIds)];
  const resumenes = await Promise.all(
    unicos.map((id) => resumenStockProducto(id, transaction)),
  );
  return resumenes.filter(Boolean);
}

async function validarProductoParaReserva(producto, unidadesAReservar) {
  if (!producto) {
    return { error: 'El producto indicado no existe', status: 404 };
  }

  if (unidadesAReservar <= 0) {
    return { producto };
  }

  if (!producto.disponible || producto.stock <= 0) {
    return { error: 'El producto no esta disponible', status: 400 };
  }

  if (unidadesAReservar > producto.stock) {
    return { error: `Stock insuficiente. Disponible: ${producto.stock}`, status: 400 };
  }

  return { producto };
}

async function ajustarStockProducto(producto, unidadesAReservar, transaction) {
  const validacion = await validarProductoParaReserva(producto, unidadesAReservar);
  if (validacion.error) {
    return validacion;
  }

  producto.stock -= unidadesAReservar;
  producto.disponible = producto.stock > 0;
  await producto.save({ transaction });

  return { producto };
}

async function obtenerProductoEnTransaccion(productoId, transaction) {
  return Producto.findByPk(productoId, { transaction });
}

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

exports.obtenerCarrito = async (req, res) => {
  try {
    const snapshot = await obtenerSnapshotCarrito(req.usuario.id);
    return res.status(200).json({ carrito: snapshot });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener el carrito',
      error: error.message,
    });
  }
};

exports.agregarItem = async (req, res) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const parsed = payloadAgregarSchema.safeParse(req.body);
    if (!parsed.success) {
      await revertirTransaccion(transaction);
      return res.status(400).json({
        mensaje: 'Datos invalidos para agregar al carrito',
        errores: parsed.error.issues.map((issue) => issue.message),
      });
    }

    const { productoId, cantidad = 1 } = parsed.data;
    const carrito = await obtenerOCrearCarrito(req.usuario.id, transaction);

    const existente = await CarritoItem.findOne({
      where: { carritoId: carrito.id, productoId },
      transaction,
    });
    const cantidadAnterior = existente?.cantidad || 0;
    const cantidadFinal = cantidadAnterior + cantidad;
    const unidadesAReservar = cantidadFinal - cantidadAnterior;

    const producto = await obtenerProductoEnTransaccion(productoId, transaction);
    const validacion = await validarProductoParaReserva(producto, unidadesAReservar);
    if (validacion.error) {
      await revertirTransaccion(transaction);
      return res.status(validacion.status).json({ mensaje: validacion.error });
    }

    const ajuste = await ajustarStockProducto(producto, unidadesAReservar, transaction);
    if (ajuste.error) {
      await revertirTransaccion(transaction);
      return res.status(ajuste.status).json({ mensaje: ajuste.error });
    }

    if (existente) {
      existente.cantidad = cantidadFinal;
      await existente.save({ transaction });
    } else {
      await CarritoItem.create({
        carritoId: carrito.id,
        productoId,
        cantidad: cantidadFinal,
      }, { transaction });
    }

    await transaction.commit();

    const snapshot = await obtenerSnapshotCarrito(req.usuario.id);
    const productosActualizados = await resumenesStockProductos([productoId]);

    return res.status(200).json({
      mensaje: 'Producto agregado al carrito',
      carrito: snapshot,
      productosActualizados,
    });
  } catch (error) {
    await revertirTransaccion(transaction);
    return res.status(500).json({
      mensaje: 'Error al agregar item al carrito',
      error: error.message,
    });
  }
};

exports.actualizarCantidad = async (req, res) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const productoId = Number(req.params.productoId);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      await revertirTransaccion(transaction);
      return res.status(400).json({ mensaje: 'productoId invalido' });
    }

    const parsed = payloadActualizarSchema.safeParse(req.body);
    if (!parsed.success) {
      await revertirTransaccion(transaction);
      return res.status(400).json({
        mensaje: 'Cantidad invalida',
        errores: parsed.error.issues.map((issue) => issue.message),
      });
    }

    const { cantidad } = parsed.data;
    const carrito = await obtenerOCrearCarrito(req.usuario.id, transaction);

    const item = await CarritoItem.findOne({
      where: { carritoId: carrito.id, productoId },
      transaction,
    });
    if (!item) {
      await revertirTransaccion(transaction);
      return res.status(404).json({ mensaje: 'El producto no esta en tu carrito' });
    }

    const unidadesAReservar = cantidad - item.cantidad;
    const producto = await obtenerProductoEnTransaccion(productoId, transaction);
    const validacion = await validarProductoParaReserva(producto, unidadesAReservar);
    if (validacion.error) {
      await revertirTransaccion(transaction);
      return res.status(validacion.status).json({ mensaje: validacion.error });
    }

    const ajuste = await ajustarStockProducto(producto, unidadesAReservar, transaction);
    if (ajuste.error) {
      await revertirTransaccion(transaction);
      return res.status(ajuste.status).json({ mensaje: ajuste.error });
    }

    item.cantidad = cantidad;
    await item.save({ transaction });

    await transaction.commit();

    const snapshot = await obtenerSnapshotCarrito(req.usuario.id);
    const productosActualizados = await resumenesStockProductos([productoId]);

    return res.status(200).json({
      mensaje: 'Cantidad actualizada',
      carrito: snapshot,
      productosActualizados,
    });
  } catch (error) {
    await revertirTransaccion(transaction);
    return res.status(500).json({
      mensaje: 'Error al actualizar cantidad del carrito',
      error: error.message,
    });
  }
};

exports.eliminarItem = async (req, res) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const productoId = Number(req.params.productoId);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      await revertirTransaccion(transaction);
      return res.status(400).json({ mensaje: 'productoId invalido' });
    }

    const carrito = await obtenerOCrearCarrito(req.usuario.id, transaction);

    const item = await CarritoItem.findOne({
      where: { carritoId: carrito.id, productoId },
      transaction,
    });

    if (!item) {
      await revertirTransaccion(transaction);
      return res.status(404).json({ mensaje: 'El producto no estaba en el carrito' });
    }

    const producto = await obtenerProductoEnTransaccion(productoId, transaction);
    if (producto) {
      producto.stock += item.cantidad;
      producto.disponible = producto.stock > 0;
      await producto.save({ transaction });
    }

    await item.destroy({ transaction });
    await transaction.commit();

    const snapshot = await obtenerSnapshotCarrito(req.usuario.id);
    const productosActualizados = await resumenesStockProductos([productoId]);

    return res.status(200).json({
      mensaje: 'Producto eliminado del carrito',
      carrito: snapshot,
      productosActualizados,
    });
  } catch (error) {
    await revertirTransaccion(transaction);
    return res.status(500).json({
      mensaje: 'Error al eliminar item del carrito',
      error: error.message,
    });
  }
};

exports.vaciarCarrito = async (req, res) => {
  let transaction;

  try {
    transaction = await sequelize.transaction();
    const carrito = await obtenerOCrearCarrito(req.usuario.id, transaction);
    const items = await CarritoItem.findAll({
      where: { carritoId: carrito.id },
      transaction,
    });

    const productoIds = [];

    for (const item of items) {
      productoIds.push(item.productoId);
      const producto = await obtenerProductoEnTransaccion(item.productoId, transaction);
      if (producto) {
        producto.stock += item.cantidad;
        producto.disponible = producto.stock > 0;
        await producto.save({ transaction });
      }
    }

    await CarritoItem.destroy({ where: { carritoId: carrito.id }, transaction });
    await transaction.commit();

    const snapshot = await obtenerSnapshotCarrito(req.usuario.id);
    const productosActualizados = await resumenesStockProductos(productoIds);

    return res.status(200).json({
      mensaje: 'Carrito vaciado',
      carrito: snapshot,
      productosActualizados,
    });
  } catch (error) {
    await revertirTransaccion(transaction);
    return res.status(500).json({
      mensaje: 'Error al vaciar el carrito',
      error: error.message,
    });
  }
};
