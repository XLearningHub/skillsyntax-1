// =============================================================================
// MANTENIMIENTO — GET /api/mantenimiento/asignar-id-num
//
// Script ONE-SHOT: asigna id_num secuencial a todos los usuarios y grupos
// existentes que aún no tengan ese campo.
//
// Orden de asignación:
//   • users  → ordenados por createdAt ASC (más antiguos primero)
//   • grupos → ordenados por creadoEn  ASC (más antiguos primero)
//
// ⚠️  EJECUTAR UNA SOLA VEZ y luego deshabilitar este endpoint.
// =============================================================================

const db    = require("../db");
const admin = require("firebase-admin");

const BATCH_LIMIT = 500;

// ── Utilidad: ejecutar array de {ref, data} en batches de update ───────────────
async function actualizarEnBatches(items) {
  let total = 0;
  for (let i = 0; i < items.length; i += BATCH_LIMIT) {
    const chunk = items.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    chunk.forEach(({ ref, data }) => batch.update(ref, data));
    await batch.commit();
    total += chunk.length;
  }
  return total;
}

// =============================================================================
exports.asignarIdNum = async (req, res) => {
  console.log("\n[MIGRACIÓN] ══════════════════════════════════════════════");
  console.log("[MIGRACIÓN] Asignando id_num a usuarios y grupos existentes...");
  console.log("[MIGRACIÓN] ══════════════════════════════════════════════\n");

  const resumen = {
    usuariosActualizados: 0,
    usuariosSinCambio:    0,
    ultimoIdUsuarios:     0,
    gruposActualizados:   0,
    gruposSinCambio:      0,
    ultimoIdGrupos:       0,
  };

  try {
    // ──────────────────────────────────────────────────────────────────────────
    // USUARIOS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("[MIGRACIÓN] 1/2 → Procesando colección 'users'...");
    const usersSnap = await db.collection("users").get();

    // Ordenar por createdAt ASC (los sin fecha van al final)
    const usersDocs = usersSnap.docs.sort((a, b) => {
      const fa = a.data().createdAt || "";
      const fb = b.data().createdAt || "";
      return fa.localeCompare(fb);
    });

    // Separar los que ya tienen id_num de los que no
    const usersSinIdNum = usersDocs.filter(d => !d.data().id_num);
    resumen.usuariosSinCambio = usersDocs.length - usersSinIdNum.length;

    // Leer el contador actual para saber desde qué número continuar
    const contadorUsersRef  = db.collection("contadores").doc("usuarios");
    const contadorUsersSnap = await contadorUsersRef.get();
    let   proximoIdUsers    = contadorUsersSnap.exists
      ? (contadorUsersSnap.data().ultimo_id || 0)
      : 0;

    // Asignar números consecutivos a los documentos sin id_num
    const usersAActualizar = usersSinIdNum.map((doc) => {
      proximoIdUsers++;
      return { ref: doc.ref, data: { id_num: proximoIdUsers } };
    });

    if (usersAActualizar.length > 0) {
      resumen.usuariosActualizados = await actualizarEnBatches(usersAActualizar);
      // Actualizar el contador al valor máximo asignado
      await contadorUsersRef.set({ ultimo_id: proximoIdUsers }, { merge: true });
    }

    resumen.ultimoIdUsuarios = proximoIdUsers;
    console.log(`[MIGRACIÓN]   ✓ Usuarios: ${resumen.usuariosActualizados} actualizados, ${resumen.usuariosSinCambio} ya tenían id_num. Contador → ${proximoIdUsers}`);

    // ──────────────────────────────────────────────────────────────────────────
    // GRUPOS
    // ──────────────────────────────────────────────────────────────────────────
    console.log("[MIGRACIÓN] 2/2 → Procesando colección 'grupos'...");
    const gruposSnap = await db.collection("grupos").get();

    // Ordenar por creadoEn ASC (los sin fecha van al final)
    const gruposDocs = gruposSnap.docs.sort((a, b) => {
      const fa = a.data().creadoEn || "";
      const fb = b.data().creadoEn || "";
      return fa.localeCompare(fb);
    });

    const gruposSinIdNum  = gruposDocs.filter(d => !d.data().id_num);
    resumen.gruposSinCambio = gruposDocs.length - gruposSinIdNum.length;

    const contadorGruposRef  = db.collection("contadores").doc("grupos");
    const contadorGruposSnap = await contadorGruposRef.get();
    let   proximoIdGrupos    = contadorGruposSnap.exists
      ? (contadorGruposSnap.data().ultimo_id || 0)
      : 0;

    const gruposAActualizar = gruposSinIdNum.map((doc) => {
      proximoIdGrupos++;
      return { ref: doc.ref, data: { id_num: proximoIdGrupos } };
    });

    if (gruposAActualizar.length > 0) {
      resumen.gruposActualizados = await actualizarEnBatches(gruposAActualizar);
      await contadorGruposRef.set({ ultimo_id: proximoIdGrupos }, { merge: true });
    }

    resumen.ultimoIdGrupos = proximoIdGrupos;
    console.log(`[MIGRACIÓN]   ✓ Grupos: ${resumen.gruposActualizados} actualizados, ${resumen.gruposSinCambio} ya tenían id_num. Contador → ${proximoIdGrupos}`);

    console.log("\n[MIGRACIÓN] ✅ Migración completada. Resumen:");
    console.table(resumen);
    console.log("[MIGRACIÓN] ══════════════════════════════════════════════\n");

    res.json({
      ok: true,
      mensaje: "Asignación de id_num completada. Desactiva este endpoint en index.js.",
      resumen,
    });

  } catch (err) {
    console.error("\n[MIGRACIÓN] ❌ Error durante la asignación de id_num:");
    console.error("[MIGRACIÓN] Código:  ", err.code);
    console.error("[MIGRACIÓN] Mensaje: ", err.message);
    console.error("[MIGRACIÓN] Stack:   ", err.stack);

    res.status(500).json({
      ok:    false,
      error: "Error durante la migración. Revisa los logs del servidor.",
    });
  }
};

// =============================================================================
// MANTENIMIENTO — GET /api/mantenimiento/limpiar-huerfanos
// (mantenida aquí como referencia, endpoint desactivado en index.js)
// =============================================================================
exports.limpiarHuerfanos = async (_req, res) => {
  res.status(410).json({ error: "Este endpoint fue desactivado tras su uso único. Ver mantenimiento.controller.js para restaurarlo si es necesario." });
};
