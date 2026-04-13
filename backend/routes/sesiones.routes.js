const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", async (req, res) => {
  console.log("🔥 ENTRO A /sesiones");

  const { usuario_id, tema, nivel } = req.body;

  try {
    const [result] = await db.query(
      "INSERT INTO sesiones (usuario_id, tema, nivel) VALUES (?, ?, ?)",
      [usuario_id, tema, nivel]
    );

    console.log("🔥 QUERY EJECUTADA");
    console.log("✅ SESION CREADA");

    res.json({ id: result.insertId });
  } catch (err) {
    console.error("❌ ERROR BD:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;