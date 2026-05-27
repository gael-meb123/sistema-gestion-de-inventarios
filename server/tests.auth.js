const request = require('supertest');
const app = require('../app');
const sequelize = require('../config/db');
const Usuario = require('../models/Usuario');
const bcrypt = require('bcryptjs');

// Setup: sincronizar BD antes de ejecutar tests
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

// Cleanup: limpiar después de los tests
afterAll(async () => {
  await sequelize.close();
});

describe('Auth API - POST /api/auth/register', () => {
  
  it('Debe registrar un nuevo usuario exitosamente', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('usuario');
    expect(response.body.usuario.email).toBe('juan@example.com');
    expect(response.body.usuario.rol).toBe('user');
  });

  it('Debe validar que el email sea válido', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Test User',
        email: 'email-invalido',
        password: 'password123'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errores');
  });

  it('Debe rechazar contraseñas cortas', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Test User',
        email: 'test@example.com',
        password: '123'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errores');
  });

  it('Debe rechazar emails duplicados', async () => {
    const email = 'duplicate@example.com';
    
    // Primer registro
    await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Usuario 1',
        email,
        password: 'password123'
      });

    // Intento duplicado
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Usuario 2',
        email,
        password: 'password123'
      });

    expect(response.status).toBe(409);
    expect(response.body.mensaje).toContain('Ya existe una cuenta');
  });

  it('Debe registrar admin con clave correcta', async () => {
    process.env.ADMIN_SETUP_KEY = 'clave-secreta-admin';
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        rol: 'admin',
        adminSetupKey: 'clave-secreta-admin'
      });

    expect(response.status).toBe(201);
    expect(response.body.usuario.rol).toBe('admin');
  });

  it('Debe rechazar admin sin clave correcta', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Fake Admin',
        email: 'fakeadmin@example.com',
        password: 'password123',
        rol: 'admin',
        adminSetupKey: 'clave-incorrecta'
      });

    expect(response.status).toBe(403);
  });
});

describe('Auth API - POST /api/auth/login', () => {

  it('Debe hacer login exitosamente con credenciales válidas', async () => {
    // Primero crear usuario
    const passwordHash = await bcrypt.hash('password123', 10);
    await Usuario.create({
      nombre: 'Login User',
      email: 'login@example.com',
      passwordHash,
      rol: 'user'
    });

    // Luego hacer login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.usuario.email).toBe('login@example.com');
  });

  it('Debe validar email requerido', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        password: 'password123'
      });

    expect(response.status).toBe(400);
  });

  it('Debe validar contraseña requerida', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com'
      });

    expect(response.status).toBe(400);
  });

  it('Debe rechazar email inexistente', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noexiste@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(401);
    expect(response.body.mensaje).toContain('Credenciales invalidas');
  });

  it('Debe rechazar contraseña incorrecta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'passwordIncorrecto'
      });

    expect(response.status).toBe(401);
  });
});

describe('Auth API - GET /api/auth/me', () => {
  
  let validToken;

  beforeEach(async () => {
    // Crear usuario y obtener token
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Me User',
        email: 'me@example.com',
        password: 'password123'
      });
    
    validToken = registerRes.body.token;
  });

  it('Debe obtener perfil del usuario autenticado', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.usuario).toHaveProperty('id');
    expect(response.body.usuario.email).toBe('me@example.com');
  });

  it('Debe rechazar sin token', async () => {
    const response = await request(app)
      .get('/api/auth/me');

    expect(response.status).toBe(401);
  });

  it('Debe rechazar con token inválido', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer token-invalido');

    expect(response.status).toBe(401);
  });
});
