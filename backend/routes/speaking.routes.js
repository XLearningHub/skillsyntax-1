const express = require("express");
const router = express.Router();
const speakingController = require("../controllers/speaking.controller");

router.get("/speaking", speakingController.generarSpeaking);

module.exports = router;
