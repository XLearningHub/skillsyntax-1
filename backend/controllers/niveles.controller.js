const db = require("../db");

// Obtener todos los niveles
exports.getNiveles = async (req, res) => {
  try {
    const snapshot = await db
      .collection("niveles")
      .orderBy("id", "asc")
      .get();

    const niveles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(niveles);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al traer los niveles" });
  }
};

// Guardar nivel por sección de usuario
exports.guardarNivelSeccion = async (req, res) => {
  const { email, seccion, nivel_id } = req.body;

  if (!email || !seccion || !nivel_id) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    await db.collection("niveles_secciones").add({
      email,
      seccion,
      nivel: nivel_id,
    });

    res.json({ mensaje: "Nivel guardado correctamente" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};