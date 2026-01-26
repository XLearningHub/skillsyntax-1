const express = require("express");
const router = express.Router();
const writingController = require("../controllers/writing.controller");

router.get("/writing", writingController.generarWriting);

module.exports = router;
