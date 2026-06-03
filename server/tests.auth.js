const request = require('supertest');
const app = require('./app');
const sequelize = require('./config/db');
const Usuario = require('./models/Usuario');
const bcrypt = require('bcryptjs');

// Setup: sincronizar BD antes de ejecutar tests
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
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

describe('Auth API - PATCH /api/auth/perfil', () => {
  let validToken;

  beforeEach(async () => {
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Perfil User',
        email: `perfil${Date.now()}@example.com`,
        password: 'password123',
      });

    validToken = registerRes.body.token;
  });

  it('Debe actualizar el nombre sin contraseña actual', async () => {
    const response = await request(app)
      .patch('/api/auth/perfil')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ nombre: 'Nombre Actualizado' });

    expect(response.status).toBe(200);
    expect(response.body.usuario.nombre).toBe('Nombre Actualizado');
  });

  it('Debe actualizar email con contraseña actual y devolver nuevo token', async () => {
    const nuevoEmail = `nuevo${Date.now()}@example.com`;

    const response = await request(app)
      .patch('/api/auth/perfil')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        email: nuevoEmail,
        passwordActual: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.usuario.email).toBe(nuevoEmail);
    expect(response.body).toHaveProperty('token');
  });

  it('Debe actualizar contraseña con contraseña actual', async () => {
    const response = await request(app)
      .patch('/api/auth/perfil')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        passwordActual: 'password123',
        passwordNueva: 'nuevaClave123',
      });

    expect(response.status).toBe(200);

    const loginVieja = await request(app)
      .post('/api/auth/login')
      .send({ email: response.body.usuario.email, password: 'password123' });
    expect(loginVieja.status).toBe(401);

    const loginNueva = await request(app)
      .post('/api/auth/login')
      .send({ email: response.body.usuario.email, password: 'nuevaClave123' });
    expect(loginNueva.status).toBe(200);
  });

  it('Debe rechazar email duplicado', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Otro User',
        email: 'duplicado@example.com',
        password: 'password123',
      });

    const registro = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Perfil Dos',
        email: `perfil2${Date.now()}@example.com`,
        password: 'password123',
      });

    const response = await request(app)
      .patch('/api/auth/perfil')
      .set('Authorization', `Bearer ${registro.body.token}`)
      .send({
        email: 'duplicado@example.com',
        passwordActual: 'password123',
      });

    expect(response.status).toBe(409);
  });

  it('Debe rechazar contraseña actual incorrecta', async () => {
    const response = await request(app)
      .patch('/api/auth/perfil')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        passwordActual: 'malpassword',
        passwordNueva: 'nuevaClave123',
      });

    expect(response.status).toBe(401);
  });
});
