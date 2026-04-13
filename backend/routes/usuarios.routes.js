const express = require("express");
const router = express.Router();
const db = require("../db");

// 🔵 YA EXISTENTE (NO TOCAR)
router.post("/email", (req, res) => {
  const { email } = req.body;

  db.query(
    "SELECT id FROM users WHERE email = ?",
    [email],
    (err, result) => {
      if (err) return res.json({ error: err });

      if (result.length === 0)
        return res.json({ error: "Usuario no encontrado" });

      res.json({ id: result[0].id });
    }
  );
});


// 🔥 NUEVO (AGREGAR)
router.get("/:id", (req, res) => {

  const id = req.params.id;

  db.query(
    "SELECT nombre FROM users WHERE id = ?",
    [id],
    (err, result) => {

      if (err) return res.status(500).json(err);

      if (result.length === 0)
        return res.json({ nombre: "Usuario" });

      res.json(result[0]);

    }
  );

});

module.exports = router;