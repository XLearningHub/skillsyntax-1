const express = require("express");
const router = express.Router();
const readingController = require("../controllers/reading.controller");

// Generar ejercicio de reading
router.post("/reading", readingController.generarReading);

// Calificar reading con IA
router.post("/reading/calificar", readingController.calificarReading);

module.exports = router;
