const db = require("../db");

// Guarda la sesión del usuario
exports.guardarSesion = async (req, res) => {
  try {
    const { usuario_id, tema, nivel } = req.body;

    if (!usuario_id || !tema || !nivel) {
      return res.status(400).json({ success: false, error: "Faltan datos" });
    }

    const docRef = await db.collection("sesiones").add({
      usuario_id,
      tema,
      nivel,
      fecha: new Date().toISOString(),
    });

    res.json({ success: true, id: docRef.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};