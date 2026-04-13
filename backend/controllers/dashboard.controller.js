// controllers/dashboard.controller.js

const db = require("../db");

exports.obtenerDashboard = (req, res) => {

  const usuario_id = req.params.usuario_id;

  const query = `
    SELECT r.habilidad, AVG(r.puntaje) as promedio
    FROM resultados r
    JOIN sesiones s ON r.sesion_id = s.id
    WHERE s.usuario_id = ?
    GROUP BY r.habilidad
  `;

  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, error: err });
    }

    res.json({ success: true, data: results });
  });
};

exports.obtenerHistorial = (req, res) => {

  const usuario_id = req.params.usuario_id;

  const query = `
    SELECT r.habilidad, r.puntaje, r.fecha
    FROM resultados r
    JOIN sesiones s ON r.sesion_id = s.id
    WHERE s.usuario_id = ?
    ORDER BY r.fecha DESC
    LIMIT 10
  `;

  db.query(query, [usuario_id], (err, results) => {
    if (err) {
      return res.status(500).json({ success:false, error: err });
    }

    res.json({ success:true, data: results });
  });
};