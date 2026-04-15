const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");

router.post("/", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(
  "SELECT * FROM users WHERE email = ?",
  [email]
);

if (rows.length === 0) {
  return res.status(400).json({ error: "Usuario no existe" });
}

const user = rows[0];

const validPassword = await bcrypt.compare(password, user.password);

if (!validPassword) {
  return res.status(400).json({ error: "Contraseña incorrecta" });
}

res.json({
  id: user.id,
  nombre: user.nombre,
  email: user.email,
  rol: user.rol
});

  } catch (error) {
    console.error("❌ Error login:", error);
    res.status(500).json({ error: "Error login" });
  }
});

module.exports = router;