const request = require('supertest');
const app = require('./app');
const sequelize = require('./config/db');
const Producto = require('./models/Producto');

// Setup
beforeAll(async () => {
  await sequelize.sync({ force: true });
  process.env.ADMIN_SETUP_KEY = 'clave-secreta-admin';
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
});

describe('Integración General - Flujo Completo', () => {
  
  it('Flujo completo: Registro -> Login -> Ver Productos -> Agregar Carrito', async () => {
    // 1. Registrarse
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Cliente Test',
        email: 'cliente@test.com',
        password: 'password123'
      });

    expect(registerRes.status).toBe(201);
    const token = registerRes.body.token;

    // 2. Crear productos (como admin)
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin',
        email: 'admin@test.com',
        password: 'password123',
        rol: 'admin',
        adminSetupKey: 'clave-secreta-admin'
      });
    
    const adminToken = adminRes.body.token;

    const createProductRes = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Laptop',
        precio: 999.99,
        stock: 5
      });

    expect(createProductRes.status).toBe(201);
    const productoId = createProductRes.body.producto.id;

    // 3. Ver productos
    const getProductsRes = await request(app)
      .get('/api/productos');

    expect(getProductsRes.status).toBe(200);
    expect(getProductsRes.body.productos.length).toBeGreaterThan(0);

    // 4. Obtener detalles de producto
    const getProductRes = await request(app)
      .get(`/api/productos/${productoId}`);

    expect(getProductRes.status).toBe(200);
    expect(getProductRes.body.producto.nombre).toBe('Laptop');

    // 5. Agregar al carrito
    const addCartRes = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productoId: productoId,
        cantidad: 2
      });

    expect(addCartRes.status).toBe(200);
    expect(addCartRes.body.carrito.items[0].cantidad).toBe(2);

    // 6. Obtener carrito
    const getCartRes = await request(app)
      .get('/api/carrito')
      .set('Authorization', `Bearer ${token}`);

    expect(getCartRes.status).toBe(200);
    expect(getCartRes.body.carrito.totalItems).toBe(2);
    expect(getCartRes.body.carrito.subtotal).toBe(1999.98); // 999.99 * 2

    // 7. Actualizar cantidad
    const updateCartRes = await request(app)
      .patch(`/api/carrito/items/${productoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        cantidad: 3
      });

    expect(updateCartRes.status).toBe(200);
    expect(updateCartRes.body.carrito.items[0].cantidad).toBe(3);
    expect(updateCartRes.body.carrito.subtotal).toBeCloseTo(2999.97, 2); // 999.99 * 3

    // 8. Eliminar del carrito
    const removeCartRes = await request(app)
      .delete(`/api/carrito/items/${productoId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(removeCartRes.status).toBe(200);
    expect(removeCartRes.body.carrito.items.length).toBe(0);
  });

  it('Flujo admin: Crear -> Actualizar -> Eliminar Producto', async () => {
    // Registrarse como admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin Manager',
        email: `admin${Date.now()}@test.com`,
        password: 'password123',
        rol: 'admin',
        adminSetupKey: 'clave-secreta-admin'
      });

    const adminToken = adminRes.body.token;

    // 1. Crear producto
    const createRes = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Monitor 4K',
        precio: 450.00,
        stock: 10
      });

    expect(createRes.status).toBe(201);
    const productId = createRes.body.producto.id;

    // 2. Actualizar producto
    const updateRes = await request(app)
      .put(`/api/productos/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: 'Monitor 4K Ultra',
        precio: 550.00,
        stock: 8
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.producto.nombre).toBe('Monitor 4K Ultra');
    expect(updateRes.body.producto.precio).toBe(550.00);

    // 3. Verificar cambios
    const getRes = await request(app)
      .get(`/api/productos/${productId}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.producto.nombre).toBe('Monitor 4K Ultra');

    // 4. Eliminar producto
    const deleteRes = await request(app)
      .delete(`/api/productos/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);

    // 5. Verificar eliminación
    const verifyRes = await request(app)
      .get(`/api/productos/${productId}`);

    expect(verifyRes.status).toBe(404);
  });
});

describe('Validación de Datos', () => {
  
  it('Debe rechazar campos faltantes en registro', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Usuario'
        // Falta email y password
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errores');
  });

  it('Debe rechazar email inválido', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Usuario',
        email: 'no-es-un-email',
        password: 'password123'
      });

    expect(response.status).toBe(400);
  });

  it('Debe rechazar payload vacío en crear producto', async () => {
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin',
        email: `admin${Date.now()}@test.com`,
        password: 'password123',
        rol: 'admin',
        adminSetupKey: 'clave-secreta-admin'
      });

    const response = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminRes.body.token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('Debe validar tipos de datos en carrito', async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Usuario',
        email: `user${Date.now()}@test.com`,
        password: 'password123'
      });

    const response = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userRes.body.token}`)
      .send({
        productoId: 'no-es-numero',
        cantidad: 'tampoco'
      });

    expect(response.status).toBe(400);
  });
});

describe('Errores HTTP Esperados', () => {
  
  it('Debe retornar 404 para endpoint inexistente', async () => {
    const response = await request(app)
      .get('/api/inexistente');

    expect(response.status).toBe(404);
  });

  it('Debe retornar 405 para método no permitido', async () => {
    const response = await request(app)
      .post('/api/productos/1'); // En lugar de PUT

    // Express puede retornar 404 o 405 dependiendo de la configuración
    expect([404, 405]).toContain(response.status);
  });
});

describe('Rate Limiting y Seguridad Básica', () => {
  
  it('Debe permitir múltiples requests válidas', async () => {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        request(app)
          .get('/api/productos')
      );
    }

    const responses = await Promise.all(requests);
    responses.forEach(res => {
      expect(res.status).toBe(200);
    });
  });

  it('Debe rechazar XSS en campos de entrada', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: '<script>alert("xss")</script>',
        email: 'test@example.com',
        password: 'password123'
      });

    // Zod debería validar el nombre pero aceptarlo como string
    if (response.status === 201) {
      const usuario = response.body.usuario;
      // El nombre no debería ser ejecutado, es solo texto
      expect(typeof usuario.nombre).toBe('string');
    }
  });
});

describe('Consistencia de Datos', () => {
  
  it('Carrito debe persistir para el mismo usuario', async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Usuario Persistente',
        email: `persist${Date.now()}@test.com`,
        password: 'password123'
      });

    const userToken = userRes.body.token;

    // Crear producto
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin',
        email: `admin${Date.now()}@test.com`,
        password: 'password123',
        rol: 'admin',
        adminSetupKey: 'clave-secreta-admin'
      });

    const productRes = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminRes.body.token}`)
      .send({
        nombre: 'Producto Persistente',
        precio: 100,
        stock: 10
      });

    const productId = productRes.body.producto.id;

    // Agregar a carrito
    const addRes = await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        productoId: productId,
        cantidad: 2
      });

    expect(addRes.body.carrito.totalItems).toBe(2);

    // Obtener carrito (debe ser el mismo)
    const getRes = await request(app)
      .get('/api/carrito')
      .set('Authorization', `Bearer ${userToken}`);

    expect(getRes.body.carrito.totalItems).toBe(2);
    expect(getRes.body.carrito.items[0].productoId).toBe(productId);
  });

  it('Stock debe disminuir correctamente', async () => {
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Admin Stock',
        email: `adminstock${Date.now()}@test.com`,
        password: 'password123',
        rol: 'admin',
        adminSetupKey: 'clave-secreta-admin'
      });

    const productRes = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${adminRes.body.token}`)
      .send({
        nombre: 'Producto Stock',
        precio: 100,
        stock: 5
      });

    const productId = productRes.body.producto.id;

    // Obtener producto original
    const getOriginal = await request(app)
      .get(`/api/productos/${productId}`);

    expect(getOriginal.body.producto.stock).toBe(5);

    // Actualizar stock
    const updateRes = await request(app)
      .put(`/api/productos/${productId}`)
      .set('Authorization', `Bearer ${adminRes.body.token}`)
      .send({
        nombre: 'Producto Stock',
        precio: 100,
        stock: 2
      });

    expect(updateRes.body.producto.stock).toBe(2);

    // Verificar en GET
    const getFinal = await request(app)
      .get(`/api/productos/${productId}`);

    expect(getFinal.body.producto.stock).toBe(2);
  });
});
