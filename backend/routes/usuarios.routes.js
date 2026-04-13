const express = require("express");
const router = express.Router();
const db = require("../db");

/* 🔹 OBTENER ID POR EMAIL (LOGIN) */
router.post("/email", async (req, res) => {
  const { email } = req.body;

  try {
    const [result] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ id: result[0].id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error servidor" });
  }
});

/* 🔹 OBTENER USUARIO POR ID (PARA DASHBOARD) */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "SELECT id, nombre FROM users WHERE id = ?",
      [id]
    );

    if (result.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error servidor" });
  }
});

module.exports = router;