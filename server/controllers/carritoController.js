const { z } = require('zod');
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

async function obtenerOCrearCarrito(usuarioId) {
  const [carrito] = await Carrito.findOrCreate({
    where: { usuarioId },
    defaults: { usuarioId },
  });
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

async function validarProductoYStock(productoId, cantidadDeseada) {
  const producto = await Producto.findByPk(productoId);

  if (!producto) {
    return { error: 'El producto indicado no existe', status: 404 };
  }

  if (!producto.disponible || producto.stock <= 0) {
    return { error: 'El producto no esta disponible', status: 400 };
  }

  if (cantidadDeseada > producto.stock) {
    return { error: `Stock insuficiente. Disponible: ${producto.stock}`, status: 400 };
  }

  return { producto };
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
  try {
    const parsed = payloadAgregarSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        mensaje: 'Datos invalidos para agregar al carrito',
        errores: parsed.error.issues.map((issue) => issue.message),
      });
    }

    const { productoId, cantidad = 1 } = parsed.data;
    const carrito = await obtenerOCrearCarrito(req.usuario.id);

    const existente = await CarritoItem.findOne({ where: { carritoId: carrito.id, productoId } });
    const cantidadFinal = existente ? existente.cantidad + cantidad : cantidad;

    const validacion = await validarProductoYStock(productoId, cantidadFinal);
    if (validacion.error) {
      return res.status(validacion.status).json({ mensaje: validacion.error });
    }

    if (existente) {
      existente.cantidad = cantidadFinal;
      await existente.save();
    } else {
      await CarritoItem.create({ carritoId: carrito.id, productoId, cantidad });
    }

    const snapshot = await obtenerSnapshotCarrito(req.usuario.id);
    return res.status(200).json({
      mensaje: 'Producto agregado al carrito',
      carrito: snapshot,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al agregar item al carrito',
      error: error.message,
    });
  }
};

exports.actualizarCantidad = async (req, res) => {
  try {
    const productoId = Number(req.params.productoId);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      return res.status(400).json({ mensaje: 'productoId invalido' });
    }

    const parsed = payloadActualizarSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        mensaje: 'Cantidad invalida',
        errores: parsed.error.issues.map((issue) => issue.message),
      });
    }

    const { cantidad } = parsed.data;
    const carrito = await obtenerOCrearCarrito(req.usuario.id);

    const item = await CarritoItem.findOne({ where: { carritoId: carrito.id, productoId } });
    if (!item) {
      return res.status(404).json({ mensaje: 'El producto no esta en tu carrito' });
    }

    const validacion = await validarProductoYStock(productoId, cantidad);
    if (validacion.error) {
      return res.status(validacion.status).json({ mensaje: validacion.error });
    }

    item.cantidad = cantidad;
    await item.save();

    const snapshot = await obtenerSnapshotCarrito(req.usuario.id);
    return res.status(200).json({
      mensaje: 'Cantidad actualizada',
      carrito: snapshot,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al actualizar cantidad del carrito',
      error: error.message,
    });
  }
};

exports.eliminarItem = async (req, res) => {
  try {
    const productoId = Number(req.params.productoId);
    if (!Number.isInteger(productoId) || productoId <= 0) {
      return res.status(400).json({ mensaje: 'productoId invalido' });
    }

    const carrito = await obtenerOCrearCarrito(req.usuario.id);

    const eliminado = await CarritoItem.destroy({
      where: { carritoId: carrito.id, productoId },
    });

    if (!eliminado) {
      return res.status(404).json({ mensaje: 'El producto no estaba en el carrito' });
    }

    const snapshot = await obtenerSnapshotCarrito(req.usuario.id);
    return res.status(200).json({
      mensaje: 'Producto eliminado del carrito',
      carrito: snapshot,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al eliminar item del carrito',
      error: error.message,
    });
  }
};

exports.vaciarCarrito = async (req, res) => {
  try {
    const carrito = await obtenerOCrearCarrito(req.usuario.id);
    await CarritoItem.destroy({ where: { carritoId: carrito.id } });

    const snapshot = await obtenerSnapshotCarrito(req.usuario.id);
    return res.status(200).json({
      mensaje: 'Carrito vaciado',
      carrito: snapshot,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al vaciar el carrito',
      error: error.message,
    });
  }
};
