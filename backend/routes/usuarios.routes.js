const express = require("express");
const router = express.Router();
const db = require("../db");

// OBTENER USUARIO POR EMAIL (PARA LOGIN)
router.post("/email", async (req, res) => {
  const { email } = req.body;

  try {
    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// OBTENER TODOS LOS USUARIOS (ADMIN)
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Ordenar por nombre en memoria (Firestore no requiere un índice para esto)
    users.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

    res.json(users);

  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// OBTENER USUARIO POR ID (PARA DASHBOARD)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const data = doc.data();
    res.json({ id: doc.id, nombre: data.nombre });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// ACTUALIZAR USUARIO (ADMIN) — nombre, email, rol, nivel_general
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, nivel_general } = req.body;

  // Incluir solo los campos que llegan en el body
  const actualizacion = {};
  if (nombre        !== undefined) actualizacion.nombre        = nombre;
  if (email         !== undefined) actualizacion.email         = email;
  if (rol           !== undefined) actualizacion.rol           = rol;
  if (nivel_general !== undefined) actualizacion.nivel_general = nivel_general;

  if (Object.keys(actualizacion).length === 0) {
    return res.status(400).json({ error: "No se proporcionaron campos para actualizar" });
  }

  try {
    await db.collection("users").doc(id).update(actualizacion);
    res.json({ mensaje: "Usuario actualizado correctamente" });

  } catch (err) {
    console.error("Error al actualizar usuario:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// ELIMINAR USUARIO (ADMIN)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("users").doc(id).delete();
    res.json({ mensaje: "Usuario eliminado correctamente" });

  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

module.exports = router;