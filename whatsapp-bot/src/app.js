// Importar dependencias
const express = require('express');
require('dotenv').config();
const { testConnection } = require('./db');
const { clientExists } = require('./clients');

// Crear instancia de Express
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Middleware para parsear URL encoded
app.use(express.urlencoded({ extended: true }));

// Endpoint de salud para pruebas
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'WhatsApp Bot API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      webhook: '/webhook/whatsapp'
    }
  });
});

// Webhook para recibir mensajes de WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    // Leer datos del body (formato JSON)
    const from = req.body.from;
    const body = req.body.body;
    
    // Manejar caso donde falten datos
    if (!from || !body) {
      console.warn('⚠️  Webhook recibido sin datos completos');
      return res.status(200).json({ ok: true });
    }
    
    // Mostrar información en consola con formato específico
    console.log('📩 Mensaje recibido');
    console.log(`De: ${from}`);
    console.log(`Texto: ${body}`);
    
    // Verificar si el cliente es nuevo o recurrente
    const exists = await clientExists(from);
    
    if (exists) {
      console.log('🔁 Cliente recurrente');
    } else {
      console.log('🆕 Cliente nuevo');
    }
    
    // Responder JSON
    res.status(200).json({ ok: true });
    
  } catch (error) {
    // En caso de error, loguear pero responder 200 para no causar reintentos
    console.error('❌ Error al procesar webhook:', error);
    res.status(200).json({ ok: true });
  }
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.path
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Obtener puerto de variables de entorno o usar 3000 por defecto
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor Express corriendo en el puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  
  // Probar conexión a la base de datos
  await testConnection();
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Exportar app para testing (opcional)
module.exports = app;
