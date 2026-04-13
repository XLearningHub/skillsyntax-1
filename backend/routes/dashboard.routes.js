const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/:usuario_id", async (req, res) => {
  const { usuario_id } = req.params;

  try {
    // 🔹 Promedio por habilidad
    const [promedios] = await db.query(`
      SELECT 
        r.habilidad, 
        ROUND(AVG(r.puntaje), 2) AS promedio
      FROM resultados r
      INNER JOIN sesiones s ON r.sesion_id = s.id
      WHERE s.usuario_id = ?
      GROUP BY r.habilidad
    `, [usuario_id]);

    // 🔹 Historial de sesiones
    const [historial] = await db.query(`
      SELECT 
        s.fecha,
        s.tema,
        s.nivel,
        r.habilidad,
        r.puntaje
      FROM resultados r
      INNER JOIN sesiones s ON r.sesion_id = s.id
      WHERE s.usuario_id = ?
      ORDER BY s.fecha DESC
    `, [usuario_id]);

    res.json({
      data: promedios,
      historial: historial
    });

  } catch (error) {
    console.error("Error en dashboard:", error);
    res.status(500).json({
      error: "Error al obtener datos del dashboard"
    });
  }
});

module.exports = router;