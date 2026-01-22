const express = require("express");
const router = express.Router();

const { generarLeccion } = require("../controllers/lecciones.controller");

router.post("/generar_leccion", generarLeccion);

module.exports = router;
