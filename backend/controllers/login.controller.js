const db = require("../db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// ======================
// LOGIN
// ======================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log("[LOGIN] Intento de login para:", email);

  if (!email || !password) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos" });
  }

  try {
    // 1. Buscar usuario en Firestore por email
    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      console.warn("[LOGIN] Usuario no encontrado:", email);
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // 2. Extraer datos del documento
    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    console.log("[LOGIN] Usuario encontrado en Firestore. ID:", user.id, "| Rol:", user.rol);

    // 3. Verificar que existe el campo password en el documento
    if (!user.password) {
      console.error("[LOGIN] El documento del usuario no tiene campo 'password'");
      return res.status(500).json({ error: "Error de configuración de cuenta" });
    }

    // 4. Comparar contraseña con bcrypt
    const passwordValida = await bcrypt.compare(password, user.password);
    console.log("[LOGIN] Resultado bcrypt.compare:", passwordValida);

    if (!passwordValida) {
      console.warn("[LOGIN] Contraseña incorrecta para:", email);
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // 5. Generar JWT
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

    console.log("[LOGIN] Login exitoso para:", email);

    // 6. Responder con datos + token
    res.json({
      token,
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      nivel_general: user.nivel_general,
    });

  } catch (error) {
    console.error("[LOGIN] Error inesperado:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================
// FORGOT PASSWORD
// ======================
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const snapshot = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // Respuesta genérica por seguridad
      return res.json({ msg: "Si el correo existe, recibirás un enlace." });
    }

    const userDoc = snapshot.docs[0];
    const user = { id: userDoc.id, ...userDoc.data() };

    const token = crypto.randomBytes(32).toString("hex");
    const expira = new Date(Date.now() + 60 * 60 * 1000); // +1 hora

    await db.collection("users").doc(user.id).update({
      reset_token: token,
      reset_expira: expira.toISOString(),
    });

    // APP_URL se configura en .env: en local = http://localhost:3000,
    // en producción = la URL real del servidor (ej. https://skillsyntax-2war.onrender.com)
    const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const link = `${appUrl}/pages/reset-password.html?token=${token}`;

    const nodemailer = require("nodemailer");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"SkillSyntax" <no-reply@skillsyntax.com>',
      to: email,
      subject: "Recuperar contraseña",
      html: `
        <h3>Recuperar contraseña</h3>
        <p>Haz clic en el siguiente enlace:</p>
        <a href="${link}">${link}</a>
      `,
    });

    res.json({ msg: "Revisa tu correo para continuar." });

  } catch (error) {
    console.error("Error forgotPassword:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

// ======================
// RESET PASSWORD
// ======================
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    const ahora = new Date().toISOString();

    const snapshot = await db
      .collection("users")
      .where("reset_token", "==", token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const userDoc = snapshot.docs[0];
    const user = userDoc.data();

    // Verificar expiración manualmente
    if (!user.reset_expira || user.reset_expira < ahora) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const hash = await bcrypt.hash(password, 10);

    await db.collection("users").doc(userDoc.id).update({
      password: hash,
      reset_token: null,
      reset_expira: null,
    });

    res.json({ msg: "Contraseña actualizada correctamente" });

  } catch (error) {
    console.error("Error resetPassword:", error);
    res.status(500).json({ error: "Error al actualizar contraseña" });
  }
};