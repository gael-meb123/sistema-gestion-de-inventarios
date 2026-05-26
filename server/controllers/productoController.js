const Producto = require('../models/Producto');
const fs = require('fs');
const path = require('path');

const eliminarImagenSiExiste = (imagenUrl) => {
  if (!imagenUrl) {
    return;
  }

  const nombreArchivo = path.basename(imagenUrl);
  const rutaArchivo = path.join(__dirname, '..', 'uploads', 'productos', nombreArchivo);

  fs.unlink(rutaArchivo, (error) => {
    if (error && error.code !== 'ENOENT') {
      console.error('No se pudo eliminar imagen previa:', error.message);
    }
  });
};

exports.crearProducto = async (req, res) => {
  try {
    const { nombre, precio, stock } = req.body;
    const disponible = stock > 0;
    const imagenUrl = req.file ? `/uploads/productos/${req.file.filename}` : null;

    const nuevoProducto = await Producto.create({
      nombre,
      precio,
      stock,
      disponible,
      imagenUrl,
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

// PUT /api/productos/:id — Actualizar producto (admin)
exports.actualizarProducto = async (req, res) => {
  try {
    const idNumerico = Number(req.params.id);
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      return res.status(400).json({ mensaje: 'El ID debe ser un número entero positivo' });
    }

    const producto = await Producto.findByPk(idNumerico);
    if (!producto) {
      return res.status(404).json({ mensaje: `No se encontró un producto con el ID ${idNumerico}` });
    }

    const { nombre, precio, stock } = req.body;
    const imagenUrlAnterior = producto.imagenUrl;
    const imagenUrlNueva = req.file ? `/uploads/productos/${req.file.filename}` : imagenUrlAnterior;

    producto.nombre = nombre;
    producto.precio = precio;
    producto.stock = stock;
    producto.disponible = stock > 0;
    producto.imagenUrl = imagenUrlNueva;

    await producto.save();

    if (req.file && imagenUrlAnterior && imagenUrlAnterior !== imagenUrlNueva) {
      eliminarImagenSiExiste(imagenUrlAnterior);
    }

    return res.status(200).json({
      mensaje: 'Producto actualizado exitosamente',
      producto,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error interno al actualizar el producto',
      error: error.message,
    });
  }
};

// DELETE /api/productos/:id — Eliminar producto (admin)
exports.eliminarProducto = async (req, res) => {
  try {
    const idNumerico = Number(req.params.id);
    if (!Number.isInteger(idNumerico) || idNumerico <= 0) {
      return res.status(400).json({ mensaje: 'El ID debe ser un número entero positivo' });
    }

    const producto = await Producto.findByPk(idNumerico);
    if (!producto) {
      return res.status(404).json({ mensaje: `No se encontró un producto con el ID ${idNumerico}` });
    }

    const imagenUrlEliminar = producto.imagenUrl;
    await producto.destroy();

    eliminarImagenSiExiste(imagenUrlEliminar);

    return res.status(200).json({
      mensaje: 'Producto eliminado exitosamente',
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error interno al eliminar el producto',
      error: error.message,
    });
  }
};
