const db = require("../db");

exports.obtenerUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection("users").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const data = doc.data();
    res.json({ id: doc.id, nombre: data.nombre });

  } catch (err) {
    console.error("Error obtenerUsuario:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

exports.actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, rol, nivel_general } = req.body;

  // Todos los campos son editables
  const actualizacion = {};
  if (nombre        !== undefined) actualizacion.nombre        = nombre;
  if (email         !== undefined) actualizacion.email         = email;
  if (rol           !== undefined) actualizacion.rol           = rol;
  if (nivel_general !== undefined) actualizacion.nivel_general = nivel_general;

  if (Object.keys(actualizacion).length === 0) {
    return res.status(400).json({ error: "No se proporcionaron campos para actualizar" });
  }

  try {
    await db.collection("users").doc(id).update(actualizacion);
    res.json({ mensaje: "Usuario actualizado correctamente" });

  } catch (err) {
    console.error("Error actualizarUsuario:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
};