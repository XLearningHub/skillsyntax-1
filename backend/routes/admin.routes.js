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

// SESIONES HOY  ─  solo las creadas desde la medianoche local de hoy
router.get("/total-sesiones", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const isoStart = startOfDay.toISOString(); // "2025-07-20T06:00:00.000Z"

    // Firestore guarda 'fecha' como string ISO → comparación lexicográfica válida
    const snapshot = await db
      .collection("sesiones")
      .where("fecha", ">=", isoStart)
      .count()
      .get();

    res.json({ total: snapshot.data().count });
  } catch (error) {
    console.error("Error sesiones hoy:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ACTIVIDAD RECIENTE  ─  últimos 8 eventos (usuarios + sesiones) para el feed
router.get("/actividad-reciente", async (req, res) => {
  try {
    const LIMIT = 8;

    // Últimos usuarios registrados
    const usersSnap = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(LIMIT)
      .get();

    const usuariosRecientes = usersSnap.docs.map((d) => ({
      tipo:   "usuario",
      icono:  "fa-user-plus",
      color:  "#00c2cb",
      texto:  `Nuevo usuario: ${d.data().nombre || d.data().email || "sin nombre"}`,
      fecha:  d.data().createdAt || null,
    }));

    // Últimas sesiones
    const sesionesSnap = await db
      .collection("sesiones")
      .orderBy("fecha", "desc")
      .limit(LIMIT)
      .get();

    const sesionesRecientes = sesionesSnap.docs.map((d) => ({
      tipo:   "sesion",
      icono:  "fa-sign-in-alt",
      color:  "#06d6a0",
      texto:  `Nueva sesión iniciada`,
      fecha:  d.data().fecha || null,
    }));

    // Unir y ordenar por fecha desc, tomar los N más recientes
    const actividad = [...usuariosRecientes, ...sesionesRecientes]
      .filter((e) => e.fecha)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, LIMIT);

    res.json(actividad);
  } catch (error) {
    console.error("Error actividad reciente:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;