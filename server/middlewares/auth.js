const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

function extraerToken(authorization) {
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  return authorization.split(' ')[1];
}

function decodificarToken(token) {
  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (_error) {
    return null;
  }
}

const adjuntarUsuarioOpcional = (req, _res, next) => {
  const token = extraerToken(req.headers.authorization);
  const payload = decodificarToken(token);

  if (payload) {
    req.usuario = {
      id: payload.id,
      rol: payload.rol,
      email: payload.email,
    };
  }

  next();
};

const autenticarToken = async (req, res, next) => {
  if (!req.usuario?.id) {
    return res.status(401).json({ mensaje: 'Token no proporcionado o invalido' });
  }

  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: ['id', 'email', 'rol'],
    });

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Usuario no encontrado o sesion invalida' });
    }

    req.usuario = {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    };

    return next();
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al validar la sesion',
      error: error.message,
    });
  }
};

const autorizarRoles = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'No autenticado' });
  }

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    const requiereAdmin = rolesPermitidos.length === 1 && rolesPermitidos[0] === 'admin';
    return res.status(403).json({
      mensaje: requiereAdmin
        ? 'Se requiere una cuenta de administrador para esta accion'
        : 'No tienes permisos para esta accion',
    });
  }

  return next();
};

module.exports = {
  adjuntarUsuarioOpcional,
  autenticarToken,
  autorizarRoles,
};
