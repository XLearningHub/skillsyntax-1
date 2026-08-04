const db = require("../db");
const jwt = require("jsonwebtoken");

// ======================
// LOGIN
// ======================
exports.login = async (req, res) => {
  const { uid, email } = req.body;


  if (!email && !uid) {
    return res.status(400).json({ error: "Faltan datos de autenticación del cliente" });
  }

  try {
    // 1. Buscar usuario en Firestore (por email para asegurar compatibilidad con cuentas antiguas)
    let snapshot;
    if (email) {
      snapshot = await db.collection("users").where("email", "==", email).limit(1).get();
    } else {
      // Fallback si solo envían uid y lo estamos usando como ID de documento
      const doc = await db.collection("users").doc(uid).get();
      snapshot = { empty: !doc.exists, docs: [doc] };
    }

    if (snapshot.empty) {
      console.warn("[LOGIN] Usuario autenticado en Auth pero no encontrado en Firestore:", email || uid);
      return res.status(401).json({ error: "No se encontraron los datos del usuario en el sistema" });
    }

    // 2. Extraer datos del documento
    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };


    // 3. Generar JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("[LOGIN] JWT_SECRET no está definido en .env");
      return res.status(500).json({ error: "Error de configuración del servidor" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, rol: user.rol },
      secret,
      { expiresIn: "8h" }
    );


    // 6. Registrar el evento de login en el Audit Trail (no bloqueante)
    db.collection("eventos_sistema").add({
      tipo:        "LOGIN",
      descripcion: `Inicio de sesión: ${user.nombre || user.email}`,
      usuarioId:   user.id,
      fecha:       new Date().toISOString(),
    }).catch((err) =>
      console.error("[LOGIN] Error al registrar evento:", err)
    );

    // 7. Responder con datos + token (incluye avatar para persistencia en frontend)
    res.json({
      token,
      id:            user.id,
      nombre:        user.nombre,
      email:         user.email,
      rol:           user.rol,
      nivel_general: user.nivel_general,
      avatar:        user.avatar || null,   // ← URL completa del avatar DiceBear (o null)
    });

  } catch (error) {
    console.error("[LOGIN] Error inesperado:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================
// FORGOT PASSWORD — DESACTIVADO
// El correo de recuperación lo envía Firebase Auth directamente
// desde el frontend con sendPasswordResetEmail(). No se necesita Nodemailer.
// ======================

// ======================
// RESET PASSWORD — DESACTIVADO
// Firebase Auth gestiona el flujo de reset de contraseña de forma nativa.
// ======================