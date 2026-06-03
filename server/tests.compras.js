const request = require('supertest');
const app = require('./app');
const sequelize = require('./config/db');
const Producto = require('./models/Producto');
const Pedido = require('./models/Pedido');

const tarjetaValida = {
  titular: 'Juan Perez',
  numero: '4111111111111111',
  expiracion: '12/28',
  cvv: '123',
};

beforeAll(async () => {
  await sequelize.sync({ force: true });
  process.env.ADMIN_SETUP_KEY = 'clave-secreta-admin';
});

beforeEach(async () => {
  await sequelize.sync({ force: true });
  process.env.ADMIN_SETUP_KEY = 'clave-secreta-admin';
});

async function crearUsuarioYToken() {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      nombre: 'Comprador Test',
      email: `comprador${Date.now()}@test.com`,
      password: 'password123',
    });
  return { token: res.body.token, usuarioId: res.body.usuario.id };
}

async function crearAdminToken() {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      nombre: 'Admin Compras',
      email: `admincompras${Date.now()}@test.com`,
      password: 'password123',
      rol: 'admin',
      adminSetupKey: 'clave-secreta-admin',
    });
  return res.body.token;
}

describe('Compras API - POST /api/compras/checkout', () => {
  let userToken;
  let productoId;

  beforeEach(async () => {
    const usuario = await crearUsuarioYToken();
    userToken = usuario.token;

    const producto = await Producto.create({
      nombre: 'Producto Checkout',
      precio: 50,
      stock: 10,
      disponible: true,
    });
    productoId = producto.id;

    await request(app)
      .post('/api/carrito/items')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ productoId, cantidad: 2 });
  });

  it('Debe confirmar compra, vaciar carrito y no restaurar stock', async () => {
    const productoAntes = await Producto.findByPk(productoId);
    const stockAntesCheckout = productoAntes.stock;

    const checkoutRes = await request(app)
      .post('/api/compras/checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send(tarjetaValida);

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.pedido.total).toBe(100);
    expect(checkoutRes.body.pedido.items).toHaveLength(1);
    expect(checkoutRes.body.pedido.ultimos4).toBe('1111');
    expect(checkoutRes.body.carrito.items).toHaveLength(0);

    const productoDespues = await Producto.findByPk(productoId);
    expect(productoDespues.stock).toBe(stockAntesCheckout);

    const carritoRes = await request(app)
      .get('/api/carrito')
      .set('Authorization', `Bearer ${userToken}`);
    expect(carritoRes.body.carrito.items).toHaveLength(0);

    const pedidos = await Pedido.findAll();
    expect(pedidos).toHaveLength(1);
    expect(pedidos[0].total).toBe(100);
  });

  it('Debe rechazar carrito vacío', async () => {
    await request(app)
      .delete('/api/carrito')
      .set('Authorization', `Bearer ${userToken}`);

    const response = await request(app)
      .post('/api/compras/checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send(tarjetaValida);

    expect(response.status).toBe(400);
    expect(response.body.mensaje).toMatch(/vacio/i);
  });

  it('Debe rechazar tarjeta inválida', async () => {
    const response = await request(app)
      .post('/api/compras/checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        titular: 'A',
        numero: '123',
        expiracion: '13/99',
        cvv: '12',
      });

    expect(response.status).toBe(400);
    expect(response.body.errores).toBeDefined();
  });

  it('Debe rechazar sin autenticación', async () => {
    const response = await request(app)
      .post('/api/compras/checkout')
      .send(tarjetaValida);

    expect(response.status).toBe(401);
  });

  it('Debe rechazar rol admin', async () => {
    const adminToken = await crearAdminToken();

    const response = await request(app)
      .post('/api/compras/checkout')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(tarjetaValida);

    expect(response.status).toBe(403);
  });
});
