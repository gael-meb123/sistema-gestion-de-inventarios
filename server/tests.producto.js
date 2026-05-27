const request = require('supertest');
const app = require('../app');
const sequelize = require('../config/db');
const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');

// Setup
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Producto API - GET /api/productos', () => {
  
  beforeEach(async () => {
    // Crear algunos productos de prueba
    await Producto.create({
      nombre: 'Producto 1',
      precio: 100.00,
      stock: 10,
      disponible: true
    });
    await Producto.create({
      nombre: 'Producto 2',
      precio: 200.00,
      stock: 5,
      disponible: true
    });
  });

  it('Debe obtener lista de todos los productos', async () => {
    const response = await request(app)
      .get('/api/productos');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('productos');
    expect(response.body.productos.length).toBe(2);
    expect(response.body.total).toBe(2);
  });

  it('Debe retornar productos con campos válidos', async () => {
    const response = await request(app)
      .get('/api/productos');

    expect(response.status).toBe(200);
    const producto = response.body.productos[0];
    expect(producto).toHaveProperty('id');
    expect(producto).toHaveProperty('nombre');
    expect(producto).toHaveProperty('precio');
    expect(producto).toHaveProperty('stock');
    expect(producto).toHaveProperty('disponible');
  });

  it('Debe retornar lista vacía cuando no hay productos', async () => {
    await Producto.destroy({ where: {} });
    
    const response = await request(app)
      .get('/api/productos');

    expect(response.status).toBe(200);
    expect(response.body.productos.length).toBe(0);
  });
});

describe('Producto API - GET /api/productos/:id', () => {
  
  let productoId;

  beforeEach(async () => {
    const producto = await Producto.create({
      nombre: 'Producto Test',
      precio: 150.00,
      stock: 8,
      disponible: true
    });
    productoId = producto.id;
  });

  it('Debe obtener un producto por ID válido', async () => {
    const response = await request(app)
      .get(`/api/productos/${productoId}`);

    expect(response.status).toBe(200);
    expect(response.body.producto.id).toBe(productoId);
    expect(response.body.producto.nombre).toBe('Producto Test');
    expect(response.body.producto.precio).toBe(150.00);
  });

  it('Debe rechazar ID inválido (no numérico)', async () => {
    const response = await request(app)
      .get('/api/productos/abc');

    expect(response.status).toBe(400);
    expect(response.body.mensaje).toContain('número entero positivo');
  });

  it('Debe rechazar ID negativo', async () => {
    const response = await request(app)
      .get('/api/productos/-1');

    expect(response.status).toBe(400);
  });

  it('Debe retornar 404 para producto inexistente', async () => {
    const response = await request(app)
      .get('/api/productos/99999');

    expect(response.status).toBe(404);
    expect(response.body.mensaje).toContain('No se encontró');
  });
});

describe('Producto API - POST /api/productos (Admin only)', () => {
  
  let adminToken;

  beforeEach(async () => {
    // Crear usuario admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
        rol: 'admin',
        adminSetupKey: process.env.ADMIN_SETUP_KEY
      });
    adminToken = adminRes.body.token;
  });

  it('Debe crear un nuevo producto como admin', async () => {
    const response = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Nuevo Producto',
        precio: 250.00,
        stock: 20
      });

    expect(response.status).toBe(201);
    expect(response.body.producto.nombre).toBe('Nuevo Producto');
    expect(response.body.producto.precio).toBe(250.00);
    expect(response.body.producto.disponible).toBe(true);
  });

  it('Debe rechazar creación sin autenticación', async () => {
    const response = await request(app)
      .post('/api/productos')
      .send({
        nombre: 'Nuevo Producto',
        precio: 250.00,
        stock: 20
      });

    expect(response.status).toBe(401);
  });

  it('Debe rechazar creación por usuario no-admin', async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'User',
        email: 'user@example.com',
        password: 'password123'
      });
    const userToken = userRes.body.token;

    const response = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nombre: 'Nuevo Producto',
        precio: 250.00,
        stock: 20
      });

    expect(response.status).toBe(403);
  });

  it('Debe validar campos requeridos', async () => {
    const response = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Producto Sin Precio'
        // Falta precio y stock
      });

    expect(response.status).toBe(400);
  });
});

describe('Producto API - PUT /api/productos/:id (Admin only)', () => {
  
  let adminToken;
  let productoId;

  beforeEach(async () => {
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin',
        email: `admin${Date.now()}@example.com`,
        password: 'password123',
        rol: 'admin',
        adminSetupKey: process.env.ADMIN_SETUP_KEY
      });
    adminToken = adminRes.body.token;

    const producto = await Producto.create({
      nombre: 'Producto Original',
      precio: 100.00,
      stock: 10,
      disponible: true
    });
    productoId = producto.id;
  });

  it('Debe actualizar un producto como admin', async () => {
    const response = await request(app)
      .put(`/api/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Producto Actualizado',
        precio: 150.00,
        stock: 15
      });

    expect(response.status).toBe(200);
    expect(response.body.producto.nombre).toBe('Producto Actualizado');
    expect(response.body.producto.precio).toBe(150.00);
  });

  it('Debe rechazar actualización de producto inexistente', async () => {
    const response = await request(app)
      .put('/api/productos/99999')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'No existe',
        precio: 100.00,
        stock: 10
      });

    expect(response.status).toBe(404);
  });

  it('Debe rechazar actualización sin autenticación', async () => {
    const response = await request(app)
      .put(`/api/productos/${productoId}`)
      .send({
        nombre: 'Nombre Nuevo',
        precio: 200.00,
        stock: 20
      });

    expect(response.status).toBe(401);
  });

  it('Debe actualizar disponibilidad basada en stock', async () => {
    const response = await request(app)
      .put(`/api/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Producto Agotado',
        precio: 100.00,
        stock: 0
      });

    expect(response.status).toBe(200);
    expect(response.body.producto.disponible).toBe(false);
  });
});

describe('Producto API - DELETE /api/productos/:id (Admin only)', () => {
  
  let adminToken;
  let productoId;

  beforeEach(async () => {
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin',
        email: `admin${Date.now()}@example.com`,
        password: 'password123',
        rol: 'admin',
        adminSetupKey: process.env.ADMIN_SETUP_KEY
      });
    adminToken = adminRes.body.token;

    const producto = await Producto.create({
      nombre: 'Producto a Eliminar',
      precio: 100.00,
      stock: 10,
      disponible: true
    });
    productoId = producto.id;
  });

  it('Debe eliminar un producto como admin', async () => {
    const response = await request(app)
      .delete(`/api/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.mensaje).toContain('eliminado exitosamente');

    // Verificar que fue eliminado
    const check = await request(app)
      .get(`/api/productos/${productoId}`);
    expect(check.status).toBe(404);
  });

  it('Debe rechazar eliminación de producto inexistente', async () => {
    const response = await request(app)
      .delete('/api/productos/99999')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(404);
  });

  it('Debe rechazar eliminación sin autenticación', async () => {
    const response = await request(app)
      .delete(`/api/productos/${productoId}`);

    expect(response.status).toBe(401);
  });

  it('Debe rechazar eliminación por usuario no-admin', async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'User',
        email: `user${Date.now()}@example.com`,
        password: 'password123'
      });
    const userToken = userRes.body.token;

    const response = await request(app)
      .delete(`/api/productos/${productoId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(403);
  });
});
