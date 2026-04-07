const express = require("express");
const router = express.Router();

const listeningController = require("../controllers/listening.controller");

// ✅ correcto
router.post("/", listeningController.generarListening);
router.post("/calificar", listeningController.calificarListening);

module.exports = router;