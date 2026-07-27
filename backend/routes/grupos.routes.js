// routes/grupos.routes.js

const express = require("express");
const router  = express.Router();
const db      = require("../db");

const COLECCION = "grupos";

// ── GET / → Obtener todos los grupos ──────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const snapshot = await db.collection(COLECCION).get();

    const grupos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Ordenar por nombre en memoria (no requiere índice compuesto en Firestore)
    grupos.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));

    res.json(grupos);
  } catch (err) {
    console.error("[GRUPOS] Error al obtener grupos:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// ── POST / → Crear un nuevo grupo ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { nombre } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El campo 'nombre' es obligatorio." });
  }

  try {
    // Obtener el siguiente id_num de forma atómica vía transacción
    const contadorRef = db.collection("contadores").doc("grupos");
    let id_num;

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(contadorRef);
      id_num = (snap.exists ? (snap.data().ultimo_id || 0) : 0) + 1;
      tx.set(contadorRef, { ultimo_id: id_num }, { merge: true });
    });

    const docRef = await db.collection(COLECCION).add({
      nombre: nombre.trim(),
      creadoEn: new Date().toISOString(),
      alumnos: [],
      id_num,   // ← ID numérico secuencial para mostrar en el frontend
    });

    console.log("[GRUPOS] Grupo creado con ID:", docRef.id);

    // Registrar evento en el Audit Trail (no bloqueante)
    db.collection("eventos_sistema").add({
      tipo:        "GRUPO_CREADO",
      descripcion: `Nuevo grupo creado: ${nombre.trim()}`,
      grupoId:     docRef.id,
      fecha:       new Date().toISOString(),
    }).catch((err) => console.error("[AUDIT] Error al registrar evento:", err));

    res.status(201).json({
      success: true,
      id: docRef.id,
      mensaje: "Grupo creado correctamente.",
    });
  } catch (err) {
    console.error("[GRUPOS] Error al crear grupo:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// ── DELETE /:id → Eliminar un grupo por ID ────────────────────────────────────
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const docRef = db.collection(COLECCION).doc(id);
    const doc    = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Grupo no encontrado." });
    }

    const nombreGrupo = doc.data().nombre || id;

    await docRef.delete();

    // Registrar evento en el Audit Trail (no bloqueante)
    db.collection("eventos_sistema").add({
      tipo:        "GRUPO_ELIMINADO",
      descripcion: `Grupo eliminado: ${nombreGrupo}`,
      grupoId:     id,
      fecha:       new Date().toISOString(),
    }).catch((err) => console.error("[AUDIT] Error al registrar evento:", err));

    res.json({ success: true, mensaje: "Grupo eliminado correctamente." });
  } catch (err) {
    console.error("[GRUPOS] Error al eliminar grupo:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// ── PUT /:id → Actualizar el nombre de un grupo ───────────────────────────────
router.put("/:id", async (req, res) => {
  const { id }     = req.params;
  const { nombre } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El campo 'nombre' es obligatorio." });
  }

  try {
    const docRef = db.collection(COLECCION).doc(id);
    const doc    = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Grupo no encontrado." });
    }

    await docRef.update({ nombre: nombre.trim() });

    console.log(`[GRUPOS] Nombre actualizado en grupo ${id}:`, nombre.trim());

    res.json({ success: true, mensaje: "Grupo actualizado correctamente." });
  } catch (err) {
    console.error("[GRUPOS] Error al actualizar grupo:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

// ── PUT /:id/alumnos → Asignar/actualizar alumnos de un grupo ─────────────────
router.put("/:id/alumnos", async (req, res) => {
  const { id } = req.params;
  const { alumnos } = req.body;

  // Validar que venga un arreglo (puede estar vacío para desasignar todos)
  if (!Array.isArray(alumnos)) {
    return res.status(400).json({ error: "El campo 'alumnos' debe ser un arreglo de IDs." });
  }

  try {
    const docRef = db.collection(COLECCION).doc(id);
    const doc    = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Grupo no encontrado." });
    }

    await docRef.update({ alumnos });

    console.log(`[GRUPOS] Alumnos actualizados en grupo ${id}:`, alumnos.length, "alumno(s)");

    res.json({
      success: true,
      mensaje: `${alumnos.length} alumno(s) asignado(s) correctamente.`,
    });
  } catch (err) {
    console.error("[GRUPOS] Error al asignar alumnos:", err);
    res.status(500).json({ error: "Error servidor" });
  }
});

module.exports = router;

