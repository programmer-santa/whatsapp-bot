// Importar pool de conexiones
const { pool } = require('./db');

// Nombre de la tabla de chats
const TABLE_NAME = 'whatsapp_chats';

/**
 * Limpia y normaliza un número de teléfono
 * @param {string} phoneNumber - Número de teléfono a limpiar
 * @returns {string} - Número limpio
 */
function cleanPhoneNumber(phoneNumber) {
  // Remover caracteres no numéricos excepto el +
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '').trim();
  // Remover el prefijo + si existe (normalizar)
  return cleanPhone.replace(/^\+/, '');
}

/**
 * Busca un chat por número de teléfono
 * @param {string} phoneNumber - Número de teléfono
 * @returns {Promise<object|null>} - Chat encontrado o null
 */
async function findChatByPhone(phoneNumber) {
  try {
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    
    const query = `
      SELECT * FROM \`${TABLE_NAME}\`
      WHERE \`telefono\` = ?
      ORDER BY \`id\` DESC
      LIMIT 1
    `;
    
    const [rows] = await pool.execute(query, [cleanPhone]);
    
    return rows.length > 0 ? rows[0] : null;
    
  } catch (error) {
    console.error('❌ Error al buscar chat:', error.message);
    return null;
  }
}

/**
 * Crea un nuevo chat
 * @param {string} phoneNumber - Número de teléfono
 * @param {string} message - Mensaje recibido
 * @returns {Promise<object|null>} - Chat creado o null
 */
async function createChat(phoneNumber, message) {
  try {
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    const now = new Date();
    
    const query = `
      INSERT INTO \`${TABLE_NAME}\` (\`telefono\`, \`estado\`, \`ultimo_mensaje\`, \`ultima_interaccion\`)
      VALUES (?, 'esperando_barbero', ?, ?)
    `;
    
    const [result] = await pool.execute(query, [cleanPhone, message, now]);
    
    // Obtener el chat creado
    const chatId = result.insertId;
    const selectQuery = `SELECT * FROM \`${TABLE_NAME}\` WHERE \`id\` = ?`;
    const [rows] = await pool.execute(selectQuery, [chatId]);
    
    return rows.length > 0 ? rows[0] : null;
    
  } catch (error) {
    console.error('❌ Error al crear chat:', error.message);
    return null;
  }
}

/**
 * Actualiza el último mensaje y la última interacción de un chat
 * @param {number} chatId - ID del chat
 * @param {string} message - Mensaje recibido
 * @returns {Promise<boolean>} - true si se actualizó correctamente
 */
async function updateChatMessage(chatId, message) {
  try {
    const now = new Date();
    
    const query = `
      UPDATE \`${TABLE_NAME}\`
      SET \`ultimo_mensaje\` = ?, \`ultima_interaccion\` = ?
      WHERE \`id\` = ?
    `;
    
    await pool.execute(query, [message, now, chatId]);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error al actualizar chat:', error.message);
    return false;
  }
}

/**
 * Marca un chat como atendido y actualiza el mensaje del barbero
 * @param {string} phoneNumber - Número de teléfono
 * @param {string} message - Mensaje del barbero
 * @returns {Promise<{success: boolean, chat: object|null}>}
 */
async function markAsAttended(phoneNumber, message) {
  try {
    // Buscar chat por teléfono
    const chat = await findChatByPhone(phoneNumber);
    
    if (!chat) {
      // Chat no encontrado
      return {
        success: false,
        chat: null
      };
    }
    
    // Actualizar estado a 'atendido', último mensaje e interacción
    const now = new Date();
    const query = `
      UPDATE \`${TABLE_NAME}\`
      SET \`estado\` = 'atendido', 
          \`ultimo_mensaje\` = ?, 
          \`ultima_interaccion\` = ?
      WHERE \`id\` = ?
    `;
    
    await pool.execute(query, [message, now, chat.id]);
    
    // Obtener el chat actualizado
    const updatedChat = await findChatByPhone(phoneNumber);
    
    return {
      success: true,
      chat: updatedChat
    };
    
  } catch (error) {
    console.error('❌ Error al marcar como atendido:', error.message);
    return {
      success: false,
      chat: null
    };
  }
}

/**
 * Procesa un mensaje recibido y retorna el estado del chat
 * @param {string} phoneNumber - Número de teléfono
 * @param {string} message - Mensaje recibido
 * @returns {Promise<{chat: object|null, estado: string, isNew: boolean}>}
 */
async function processMessage(phoneNumber, message) {
  try {
    // Buscar chat existente
    let chat = await findChatByPhone(phoneNumber);
    
    if (!chat) {
      // Cliente nuevo - crear chat con estado esperando_barbero
      chat = await createChat(phoneNumber, message);
      
      if (chat) {
        return {
          chat,
          estado: 'esperando_barbero',
          isNew: true
        };
      } else {
        return {
          chat: null,
          estado: 'nuevo',
          isNew: true
        };
      }
    } else {
      // Cliente existente - actualizar último mensaje
      await updateChatMessage(chat.id, message);
      
      // Obtener el chat actualizado
      chat = await findChatByPhone(phoneNumber);
      
      return {
        chat,
        estado: chat.estado,
        isNew: false
      };
    }
    
  } catch (error) {
    console.error('❌ Error al procesar mensaje:', error.message);
    return {
      chat: null,
      estado: 'nuevo',
      isNew: false
    };
  }
}

module.exports = {
  findChatByPhone,
  createChat,
  updateChatMessage,
  processMessage,
  markAsAttended
};
