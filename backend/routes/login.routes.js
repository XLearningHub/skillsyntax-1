const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", (req, res) => {

  const { email, password } = req.body;

  console.log("Datos recibidos:", email, password);

  db.query(
    "SELECT * FROM users WHERE email = ? AND password = ?"
    [email, password],
    (err, results) => {

      if (err) {
        console.error("ERROR:", err);
        return res.status(500).json({
          message: "Error en servidor"
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          message: "Credenciales incorrectas"
        });
      }

      return res.json({
        id: results[0].id
      });

    }
  );

});

module.exports = router;