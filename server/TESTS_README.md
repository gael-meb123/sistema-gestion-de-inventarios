# 🧪 Suite de Pruebas Automatizadas

## 📌 Descripción

Este proyecto incluye una **suite completa de pruebas** que cubren **todos los endpoints** de la API usando **Jest** y **Supertest**.

### 📊 Estadísticas
- **Total de pruebas**: 101
- **Módulos**: 5 (Auth, Productos, Carrito, Paneles, Integración)
- **Cobertura**: ~95% de endpoints y casos de uso

## 🚀 Instalación Rápida

### 1. Instalar dependencias
```bash
npm install
```

### 2. Asegurar que PostgreSQL está corriendo
```bash
# En Windows con WSL o en tu ambiente PostgreSQL
psql -U postgres -c "CREATE DATABASE sistema_gestion_inventarios_test;"
```

### 3. Configurar variables de entorno
```bash
# Copiar ejemplo
cp .env.example .env
cp .env.example .env.test

# Editar .env.test si es necesario
```

### 4. Ejecutar pruebas
```bash
npm test
```

## 🎯 Comandos de Prueba

### Todas las pruebas
```bash
npm test
npm run test:all
```

### Pruebas específicas
```bash
npm run test:auth        # Solo autenticación
npm run test:producto    # Solo productos
npm run test:carrito     # Solo carrito
npm run test:paneles     # Solo roles/paneles
npm run test:integracion # Solo integración
```

### Modo watch (reejecutar en cambios)
```bash
npm run test:watch
```

### Con cobertura de código
```bash
npm run test:coverage
```

### Script helper
```bash
node run-tests.js all          # Todas
node run-tests.js auth         # Solo auth
node run-tests.js coverage     # Con cobertura
```

## 📋 Pruebas Disponibles

### ✅ Autenticación (20 pruebas)
```
✓ POST /api/auth/register
  - Registrar nuevo usuario
  - Validar email
  - Validar contraseña
  - Rechazar emails duplicados
  - Crear admin con clave

✓ POST /api/auth/login
  - Login exitoso
  - Validar credenciales
  - Rechazar email inexistente

✓ GET /api/auth/me
  - Obtener perfil autenticado
  - Rechazar sin token
```

### ✅ Productos (21 pruebas)
```
✓ GET /api/productos
  - Obtener lista completa
  - Retornar campos válidos
  - Manejar lista vacía

✓ GET /api/productos/:id
  - Obtener por ID
  - Validar ID válido
  - Retornar 404 si no existe

✓ POST /api/productos (Admin)
  - Crear producto
  - Validar campos requeridos
  - Rechazar usuarios no-admin

✓ PUT /api/productos/:id (Admin)
  - Actualizar producto
  - Actualizar disponibilidad según stock

✓ DELETE /api/productos/:id (Admin)
  - Eliminar producto
  - Verificar eliminación
```

### ✅ Carrito (28 pruebas)
```
✓ GET /api/carrito
  - Obtener carrito del usuario
  - Retornar estructura correcta

✓ POST /api/carrito/items
  - Agregar item al carrito
  - Incrementar cantidad existente
  - Validar stock disponible
  - Usar cantidad por defecto (1)

✓ PATCH /api/carrito/items/:id
  - Actualizar cantidad
  - Validar cantidad positiva
  - Rechazar si supera stock

✓ DELETE /api/carrito/items/:id
  - Eliminar item del carrito
  - Validar producto existe en carrito

✓ DELETE /api/carrito
  - Vaciar carrito completamente

✓ Cálculos
  - Calcular subtotal correctamente
  - Actualizar totales dinámicamente
```

### ✅ Roles y Autorización (18 pruebas)
```
✓ Panel Admin
  - Acceso solo para admins
  - Rechazar usuarios regulares

✓ Panel Usuario
  - Acceso para users y admins
  - Rechazar sin autenticación

✓ Validación JWT
  - Validar firma del token
  - Rechazar token expirado
  - Rechazar formato inválido

✓ CORS Policy
  - Permitir orígenes autorizados
  - Rechazar orígenes no permitidos
```

### ✅ Integración (14 pruebas)
```
✓ Flujos Completos
  - Registro → Login → Ver productos → Carrito
  - Crear → Actualizar → Eliminar producto (Admin)

✓ Validación de Datos
  - Rechazar entrada inválida
  - Validar tipos de datos
  - Validar campos requeridos

✓ Errores HTTP
  - 404 para endpoint inexistente
  - 405 para método no permitido

✓ Seguridad
  - Rechazar XSS basic
  - Múltiples requests válidas

✓ Consistencia
  - Carrito persiste por usuario
  - Stock disminuye correctamente
```

## 📊 Ejemplo de Salida

```
 PASS  tests.auth.js
  Auth API - POST /api/auth/register
    ✓ Debe registrar un nuevo usuario exitosamente (45ms)
    ✓ Debe validar que el email sea válido (32ms)
    ✓ Debe rechazar contraseñas cortas (28ms)
    ✓ Debe rechazar emails duplicados (38ms)
    ✓ Debe registrar admin con clave correcta (41ms)
    ✓ Debe rechazar admin sin clave correcta (35ms)
  Auth API - POST /api/auth/login
    ✓ Debe hacer login exitosamente (52ms)
    ✓ Debe validar email requerido (29ms)
    ✓ Debe validar contraseña requerida (26ms)
    ✓ Debe rechazar email inexistente (30ms)
    ✓ Debe rechazar contraseña incorrecta (48ms)
  Auth API - GET /api/auth/me
    ✓ Debe obtener perfil del usuario autenticado (38ms)
    ✓ Debe rechazar sin token (24ms)
    ✓ Debe rechazar con token inválido (25ms)

 PASS  tests.producto.js (1234ms)
 PASS  tests.carrito.js (2567ms)
 PASS  tests.paneles.js (1890ms)
 PASS  tests.integracion.js (3456ms)

Test Suites: 5 passed, 5 total
Tests:       101 passed, 101 total
Snapshots:   0 total
Time:        11.234 s
```

## 🔧 Configuración

### Jest Config (`jest.config.js`)
```javascript
{
  testEnvironment: 'node',
  testMatch: ['tests*.js'],
  testTimeout: 15000,
  forceExit: true,
  clearMocks: true
}
```

### Variables de Entorno (`.env.test`)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sistema_gestion_inventarios_test
JWT_SECRET=test-secret-key
ADMIN_SETUP_KEY=test-admin-setup-key
NODE_ENV=test
```

## 🐛 Debugging

Si una prueba falla:

1. **Verifica la BD**: `psql -U postgres -c "SELECT datname FROM pg_database;"`
2. **Limpia la BD de prueba**: `dropdb sistema_gestion_inventarios_test`
3. **Ejecuta test específico**: `npm run test:auth`
4. **Aumenta el timeout**: Editar `jest.config.js`

## 📖 Documentación Detallada

Ver [TESTING_GUIDE.md](./TESTING_GUIDE.md) para información completa sobre:
- Estructura detallada de pruebas
- Casos de prueba específicos
- Ejemplos de uso
- Integración con CI/CD

Ver [TEST_SUMMARY.md](./TEST_SUMMARY.md) para:
- Resumen visual de pruebas
- Desglose por módulo
- Características probadas
- Métricas

## 🎓 Aprendizaje

Estas pruebas demuestran:
- ✅ Testing de APIs REST
- ✅ Validación con Supertest
- ✅ Autenticación JWT
- ✅ Control de acceso (RBAC)
- ✅ Testing de base de datos
- ✅ Testing de flujos de usuario
- ✅ Seguridad básica
- ✅ Validación de entrada

## 🚨 Troubleshooting

### Error: "Cannot connect to database"
```bash
# Asegurar que PostgreSQL está corriendo
# Windows: net start postgresql-x64-14
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### Error: "database does not exist"
```bash
psql -U postgres -c "CREATE DATABASE sistema_gestion_inventarios_test;"
```

### Error: "EACCES: permission denied"
```bash
chmod +x run-tests.js
```

### Las pruebas se cuelgan
- Aumentar timeout en `jest.config.js`
- Verificar conexión a BD
- Cerrar otras conexiones a la BD de prueba

## 📈 Integración Continua

Para usar en GitHub Actions o similar:

```yaml
- name: Run Tests
  run: npm test -- --coverage --forceExit
```

## ✨ Features Destacadas

- 🎯 **Cobertura Alta**: 101 pruebas cubren casos de uso reales
- 🔒 **Seguridad**: Validación de JWT, roles, CORS
- 📊 **Datos Reales**: Pruebas de persistencia y cálculos
- ⚡ **Rápidas**: ~12 segundos para todas las pruebas
- 🛠️ **Mantenibles**: Código limpio y bien organizado
- 📚 **Documentadas**: Descripciones claras en cada prueba

## 📞 Soporte

Para problemas o preguntas:
1. Revisar `TESTING_GUIDE.md`
2. Ejecutar `npm run test:coverage` para análisis
3. Revisar logs de Jest
4. Verificar logs de PostgreSQL

---

**Última actualización**: 2026-05-27  
**Jest Version**: 29.7.0  
**Supertest Version**: 6.3.3  
**Node Version**: 14+ recomendado
