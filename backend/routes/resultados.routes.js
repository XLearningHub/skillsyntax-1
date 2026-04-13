const express = require("express");
const router = express.Router();
const db = require("../db");

/* GUARDAR RESULTADO */
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
        JSON.stringify(respuestas) // Guarda las respuestas en formato JSON
      ]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("Error guardando:", error);
    res.status(500).json({ error: "Error al guardar resultado" });
  }
});

module.exports = router;