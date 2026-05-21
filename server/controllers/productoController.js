const Producto = require('../models/Producto');

exports.crearProducto = async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;

    const disponible = stock > 0;

    const nuevoProducto = await Producto.create({
      nombre,
      precio,
      stock,
      disponible
    });

    return res.status(201).json({
      mensaje: "Producto registrado exitosamente en el sistema",
      producto: nuevoProducto
    });

  } catch (error) {
    return res.status(500).json({
      mensaje: "Error interno en el servidor al intentar guardar el producto",
      error: error.message
    });
  }
};