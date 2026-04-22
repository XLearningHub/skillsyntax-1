const db = require("../db");
const bcrypt = require("bcrypt");

// LOGIN
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

    // validar contraseña
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

const crypto = require("crypto");

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    // 🔐 seguridad: no decir si existe o no
    if (users.length === 0) {
      return res.json({ msg: "Si el correo existe, recibirás un enlace." });
    }

    const user = users[0];

    // generar token
    const token = crypto.randomBytes(32).toString("hex");

    // guardar token + expiración (1 hora)
    await db.query(
      "UPDATE users SET reset_token = ?, reset_expira = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE id = ?",
      [token, user.id]
    );

    // link (luego será tu página real)
    const link = `https://skillsyntax-2war.onrender.com/reset-password.html?token=${token}`;

    console.log("🔗 LINK DE RECUPERACIÓN:", link);

    res.json({ msg: "Revisa tu correo para continuar." });

  } catch (error) {
    console.error("Error forgotPassword:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};