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

// SESIONES HOY  ─  logins registrados en eventos_sistema desde medianoche
router.get("/total-sesiones", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const isoStart = startOfDay.toISOString();

    // Cuenta exclusivamente eventos de tipo LOGIN del día actual
    const snapshot = await db
      .collection("eventos_sistema")
      .where("tipo",  "==", "LOGIN")
      .where("fecha", ">=", isoStart)
      .count()
      .get();

    res.json({ total: snapshot.data().count });
  } catch (error) {
    console.error("Error sesiones hoy:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// ACTIVIDAD RECIENTE  ─  últimos 10 eventos del Audit Trail
router.get("/actividad-reciente", async (req, res) => {
  try {
    const snap = await db
      .collection("eventos_sistema")
      .orderBy("fecha", "desc")
      .limit(10)
      .get();

    // Mapa de icono y color por tipo de evento
    const metaEvento = {
      LOGIN:             { icono: "fa-sign-in-alt",   color: "#06d6a0" },
      USUARIO_CREADO:    { icono: "fa-user-plus",     color: "#9b5de5" },
      USUARIO_ELIMINADO: { icono: "fa-user-minus",    color: "#ff5f52" },
      GRUPO_CREADO:      { icono: "fa-users-line",    color: "#00c2cb" },
      GRUPO_ELIMINADO:   { icono: "fa-users-slash",   color: "#ffd166" },
    };

    const actividad = snap.docs.map((d) => {
      const data = d.data();
      const meta = metaEvento[data.tipo] || { icono: "fa-circle-info", color: "#a0aec0" };
      return {
        tipo:        data.tipo,
        icono:       meta.icono,
        color:       meta.color,
        texto:       data.descripcion || data.tipo,
        fecha:       data.fecha || null,
      };
    });

    res.json(actividad);
  } catch (error) {
    console.error("Error actividad reciente:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

module.exports = router;