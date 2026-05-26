const jwt = require('jsonwebtoken');

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

const autenticarToken = (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'Token no proporcionado o invalido' });
  }
  next();
};

const autorizarRoles = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ mensaje: 'No autenticado' });
  }

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({ mensaje: 'No tienes permisos para esta accion' });
  }

  next();
};

module.exports = {
  adjuntarUsuarioOpcional,
  autenticarToken,
  autorizarRoles,
};
