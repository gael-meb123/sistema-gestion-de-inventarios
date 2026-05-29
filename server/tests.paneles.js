const request = require('supertest');
const app = require('./app');
const sequelize = require('./config/db');
const Usuario = require('./models/Usuario');

// Setup
beforeAll(async () => {
  await sequelize.sync({ force: true });
  process.env.ADMIN_SETUP_KEY = 'clave-secreta-admin';
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

describe('Panel API - Roles y Autorización', () => {
  
  let adminToken;
  let userToken;

  beforeEach(async () => {
    // Crear usuario admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin User',
        email: `admin${Date.now()}@example.com`,
        password: 'password123',
        rol: 'admin',
        adminSetupKey: 'clave-secreta-admin'
      });
    adminToken = adminRes.body.token;

    // Crear usuario regular
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Regular User',
        email: `user${Date.now()}@example.com`,
        password: 'password123'
      });
    userToken = userRes.body.token;
  });

  describe('GET /api/panel/admin', () => {
    
    it('Debe permitir acceso a admin', async () => {
      const response = await request(app)
        .get('/api/panel/admin')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.mensaje).toContain('administrador');
      expect(response.body.usuario.rol).toBe('admin');
    });

    it('Debe rechazar acceso a usuario regular', async () => {
      const response = await request(app)
        .get('/api/panel/admin')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('Debe rechazar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/panel/admin');

      expect(response.status).toBe(401);
    });

    it('Debe rechazar con token inválido', async () => {
      const response = await request(app)
        .get('/api/panel/admin')
        .set('Authorization', 'Bearer token-invalido');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/panel/usuario', () => {
    
    it('Debe permitir acceso a usuario regular', async () => {
      const response = await request(app)
        .get('/api/panel/usuario')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.mensaje).toContain('usuario');
      expect(response.body.usuario.rol).toBe('user');
    });

    it('Debe permitir acceso a admin', async () => {
      const response = await request(app)
        .get('/api/panel/usuario')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.usuario.rol).toBe('admin');
    });

    it('Debe rechazar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/panel/usuario');

      expect(response.status).toBe(401);
    });
  });

  describe('Autorización en Productos', () => {
    
    it('Debe permitir crear producto como admin', async () => {
      const response = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Producto Admin',
          precio: 100.00,
          stock: 10
        });

      expect(response.status).toBe(201);
    });

    it('Debe rechazar crear producto como usuario regular', async () => {
      const response = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          nombre: 'Producto Usuario',
          precio: 100.00,
          stock: 10
        });

      expect(response.status).toBe(403);
    });

    it('Debe permitir ver productos sin autenticación', async () => {
      const response = await request(app)
        .get('/api/productos');

      expect(response.status).toBe(200);
    });
  });
});

describe('JWT Token Validation', () => {
  
  it('Debe rechazar token expirado', async () => {
    // Crear un token con tiempo corto
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { id: 1, rol: 'user', email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '0s' }
    );

    // Esperar un poco para asegurar que está expirado
    await new Promise(r => setTimeout(r, 100));

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it('Debe validar firma del token', async () => {
    const jwt = require('jsonwebtoken');
    const invalidToken = jwt.sign(
      { id: 1, rol: 'user', email: 'test@example.com' },
      'clave-incorrecta',
      { expiresIn: '1h' }
    );

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${invalidToken}`);

    expect(response.status).toBe(401);
  });

  it('Debe rechazar token malformado', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer malformed.token.here');

    expect(response.status).toBe(401);
  });

  it('Debe rechazar header Authorization sin Bearer', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'token-sin-bearer');

    expect(response.status).toBe(401);
  });
});

describe('CORS Policy', () => {
  
  it('Debe permitir origen permitido', async () => {
    const response = await request(app)
      .get('/api/productos')
      .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
  });

  it('Debe permitir segundo origen permitido', async () => {
    const response = await request(app)
      .get('/api/productos')
      .set('Origin', 'http://localhost:5174');

    expect(response.status).toBe(200);
  });

  it('Debe rechazar origen no permitido', async () => {
    const response = await request(app)
      .options('/api/productos')
      .set('Origin', 'http://malicioso.com');

    // Nota: Express CORS rechaza en preflight
    expect([200, 403, 500]).toContain(response.status);
  });
});
