const db    = require("../db");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

// ── Mapeo de códigos de error de Firebase Auth → mensajes legibles ────────────
const AUTH_ERROR_MAP = {
  "auth/email-already-exists":  "El correo ya está registrado en el sistema.",
  "auth/invalid-email":         "El correo electrónico no es válido.",
  "auth/weak-password":         "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-password":      "La contraseña debe tener al menos 6 caracteres.",
  "auth/uid-already-exists":    "El ID de usuario ya está en uso.",
};

// =============================================================================
// CREAR USUARIO  ─  POST /api/usuarios
// Body: { nombre, email, password, rol, nivel_general?, grupo_id? }
// Flujo: Firebase Auth → Firestore (uid sincronizado) → Grupo (arrayUnion)
// =============================================================================
exports.crearUsuario = async (req, res) => {
  console.log("\n[DEBUG] Iniciando creación de usuario...");
  const { nombre, email, password, rol, nivel_general, grupo_id } = req.body;

  // ── Validaciones básicas ───────────────────────────────────────────────────
  if (!nombre || !email || !password || !rol) {
    console.warn("[DEBUG] Faltan campos obligatorios en el body.");
    return res.status(400).json({
      error: "Los campos nombre, email, password y rol son obligatorios.",
    });
  }
  if (password.length < 6) {
    console.warn("[DEBUG] La contraseña es demasiado corta.");
    return res.status(400).json({
      error: "La contraseña debe tener al menos 6 caracteres.",
    });
  }

  let userRecord = null; // referencia para el rollback si Firestore falla

  try {
    // ── PASO 1: Crear en Firebase Authentication ───────────────────────────
    console.log(`[DEBUG] Intentando guardar en Auth con email: ${email}`);
    // Firebase Admin hashea la contraseña de forma nativa — no usamos bcrypt.
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre,
    });

    console.log(`[DEBUG] Éxito en Auth. UID generado: ${userRecord.uid}`);

    // ── PASO 2: Guardar en Firestore usando el uid como ID del documento ───
    console.log(`[DEBUG] Intentando guardar en Firestore con el UID: ${userRecord.uid}`);
    // Se excluye explícitamente la contraseña — Firebase Auth la gestiona.

    // Obtener el siguiente id_num de forma atómica vía transacción
    const contadorRef = db.collection("contadores").doc("usuarios");
    let id_num;

    await db.runTransaction(async (tx) => {
      const contadorSnap = await tx.get(contadorRef);
      id_num = (contadorSnap.exists ? (contadorSnap.data().ultimo_id || 0) : 0) + 1;
      tx.set(contadorRef, { ultimo_id: id_num }, { merge: true });
    });

    const docData = {
      nombre,
      email,
      rol,
      nivel_general: nivel_general || "A1",
      createdAt:     new Date().toISOString(),
      id_num,        // ← ID numérico secuencial para mostrar en el frontend
    };

    await db.collection("users").doc(userRecord.uid).set(docData);

    console.log(`[DEBUG] Éxito en Firestore. Usuario guardado correctamente en la colección 'users'.`);

    // ── PASO 2.5: Asignar al grupo si viene grupo_id en el body ────────────
    // REGRESIÓN RESTAURADA: lógica omitida durante la migración a Firebase Auth.
    if (grupo_id && typeof grupo_id === "string" && grupo_id.trim() !== "") {
      console.log(`[DEBUG] grupo_id recibido: "${grupo_id}". Añadiendo uid al grupo...`);
      try {
        console.log('[DEBUG] Intentando agregar al grupo:', grupo_id);
        await db.collection("grupos").doc(grupo_id.trim()).update({
          alumnos: FieldValue.arrayUnion(userRecord.uid),
        });
        console.log(`[DEBUG] UID ${userRecord.uid} añadido al grupo "${grupo_id}" correctamente.`);
      } catch (grupoErr) {
        // No es un error fatal — el usuario ya fue creado; sólo logueamos la advertencia.
        console.error('[DEBUG-ERROR] Falló asignación a grupo:', grupoErr);
      }
    } else {
      console.log(`[DEBUG] Sin grupo_id en el body — el usuario no será asignado a ningún grupo.`);
    }

    // ── PASO 3: Registrar evento en Audit Trail (no bloqueante) ────────────
    console.log(`[DEBUG] Registrando evento en Audit Trail...`);
    db.collection("eventos_sistema").add({
      tipo:        "USUARIO_CREADO",
      descripcion: `Nuevo usuario creado: ${nombre} (${email}) — Rol: ${rol}`,
      usuarioId:   userRecord.uid,
      fecha:       new Date().toISOString(),
    }).catch((err) => console.error("[AUDIT] Error al registrar evento:", err));

    // ── Respuesta exitosa ──────────────────────────────────────────────────
    console.log(`[DEBUG] Respondiendo al frontend con estado 201.`);
    res.status(201).json({
      mensaje:  "Usuario creado correctamente.",
      id:       userRecord.uid,
      nombre,
      email,
      rol,
    });

  } catch (err) {
    console.error("\n[DEBUG-ERROR] ❌ Ocurrió un error en el flujo de creación de usuario:");
    console.error("[DEBUG-ERROR] Código de error:", err.code);
    console.error("[DEBUG-ERROR] Mensaje original:", err.message);
    console.error("[DEBUG-ERROR] Stacktrace completo:", err.stack);

    // ── COMPENSACIÓN: si Firestore falló pero Auth ya fue creado, revertir ─
    if (userRecord) {
      try {
        console.warn(`[DEBUG-WARNING] Iniciando rollback: eliminando cuenta huérfana de Auth para UID ${userRecord.uid}...`);
        await admin.auth().deleteUser(userRecord.uid);
        console.warn(`[DEBUG-WARNING] Rollback exitoso.`);
      } catch (rollbackErr) {
        console.error("[DEBUG-ERROR] ❌ Error CRÍTICO en rollback de Auth:", rollbackErr);
      }
    }

    // Devolver mensaje amigable al frontend
    const mensajeAmigable = AUTH_ERROR_MAP[err.code]
      || err.message
      || "Error al crear el usuario.";

    res.status(400).json({ error: mensajeAmigable });
  }
};

// =============================================================================
// OBTENER USUARIO POR ID  ─  GET /api/usuarios/:id
// =============================================================================
exports.obtenerUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    const data = doc.data();
    res.json({
      id:            doc.id,
      nombre:        data.nombre,
      email:         data.email,
      rol:           data.rol,
      nivel_general: data.nivel_general,
      avatar:        data.avatar || null,
    });

  } catch (err) {
    console.error("Error obtenerUsuario:", err);
    res.status(500).json({ error: "Error en el servidor." });
  }
};

// =============================================================================
// ACTUALIZAR USUARIO  ─  PUT /api/usuarios/:id
// Body: { nombre?, email?, rol?, nivel_general?, nueva_password? }
// Sincroniza cambios en Firebase Auth y Firestore.
// =============================================================================
exports.actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, nivel_general, nueva_password } = req.body;

  // ── Campos a actualizar en Firestore ──────────────────────────────────────
  const firestoreUpdate = {};
  if (nombre        !== undefined) firestoreUpdate.nombre        = nombre;
  if (email         !== undefined) firestoreUpdate.email         = email;
  if (rol           !== undefined) firestoreUpdate.rol           = rol;
  if (nivel_general !== undefined) firestoreUpdate.nivel_general = nivel_general;

  if (Object.keys(firestoreUpdate).length === 0 && !nueva_password) {
    return res.status(400).json({ error: "No se proporcionaron campos para actualizar." });
  }

  try {
    // ── Sincronizar con Firebase Auth si hay cambios relevantes ─────────────
    const authUpdate = {};
    if (email         !== undefined) authUpdate.email       = email;
    if (nombre        !== undefined) authUpdate.displayName = nombre;
    if (nueva_password && nueva_password.trim().length >= 6) {
      authUpdate.password = nueva_password.trim();
    }

    if (Object.keys(authUpdate).length > 0) {
      await admin.auth().updateUser(id, authUpdate);
      console.log(`[USUARIOS] Auth actualizado para ${id}`);
    }

    // ── Actualizar Firestore ───────────────────────────────────────────────
    if (Object.keys(firestoreUpdate).length > 0) {
      await db.collection("users").doc(id).update(firestoreUpdate);
    }

    res.json({ mensaje: "Usuario actualizado correctamente." });

  } catch (err) {
    console.error("Error actualizarUsuario:", err);
    const mensajeAmigable = AUTH_ERROR_MAP[err.code] || "Error al actualizar el usuario.";
    res.status(400).json({ error: mensajeAmigable });
  }
};

// =============================================================================
// ELIMINAR USUARIO  ─  DELETE /api/usuarios/:id
// Borrado en cascada:
//   1. sesiones        (delete where usuario_id == uid)
//   2. resultados      (delete where sesion_id in <ids de sesiones>)
//   3. eventos_sistema (delete where usuarioId == uid)
//   4. grupos          (arrayRemove uid de campo 'alumnos' donde uid esté presente)
//   5. users/<uid>     (documento principal)
//   6. Firebase Auth   (cuenta de autenticación — tolerante a usuarios legacy)
// Todo en WriteBatches atómicos (máx. 500 ops por batch).
// =============================================================================
exports.eliminarUsuario = async (req, res) => {
  const { id: uid } = req.params;

  console.log(`\n[CASCADE-DELETE] Iniciando borrado en cascada para UID: ${uid}`);

  // ── Utilidad: ejecuta un array de refs en batches de 500 ops ───────────────
  async function deletarEnBatches(docRefs) {
    const BATCH_LIMIT = 500;
    for (let i = 0; i < docRefs.length; i += BATCH_LIMIT) {
      const chunk = docRefs.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
      console.log(`[CASCADE-DELETE] Batch ejecutado: ${chunk.length} documentos eliminados.`);
    }
  }

  try {
    // ── PASO 1: Obtener todas las sesiones del usuario ─────────────────────
    console.log(`[CASCADE-DELETE] 1/5 → Buscando sesiones de usuario_id: ${uid}...`);
    const sesionesSnap = await db
      .collection("sesiones")
      .where("usuario_id", "==", uid)
      .get();

    const sesionIds   = [];
    const sesionRefs  = [];

    sesionesSnap.forEach((doc) => {
      sesionIds.push(doc.id);
      sesionRefs.push(doc.ref);
    });

    console.log(`[CASCADE-DELETE]   → ${sesionIds.length} sesión(es) encontrada(s).`);

    // ── PASO 2: Obtener y eliminar resultados ligados a esas sesiones ──────
    if (sesionIds.length > 0) {
      console.log(`[CASCADE-DELETE] 2/5 → Buscando resultados vinculados...`);
      const resultadosRefs = [];
      const CHUNK = 30; // límite de Firestore para operador 'in'

      for (let i = 0; i < sesionIds.length; i += CHUNK) {
        const chunk = sesionIds.slice(i, i + CHUNK);
        const snap  = await db
          .collection("resultados")
          .where("sesion_id", "in", chunk)
          .get();
        snap.forEach((doc) => resultadosRefs.push(doc.ref));
      }

      console.log(`[CASCADE-DELETE]   → ${resultadosRefs.length} resultado(s) encontrado(s).`);

      if (resultadosRefs.length > 0) {
        await deletarEnBatches(resultadosRefs);
        console.log(`[CASCADE-DELETE]   ✓ Resultados eliminados.`);
      }

      // ── PASO 3: Eliminar las sesiones ─────────────────────────────────────
      console.log(`[CASCADE-DELETE] 3/5 → Eliminando sesiones...`);
      await deletarEnBatches(sesionRefs);
      console.log(`[CASCADE-DELETE]   ✓ Sesiones eliminadas.`);
    } else {
      console.log(`[CASCADE-DELETE] 2/5 → Sin resultados que eliminar (no hay sesiones).`);
      console.log(`[CASCADE-DELETE] 3/5 → Sin sesiones que eliminar.`);
    }

    // ── PASO 3: Eliminar eventos_sistema del usuario ───────────────────────
    console.log(`[CASCADE-DELETE] 3/6 → Buscando eventos_sistema de usuarioId: ${uid}...`);
    const eventosSnap = await db
      .collection("eventos_sistema")
      .where("usuarioId", "==", uid)
      .get();

    const eventosRefs = [];
    eventosSnap.forEach((doc) => eventosRefs.push(doc.ref));
    console.log(`[CASCADE-DELETE]   → ${eventosRefs.length} evento(s) encontrado(s).`);

    if (eventosRefs.length > 0) {
      await deletarEnBatches(eventosRefs);
      console.log(`[CASCADE-DELETE]   ✓ Eventos del sistema eliminados.`);
    }

    // ── PASO 4: Remover uid del array 'alumnos' en todos los grupos ────────
    // Usamos arrayRemove para no eliminar el grupo, sólo desasignar al alumno.
    console.log(`[CASCADE-DELETE] 4/6 → Buscando grupos que contengan al alumno ${uid}...`);
    const gruposSnap = await db
      .collection("grupos")
      .where("alumnos", "array-contains", uid)
      .get();

    console.log(`[CASCADE-DELETE]   → ${gruposSnap.size} grupo(s) encontrado(s).`);

    if (!gruposSnap.empty) {
      const BATCH_LIMIT = 500;
      const gruposDocs  = gruposSnap.docs;
      const arrayRemove = admin.firestore.FieldValue.arrayRemove(uid);

      for (let i = 0; i < gruposDocs.length; i += BATCH_LIMIT) {
        const chunk = gruposDocs.slice(i, i + BATCH_LIMIT);
        const batch = db.batch();
        chunk.forEach((doc) => batch.update(doc.ref, { alumnos: arrayRemove }));
        await batch.commit();
        console.log(`[CASCADE-DELETE]   Batch grupos: ${chunk.length} grupo(s) actualizados.`);
      }

      console.log(`[CASCADE-DELETE]   ✓ Alumno removido de ${gruposSnap.size} grupo(s).`);
    }

    // ── PASO 5: Eliminar documento del usuario en Firestore ────────────────
    console.log(`[CASCADE-DELETE] 5/6 → Eliminando documento users/${uid} en Firestore...`);
    await db.collection("users").doc(uid).delete();
    console.log(`[CASCADE-DELETE]   ✓ Documento Firestore eliminado.`);

    // ── PASO 6: Eliminar cuenta en Firebase Auth ───────────────────────────
    // Try/catch anidado para tolerar usuarios legacy que no existen en Auth.
    console.log(`[CASCADE-DELETE] 6/6 → Eliminando cuenta de Firebase Auth...`);
    try {
      await admin.auth().deleteUser(uid);
      console.log(`[CASCADE-DELETE]   ✓ Cuenta de Auth eliminada.`);
    } catch (authErr) {
      if (authErr.code === "auth/user-not-found") {
        console.warn(`[CASCADE-DELETE] El usuario no existía en Auth. Omitiendo...`);
        // No es un error fatal: los datos de Firestore ya fueron limpiados correctamente.
      } else {
        // Cualquier otro error de Auth sí es inesperado → propagar al catch principal.
        throw authErr;
      }
    }

    // ── Registrar evento de auditoría (no bloqueante) ──────────────────────
    db.collection("eventos_sistema").add({
      tipo:        "USUARIO_ELIMINADO",
      descripcion: `Usuario con UID ${uid} eliminado junto a sus datos asociados (cascada).`,
      usuarioId:   uid,
      fecha:       new Date().toISOString(),
    }).catch((err) => console.error("[AUDIT] Error al registrar evento de eliminación:", err));

    console.log(`[CASCADE-DELETE] ✅ Borrado en cascada completado para UID: ${uid}\n`);

    res.json({
      mensaje: "Usuario y todos sus datos asociados eliminados correctamente.",
      uid,
    });

  } catch (err) {
    console.error(`\n[CASCADE-DELETE] ❌ Error durante el borrado en cascada del UID ${uid}:`);
    console.error("[CASCADE-DELETE] Código:", err.code);
    console.error("[CASCADE-DELETE] Mensaje:", err.message);
    console.error("[CASCADE-DELETE] Stack:", err.stack);


    res.status(500).json({
      error: "Error al eliminar el usuario. Verifique los logs del servidor para más detalles.",
    });
  }
};