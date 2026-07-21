const express = require("express");
const router = express.Router();
const db = require("../db");

function calcularPromedios(resultados) {
  const mapa = {};
  resultados.forEach(({ habilidad, puntaje }) => {
    if (!mapa[habilidad]) mapa[habilidad] = { total: 0, count: 0 };
    mapa[habilidad].total += puntaje;
    mapa[habilidad].count += 1;
  });
  return Object.entries(mapa).map(([habilidad, { total, count }]) => ({
    habilidad,
    promedio: Math.round((total / count) * 100) / 100,
  }));
}

// ── GET /grafica-7-dias ── Datos agrupados por día para Chart.js ───────────
router.get("/grafica-7-dias", async (req, res) => {
  try {
    // Calcular rango: medianoche de hace 6 días → ahora
    const hoy       = new Date();
    const dias      = [];
    const labels    = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy);
      d.setDate(hoy.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
      dias.push({ key, from: d.toISOString() });
      labels.push(
        d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })
      );
    }

    const isoInicio = dias[0].from;

    // Lanzar las dos queries en paralelo
    const [loginsSnap, sesionesSnap] = await Promise.all([
      db.collection("eventos_sistema")
        .where("tipo",  "==", "LOGIN")
        .where("fecha", ">=", isoInicio)
        .get(),
      db.collection("sesiones")
        .where("fecha", ">=", isoInicio)
        .get(),
    ]);

    // Agrupar por día (YYYY-MM-DD)
    const loginsPorDia   = Object.fromEntries(dias.map(d => [d.key, 0]));
    const ejerciciosPorDia = Object.fromEntries(dias.map(d => [d.key, 0]));

    loginsSnap.docs.forEach(doc => {
      const fecha = (doc.data().fecha || "").slice(0, 10);
      if (loginsPorDia[fecha] !== undefined) loginsPorDia[fecha]++;
    });

    sesionesSnap.docs.forEach(doc => {
      const fecha = (doc.data().fecha || "").slice(0, 10);
      if (ejerciciosPorDia[fecha] !== undefined) ejerciciosPorDia[fecha]++;
    });

    res.json({
      labels,
      datasets: [
        {
          label:           "Inicios de Sesión",
          data:            dias.map(d => loginsPorDia[d.key]),
          borderColor:     "#06d6a0",
          backgroundColor: "rgba(6,214,160,0.15)",
          tension:         0.4,
          pointRadius:     4,
          pointHoverRadius: 6,
        },
        {
          label:           "Ejercicios Realizados",
          data:            dias.map(d => ejerciciosPorDia[d.key]),
          borderColor:     "#9b5de5",
          backgroundColor: "rgba(155,93,229,0.12)",
          tension:         0.4,
          pointRadius:     4,
          pointHoverRadius: 6,
        },
      ],
    });

  } catch (error) {
    console.error("[Dashboard] Error en grafica-7-dias:", error);
    res.status(500).json({ error: "Error al obtener datos de la gráfica" });
  }
});

router.get("/:usuario_id", async (req, res) => {
  const { usuario_id } = req.params;

  try {
    // 1. Sesiones del usuario
    const sesionesSnap = await db
      .collection("sesiones")
      .where("usuario_id", "==", usuario_id)
      .get();

    if (sesionesSnap.empty) {
      return res.json({ data: [], historial: [] });
    }

    const sesionesMap = {};
    sesionesSnap.docs.forEach((doc) => { sesionesMap[doc.id] = doc.data(); });
    const sesionIds = Object.keys(sesionesMap);

    // 2. Resultados de esas sesiones (batch por chunks de 30)
    const resultadosDocs = [];
    const chunkSize = 30;
    for (let i = 0; i < sesionIds.length; i += chunkSize) {
      const chunk = sesionIds.slice(i, i + chunkSize);
      const snap = await db
        .collection("resultados")
        .where("sesion_id", "in", chunk)
        .get();
      snap.docs.forEach((d) => resultadosDocs.push({ id: d.id, ...d.data() }));
    }

    // 3. Promedios por habilidad
    const data = calcularPromedios(resultadosDocs);

    // 4. Historial ordenado por fecha desc
    const historial = resultadosDocs
      .map((r) => {
        const sesion = sesionesMap[r.sesion_id] || {};
        return {
          fecha: sesion.fecha || null,
          tema: sesion.tema || null,
          nivel: sesion.nivel || null,
          habilidad: r.habilidad,
          puntaje: r.puntaje,
        };
      })
      .sort((a, b) => {
        if (!a.fecha) return 1;
        if (!b.fecha) return -1;
        return new Date(b.fecha) - new Date(a.fecha);
      });

    res.json({ data, historial });

  } catch (error) {
    console.error("Error en dashboard:", error);
    res.status(500).json({ error: "Error al obtener datos del dashboard" });
  }
});

module.exports = router;