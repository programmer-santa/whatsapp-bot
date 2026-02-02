// Importar dependencias
const twilio = require('twilio');
require('dotenv').config();

// Configuración de Twilio desde variables de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // Formato: whatsapp:+1234567890

// Validar que las variables de entorno estén configuradas
if (!accountSid || !authToken || !whatsappFrom) {
  console.warn('⚠️  Variables de entorno de Twilio no configuradas completamente');
  console.warn('   Se requieren: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM');
}

// Inicializar cliente de Twilio
const client = accountSid && authToken 
  ? twilio(accountSid, authToken)
  : null;

/**
 * Normaliza un número de teléfono para WhatsApp
 * Asegura que tenga el formato correcto para Twilio
 * @param {string} phoneNumber - Número de teléfono
 * @returns {string} - Número normalizado con prefijo whatsapp:
 */
function normalizePhoneNumber(phoneNumber) {
  // Limpiar el número
  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '').trim();
  
  // Si no tiene prefijo whatsapp:, agregarlo
  if (!cleanPhone.startsWith('whatsapp:')) {
    // Si no tiene +, agregarlo
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    cleanPhone = 'whatsapp:' + cleanPhone;
  }
  
  return cleanPhone;
}

/**
 * Envía un mensaje de WhatsApp usando Twilio
 * @param {string} to - Número de destino (formato: +1234567890 o whatsapp:+1234567890)
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<{success: boolean, messageSid?: string, error?: string}>}
 */
async function sendWhatsAppMessage(to, message) {
  // Validar que Twilio esté configurado
  if (!client) {
    const error = 'Twilio no está configurado. Verifica las variables de entorno.';
    console.error('❌', error);
    return { success: false, error };
  }
  
  // Validar que el número de destino esté presente
  if (!to) {
    const error = 'Número de destino no proporcionado';
    console.error('❌', error);
    return { success: false, error };
  }
  
  // Validar que el mensaje esté presente
  if (!message) {
    const error = 'Mensaje vacío';
    console.error('❌', error);
    return { success: false, error };
  }
  
  try {
    // Normalizar número de destino
    const normalizedTo = normalizePhoneNumber(to);
    
    // Enviar mensaje usando Twilio
    const result = await client.messages.create({
      from: whatsappFrom,
      to: normalizedTo,
      body: message
    });
    
    console.log('✅ Mensaje enviado correctamente');
    console.log(`   De: ${whatsappFrom}`);
    console.log(`   Para: ${normalizedTo}`);
    console.log(`   Message SID: ${result.sid}`);
    
    return {
      success: true,
      messageSid: result.sid
    };
    
  } catch (error) {
    // Manejar errores de Twilio
    const errorMessage = error.message || 'Error desconocido al enviar mensaje';
    console.error('❌ Error al enviar mensaje de WhatsApp:', errorMessage);
    console.error('   Código:', error.code);
    console.error('   Detalles:', error);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

module.exports = {
  sendWhatsAppMessage,
  normalizePhoneNumber
};
