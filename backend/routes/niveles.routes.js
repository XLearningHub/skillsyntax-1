const express = require("express");
const router = express.Router();
const nivelesController = require("../controllers/niveles.controller");

router.post("/guardar_niveles", nivelesController.guardarNiveles);

module.exports = router;
