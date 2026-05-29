const request = require('supertest');
const app = require('./app');
const sequelize = require('./config/db');
const Usuario = require('./models/Usuario');
const Producto = require('./models/Producto');
const Carrito = require('./models/Carrito');

// Setup
beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

describe('Carrito API - GET /api/carrito', () => {
  
  let userToken;
  let usuarioId;

  beforeEach(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Cart User',
        email: `cartuser${Date.now()}@example.com`,
        password: 'password123'
      });
    userToken = userRes.body.token;
    usuarioId = userRes.body.usuario.id;

    // Crear productos
    await Producto.create({
      nombre: 'Producto Carrito 1',
      precio: 100.00,
      stock: 10,
      disponible: true
    });
    await Producto.create({
      nombre: 'Producto Carrito 2',
      precio: 200.00,
      stock: 5,
      disponible: true
    });
  });

  it('Debe obtener carrito vacío para nuevo usuario', async () => {
    const response = await request(app)
      .get('/api/carrito')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.carrito.items.length).toBe(0);
    expect(response.body.carrito.totalItems).toBe(0);
    expect(response.body.carrito.subtotal).toBe(0);
  });

  it('Debe rechazar sin autenticación', async () => {
    const response = await request(app)
      .get('/api/carrito');

    expect(response.status).toBe(401);
  });

  it('Debe retornar estructura correcta del carrito', async () => {
    const response = await request(app)
      .get('/api/carrito')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.carrito).toHaveProperty('id');
    expect(response.body.carrito).toHaveProperty('items');
    expect(response.body.carrito).toHaveProperty('totalItems');
    expect(response.body.carrito).toHaveProperty('subtotal');
  });
});

describe('Carrito API - POST /api/carrito/items', () => {
  
  let userToken;
  let usuarioId;
  let productoId;

  beforeEach(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Cart User',
        email: `cartuser${Date.now()}@example.com`,
        password: 'password123'
      });
    userToken = userRes.body.token;
    usuarioId = userRes.body.usuario.id;

    const producto = await Producto.create({
      nombre: 'Producto para Carrito',
      precio: 150.00,
      stock: 20,
      disponible: true
    });
    productoId = producto.id;
  });

  it('Debe agregar un item al carrito', async () => {
    const response = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId,
        cantidad: 2
      });

    expect(response.status).toBe(200);
    expect(response.body.carrito.items.length).toBe(1);
    expect(response.body.carrito.items[0].cantidad).toBe(2);
    expect(response.body.carrito.totalItems).toBe(2);
  });

  it('Debe incrementar cantidad si el producto ya está en carrito', async () => {
    // Agregar primera vez
    await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId,
        cantidad: 1
      });

    // Agregar segunda vez
    const response = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId,
        cantidad: 2
      });

    expect(response.status).toBe(200);
    expect(response.body.carrito.items[0].cantidad).toBe(3);
  });

  it('Debe validar cantidad como positiva', async () => {
    const response = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId,
        cantidad: -1
      });

    expect(response.status).toBe(400);
  });

  it('Debe rechazar si cantidad supera stock disponible', async () => {
    const response = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId,
        cantidad: 100
      });

    expect(response.status).toBe(400);
    expect(response.body.mensaje).toContain('Stock insuficiente');
  });

  it('Debe rechazar producto inexistente', async () => {
    const response = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: 99999,
        cantidad: 1
      });

    expect(response.status).toBe(404);
  });

  it('Debe rechazar producto no disponible', async () => {
    // Agotar el stock
    const producto = await Producto.findByPk(productoId);
    producto.stock = 0;
    producto.disponible = false;
    await producto.save();

    const response = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId,
        cantidad: 1
      });

    expect(response.status).toBe(400);
  });

  it('Debe usar cantidad 1 por defecto', async () => {
    const response = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId
      });

    expect(response.status).toBe(200);
    expect(response.body.carrito.items[0].cantidad).toBe(1);
  });

  it('Debe rechazar sin autenticación', async () => {
    const response = await request(app)
      .post('/api/carrito/items')
      .send({
        productoId: productoId,
        cantidad: 1
      });

    expect(response.status).toBe(401);
  });
});

describe('Carrito API - PATCH /api/carrito/items/:productoId', () => {
  
  let userToken;
  let productoId;

  beforeEach(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Cart User',
        email: `cartuser${Date.now()}@example.com`,
        password: 'password123'
      });
    userToken = userRes.body.token;

    const producto = await Producto.create({
      nombre: 'Producto Update Carrito',
      precio: 175.00,
      stock: 30,
      disponible: true
    });
    productoId = producto.id;

    // Agregar al carrito
    await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId,
        cantidad: 2
      });
  });

  it('Debe actualizar cantidad de item en carrito', async () => {
    const response = await request(app)
      .patch(`/api/carrito/items/${productoId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cantidad: 5
      });

    expect(response.status).toBe(200);
    expect(response.body.carrito.items[0].cantidad).toBe(5);
    expect(response.body.carrito.totalItems).toBe(5);
  });

  it('Debe rechazar cantidad cero o negativa', async () => {
    const response = await request(app)
      .patch(`/api/carrito/items/${productoId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cantidad: 0
      });

    expect(response.status).toBe(400);
  });

  it('Debe rechazar si cantidad supera stock', async () => {
    const response = await request(app)
      .patch(`/api/carrito/items/${productoId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cantidad: 100
      });

    expect(response.status).toBe(400);
  });

  it('Debe rechazar actualizar producto inexistente en carrito', async () => {
    const response = await request(app)
      .patch(`/api/carrito/items/99999`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cantidad: 1
      });

    expect(response.status).toBe(404);
  });

  it('Debe validar ID de producto válido', async () => {
    const response = await request(app)
      .patch(`/api/carrito/items/abc`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cantidad: 1
      });

    expect(response.status).toBe(400);
  });
});

describe('Carrito API - DELETE /api/carrito/items/:productoId', () => {
  
  let userToken;
  let productoId;

  beforeEach(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Cart User',
        email: `cartuser${Date.now()}@example.com`,
        password: 'password123'
      });
    userToken = userRes.body.token;

    const producto = await Producto.create({
      nombre: 'Producto Delete Carrito',
      precio: 200.00,
      stock: 15,
      disponible: true
    });
    productoId = producto.id;

    // Agregar al carrito
    await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId,
        cantidad: 3
      });
  });

  it('Debe eliminar item del carrito', async () => {
    const response = await request(app)
      .delete(`/api/carrito/items/${productoId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.carrito.items.length).toBe(0);
    expect(response.body.carrito.totalItems).toBe(0);
  });

  it('Debe rechazar eliminar producto no existente en carrito', async () => {
    const response = await request(app)
      .delete(`/api/carrito/items/99999`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(404);
  });

  it('Debe validar ID de producto válido', async () => {
    const response = await request(app)
      .delete(`/api/carrito/items/invalido`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(400);
  });

  it('Debe rechazar sin autenticación', async () => {
    const response = await request(app)
      .delete(`/api/carrito/items/${productoId}`);

    expect(response.status).toBe(401);
  });
});

describe('Carrito API - DELETE /api/carrito', () => {
  
  let userToken;
  let productoId1;
  let productoId2;

  beforeEach(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Cart User',
        email: `cartuser${Date.now()}@example.com`,
        password: 'password123'
      });
    userToken = userRes.body.token;

    const producto1 = await Producto.create({
      nombre: 'Producto 1 Vaciado',
      precio: 100.00,
      stock: 10,
      disponible: true
    });
    const producto2 = await Producto.create({
      nombre: 'Producto 2 Vaciado',
      precio: 200.00,
      stock: 5,
      disponible: true
    });
    productoId1 = producto1.id;
    productoId2 = producto2.id;

    // Agregar múltiples productos
    await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId1,
        cantidad: 2
      });
    await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productoId2,
        cantidad: 3
      });
  });

  it('Debe vaciar completamente el carrito', async () => {
    const response = await request(app)
      .delete('/api/carrito')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.carrito.items.length).toBe(0);
    expect(response.body.carrito.totalItems).toBe(0);
    expect(response.body.carrito.subtotal).toBe(0);
  });

  it('Debe rechazar sin autenticación', async () => {
    const response = await request(app)
      .delete('/api/carrito');

    expect(response.status).toBe(401);
  });

  it('Debe poder vaciar carrito que ya estaba vacío', async () => {
    // Vaciar una vez
    await request(app)
      .delete('/api/carrito')
      .set('Authorization', `Bearer ${userToken}`);

    // Vaciar nuevamente
    const response = await request(app)
      .delete('/api/carrito')
      .set('Authorization', `Bearer ${userToken}`);

    expect(response.status).toBe(200);
    expect(response.body.carrito.items.length).toBe(0);
  });
});

describe('Carrito API - Cálculos', () => {
  
  let userToken;
  let producto1Id;
  let producto2Id;

  beforeEach(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Cart User',
        email: `cartuser${Date.now()}@example.com`,
        password: 'password123'
      });
    userToken = userRes.body.token;

    const p1 = await Producto.create({
      nombre: 'Producto A',
      precio: 100.00,
      stock: 20,
      disponible: true
    });
    const p2 = await Producto.create({
      nombre: 'Producto B',
      precio: 50.00,
      stock: 30,
      disponible: true
    });
    producto1Id = p1.id;
    producto2Id = p2.id;
  });

  it('Debe calcular correctamente subtotal y total items', async () => {
    // Agregar producto 1: 2 unidades x $100 = $200
    await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: producto1Id,
        cantidad: 2
      });

    // Agregar producto 2: 3 unidades x $50 = $150
    const response = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: producto2Id,
        cantidad: 3
      });

    expect(response.status).toBe(200);
    expect(response.body.carrito.totalItems).toBe(5); // 2 + 3
    expect(response.body.carrito.subtotal).toBe(350); // 200 + 150
  });

  it('Debe actualizar cálculos al cambiar cantidad', async () => {
    await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: producto1Id,
        cantidad: 1
      });

    const response = await request(app)
      .patch(`/api/carrito/items/${producto1Id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        cantidad: 5
      });

    expect(response.status).toBe(200);
    expect(response.body.carrito.totalItems).toBe(5);
    expect(response.body.carrito.subtotal).toBe(500); // 5 x $100
  });
});
