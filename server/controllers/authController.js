const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const Usuario = require('../models/Usuario');

const registroSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('El email no es valido'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'user']).optional(),
  adminSetupKey: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('El email no es valido'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, rol: usuario.rol, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

exports.registrar = async (req, res) => {
  try {
    const parsed = registroSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        errores: parsed.error.issues.map(issue => ({
          campo: issue.path[0],
          mensaje: issue.message,
        })),
      });
    }

    const { nombre, email, password, rol, adminSetupKey } = parsed.data;

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese email' });
    }

    let rolFinal = 'user';
    if (rol === 'admin') {
      const llave = process.env.ADMIN_SETUP_KEY;
      if (!llave || adminSetupKey !== llave) {
        return res.status(403).json({ mensaje: 'No autorizado para registrar administradores' });
      }
      rolFinal = 'admin';
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      passwordHash,
      rol: rolFinal,
    });

    const token = firmarToken(nuevoUsuario);

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol,
      },
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error interno al registrar el usuario',
      error: error.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        errores: parsed.error.issues.map(issue => ({
          campo: issue.path[0],
          mensaje: issue.message,
        })),
      });
    }

    const { email, password } = parsed.data;

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales invalidas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      return res.status(401).json({ mensaje: 'Credenciales invalidas' });
    }

    const token = firmarToken(usuario);

    return res.status(200).json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error interno al iniciar sesion',
      error: error.message,
    });
  }
};

exports.me = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'nombre', 'email', 'rol', 'createdAt', 'updatedAt'],
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    return res.status(200).json({ usuario });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error interno al obtener el perfil',
      error: error.message,
    });
  }
};
