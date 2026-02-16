const express = require("express");
const router = express.Router();

const listeningController = require("../controllers/listening.controller");


// GENERAR LISTENING
router.post("/listening", listeningController.generarListening);


// CALIFICAR LISTENING
router.post("/listening/calificar", listeningController.calificarListening);


module.exports = router;
