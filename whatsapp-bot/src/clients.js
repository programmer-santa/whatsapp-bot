// Importar pool de conexiones
const { pool } = require('./db');

/**
 * Verifica si un cliente existe en la base de datos por su número de teléfono
 * 
 * NOTA: Ajusta estos valores según tu estructura de base de datos:
 * - TABLE_NAME: nombre de la tabla (ej: 'users', 'clients', 'clientes', 'customers')
 * - PHONE_FIELD: nombre del campo de teléfono (ej: 'phone', 'telefono', 'phone_number', 'celular', 'mobile')
 * 
 * @param {string} phoneNumber - Número de teléfono a buscar
 * @returns {Promise<boolean>} - true si el cliente existe, false si no existe
 */
async function clientExists(phoneNumber) {
  // Configuración: Ajusta estos valores según tu base de datos
  const TABLE_NAME = process.env.DB_CLIENTS_TABLE || 'users'; // Cambiar según tu tabla
  const PHONE_FIELD = process.env.DB_PHONE_FIELD || 'phone'; // Cambiar según tu campo
  
  try {
    // Limpiar el número de teléfono
    // Remover caracteres no numéricos excepto el +
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '').trim();
    const cleanPhoneWithoutPlus = cleanPhone.replace(/^\+/, '');
    
    // Consulta segura usando prepared statement
    // Los nombres de tabla y campo vienen de variables de entorno (seguro)
    // Los valores se pasan como parámetros (prepared statement)
    const query = `
      SELECT COUNT(*) as count 
      FROM \`${TABLE_NAME}\`
      WHERE \`${PHONE_FIELD}\` = ? OR \`${PHONE_FIELD}\` = ?
    `;
    
    // Ejecutar consulta con prepared statement (protección contra SQL injection)
    const [rows] = await pool.execute(query, [
      cleanPhone,
      cleanPhoneWithoutPlus // También buscar sin el +
    ]);
    
    // Si count > 0, el cliente existe
    return rows[0].count > 0;
    
  } catch (error) {
    console.error('❌ Error al verificar cliente en BD:', error.message);
    // En caso de error, retornar false para no bloquear el flujo
    return false;
  }
}

module.exports = {
  clientExists
};
