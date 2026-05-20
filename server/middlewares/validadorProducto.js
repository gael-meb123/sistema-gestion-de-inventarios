// middlewares/validadorProducto.js
const { z } = require('zod');
const { validationResult } = require('express-validator');

// 1. Definición del esquema con Zod
const productoEsquemaZod = z.object({
    nombre: z.string({ required_error: "El nombre es obligatorio" })
        .min(2, "El nombre del producto debe tener al menos 2 caracteres"),
    precio: z.number({ required_error: "El precio es obligatorio" })
        .positive("El precio debe ser un número mayor a cero"),
    stock: z.number({ required_error: "El stock es obligatorio" })
        .int("El stock debe ser un número entero")
        .nonnegative("El stock no puede ser un valor negativo"),
});

// 2. Middleware de interceptación
const validarRegistroProducto = (req, res, next) => {

    // Ejecutamos la validación estructural de Zod
    const resultadoZod = productoEsquemaZod.safeParse(req.body);

    if (!resultadoZod.success) {
        // Damos formato a los errores de Zod para enviarlos de forma limpia al Frontend
        return res.status(400).json({
            errores: resultadoZod.error.errors.map(err => ({
                campo: err.path[0],
                mensaje: err.message
            }))
        });
    }

    // Comprobación complementaria con express-validator por si se requiere auditoría extra de Express
    const erroresExpress = validationResult(req);
    if (!erroresExpress.isEmpty()) {
        return res.status(400).json({ errores: erroresExpress.array() });
    }

    // Si los datos son perfectos, permitimos el paso al controlador
    next();
};

module.exports = { validarRegistroProducto };