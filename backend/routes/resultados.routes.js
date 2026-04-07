const express = require("express");
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

module.exports = router;