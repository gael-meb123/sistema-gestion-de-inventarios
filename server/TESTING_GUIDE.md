# Testing Guide - Sistema de Gestión de Inventarios

## Descripción General

Este proyecto incluye una suite completa de pruebas automatizadas usando **Jest** y **Supertest** para validar todos los endpoints de la API.

## Instalación de Dependencias

```bash
npm install
```

Las siguientes dependencias se instalarán:
- **Jest**: Framework de testing
- **Supertest**: Librería para testing HTTP

## Estructura de Pruebas

Las pruebas están organizadas en los siguientes archivos:

### 1. **tests.auth.js** - Pruebas de Autenticación
- **POST /api/auth/register**
  - ✓ Registrar nuevo usuario
  - ✓ Validar email
  - ✓ Validar contraseña
  - ✓ Rechazar emails duplicados
  - ✓ Crear admin con clave
  - ✓ Rechazar admin sin clave

- **POST /api/auth/login**
  - ✓ Login exitoso
  - ✓ Validar email requerido
  - ✓ Validar contraseña requerida
  - ✓ Rechazar email inexistente
  - ✓ Rechazar contraseña incorrecta

- **GET /api/auth/me**
  - ✓ Obtener perfil autenticado
  - ✓ Rechazar sin token
  - ✓ Rechazar token inválido

**Total: 20 pruebas**

### 2. **tests.producto.js** - Pruebas de Productos
- **GET /api/productos**
  - ✓ Obtener lista de productos
  - ✓ Campos válidos
  - ✓ Lista vacía

- **GET /api/productos/:id**
  - ✓ Obtener por ID
  - ✓ Rechazar ID inválido
  - ✓ Rechazar ID negativo
  - ✓ Retornar 404 si no existe

- **POST /api/productos**
  - ✓ Crear producto como admin
  - ✓ Rechazar sin autenticación
  - ✓ Rechazar usuario no-admin
  - ✓ Validar campos requeridos

- **PUT /api/productos/:id**
  - ✓ Actualizar producto
  - ✓ Rechazar inexistente
  - ✓ Rechazar sin autenticación
  - ✓ Actualizar disponibilidad

- **DELETE /api/productos/:id**
  - ✓ Eliminar producto
  - ✓ Rechazar inexistente
  - ✓ Rechazar sin autenticación
  - ✓ Rechazar no-admin

**Total: 21 pruebas**

### 3. **tests.carrito.js** - Pruebas de Carrito
- **GET /api/carrito**
  - ✓ Obtener carrito vacío
  - ✓ Rechazar sin autenticación
  - ✓ Estructura correcta

- **POST /api/carrito/items**
  - ✓ Agregar item
  - ✓ Incrementar cantidad existente
  - ✓ Validar cantidad positiva
  - ✓ Rechazar si supera stock
  - ✓ Rechazar producto inexistente
  - ✓ Rechazar producto no disponible
  - ✓ Cantidad por defecto

- **PATCH /api/carrito/items/:productoId**
  - ✓ Actualizar cantidad
  - ✓ Rechazar cantidad cero
  - ✓ Rechazar si supera stock
  - ✓ Rechazar producto inexistente

- **DELETE /api/carrito/items/:productoId**
  - ✓ Eliminar item
  - ✓ Rechazar inexistente
  - ✓ Validar ID válido

- **DELETE /api/carrito**
  - ✓ Vaciar carrito
  - ✓ Rechazar sin autenticación
  - ✓ Vaciar carrito ya vacío

- **Cálculos**
  - ✓ Calcular subtotal y total items
  - ✓ Actualizar cálculos

**Total: 28 pruebas**

### 4. **tests.paneles.js** - Pruebas de Roles y Autorización
- **GET /api/panel/admin**
  - ✓ Permitir admin
  - ✓ Rechazar usuario regular
  - ✓ Rechazar sin token
  - ✓ Rechazar token inválido

- **GET /api/panel/usuario**
  - ✓ Permitir usuario regular
  - ✓ Permitir admin
  - ✓ Rechazar sin token

- **Autorización en Productos**
  - ✓ Crear producto como admin
  - ✓ Rechazar usuario regular
  - ✓ Ver productos sin autenticación

- **JWT Token Validation**
  - ✓ Rechazar token expirado
  - ✓ Validar firma del token
  - ✓ Rechazar token malformado
  - ✓ Rechazar sin Bearer

- **CORS Policy**
  - ✓ Permitir origen permitido
  - ✓ Permitir segundo origen
  - ✓ Rechazar origen no permitido

**Total: 18 pruebas**

### 5. **tests.integracion.js** - Pruebas de Integración
- **Flujo Completo**
  - ✓ Registro -> Login -> Ver Productos -> Carrito
  - ✓ Admin: Crear -> Actualizar -> Eliminar

- **Validación de Datos**
  - ✓ Rechazar campos faltantes
  - ✓ Rechazar email inválido
  - ✓ Rechazar payload vacío
  - ✓ Validar tipos de datos

- **Errores HTTP**
  - ✓ 404 para endpoint inexistente
  - ✓ 405 para método no permitido

- **Rate Limiting y Seguridad**
  - ✓ Múltiples requests válidas
  - ✓ Rechazar XSS

- **Consistencia de Datos**
  - ✓ Carrito persiste
  - ✓ Stock disminuye correctamente

**Total: 14 pruebas**

## Ejecutar Pruebas

### Ejecutar todas las pruebas
```bash
npm test
```

### Ejecutar pruebas específicas
```bash
# Solo pruebas de autenticación
npm test tests.auth.js

# Solo pruebas de productos
npm test tests.producto.js

# Solo pruebas de carrito
npm test tests.carrito.js

# Solo pruebas de paneles y roles
npm test tests.paneles.js

# Solo pruebas de integración
npm test tests.integracion.js
```

### Modo watch (reejecutar en cambios)
```bash
npm run test:watch
```

### Cobertura de código
```bash
npm run test:coverage
```

## Requisitos Previos

1. **Variables de Entorno**: Asegúrate de tener configurado `.env` con:
   ```
   DATABASE_URL=postgresql://usuario:password@localhost:5432/db_test
   JWT_SECRET=tu-clave-secreta
   ADMIN_SETUP_KEY=clave-admin-test
   ```

2. **Base de Datos**: Las pruebas crean y eliminan tablas automáticamente usando `sequelize.sync({ force: true })`

## Resultado Esperado

```
PASS  tests.auth.js
  Auth API - POST /api/auth/register
    ✓ Debe registrar un nuevo usuario exitosamente
    ✓ Debe validar que el email sea válido
    ...

PASS  tests.producto.js
  Producto API - GET /api/productos
    ✓ Debe obtener lista de todos los productos
    ...

PASS  tests.carrito.js
  Carrito API - GET /api/carrito
    ✓ Debe obtener carrito vacío para nuevo usuario
    ...

PASS  tests.paneles.js
  Panel API - Roles y Autorización
    ✓ Debe permitir acceso a admin
    ...

PASS  tests.integracion.js
  Integración General - Flujo Completo
    ✓ Flujo completo: Registro -> Login -> Ver Productos
    ...

Test Suites: 5 passed, 5 total
Tests:       101 passed, 101 total
```

## Casos de Prueba Cubiertos

### Autenticación (20 pruebas)
- Validación de entrada (email, contraseña)
- Creación de usuarios
- Autorización de roles
- Generación de JWT
- Manejo de errores

### Productos (21 pruebas)
- CRUD completo (Create, Read, Update, Delete)
- Validación de datos
- Control de acceso (admin only)
- Gestión de disponibilidad
- Validación de IDs

### Carrito (28 pruebas)
- Operaciones CRUD en items
- Cálculos de subtotal
- Validación de stock
- Persistencia de datos
- Control de acceso

### Roles y Autorización (18 pruebas)
- Paneles por rol
- Validación de JWT
- CORS policy
- Autenticación requerida

### Integración (14 pruebas)
- Flujos de usuario reales
- Consistencia de datos
- Validación de entradas
- Seguridad básica

## Debugging

Si una prueba falla, verás:
- El nombre de la prueba
- El error específico
- La línea del código que falló
- El estado HTTP recibido vs esperado

Ejemplo:
```
FAIL  tests.auth.js
  Auth API - POST /api/auth/register
    ✗ Debe registrar un nuevo usuario exitosamente
      Expected status 201
      Received status 500
      Error: Database connection failed
```

## Notas Importantes

1. **Aislamiento**: Cada suite de pruebas realiza `sequelize.sync({ force: true })` para limpiar la BD
2. **Tokens**: Los tokens JWT se generan con expiración de 8 horas en pruebas
3. **Contraseñas**: Se usan hashes bcrypt para seguridad
4. **Timeout**: Configurado a 15 segundos por prueba

## Integración Continua

Para usar en CI/CD, puedes ejecutar:
```bash
npm test -- --coverage --forceExit
```

Esto generará un reporte de cobertura y cerrará el proceso automáticamente.
