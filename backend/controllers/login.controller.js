const db = require("../db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

// ======================
// LOGIN
// ======================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ mensaje: "Usuario no encontrado" });
    }

    const user = users[0];

    const passwordValida = await bcrypt.compare(password, user.password);

    if (!passwordValida) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    res.json({
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      nivel_general: user.nivel_general
    });

  } catch (error) {
    console.error("Error login:", error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

// ======================
// FORGOT PASSWORD
// ======================
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.json({ msg: "Si el correo existe, recibirás un enlace." });
    }

    const user = users[0];

    const token = crypto.randomBytes(32).toString("hex");

    await db.query(
      "UPDATE users SET reset_token = ?, reset_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?",
      [token, user.id]
    );

    const link = `https://skillsyntax-2war.onrender.com/pages/reset-password.html?token=${token}`;

    console.log("🔗 LINK DE RECUPERACIÓN:", link);

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
    const [users] = await db.query(
      "SELECT * FROM users WHERE reset_token = ? AND reset_expira > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "Token inválido o expirado" });
    }

    const user = users[0];

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "UPDATE users SET password = ?, reset_token = NULL, reset_expira = NULL WHERE id = ?",
      [hash, user.id]
    );

    res.json({ msg: "Contraseña actualizada correctamente" });

  } catch (error) {
    console.error("Error resetPassword:", error);
    res.status(500).json({ error: "Error al actualizar contraseña" });
  }
};