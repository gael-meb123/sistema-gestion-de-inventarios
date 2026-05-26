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

// GET /api/productos — Listar todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      order: [['id', 'ASC']]
    });

    return res.status(200).json({
      mensaje: "Productos obtenidos exitosamente",
      total: productos.length,
      productos
    });

  } catch (error) {
    return res.status(500).json({
      mensaje: "Error interno en el servidor al obtener los productos",
      error: error.message
    });
  }
};

// GET /api/productos/:id — Obtener un producto por ID
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    // Validamos que el id sea un entero positivo
    const idNumerico = Number(id);
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      return res.status(400).json({
        mensaje: "El ID debe ser un número entero positivo"
      });
    }

    const producto = await Producto.findByPk(idNumerico);

    if (!producto) {
      return res.status(404).json({
        mensaje: `No se encontró un producto con el ID ${idNumerico}`
      });
    }

    return res.status(200).json({
      mensaje: "Producto obtenido exitosamente",
      producto
    });

  } catch (error) {
    return res.status(500).json({
      mensaje: "Error interno en el servidor al obtener el producto",
      error: error.message
    });
  }
};
