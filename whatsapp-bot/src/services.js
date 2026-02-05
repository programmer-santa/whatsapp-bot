// Importar pool de conexiones
const { pool } = require('./db');

/**
 * Obtiene todos los servicios disponibles
 * @returns {Promise<Array>} - Lista de servicios
 */
async function getServicios() {
  try {
    const query = `
      SELECT * FROM \`servicios\`
      ORDER BY \`id\` ASC
    `;
    
    const [rows] = await pool.execute(query);
    return rows;
    
  } catch (error) {
    console.error('❌ Error al obtener servicios:', error.message);
    return [];
  }
}

/**
 * Obtiene todos los barberos disponibles
 * @returns {Promise<Array>} - Lista de barberos
 */
async function getBarberos() {
  try {
    const query = `
      SELECT * FROM \`barberos\`
      ORDER BY \`id\` ASC
    `;
    
    const [rows] = await pool.execute(query);
    return rows;
    
  } catch (error) {
    console.error('❌ Error al obtener barberos:', error.message);
    return [];
  }
}

/**
 * Formatea la lista de servicios para WhatsApp
 * @param {Array} servicios - Lista de servicios
 * @returns {string} - Mensaje formateado
 */
function formatServicios(servicios) {
  if (servicios.length === 0) {
    return '📋 No hay servicios disponibles en este momento.';
  }
  
  let mensaje = '*📋 SERVICIOS DISPONIBLES*\n\n';
  
  servicios.forEach((servicio, index) => {
    const nombre = servicio.nombre || servicio.Nombre || servicio.name || 'Sin nombre';
    const precio = servicio.precio || servicio.Precio || servicio.price || 'N/A';
    const descripcion = servicio.descripcion || servicio.Descripcion || servicio.description || '';
    
    mensaje += `${index + 1}. *${nombre}*\n`;
    if (descripcion) {
      mensaje += `   ${descripcion}\n`;
    }
    mensaje += `   💰 Precio: $${precio}\n\n`;
  });
  
  return mensaje;
}

/**
 * Formatea la lista de barberos para WhatsApp
 * @param {Array} barberos - Lista de barberos
 * @returns {string} - Mensaje formateado
 */
function formatBarberos(barberos) {
  if (barberos.length === 0) {
    return '👨‍💼 No hay barberos disponibles en este momento.';
  }
  
  let mensaje = '*👨‍💼 NUESTROS BARBEROS*\n\n';
  
  barberos.forEach((barbero, index) => {
    const nombre = barbero.nombre || barbero.Nombre || barbero.name || 'Sin nombre';
    const especialidad = barbero.especialidad || barbero.Especialidad || barbero.specialty || '';
    
    mensaje += `${index + 1}. *${nombre}*`;
    if (especialidad) {
      mensaje += `\n   ${especialidad}`;
    }
    mensaje += '\n\n';
  });
  
  return mensaje;
}

module.exports = {
  getServicios,
  getBarberos,
  formatServicios,
  formatBarberos
};
