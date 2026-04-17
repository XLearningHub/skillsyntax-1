const db = require("../db");

exports.obtenerDashboard = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const [data] = await db.query(`
      SELECT 
        r.habilidad,
        AVG(r.puntaje) as promedio
      FROM resultados r
      JOIN sesiones s ON r.sesion_id = s.id
      WHERE s.usuario_id = ?
      GROUP BY r.habilidad
    `, [usuario_id]);

    const [historial] = await db.query(`
      SELECT 
        r.fecha,
        s.tema,
        s.nivel,
        r.habilidad,
        r.puntaje
      FROM resultados r
      JOIN sesiones s ON r.sesion_id = s.id
      WHERE s.usuario_id = ?
      ORDER BY r.fecha DESC
    `, [usuario_id]);

    res.json({
      data,
      historial
    });

  } catch (error) {
    console.error("Error dashboard:", error);
    res.status(500).json({ error: "Error en dashboard" });
  }
};


exports.obtenerHistorial = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const [historial] = await db.query(`
      SELECT 
        r.fecha,
        s.tema,
        s.nivel,
        r.habilidad,
        r.puntaje
      FROM resultados r
      JOIN sesiones s ON r.sesion_id = s.id
      WHERE s.usuario_id = ?
      ORDER BY r.fecha DESC
    `, [usuario_id]);

    res.json(historial);

  } catch (error) {
    res.status(500).json({ error: "Error historial" });
  }
};