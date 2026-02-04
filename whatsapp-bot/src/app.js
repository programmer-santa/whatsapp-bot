// Importar dependencias
const express = require('express');
require('dotenv').config();
const { testConnection } = require('./db');
const { processMessage, markAsAttended } = require('./chats');

// Crear instancia de Express
const app = express();

// IMPORTANTE: necesario para Twilio (envía application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

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
      webhook: '/webhook/whatsapp',
      barberoResponde: '/webhook/barbero-responde'
    }
  });
});

// Webhook para recibir mensajes de WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
  try {
    // Log del body completo para debugging
    console.log('📥 Webhook RAW:', req.body);
    
    // Twilio envía los datos con mayúsculas: From y Body
    const from = req.body.From;
    const body = req.body.Body;
    
    // Manejar caso donde falten datos
    if (!from || !body) {
      console.log('⚠️ Webhook recibido sin datos completos');
      return res.sendStatus(200);
    }
    
    // Limpiar el número de teléfono (remover prefijo whatsapp:)
    const telefono = from.replace('whatsapp:', '');
    
    // Mostrar información en consola con formato específico
    console.log('📩 Mensaje recibido');
    console.log('De:', telefono);
    console.log('Texto:', body);
    
    // Procesar mensaje y obtener estado del chat
    const { chat, estado, isNew } = await processMessage(telefono, body);
    
    // Determinar mensaje de respuesta según el estado
    let responseMessage = '';
    
    if (isNew) {
      // Cliente nuevo - crear chat con estado esperando_barbero
      console.log('🆕 Cliente nuevo');
      responseMessage = '👋 Gracias por escribir a nuestra barbería.\nEn breve un barbero te atenderá.';
    } else if (estado === 'esperando_barbero') {
      // Cliente esperando barbero
      console.log('🔁 Cliente esperando');
      responseMessage = '⏳ Estamos procesando tu solicitud. Un barbero te atenderá pronto.';
    } else if (estado === 'atendido') {
      // Cliente atendido - mensaje de bienvenida nuevamente
      console.log('✅ Cliente atendido');
      responseMessage = '👋 ¡Bienvenido de nuevo!\n¿En qué podemos ayudarte hoy? 💈';
    } else {
      // Estado nuevo (por defecto)
      console.log('🆕 Cliente nuevo');
      responseMessage = '👋 Gracias por escribir a nuestra barbería.\nEn breve un barbero te atenderá.';
    }
    
    // Simular envío de mensaje (sin Twilio real)
    console.log('📤 Mensaje de respuesta:');
    console.log(responseMessage);
    
    // Respuesta vacía correcta para Twilio (debe ser 200 sin body)
    res.sendStatus(200);
    
  } catch (error) {
    // En caso de error, loguear pero responder 200 para no causar reintentos
    console.error('❌ Error al procesar webhook:', error);
    res.sendStatus(200);
  }
});

// Webhook para que el barbero marque un cliente como atendido
app.post('/webhook/barbero-responde', async (req, res) => {
  try {
    // Leer datos del body (formato JSON)
    const telefono = req.body.telefono;
    const mensaje = req.body.mensaje;
    
    // Manejar caso donde falten datos
    if (!telefono || !mensaje) {
      console.warn('⚠️  Webhook barbero recibido sin datos completos');
      return res.status(400).json({ 
        ok: false, 
        error: 'Faltan datos: telefono y mensaje son requeridos' 
      });
    }
    
    // Buscar y actualizar el chat
    const result = await markAsAttended(telefono, mensaje);
    
    if (!result.success) {
      console.warn(`⚠️  No se encontró chat para el teléfono: ${telefono}`);
      return res.status(404).json({ 
        ok: false, 
        error: 'Chat no encontrado para este teléfono' 
      });
    }
    
    // Log en consola
    console.log('🧔 Barbero respondió');
    console.log(`📞 Teléfono: ${telefono}`);
    
    // Responder JSON
    res.status(200).json({ ok: true });
    
  } catch (error) {
    // En caso de error, loguear y responder
    console.error('❌ Error al procesar respuesta del barbero:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Error interno del servidor' 
    });
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
