const express = require("express");
const router = express.Router();
const multer = require("multer");
const speakingController = require("../controllers/speaking.controller");

const upload = multer({ dest: "uploads/" });

router.post("/", speakingController.generarSpeaking);
router.post("/calificar", upload.single("audio"), speakingController.calificarSpeaking);

module.exports = router;