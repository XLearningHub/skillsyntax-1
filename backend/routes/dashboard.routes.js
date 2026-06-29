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