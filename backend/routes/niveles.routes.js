const express = require("express");
const router = express.Router();
const nivelesController = require("../controllers/niveles.controller");

// Obtener todos los niveles
router.get("/todos", nivelesController.getNiveles);

// Guardar nivel seleccionado por usuario
router.post("/guardar_nivel_seccion", nivelesController.guardarNivelSeccion);

module.exports = router;