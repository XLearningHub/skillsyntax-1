const db = require("../db");

// Guarda la sesión del usuario
exports.guardarSesion = async (req, res) => {
  try {
  
    const { usuario_id, tema, nivel } = req.body;

    if (!usuario_id || !tema || !nivel) {
      return res.status(400).json({ success: false, error: "Faltan datos" });
    }

    const [resultado] = await db.query(
      "INSERT INTO sesiones (usuario_id, tema, nivel) VALUES (?, ?, ?)",
      [usuario_id, tema, nivel]
    );

    res.json({ success: true, id: resultado.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};