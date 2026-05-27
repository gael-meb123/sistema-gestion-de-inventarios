#!/usr/bin/env node

/**
 * GUÍA DE IMPLEMENTACIÓN - Suite de Pruebas
 * 
 * Este archivo contiene instrucciones paso a paso para
 * instalar y ejecutar la suite completa de pruebas.
 */

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    🚀 SUITE DE PRUEBAS AUTOMATIZADAS - GUÍA DE SETUP    ║
║                                                           ║
║    Total: 101 pruebas cobriendo todos los endpoints     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

console.log(`
📋 PASO 1: INSTALAR DEPENDENCIAS
═════════════════════════════════════════════════════════════

Ejecuta el siguiente comando en la carpeta 'server':

  npm install

Esto instalará:
  ✓ Jest (^29.7.0) - Framework de testing
  ✓ Supertest (^6.3.3) - Testing para HTTP
  ✓ Nodemon (^3.1.10) - Dev dependency

Tiempo estimado: 2-3 minutos
`);

console.log(`
🗄️  PASO 2: CREAR BASE DE DATOS DE PRUEBAS
═════════════════════════════════════════════════════════════

Asegúrate de que PostgreSQL está corriendo, luego ejecuta:

  # En PowerShell / CMD
  psql -U postgres -c "CREATE DATABASE sistema_gestion_inventarios_test;"

  # O en psql interactivo
  psql -U postgres
  postgres=# CREATE DATABASE sistema_gestion_inventarios_test;
  postgres=# \\q

Si la BD ya existe, puedes eliminarla y recrearla:
  psql -U postgres -c "DROP DATABASE IF EXISTS sistema_gestion_inventarios_test;"
  psql -U postgres -c "CREATE DATABASE sistema_gestion_inventarios_test;"
`);

console.log(`
⚙️  PASO 3: CONFIGURAR VARIABLES DE ENTORNO
═════════════════════════════════════════════════════════════

El archivo .env.test ya está configurado con valores por defecto:
  
  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/...
  JWT_SECRET=test-secret-key-for-testing-only-not-for-production
  ADMIN_SETUP_KEY=test-admin-setup-key
  NODE_ENV=test

Si usas credenciales diferentes para PostgreSQL, actualiza:
  .env.test

También asegúrate de que .env tenga las mismas credenciales
para desarrollo.
`);

console.log(`
✅ PASO 4: EJECUTAR LAS PRUEBAS
═════════════════════════════════════════════════════════════

OPCIÓN A - Todas las pruebas:
  npm test
  npm run test:all

OPCIÓN B - Pruebas específicas:
  npm run test:auth       # Autenticación (20 pruebas)
  npm run test:producto   # Productos (21 pruebas)
  npm run test:carrito    # Carrito (28 pruebas)
  npm run test:paneles    # Roles (18 pruebas)
  npm run test:integracion # Integración (14 pruebas)

OPCIÓN C - Con cobertura de código:
  npm run test:coverage   # Genera reporte de cobertura

OPCIÓN D - Modo watch (reejecutar en cambios):
  npm run test:watch

OPCIÓN E - Script helper:
  node run-tests.js all
  node run-tests.js auth
  node run-tests.js coverage
`);

console.log(`
📊 RESULTADO ESPERADO
═════════════════════════════════════════════════════════════

Cuando todas las pruebas pasen, verás:

  ✓ Test Suites: 5 passed, 5 total
  ✓ Tests:       101 passed, 101 total
  ✓ Time:        ~12 seconds

Estructura de pruebas:
  
  ✅ tests.auth.js ............... 20 pruebas
  ✅ tests.producto.js ........... 21 pruebas
  ✅ tests.carrito.js ............ 28 pruebas
  ✅ tests.paneles.js ............ 18 pruebas
  ✅ tests.integracion.js ........ 14 pruebas
  ──────────────────────────────────────────
  📊 TOTAL ........................ 101 pruebas
`);

console.log(`
🔍 ESTRUCTURA DE PRUEBAS
═════════════════════════════════════════════════════════════

Autenticación (tests.auth.js - 20 pruebas)
├─ Registro
│  ├─ Registrar nuevo usuario ✓
│  ├─ Validar email ✓
│  ├─ Validar contraseña ✓
│  ├─ Rechazar emails duplicados ✓
│  ├─ Crear admin ✓
│  └─ Rechazar admin sin clave ✓
├─ Login
│  ├─ Login exitoso ✓
│  ├─ Validaciones ✓
│  └─ Rechazar credenciales inválidas ✓
└─ Perfil
   ├─ Obtener perfil ✓
   └─ Seguridad de token ✓

Productos (tests.producto.js - 21 pruebas)
├─ GET /api/productos ✓
├─ GET /api/productos/:id ✓
├─ POST /api/productos (Admin) ✓
├─ PUT /api/productos/:id (Admin) ✓
└─ DELETE /api/productos/:id (Admin) ✓

Carrito (tests.carrito.js - 28 pruebas)
├─ GET /api/carrito ✓
├─ POST /api/carrito/items ✓
├─ PATCH /api/carrito/items/:id ✓
├─ DELETE /api/carrito/items/:id ✓
├─ DELETE /api/carrito ✓
└─ Cálculos ✓

Roles (tests.paneles.js - 18 pruebas)
├─ Panel Admin ✓
├─ Panel Usuario ✓
├─ Autorización ✓
├─ JWT Validation ✓
└─ CORS Policy ✓

Integración (tests.integracion.js - 14 pruebas)
├─ Flujos completos ✓
├─ Validación de datos ✓
├─ Errores HTTP ✓
├─ Seguridad ✓
└─ Consistencia ✓
`);

console.log(`
🐛 TROUBLESHOOTING
═════════════════════════════════════════════════════════════

PROBLEMA: "Cannot connect to database"
SOLUCIÓN: 
  1. Verifica que PostgreSQL está corriendo
  2. Revisa credenciales en .env.test
  3. Asegúrate que la BD existe: CREATE DATABASE ...

PROBLEMA: "database does not exist"
SOLUCIÓN:
  psql -U postgres -c "CREATE DATABASE sistema_gestion_inventarios_test;"

PROBLEMA: "ERR_REQUIRE_ESM" o errores de módulos
SOLUCIÓN:
  npm install
  npm test

PROBLEMA: Las pruebas se cuelgan
SOLUCIÓN:
  1. Aumenta timeout en jest.config.js (testTimeout: 20000)
  2. Cierra otras conexiones a la BD
  3. Reinicia PostgreSQL

PROBLEMA: "EACCES: permission denied" con run-tests.js
SOLUCIÓN:
  chmod +x run-tests.js
  # O simplemente usa: node run-tests.js
`);

console.log(`
📚 DOCUMENTACIÓN DISPONIBLE
═════════════════════════════════════════════════════════════

Archivo                    Contenido
─────────────────────────────────────────────────────────
TESTS_README.md            Guía de instalación y uso
TESTING_GUIDE.md           Guía técnica detallada
TEST_SUMMARY.md            Resumen visual con estadísticas
IMPLEMENTATION_SUMMARY.md  Resumen de lo implementado
este archivo               Instrucciones paso a paso
`);

console.log(`
🎯 COMANDOS RÁPIDOS
═════════════════════════════════════════════════════════════

# Instalación
npm install

# Ejecutar todas las pruebas
npm test

# Pruebas específicas
npm run test:auth
npm run test:producto
npm run test:carrito
npm run test:paneles
npm run test:integracion

# Con cobertura
npm run test:coverage

# Modo watch
npm run test:watch

# Script helper
node run-tests.js all
`);

console.log(`
✨ SIGUIENTES PASOS
═════════════════════════════════════════════════════════════

1. ✅ Instalar: npm install
2. ✅ Crear BD: CREATE DATABASE sistema_gestion_inventarios_test
3. ✅ Ejecutar: npm test
4. ✅ Revisar documentación si es necesario
5. ✅ Integrar en CI/CD pipeline

Una vez que todas las pruebas pasen, puedes:
- Agregar más pruebas según necesidades
- Integrar con GitHub Actions o similar
- Monitorear cobertura regularmente
- Ejecutar en cada push/PR
`);

console.log(`
📞 SOPORTE
═════════════════════════════════════════════════════════════

Si encuentras problemas:
1. Lee TESTING_GUIDE.md - Guía completa
2. Verifica logs: npm test 2>&1 | head -50
3. Revisa BD: psql -U postgres -l
4. Prueba módulo por módulo: npm run test:auth

Contacta al equipo de desarrollo si:
- Las pruebas no instalan correctamente
- Las pruebas fallan sin motivo aparente
- Necesitas agregar más pruebas


╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║              ¡LISTO PARA EMPEZAR! 🚀                    ║
║                                                           ║
║     Ejecuta: npm install && npm test                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
