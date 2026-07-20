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

// ─────────────────────────────────────────────────────────────────────────────
// REPORTES GRUPALES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Utilidad compartida: dado un grupoId, devuelve el array de UID de alumnos.
 * Si el grupo no existe o no tiene alumnos retorna [].
 */
async function obtenerAlumnosDeGrupo(grupoId) {
  if (!grupoId) return [];
  const grupoDoc = await db.collection("grupos").doc(grupoId).get();
  if (!grupoDoc.exists) return [];
  return grupoDoc.data().alumnos || [];
}

/**
 * Dado un array de UID de alumnos, devuelve un Map { sesionId → sesionData }
 * con todas las sesiones que pertenecen a esos usuarios.
 */
async function obtenerSesionesDeAlumnos(alumnoIds) {
  if (!alumnoIds.length) return {};
  const sesionesMap = {};
  const chunkSize   = 30;

  for (let i = 0; i < alumnoIds.length; i += chunkSize) {
    const chunk = alumnoIds.slice(i, i + chunkSize);
    const snap  = await db
      .collection("sesiones")
      .where("usuario_id", "in", chunk)
      .get();
    snap.docs.forEach((d) => { sesionesMap[d.id] = d.data(); });
  }
  return sesionesMap;
}

// GET /reporte-grupal-usuarios?grupoId=XXX&dias=YYY
router.get("/reporte-grupal-usuarios", async (req, res) => {
  const { grupoId, dias: diasRaw } = req.query;

  try {
    console.log(`[reporte-grupal-usuarios] grupoId=${grupoId} dias=${diasRaw}`);

    // 1. Alumnos del grupo
    const alumnoIds = await obtenerAlumnosDeGrupo(grupoId);
    if (!alumnoIds.length) {
      return res.json([]);
    }

    // 2. Sesiones de esos alumnos
    const sesionesMap = await obtenerSesionesDeAlumnos(alumnoIds);
    const sesionIdsDelGrupo = new Set(Object.keys(sesionesMap));

    if (!sesionIdsDelGrupo.size) return res.json([]);

    // 3. Todos los resultados y filtrar por sesion_id del grupo
    const allSnap = await db.collection("resultados").get();
    let resultados = allSnap.docs
      .map((d) => d.data())
      .filter((r) => sesionIdsDelGrupo.has(r.sesion_id));

    // 4. Filtro de fecha
    if (diasRaw && diasRaw !== "all") {
      const dias        = parseInt(diasRaw, 10);
      const fechaMinima = new Date();
      fechaMinima.setDate(fechaMinima.getDate() - dias);
      fechaMinima.setHours(0, 0, 0, 0);
      resultados = resultados.filter((r) => {
        if (!r.fecha) return false;
        return new Date(r.fecha).getTime() >= fechaMinima.getTime();
      });
    }

    // 5. Obtener nombres de usuarios
    const usersMap  = {};
    const chunkSize = 30;
    for (let i = 0; i < alumnoIds.length; i += chunkSize) {
      const chunk = alumnoIds.slice(i, i + chunkSize);
      const snap  = await db.collection("users").where("__name__", "in", chunk).get();
      snap.docs.forEach((d) => { usersMap[d.id] = d.data(); });
    }

    // 6. Agregar por usuario
    const conteo = {};
    resultados.forEach((r) => {
      const sesion   = sesionesMap[r.sesion_id] || {};
      const user     = usersMap[sesion.usuario_id] || {};
      const nombre   = user.nombre || "Desconocido";
      conteo[nombre] = (conteo[nombre] || 0) + 1;
    });

    const rows = Object.entries(conteo).map(([usuario, total]) => ({ usuario, total }));
    console.log(`[reporte-grupal-usuarios] Filas: ${rows.length}`);
    res.json(rows);

  } catch (error) {
    console.error("[reporte-grupal-usuarios] ERROR:", error);
    res.status(500).json({ error: "Error en reporte grupal usuarios" });
  }
});

// GET /reporte-grupal-habilidades?grupoId=XXX&dias=YYY
router.get("/reporte-grupal-habilidades", async (req, res) => {
  const { grupoId, dias: diasRaw } = req.query;

  try {
    console.log(`[reporte-grupal-habilidades] grupoId=${grupoId} dias=${diasRaw}`);

    // 1. Alumnos del grupo
    const alumnoIds = await obtenerAlumnosDeGrupo(grupoId);
    if (!alumnoIds.length) {
      return res.json([]);
    }

    // 2. Sesiones de esos alumnos
    const sesionesMap = await obtenerSesionesDeAlumnos(alumnoIds);
    const sesionIdsDelGrupo = new Set(Object.keys(sesionesMap));

    if (!sesionIdsDelGrupo.size) return res.json([]);

    // 3. Todos los resultados y filtrar por sesion_id del grupo
    const allSnap = await db.collection("resultados").get();
    let resultados = allSnap.docs
      .map((d) => d.data())
      .filter((r) => sesionIdsDelGrupo.has(r.sesion_id));

    // 4. Filtro de fecha
    let fechaMinima = null;
    if (diasRaw && diasRaw !== "all") {
      const dias = parseInt(diasRaw, 10);
      fechaMinima = new Date();
      fechaMinima.setDate(fechaMinima.getDate() - dias);
      fechaMinima.setHours(0, 0, 0, 0);
    }

    // 5. Agregar por habilidad
    const conteo = {};
    resultados.forEach((r) => {
      if (!r.habilidad) return;
      if (fechaMinima) {
        if (!r.fecha) return;
        if (new Date(r.fecha).getTime() < fechaMinima.getTime()) return;
      }
      conteo[r.habilidad] = (conteo[r.habilidad] || 0) + 1;
    });

    const rows = Object.entries(conteo).map(([habilidad, total]) => ({ habilidad, total }));
    console.log(`[reporte-grupal-habilidades] Filas: ${rows.length}`);
    res.json(rows);

  } catch (error) {
    console.error("[reporte-grupal-habilidades] ERROR:", error);
    res.status(500).json({ error: "Error en reporte grupal habilidades" });
  }
});

// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// REPORTE GENERAL DE GRUPOS  –  GET /reporte-general-grupos?dias=N
// Devuelve un array con un objeto por grupo:
//   { grupo, totalEjercicios, promedioGeneral }
// ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
router.get("/reporte-general-grupos", async (req, res) => {
  const { dias: diasRaw } = req.query;

  try {
    console.log(`[reporte-general-grupos] dias=${diasRaw}`);
    const chunkSize = 30;

    // 1. Obtener todos los grupos con sus alumnos
    const gruposSnap = await db.collection("grupos").get();
    const grupos = gruposSnap.docs.map((d) => ({
      id:       d.id,
      nombre:   d.data().nombre || d.id,
      alumnos:  d.data().alumnos || [],
    }));

    if (!grupos.length) return res.json([]);

    // 2. Recoger todos los alumnoIds únicos de todos los grupos
    const todosAlumnos = [...new Set(grupos.flatMap((g) => g.alumnos))];

    // 3. Cargar sesiones de todos esos alumnos (by usuario_id)
    const sesionesMap = {}; // { sesionId → { usuario_id, ... } }
    for (let i = 0; i < todosAlumnos.length; i += chunkSize) {
      const chunk = todosAlumnos.slice(i, i + chunkSize);
      const snap  = await db.collection("sesiones")
        .where("usuario_id", "in", chunk).get();
      snap.docs.forEach((d) => { sesionesMap[d.id] = d.data(); });
    }

    // 4. Construir mapa inverso: usuarioId → Set<sesionId>
    const usuarioASesiones = {}; // { usuarioId → Set<sesionId> }
    Object.entries(sesionesMap).forEach(([sesId, sesData]) => {
      const uid = sesData.usuario_id;
      if (!uid) return;
      if (!usuarioASesiones[uid]) usuarioASesiones[uid] = new Set();
      usuarioASesiones[uid].add(sesId);
    });

    // 5. Cargar todos los resultados y aplicar filtro de fecha
    const allSnap = await db.collection("resultados").get();
    let resultados = allSnap.docs.map((d) => d.data());

    if (diasRaw && diasRaw !== "all") {
      const dias        = parseInt(diasRaw, 10);
      const fechaMinima = new Date();
      fechaMinima.setDate(fechaMinima.getDate() - dias);
      fechaMinima.setHours(0, 0, 0, 0);
      resultados = resultados.filter((r) => {
        if (!r.fecha) return false;
        return new Date(r.fecha).getTime() >= fechaMinima.getTime();
      });
    }

    // 6. Para cada resultado, saber a qué usuario pertenece
    //    Mapa: sesionId → usuarioId  (ya lo tenemos en sesionesMap)
    const resultadoConUsuario = resultados.map((r) => ({
      ...r,
      usuarioId: sesionesMap[r.sesion_id]?.usuario_id ?? null,
    }));

    // 7. Calcular totalEjercicios y promedioGeneral por grupo
    const filas = grupos.map((g) => {
      const sesionIdsDelGrupo = new Set(
        g.alumnos.flatMap((uid) => [...(usuarioASesiones[uid] || [])])
      );

      const resultadosDelGrupo = resultadoConUsuario.filter(
        (r) => sesionIdsDelGrupo.has(r.sesion_id)
      );

      const totalEjercicios = resultadosDelGrupo.length;
      const puntajesValidos = resultadosDelGrupo
        .map((r) => Number(r.puntaje))
        .filter((p) => !isNaN(p));

      const promedioGeneral = puntajesValidos.length > 0
        ? puntajesValidos.reduce((a, b) => a + b, 0) / puntajesValidos.length
        : 0;

      return {
        grupo:           g.nombre,
        totalEjercicios,
        promedioGeneral: parseFloat(promedioGeneral.toFixed(2)),
      };
    });

    // Ordenar por promedio desc para visualización más clara
    filas.sort((a, b) => b.promedioGeneral - a.promedioGeneral);

    console.log(`[reporte-general-grupos] Grupos devueltos: ${filas.length}`);
    res.json(filas);

  } catch (error) {
    console.error("[reporte-general-grupos] ERROR:", error);
    res.status(500).json({ error: "Error en reporte general de grupos" });
  }
});

module.exports = router;