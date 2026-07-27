// routes/perfil.routes.js
const express = require("express");
const router  = express.Router();
const db      = require("../db");
const admin   = require("firebase-admin");

// ── PUT /api/perfil/avatar ──────────────────────────────────────────────────
// Body: { usuarioId: string, avatar: string }
// Acepta cualquier URL de avatar válida (DiceBear u otra) enviada por el frontend.
router.put("/avatar", async (req, res) => {
  const { usuarioId, avatar } = req.body;

  if (!usuarioId || !avatar) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }

  // Validación flexible: solo requiere que sea un string no vacío y razonable
  if (typeof avatar !== "string" || avatar.trim().length === 0 || avatar.length > 512) {
    return res.status(400).json({ error: "El valor del avatar no es válido." });
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
// Nota: Firebase Admin no verifica passwordActual. Si se desea re-autenticar al
// usuario por seguridad, esto debe hacerse en el cliente con signInWithEmailAndPassword
// antes de llamar a este endpoint.
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
    // Actualizar la contraseña directamente en Firebase Auth
    await admin.auth().updateUser(usuarioId, {
      password: nuevaPassword
    });

    console.log(`[PERFIL] Contraseña actualizada en Firebase Auth para usuario ${usuarioId}`);
    res.json({ mensaje: "Contraseña actualizada correctamente." });

  } catch (err) {
    console.error("[PERFIL] Error al cambiar contraseña:", err);
    
    // Mapear errores de Firebase Auth a mensajes de cliente
    const errorMessages = {
      "auth/weak-password": "La nueva contraseña debe tener al menos 6 caracteres.",
      "auth/user-not-found": "El usuario no existe en el sistema de autenticación."
    };
    
    // Devolvemos 400 si es un error de validación de Firebase, o 500 para errores internos
    if (err.code && err.code.startsWith("auth/")) {
      return res.status(400).json({ error: errorMessages[err.code] || "Error al actualizar la contraseña." });
    }
    
    res.status(500).json({ error: "Error interno al actualizar la contraseña." });
  }
});

module.exports = router;
