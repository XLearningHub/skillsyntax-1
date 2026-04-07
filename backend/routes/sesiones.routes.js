const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {
  const { usuario_id, tema, nivel } = req.body;

  if (!usuario_id) return res.json({ success: false, error: "Usuario no logueado" });

  db.query(
    "INSERT INTO sesiones (usuario_id, tema, nivel) VALUES (?, ?, ?)",
    [usuario_id, tema, nivel],
    (err, result) => {
      if (err) {
        console.error("Error al guardar sesión:", err);
        return res.json({ success: false, error: err });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
});

module.exports = router;