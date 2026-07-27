const express = require("express");
const router  = express.Router();
const db      = require("../db");
const admin   = require("firebase-admin");
const usuariosCtrl = require("../controllers/usuarios.controller");

// CREAR USUARIO (ADMIN)  ─  Auth + Firestore sincronizados
router.post("/", usuariosCtrl.crearUsuario);

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

    // Ordenar por nombre en memoria
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

// ACTUALIZAR USUARIO (ADMIN) — sincroniza Auth + Firestore
router.put("/:id", usuariosCtrl.actualizarUsuario);

// ELIMINAR USUARIO (ADMIN) — borrado en cascada: sesiones → resultados → eventos → users → Auth
router.delete("/:id", usuariosCtrl.eliminarUsuario);

module.exports = router;