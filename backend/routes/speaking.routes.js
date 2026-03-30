const express = require("express");
const router = express.Router();
const multer = require("multer");
const speakingController = require("../controllers/speaking.controller");

//Guardar audio en memoria 
const upload = multer({
  storage: multer.memoryStorage()
});

// GENERAR SPEAKING
router.post(
  "/speaking",
  speakingController.generarSpeaking
);

// CALIFICAR SPEAKING
router.post(
  "/speaking/calificar",
  upload.single("audio"),
  speakingController.calificarSpeaking
);

module.exports = router;