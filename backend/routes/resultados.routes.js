const express = require("express");
const router = express.Router();
const db = require("../db");

// GUARDAR RESULTADO
router.post("/", async (req, res) => {
  const { sesion_id, habilidad, puntaje, feedback, respuestas } = req.body;

  try {
    await db.collection("resultados").add({
      sesion_id,
      habilidad,
      puntaje,
      feedback,
      respuestas: respuestas || [],
      fecha: new Date().toISOString(),
    });

    res.json({ ok: true });

  } catch (error) {
    console.error("Error guardando:", error);
    res.status(500).json({ error: "Error al guardar resultado" });
  }
});

// OBTENER TODOS LOS RESULTADOS (ADMIN) — incluye nombre de usuario
router.get("/", async (req, res) => {
  try {
    const resultadosSnap = await db.collection("resultados").get();
    const resultados = resultadosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Enriquecer con el nombre de usuario via sesión
    const sesionIds = [...new Set(resultados.map((r) => r.sesion_id).filter(Boolean))];
    const sesionesMap = {};

    const chunkSize = 30;
    for (let i = 0; i < sesionIds.length; i += chunkSize) {
      const chunk = sesionIds.slice(i, i + chunkSize);
      const snap = await db.collection("sesiones").where("__name__", "in", chunk).get();
      snap.docs.forEach((d) => { sesionesMap[d.id] = d.data(); });
    }

    const usuarioIds = [
      ...new Set(Object.values(sesionesMap).map((s) => s.usuario_id).filter(Boolean)),
    ];
    const usersMap = {};

    for (let i = 0; i < usuarioIds.length; i += chunkSize) {
      const chunk = usuarioIds.slice(i, i + chunkSize);
      const snap = await db.collection("users").where("__name__", "in", chunk).get();
      snap.docs.forEach((d) => { usersMap[d.id] = d.data(); });
    }

    const enriched = resultados
      .map((r) => {
        const sesion = sesionesMap[r.sesion_id] || {};
        const usuarioId = sesion.usuario_id || null;
        const user = usersMap[usuarioId] || {};
        return {
          id: r.id,
          usuarioId,                          // ← UID de Firebase para filtrado
          usuario: user.nombre || "Desconocido",
          email: user.email || "",
          habilidad: r.habilidad,
          puntaje: r.puntaje,
          feedback: r.feedback,
        };
      })
      .reverse(); // más reciente primero

    res.json(enriched);

  } catch (error) {
    console.error("Error obteniendo resultados:", error);
    res.status(500).json({ error: "Error al obtener resultados" });
  }
});

// ELIMINAR RESULTADO
router.delete("/:id", async (req, res) => {
  try {
    await db.collection("resultados").doc(req.params.id).delete();
    res.json({ mensaje: "Eliminado correctamente" });

  } catch (error) {
    console.error("Error eliminando:", error);
    res.status(500).json({ error: "Error al eliminar" });
  }
});

// REPORTE: ejercicios por usuario
router.get("/reporte-usuarios", async (req, res) => {
  try {
    const resultadosSnap = await db.collection("resultados").get();
    let resultados = resultadosSnap.docs.map((d) => d.data());

    console.log(`[reporte-usuarios] Total en Firestore: ${resultados.length}`);

    // ── Histórico: sin ?dias o ?dias=all → devolver TODO sin tocar fechas
    const diasRaw = req.query.dias;
    if (!diasRaw || diasRaw === "all") {
      console.log("[reporte-usuarios] Modo histórico: sin filtro de fecha");
    } else {
      // ── Filtro 7 / 30 días: parseo ISO directo
      const dias = parseInt(diasRaw, 10);
      const fechaMinima = new Date();
      fechaMinima.setDate(fechaMinima.getDate() - dias);
      fechaMinima.setHours(0, 0, 0, 0);
      console.log(`[reporte-usuarios] Filtrando últimos ${dias} días desde: ${fechaMinima.toISOString()}`);

      const antes = resultados.length;
      resultados = resultados.filter((r) => {
        if (!r.fecha) return false;                         // campo ausente → descarta
        const fechaRegistro = new Date(r.fecha);           // ISO string → Date
        return fechaRegistro.getTime() >= fechaMinima.getTime();
      });
      console.log(`[reporte-usuarios] Tras filtro: ${resultados.length} de ${antes}`);
    }

    // ── Agrupación por usuario (enriquecida con sesiones → users)
    const sesionIds = [...new Set(resultados.map((r) => r.sesion_id).filter(Boolean))];
    const sesionesMap = {};
    const chunkSize = 30;
    for (let i = 0; i < sesionIds.length; i += chunkSize) {
      const chunk = sesionIds.slice(i, i + chunkSize);
      const snap  = await db.collection("sesiones").where("__name__", "in", chunk).get();
      snap.docs.forEach((d) => { sesionesMap[d.id] = d.data(); });
    }

    const usuarioIds = [...new Set(Object.values(sesionesMap).map((s) => s.usuario_id).filter(Boolean))];
    const usersMap = {};
    for (let i = 0; i < usuarioIds.length; i += chunkSize) {
      const chunk = usuarioIds.slice(i, i + chunkSize);
      const snap  = await db.collection("users").where("__name__", "in", chunk).get();
      snap.docs.forEach((d) => { usersMap[d.id] = d.data(); });
    }

    const conteo = {};
    resultados.forEach((r) => {
      const sesion = sesionesMap[r.sesion_id] || {};
      const user   = usersMap[sesion.usuario_id] || {};
      const nombre = user.nombre || "Desconocido";
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });

    const rows = Object.entries(conteo).map(([usuario, total]) => ({ usuario, total }));
    console.log(`[reporte-usuarios] Filas devueltas: ${rows.length}`);
    res.json(rows);

  } catch (error) {
    console.error("[reporte-usuarios] ERROR:", error);
    res.status(500).json({ error: "Error en reporte" });
  }
});

// REPORTE: ejercicios por habilidad
router.get("/reporte-habilidades", async (req, res) => {
  try {
    const snapshot = await db.collection("resultados").get();
    console.log(`[reporte-habilidades] Total en Firestore: ${snapshot.size}`);

    // ── Histórico: sin ?dias o ?dias=all → devolver TODO sin tocar fechas
    const diasRaw = req.query.dias;
    let fechaMinima = null;

    if (!diasRaw || diasRaw === "all") {
      console.log("[reporte-habilidades] Modo histórico: sin filtro de fecha");
    } else {
      // ── Filtro 7 / 30 días: parseo ISO directo
      const dias = parseInt(diasRaw, 10);
      fechaMinima = new Date();
      fechaMinima.setDate(fechaMinima.getDate() - dias);
      fechaMinima.setHours(0, 0, 0, 0);
      console.log(`[reporte-habilidades] Filtrando últimos ${dias} días desde: ${fechaMinima.toISOString()}`);
    }

    const conteo = {};
    snapshot.docs.forEach((doc) => {
      const { habilidad, fecha } = doc.data();
      if (!habilidad) return;

      if (fechaMinima) {
        if (!fecha) return;                                 // campo ausente → descarta
        const fechaRegistro = new Date(fecha);             // ISO string → Date
        if (fechaRegistro.getTime() < fechaMinima.getTime()) return;
      }

      conteo[habilidad] = (conteo[habilidad] || 0) + 1;
    });

    const rows = Object.entries(conteo).map(([habilidad, total]) => ({ habilidad, total }));
    console.log(`[reporte-habilidades] Filas devueltas: ${rows.length}`);
    res.json(rows);

  } catch (error) {
    console.error("[reporte-habilidades] ERROR:", error);
    res.status(500).json({ error: "Error en reporte habilidades" });
  }
});

module.exports = router;