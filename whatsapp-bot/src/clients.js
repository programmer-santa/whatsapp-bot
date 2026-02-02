// Importar pool de conexiones
const { pool } = require('./db');

// Nombre de la tabla de clientes de WhatsApp
const TABLE_NAME = 'whatsapp_clientes';

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
 * Verifica si un cliente existe en la tabla whatsapp_clientes
 * @param {string} phoneNumber - Número de teléfono a buscar
 * @returns {Promise<boolean>} - true si el cliente existe, false si no existe
 */
async function clientExists(phoneNumber) {
  try {
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    
    // Consulta segura usando prepared statement
    const query = `
      SELECT COUNT(*) as count 
      FROM \`${TABLE_NAME}\`
      WHERE \`telefono\` = ?
    `;
    
    // Ejecutar consulta con prepared statement (protección contra SQL injection)
    const [rows] = await pool.execute(query, [cleanPhone]);
    
    // Si count > 0, el cliente existe
    return rows[0].count > 0;
    
  } catch (error) {
    console.error('❌ Error al verificar cliente en BD:', error.message);
    // En caso de error, retornar false para no bloquear el flujo
    return false;
  }
}

/**
 * Inserta un nuevo cliente en la tabla whatsapp_clientes
 * @param {string} phoneNumber - Número de teléfono a insertar
 * @returns {Promise<boolean>} - true si se insertó correctamente, false si hubo error
 */
async function insertClient(phoneNumber) {
  try {
    const cleanPhone = cleanPhoneNumber(phoneNumber);
    
    // Consulta segura usando prepared statement
    const query = `
      INSERT INTO \`${TABLE_NAME}\` (\`telefono\`)
      VALUES (?)
    `;
    
    // Ejecutar inserción con prepared statement
    await pool.execute(query, [cleanPhone]);
    
    return true;
    
  } catch (error) {
    // Si el error es por duplicado (UNIQUE constraint), el cliente ya existe
    if (error.code === 'ER_DUP_ENTRY') {
      return true; // Considerar como éxito (cliente ya existe)
    }
    
    console.error('❌ Error al insertar cliente en BD:', error.message);
    return false;
  }
}

/**
 * Verifica si un cliente existe, y si no existe, lo inserta
 * @param {string} phoneNumber - Número de teléfono a verificar/insertar
 * @returns {Promise<{exists: boolean, isNew: boolean}>} - Objeto con información del cliente
 */
async function checkOrCreateClient(phoneNumber) {
  try {
    // Verificar si el cliente ya existe
    const exists = await clientExists(phoneNumber);
    
    if (exists) {
      // Cliente recurrente
      return { exists: true, isNew: false };
    } else {
      // Cliente nuevo - insertar en la base de datos
      const inserted = await insertClient(phoneNumber);
      
      if (inserted) {
        return { exists: true, isNew: true };
      } else {
        // Error al insertar, pero no bloquear el flujo
        return { exists: false, isNew: true };
      }
    }
    
  } catch (error) {
    console.error('❌ Error al verificar/crear cliente:', error.message);
    return { exists: false, isNew: false };
  }
}

module.exports = {
  clientExists,
  insertClient,
  checkOrCreateClient
};
