// routes/perfil.routes.js
const express = require("express");
const router  = express.Router();
const db      = require("../db");
const bcrypt  = require("bcrypt");

// Avatares válidos aceptados por el servidor (lista blanca)
const AVATARES_VALIDOS = [
  "av1","av2","av3","av4","av5","av6","av7","av8",
];

// ── PUT /api/perfil/avatar ──────────────────────────────────────────────────
// Body: { usuarioId: string, avatar: string }
router.put("/avatar", async (req, res) => {
  const { usuarioId, avatar } = req.body;

  if (!usuarioId || !avatar) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }

  if (!AVATARES_VALIDOS.includes(avatar)) {
    return res.status(400).json({ error: "Avatar no válido." });
  }

  try {
    await db.collection("users").doc(usuarioId).update({ avatar });
    console.log(`[PERFIL] Avatar actualizado para ${usuarioId}: ${avatar}`);
    res.json({ mensaje: "Avatar actualizado correctamente." });
  } catch (err) {
    console.error("[PERFIL] Error al actualizar avatar:", err);
    res.status(500).json({ error: "Error al guardar el avatar." });
  }
});

// ── PUT /api/perfil/password ────────────────────────────────────────────────
// Body: { usuarioId: string, passwordActual: string, nuevaPassword: string }
router.put("/password", async (req, res) => {
  const { usuarioId, passwordActual, nuevaPassword } = req.body;

  // Validaciones básicas
  if (!usuarioId || !passwordActual || !nuevaPassword) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }
  if (nuevaPassword.length < 6) {
    return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
  }
  if (passwordActual === nuevaPassword) {
    return res.status(400).json({ error: "La nueva contraseña debe ser diferente a la actual." });
  }

  try {
    // 1. Obtener el documento del usuario
    const userDoc = await db.collection("users").doc(usuarioId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const userData = userDoc.data();

    if (!userData.password) {
      return res.status(500).json({ error: "Error de configuración de cuenta." });
    }

    // 2. Validar la contraseña actual con bcrypt (re-autenticación segura)
    const esCorrecta = await bcrypt.compare(passwordActual, userData.password);

    if (!esCorrecta) {
      console.warn(`[PERFIL] Contraseña actual incorrecta para usuario ${usuarioId}`);
      return res.status(401).json({ error: "La contraseña actual es incorrecta." });
    }

    // 3. Hashear la nueva contraseña y guardarla
    const nuevoHash = await bcrypt.hash(nuevaPassword, 10);
    await db.collection("users").doc(usuarioId).update({ password: nuevoHash });

    console.log(`[PERFIL] Contraseña actualizada para usuario ${usuarioId}`);
    res.json({ mensaje: "Contraseña actualizada correctamente." });

  } catch (err) {
    console.error("[PERFIL] Error al cambiar contraseña:", err);
    res.status(500).json({ error: "Error interno al actualizar la contraseña." });
  }
});

module.exports = router;
