const db = require("../db");

// Agrupación en memoria de promedios por habilidad
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

exports.obtenerDashboard = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    // 1. Obtener sesiones del usuario
    const sesionesSnap = await db
      .collection("sesiones")
      .where("usuario_id", "==", usuario_id)
      .get();

    if (sesionesSnap.empty) {
      return res.json({ data: [], historial: [] });
    }

    const sesionesMap = {};
    sesionesSnap.docs.forEach((doc) => {
      sesionesMap[doc.id] = doc.data();
    });
    const sesionIds = Object.keys(sesionesMap);

    // 2. Obtener resultados de esas sesiones (Firestore soporta 'in' hasta 30 items)
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

    // 3. Calcular promedios
    const data = calcularPromedios(resultadosDocs);

    // 4. Construir historial enriquecido
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
    console.error("Error dashboard:", error);
    res.status(500).json({ error: "Error en dashboard" });
  }
};


exports.obtenerHistorial = async (req, res) => {
  const { usuario_id } = req.params;

  try {
    const sesionesSnap = await db
      .collection("sesiones")
      .where("usuario_id", "==", usuario_id)
      .get();

    if (sesionesSnap.empty) {
      return res.json([]);
    }

    const sesionesMap = {};
    sesionesSnap.docs.forEach((doc) => {
      sesionesMap[doc.id] = doc.data();
    });
    const sesionIds = Object.keys(sesionesMap);

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

    res.json(historial);

  } catch (error) {
    res.status(500).json({ error: "Error historial" });
  }
};