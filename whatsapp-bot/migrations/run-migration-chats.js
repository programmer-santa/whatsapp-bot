// Script para ejecutar la migración de la tabla whatsapp_chats
const { pool } = require('../src/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Ejecutando migración: crear tabla whatsapp_chats...');
    
    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create_whatsapp_chats.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar la migración
    await pool.query(sql);
    
    console.log('✅ Migración ejecutada correctamente');
    console.log('📊 Tabla whatsapp_chats creada');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al ejecutar migración:', error.message);
    process.exit(1);
  }
}

runMigration();
