const express = require("express");
const router = express.Router();
const readingController = require("../controllers/reading.controller");

router.get("/reading", readingController.generarReading);

module.exports = router;
