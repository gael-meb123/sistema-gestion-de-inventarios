#!/usr/bin/env node

/**
 * Script Helper para ejecutar pruebas
 * Uso: node run-tests.js [opción]
 * 
 * Opciones:
 *   all        - Ejecutar todas las pruebas
 *   auth       - Solo pruebas de autenticación
 *   producto   - Solo pruebas de productos
 *   carrito    - Solo pruebas de carrito
 *   paneles    - Solo pruebas de paneles y roles
 *   integracion- Solo pruebas de integración
 *   coverage   - Ejecutar con cobertura
 *   watch      - Modo watch
 */

const { execSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
const command = args[0] || 'all';

const commands = {
  all: 'npm test',
  auth: 'npm test tests.auth.js',
  producto: 'npm test tests.producto.js',
  carrito: 'npm test tests.carrito.js',
  paneles: 'npm test tests.paneles.js',
  integracion: 'npm test tests.integracion.js',
  coverage: 'npm run test:coverage',
  watch: 'npm run test:watch',
};

const selectedCommand = commands[command];

if (!selectedCommand) {
  console.error(`\n❌ Opción desconocida: "${command}"\n`);
  console.log('Opciones disponibles:');
  Object.keys(commands).forEach(cmd => {
    console.log(`  - ${cmd}`);
  });
  process.exit(1);
}

console.log(`\n🚀 Ejecutando: ${selectedCommand}\n`);

try {
  execSync(selectedCommand, { stdio: 'inherit' });
  console.log('\n✅ Pruebas completadas exitosamente\n');
} catch (error) {
  console.error('\n❌ Las pruebas fallaron\n');
  process.exit(1);
}
