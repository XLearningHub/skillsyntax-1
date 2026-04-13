 const db = require("../db");

exports.obtenerUsuario = (req, res) => {

  const id = req.params.id;

  db.query("SELECT nombre FROM usuarios WHERE id = ?", [id], (err, result) => {

    if (err) return res.status(500).json(err);

    res.json(result[0]);

  });

};