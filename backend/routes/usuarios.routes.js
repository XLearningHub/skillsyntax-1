const express = require("express");
const router = express.Router();
const db = require("../db");

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

module.exports = router;