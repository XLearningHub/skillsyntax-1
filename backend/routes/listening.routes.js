const express = require("express");
const router = express.Router();
const listeningController = require("../controllers/listening.controller");

router.get("/listening", listeningController.generarListening);

module.exports = router;
