/*const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
  const { sesion_id, habilidad, puntaje, respuestas, feedback } = req.body;

  if (!sesion_id || !habilidad) {
    return res.json({ success: false, error: "Faltan datos" });
  }

  db.query(
    `INSERT INTO resultados 
    (sesion_id, habilidad, puntaje, respuestas, feedback) 
    VALUES (?, ?, ?, ?, ?)`,
    [sesion_id, habilidad, puntaje, JSON.stringify(respuestas), feedback],
    (err, result) => {
      if (err) {
        console.error("Error guardando resultado:", err);
        return res.json({ success: false, error: err });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;*/

const express = require("express");
const router = express.Router();
const db = require("../db");

/* CREAR SESIÓN */
router.post("/sesiones", async (req, res) => {
  const { usuario_id, tema, nivel } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO sesiones (usuario_id, tema, nivel) VALUES (?, ?, ?)",
      [usuario_id, tema, nivel]
    );

    res.json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: "Error al crear sesión" });
  }
});

/* GUARDAR RESULTADO */
router.post("/resultados", async (req, res) => {
  const { sesion_id, habilidad, puntaje, feedback, respuestas } = req.body;

  try {
    await db.query(
      `INSERT INTO resultados 
      (sesion_id, habilidad, puntaje, feedback, respuestas) 
      VALUES (?, ?, ?, ?, ?)`,
      [sesion_id, habilidad, puntaje, feedback, respuestas]
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar resultado" });
  }
});

module.exports = router;