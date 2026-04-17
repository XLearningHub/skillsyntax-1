const express = require("express");
const router = express.Router();
const db = require("../db");


router.post("/", async (req, res) => {
  const { sesion_id, habilidad, puntaje, feedback, respuestas } = req.body;

  try {
    await db.query(
  `INSERT INTO resultados 
   (sesion_id, habilidad, puntaje, feedback, respuestas) 
   VALUES (?, ?, ?, ?, ?)`,
  [
    sesion_id,
    habilidad,
    puntaje,
    feedback,
    JSON.stringify(respuestas)
  ]
);

    res.json({ ok: true });
  } catch (error) {
    console.error("Error guardando:", error);
    res.status(500).json({ error: "Error al guardar resultado" });
  }
});

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        r.id,
        u.nombre AS usuario,
        r.habilidad,
        r.puntaje,
        r.feedback,
        r.audio_url
      FROM resultados r
      LEFT JOIN sesiones s ON r.sesion_id = s.id
      LEFT JOIN users u ON s.usuario_id = u.id
      ORDER BY r.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("Error obteniendo resultados:", error);
    res.status(500).json({ error: "Error al obtener resultados" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM resultados WHERE id = ?", [req.params.id]);
    res.json({ mensaje: "Eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminando:", error);
    res.status(500).json({ error: "Error al eliminar" });
  }
});

router.get("/reporte-usuarios", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.nombre AS usuario,
        COUNT(r.id) AS total
      FROM resultados r
      JOIN sesiones s ON r.sesion_id = s.id
      JOIN users u ON s.usuario_id = u.id
      GROUP BY u.nombre
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en reporte" });
  }
});

router.get("/reporte-habilidades", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT habilidad, COUNT(*) AS total
      FROM resultados
      GROUP BY habilidad
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en reporte habilidades" });
  }
});

module.exports = router;