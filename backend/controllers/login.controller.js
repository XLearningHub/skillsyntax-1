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