const express = require("express");
const router = express.Router();
const db = require("../db");

// OBTENER USUARIO POR EMAIL (PARA LOGIN)
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

// OBTENER TODOS LOS USUARIOS (ADMIN)
router.get("/", async (req, res) => {
  try {
    const [result] = await db.query(
      "SELECT id, nombre, email, nivel_general, rol, fecha FROM users ORDER BY id ASC"
    );
    res.json(result);
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// OBTENER USUARIO POR ID (PARA DASHBOARD)
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

// ACTUALIZAR ROL DE USUARIO (ADMIN)
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  try {
    await db.query(
      "UPDATE users SET rol = ? WHERE id = ?",
      [rol, id]
    );

    res.json({ mensaje: "Rol actualizado correctamente" });
  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

//ACTUALIZAR NIVEL GENERAL DE USUARIO (DASHBOARD)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    res.json({ mensaje: "Usuario eliminado correctamente" });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

module.exports = router;