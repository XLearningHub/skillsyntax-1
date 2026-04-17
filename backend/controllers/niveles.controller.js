const db = require("../db");


exports.getNiveles = (req, res) => {
  const sql = "SELECT id, codigo, descripcion FROM niveles ORDER BY id ASC";
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Error al traer los niveles" });
    }
    res.json(results);
  });
};

// Guardar nivel por sección de usuario
exports.guardarNivelSeccion = (req, res) => {
  const { email, seccion, nivel_id } = req.body;

  if (!email || !seccion || !nivel_id) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  const sql = "INSERT INTO niveles_secciones (email, seccion, nivel) VALUES (?, ?, ?)";
  db.query(sql, [email, seccion, nivel_id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ mensaje: "Nivel guardado correctamente" });
  });
};