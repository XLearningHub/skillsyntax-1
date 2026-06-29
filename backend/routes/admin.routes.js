const express = require("express");
const router = express.Router();
const db = require("../db");

// TOTAL DE USUARIOS
router.get("/total-usuarios", async (req, res) => {
  try {
    const snapshot = await db.collection("users").count().get();
    res.json({ total: snapshot.data().count });
  } catch (error) {
    console.error("Error usuarios:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// TOTAL DE EJERCICIOS
router.get("/total-ejercicios", async (req, res) => {
  try {
    const snapshot = await db.collection("resultados").count().get();
    res.json({ total: snapshot.data().count });
  } catch (error) {
    console.error("Error ejercicios:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// TOTAL DE SESIONES
router.get("/total-sesiones", async (req, res) => {
  try {
    const snapshot = await db.collection("sesiones").count().get();
    res.json({ total: snapshot.data().count });
  } catch (error) {
    console.error("Error sesiones:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;