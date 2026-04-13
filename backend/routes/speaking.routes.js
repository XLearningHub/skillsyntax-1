const express = require("express");
const router = express.Router();
const speakingController = require("../controllers/speaking.controller");

const multer = require("multer");

// configuración correcta
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + ".webm"); // 👈 clave
  }
});

const upload = multer({ storage });

// generar speaking
router.post("/", speakingController.generarSpeaking);

// calificar speaking
router.post("/calificar", upload.single("audio"), speakingController.calificarSpeaking);

module.exports = router;