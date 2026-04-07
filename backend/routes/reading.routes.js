const express = require("express");
const router = express.Router();
const readingController = require("../controllers/reading.controller");

// Generar ejercicio de reading
router.post("/", readingController.generarReading);

// Calificar reading
router.post("/calificar", readingController.calificarReading);

module.exports = router;