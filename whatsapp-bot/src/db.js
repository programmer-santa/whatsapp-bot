// Importar dependencias
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión desde variables de entorno
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barberia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`📊 Base de datos: ${dbConfig.database}`);
    console.log(`🖥️  Host: ${dbConfig.host}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    return false;
  }
}

// Probar conexión al cargar el módulo
testConnection().catch(err => {
  console.error('Error en la prueba inicial de conexión:', err);
});

// Exportar el pool para reutilizarlo en otros módulos
module.exports = {
  pool,
  testConnection
};
